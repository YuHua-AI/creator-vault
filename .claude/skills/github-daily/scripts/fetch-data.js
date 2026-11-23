#!/usr/bin/env node
/**
 * 日榜数据更新自动化：git pull → 找最新一天 → 解析 Top8 → 脚手架新期目录
 *
 * 做三件事：
 *   1. tools/github-daily-rank 执行 git pull（git 直连；失败则用本地已有数据继续）
 *   2. 解析当日 YYYYMMDD.md：日期、Top8（owner/repo、总星标、日增长）、各项目详情（描述/建仓时间）
 *   3. 若 drafts/github/daily-<date>/ 不存在 → 生成脚手架：img-src/data.json（数值字段已填，
 *      文案类字段为 TODO，留给调研阶段）+ article.md 壳（图片引用已按序排好）
 *
 * 用法：node fetch-data.js [日期如 20261116]   # 缺省取数据源里最新一天
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const VAULT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const REPO = join(VAULT, 'tools/github-daily-rank');
const SERIES = join(VAULT, 'drafts/github');
const wantDay = process.argv[2] || '';

// ---------- ① git pull ----------
console.log('① git pull 数据源 ...');
try {
  const out = execSync('git pull --ff-only', {
    cwd: REPO, stdio: 'pipe', encoding: 'utf8',
  }).trim();
  console.log(`  ✓ ${out.split('\n').pop() || '已是最新'}`);
} catch (e) {
  console.warn(`  ⚠ pull 失败（${String(e.stderr || e.message).split('\n')[0]}），改用本地已有数据`);
}

// ---------- ② 找日文件 ----------
const days = [];
for (const y of readdirSync(REPO)) if (/^\d{4}$/.test(y))
  for (const m of readdirSync(join(REPO, y))) if (/^\d{2}$/.test(m))
    for (const f of readdirSync(join(REPO, y, m))) {
      const d = f.match(/^(\d{8})\.md$/);
      if (d) days.push(d[1]);
    }
if (!days.length) { console.error('✗ 数据源里没有日文件'); process.exit(1); }
days.sort();
const day = wantDay && days.includes(wantDay) ? wantDay : days[days.length - 1];
if (wantDay && !days.includes(wantDay)) console.warn(`  ⚠ 没有日文件 ${wantDay}，改用最新一天 ${day}`);

// ---------- ②' 与已发布/在稿对比：数据源不是每天更新，无新的一天就到此为止 ----------
const draftDir = join(SERIES, 'daily-' + day);
const publishedDir = join(VAULT, 'published/github', 'daily-' + day);
if (existsSync(draftDir) || existsSync(publishedDir)) {
  const where = existsSync(publishedDir)
    ? `已发布（published/github/daily-${day}/）`
    : `已在稿（drafts/github/daily-${day}/，待人工审）`;
  console.log(`✓ 无更新：数据源最新日文件 ${day} 的这一期${where}，没有新数据可做，本轮结束`);
  process.exit(0);
}

const mdPath = join(REPO, day.slice(0, 4), day.slice(4, 6), `${day}.md`);
const raw = readFileSync(mdPath, 'utf8');
console.log(`② 解析 ${mdPath.replace(VAULT + '/', '')} ...`);

// ---------- ③ 解析 ----------
const dateStr = `${day.slice(0, 4)}.${day.slice(4, 6)}.${day.slice(6, 8)}`;
const rows = [];
for (const m of raw.matchAll(/\|\s*(\d+)\s*\|\s*\[([^\]/]+)\/([^\]]+)\]\([^)]*\)\|\s*([0-9.]+\s*[km]?)\s*\|\s*🔺\s*(\d+)/g)) {
  const [, rank, owner, repo, total, growth] = m;
  if (Number(rank) <= 8) rows.push({ no: Number(rank), owner, repo, total: total.replace(/\s/g, ''), growth: Number(growth).toLocaleString('en-US') });
}
if (rows.length < 8) { console.error(`✗ 只解析到 ${rows.length}/8 行，日文件格式可能变了，请检查解析正则`); process.exit(1); }
// 详情段（描述/建仓时间/周月增长）作为调研素材挂在 _research
const detail = {};
for (const block of raw.split(/<h3[^>]*>/).slice(1)) {
  const h = block.match(/https:\/\/github\.com\/([^<\s]+)\s*<\/span>/);
  if (!h) continue;
  detail[h[1]] = {
    created: block.match(/开源时间：\s*([\d-]+)/)?.[1] ?? '',
    desc: block.match(/项目描述：\s*(.+)/)?.[1]?.trim() ?? '',
    weekGrowth: block.match(/上周增长数量：\s*([\d.]+[km]?)\s*⭐?/)?.[1] ?? '',
    monthGrowth: block.match(/上月增长数量：\s*([\d.]+[km]?)\s*⭐?/)?.[1] ?? '',
  };
}

// ---------- ④ 脚手架 ----------
const issueDir = draftDir;
if (existsSync(issueDir)) {
  console.log(`④ drafts/github/daily-${day}/ 已存在，跳过脚手架（不覆盖已有稿件）`);
} else {
  const slug = (repo) => repo.toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40);
  const cards = rows.map(r => ({
    file: `${String(r.no).padStart(2, '0')}-${slug(r.repo)}`,
    icon: 'TODO（映射 icons.js 已有 key，或新画一个追加进去）',
    no: r.no, owner: r.owner, repo: r.repo,
    lang: 'TODO',
    coverIntro: 'TODO', coverTags: ['TODO', 'TODO'],
    pitch: 'TODO',
    total: r.total, growth: r.growth,
    what: ['TODO', 'TODO'], can: ['TODO', 'TODO'], who: ['TODO', 'TODO'],
    tags: ['TODO', 'TODO', 'TODO'],
    _research: detail[`${r.owner}/${r.repo}`] ?? {},
  }));
  const data = {
    day, period: dateStr,
    subtitle: '今日涨星最快的 8 个开源项目',
    subtitleHighlight: 'TODO（今日趋势一句话）',
    _todo: ['subtitleHighlight 趋势一句话', '各卡 icon/lang/pitch/what/can/who/tags/coverIntro/coverTags', 'file 短名可按需改短'],
    cards,
  };
  mkdirSync(join(issueDir, 'img-src'), { recursive: true });
  writeFileSync(join(issueDir, 'img-src/data.json'), JSON.stringify(data, null, 2) + '\n');

  const today = new Date().toISOString().slice(0, 10);
  const imgs = [`![今日涨星最快的 8 个开源项目](img/cover.jpg)`, ...cards.map(c => `![${c.repo} 项目卡](img/${c.file}.jpg)`)].join('\n\n');
  writeFileSync(join(issueDir, 'article.md'), `---
title: GitHub 日榜｜今日涨星最快的 8 个开源项目（TODO 可补今日亮点）
post_title: GitHub 日榜｜今日涨星最快的 8 个开源项目
date: ${today}
status: draft
collection: GitHub 日榜
tags: [GitHub, 开源日报, AI Agent]
platform: [公众号]
---

<!-- TODO: 开场 2~3 行（今日趋势，与 data.json 的 subtitleHighlight 呼应） -->

${imgs}

---

<!-- TODO: 收尾互动 + 关注引导（参考往期 article.md） -->
`);

  console.log(`④ 已脚手架 drafts/github/daily-${day}/（data.json + article.md）`);
}

// ---------- ⑤ 摘要 ----------
console.log(`\n📌 ${dateStr} 日榜涨星 Top 8：`);
rows.forEach(r => console.log(`  ${String(r.no).padStart(2, '0')}  ${r.owner}/${r.repo}  ★${r.total}  ▲${r.growth}`));
console.log('\n下一步：调研补齐 data.json 的 TODO 字段 → 图标映射 → 生成渲染（见 SKILL.md ②⑤）');
