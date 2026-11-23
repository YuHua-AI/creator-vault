#!/usr/bin/env node
/**
 * 周榜数据更新自动化：抓 git-homed 周榜页 → 解析 Top8 → 脚手架新期目录
 *
 * 做三件事：
 *   1. 抓 https://git-homed.org/weekly（每日重建，直连，失败重试一次）
 *   2. 解析 Last updated 与 Top10（owner/repo、总星标、周增长、语言、描述）
 *   3. 若 drafts/github/weekly-<数据日期>/ 不存在 → 生成脚手架：img-src/data.json（数值与描述已填，
 *      文案类字段为 TODO，留给调研阶段）+ article.md 壳（图片引用已按序排好）
 *
 * 数据口径：git-homed 的「stars this week」是截止 Last updated 时刻的滚动 7 天窗口，
 * 不是自然周；期号取 Last updated 的 UTC 日期。
 *
 * 用法：node fetch-data.js [--dry-run]   # --dry-run 只解析打印，不落盘
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VAULT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const SERIES = join(VAULT, 'drafts/github');
const SRC = 'https://git-homed.org/weekly';
const DRY = process.argv.includes('--dry-run');

async function fetchPage(url) {
  let err;
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (creator-vault; github-weekly fetch-data)' },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) { err = e; }
  }
  throw err;
}

const unescapeHtml = (s) => s
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function parse(html) {
  const upd = html.match(/Last updated:\s*(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})\s*UTC/);
  if (!upd) throw new Error('页面里没找到 Last updated 时间戳，页面结构可能变了');
  const [, y, mo, d, hh, mm] = upd;
  const updated = `${y}-${mo}-${d} ${hh}:${mm} UTC`;

  const rows = [];
  for (const m of html.matchAll(/<article class="repo">([\s\S]*?)<\/article>/g)) {
    const r = m[1];
    const rank = Number((r.match(/<div class="rank[^"]*">(\d+)<\/div>/) || [])[1]);
    const href = (r.match(/href="\/repo\/([^"]+)"/) || [])[1] || '';
    const at = href.indexOf('__');
    // 链接是小写 slug，显示名从标题取原始大小写
    const h3 = r.match(/<h3 class="rtitle">[\s\S]*?<em>([^<]*)<\/em>\s*([^<]*)</);
    const owner = h3 ? h3[1].replace(/\s*\/\s*$/, '').trim() : (at > 0 ? href.slice(0, at) : '');
    const repo = h3 ? h3[2].trim() : (at > 0 ? href.slice(at + 2) : '');
    if (!rank || !owner || !repo) continue;
    const desc = unescapeHtml(((r.match(/<p class="rdesc">([\s\S]*?)<\/p>/) || [])[1] || '')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    const lang = ((r.match(/<span class="chip"><i[^>]*><\/i>([^<]*)<\/span>/) || [])[1] || '').trim();
    const total = ((r.match(/★\s*([\d,]+)/) || [])[1] || '').replace(/,/g, '');
    const growth = ((r.match(/▲\s*([\d,]+)\s*stars this week/) || [])[1] || '').replace(/,/g, '');
    rows.push({ no: rank, owner, repo, lang, desc, total, growth });
  }
  rows.sort((a, b) => a.no - b.no);
  return { updated, rows };
}

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (dt) => `${dt.getUTCFullYear()}.${pad(dt.getUTCMonth() + 1)}.${pad(dt.getUTCDate())}`;

// ---------- ① 抓取 ----------
console.log(`① 抓取 ${SRC} ...`);
let html;
try {
  html = await fetchPage(SRC);
  console.log('  ✓ 页面已拿到');
} catch (e) {
  console.error(`✗ 抓取失败（${e.message}），网络或 git-homed 不可达，本轮结束`);
  process.exit(1);
}

// ---------- ② 解析 ----------
const { updated, rows } = parse(html);
if (!rows.length) { console.error('✗ 一条榜单都没解析到，页面结构可能变了'); process.exit(1); }
const top = rows.filter((r) => r.no <= 10);
if (top.length < 8) { console.error(`✗ 只解析到 ${top.length}/8 条榜单，页面结构可能变了`); process.exit(1); }
console.log(`② 解析完成：Last updated ${updated}，榜单 ${rows.length} 条`);

// 期号 = 数据更新日（UTC），窗口 = 截止 updated 的滚动 7 天
const [y, mo, d] = updated.slice(0, 10).split('-');
const week = `${y}${mo}${d}`;
const endDt = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
const period = `${fmtDate(new Date(endDt.getTime() - 7 * 864e5))} – ${fmtDate(endDt)}`;

// ---------- ③ 与已发布/在稿对比 ----------
const draftDir = join(SERIES, 'weekly-' + week);
const publishedDir = join(VAULT, 'published/github', 'weekly-' + week);
if (existsSync(draftDir) || existsSync(publishedDir)) {
  const where = existsSync(publishedDir)
    ? `已发布（published/github/weekly-${week}/）`
    : `已在稿（drafts/github/weekly-${week}/，待人工审）`;
  console.log(`✓ 无更新：数据源最新一期（${updated} 更新）的 weekly-${week} ${where}，本轮结束`);
  process.exit(0);
}

const cards = top.slice(0, 8).map((r) => ({ ...r, total: Number(r.total).toLocaleString('en-US'), growth: Number(r.growth).toLocaleString('en-US') }));

// ---------- ④ 脚手架 ----------
if (DRY) {
  console.log(`④ --dry-run：跳过脚手架（将生成 drafts/github/weekly-${week}/）`);
} else {
  const slug = (repo) => repo.toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
  const data = {
    week, period,
    _source: { url: SRC, updatedAt: updated, window: '滚动 7 天' },
    subtitle: '本周涨星最快的 8 个开源项目',
    subtitleHighlight: 'TODO（本周趋势一句话）',
    _todo: ['subtitleHighlight 趋势一句话', '各卡 icon/pitch/what/can/who/tags/coverIntro/coverTags', 'file 短名可按需改短'],
    cards: cards.map((r) => ({
      file: `${pad(r.no)}-${slug(r.repo)}`,
      icon: 'TODO（映射 icons.js 已有 key，或新画一个追加进去）',
      no: r.no, owner: r.owner, repo: r.repo,
      lang: r.lang || 'TODO',
      coverIntro: 'TODO', coverTags: ['TODO', 'TODO'],
      pitch: 'TODO',
      total: r.total, growth: r.growth,
      what: ['TODO', 'TODO'], can: ['TODO', 'TODO'], who: ['TODO', 'TODO'],
      tags: ['TODO', 'TODO', 'TODO'],
      _research: r.desc ? { desc: r.desc } : {},
    })),
  };
  mkdirSync(join(draftDir, 'img-src'), { recursive: true });
  writeFileSync(join(draftDir, 'img-src/data.json'), JSON.stringify(data, null, 2) + '\n');

  const today = new Date().toISOString().slice(0, 10);
  const imgs = ['![本周涨星最快的 8 个开源项目](img/cover.jpg)', ...data.cards.map((c) => `![${c.repo} 项目卡](img/${c.file}.jpg)`)].join('\n\n');
  writeFileSync(join(draftDir, 'article.md'), `---
title: GitHub 周榜｜本周涨星最快的 8 个开源项目（TODO 可补本周亮点）
post_title: GitHub 周榜｜本周涨星最快的 8 个开源项目
date: ${today}
status: draft
tags: [GitHub, 开源周报, AI Agent]
platform: [公众号]
---

<!-- 数据口径：滚动 7 天，截至 ${updated}，来源 ${SRC} -->

<!-- TODO: 开场 2~3 行（本周趋势，与 data.json 的 subtitleHighlight 呼应） -->

${imgs}

---

<!-- TODO: 收尾互动 + 关注引导（参考往期 published/github/*/article.md） -->
`);

  console.log(`④ 已脚手架 drafts/github/weekly-${week}/（data.json + article.md）`);
}

// ---------- ⑤ 摘要 ----------
console.log(`\n📌 ${week} 周（${period}，数据截至 ${updated}）涨星 Top 8：`);
cards.forEach((r) => console.log(`  ${pad(r.no)}  ${r.owner}/${r.repo}  ★${r.total}  ▲${r.growth}  ${r.lang}`));
if (top.length > 8) console.log(`  备选（违规剔除时顺位补）：${top.slice(8).map((r) => `${r.owner}/${r.repo}（▲${r.growth}）`).join('、')}`);
console.log('\n下一步：调研补齐 data.json 的 TODO 字段 → 图标映射 → 生成渲染（见 SKILL.md ②⑤）');
