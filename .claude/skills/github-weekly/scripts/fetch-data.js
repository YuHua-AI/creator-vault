#!/usr/bin/env node
/**
 * 周榜数据更新自动化：git pull → 找最新周 → 解析 Top8 → 脚手架新期目录
 *
 * 做三件事：
 *   1. tools/github-weekly-rank 执行 git pull（走本机代理 127.0.0.1:7890，失败则用本地已有数据继续）
 *   2. 解析当周 YYYYMMDD.md：周期、Top8（owner/repo、总星标、周增长）、前 3 名详情（描述/建仓时间）
 *   3. 若 drafts/GitHub周榜/<week>/ 不存在 → 生成脚手架：img-src/data.json（数值字段已填，
 *      文案类字段为 TODO，留给调研阶段）+ article.md 壳（图片引用已按序排好）
 *
 * 用法：node fetch-data.js [周日期如 20261116]   # 缺省取数据源里最新一周
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const VAULT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const REPO = join(VAULT, 'tools/github-weekly-rank');
const SERIES = join(VAULT, 'drafts/GitHub周榜');
const wantWeek = process.argv[2] || '';

// ---------- ① git pull ----------
console.log('① git pull 数据源 ...');
try {
  const out = execSync('git pull --ff-only', {
    cwd: REPO, stdio: 'pipe', encoding: 'utf8',
    env: { ...process.env, https_proxy: 'http://127.0.0.1:7890' },
  }).trim();
  console.log(`  ✓ ${out.split('\n').pop() || '已是最新'}`);
} catch (e) {
  console.warn(`  ⚠ pull 失败（${String(e.stderr || e.message).split('\n')[0]}），改用本地已有数据`);
}

// ---------- ② 找周文件 ----------
const weeks = [];
for (const y of readdirSync(REPO)) if (/^\d{4}$/.test(y))
  for (const m of readdirSync(join(REPO, y))) if (/^\d{2}$/.test(m))
    for (const f of readdirSync(join(REPO, y, m))) {
      const w = f.match(/^(\d{8})\.md$/);
      if (w) weeks.push(w[1]);
    }
if (!weeks.length) { console.error('✗ 数据源里没有周文件'); process.exit(1); }
weeks.sort();
const week = wantWeek && weeks.includes(wantWeek) ? wantWeek : weeks[weeks.length - 1];
if (wantWeek && !weeks.includes(wantWeek)) console.warn(`  ⚠ 没有周文件 ${wantWeek}，改用最新一周 ${week}`);
const mdPath = join(REPO, week.slice(0, 4), week.slice(4, 6), `${week}.md`);
const raw = readFileSync(mdPath, 'utf8');
console.log(`② 解析 ${mdPath.replace(VAULT + '/', '')} ...`);

// ---------- ③ 解析 ----------
const pm = raw.match(/(\d{4}\.\d{2}\.\d{2})-(\d{4})\.(\d{2})\.(\d{2})\s*周榜排行/);
const period = pm ? `${pm[1]} – ${pm[3]}.${pm[4]}` : 'TODO';
const rows = [];
for (const m of raw.matchAll(/\|\s*(\d+)\s*\|\s*\[([^\]/]+)\/([^\]]+)\]\([^)]*\)\|\s*([0-9.]+\s*[km]?)\s*\|\s*🔺\s*(\d+)/g)) {
  const [, rank, owner, repo, total, growth] = m;
  if (Number(rank) <= 8) rows.push({ no: Number(rank), owner, repo, total: total.replace(/\s/g, ''), growth: Number(growth).toLocaleString('en-US') });
}
if (rows.length < 8) { console.error(`✗ 只解析到 ${rows.length}/8 行，周文件格式可能变了，请检查解析正则`); process.exit(1); }
// 前 3 名详情（描述/建仓时间）作为调研素材挂在 _research
const detail = {};
for (const block of raw.split('**榜单增长：').slice(1)) {
  const h = block.match(/第(\d)名:\s*(\S+?)\s*\*+/);
  if (!h) continue;
  detail[`${h[2]}`] = {
    created: block.match(/开源时间：\s*([\d-]+)/)?.[1] ?? '',
    desc: block.match(/项目描述：\s*(.+)/)?.[1].trim() ?? '',
  };
}

// ---------- ④ 脚手架 ----------
const issueDir = join(SERIES, week);
if (existsSync(issueDir)) {
  console.log(`④ drafts/GitHub周榜/${week}/ 已存在，跳过脚手架（不覆盖已有稿件）`);
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
    week, period,
    subtitle: '本周涨星最快的 8 个开源项目',
    subtitleHighlight: 'TODO（本周趋势一句话）',
    _todo: ['subtitleHighlight 趋势一句话', '各卡 icon/lang/pitch/what/can/who/tags/coverIntro/coverTags', 'file 短名可按需改短'],
    cards,
  };
  mkdirSync(join(issueDir, 'img-src'), { recursive: true });
  writeFileSync(join(issueDir, 'img-src/data.json'), JSON.stringify(data, null, 2) + '\n');

  const today = new Date().toISOString().slice(0, 10);
  const imgs = [`![本周涨星最快的 8 个开源项目](img/cover.jpg)`, ...cards.map(c => `![${c.repo} 项目卡](img/${c.file}.jpg)`)].join('\n\n');
  writeFileSync(join(issueDir, 'article.md'), `---
title: GitHub 周榜｜本周涨星最快的 8 个开源项目（TODO 可补本周亮点）
post_title: GitHub 周榜｜本周涨星最快的 8 个开源项目
date: ${today}
status: draft
tags: [GitHub, 开源周报, AI Agent]
platform: [公众号]
---

<!-- TODO: 开场 2~3 行（本周趋势，与 data.json 的 subtitleHighlight 呼应） -->

${imgs}

---

<!-- TODO: 收尾互动 + 关注引导（参考往期 published/GitHub周榜/*/article.md） -->
`);

  console.log(`④ 已脚手架 drafts/GitHub周榜/${week}/（data.json + article.md）`);
}

// ---------- ⑤ 摘要 ----------
console.log(`\n📌 ${week} 周（统计周期 ${period}）涨星 Top 8：`);
rows.forEach(r => console.log(`  ${String(r.no).padStart(2, '0')}  ${r.owner}/${r.repo}  ★${r.total}  ▲${r.growth}`));
console.log('\n下一步：调研补齐 data.json 的 TODO 字段 → 图标映射 → 生成渲染（见 SKILL.md ②⑤）');
