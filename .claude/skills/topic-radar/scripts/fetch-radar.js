#!/usr/bin/env node
/**
 * topic-radar 素材雷达抓取：一次扫描四条选题线（NAS / GitHub / AUTOSAR / Obsidian）的热点素材
 *
 * 数据源（全部免费免登录，单源失败不影响其它源，失败原因写进 errors）：
 *   1. HN Algolia API —— 各线关键词近 7 天高分帖（按 points 过滤）
 *   2. Reddit RSS top/week —— r/selfhosted / r/homelab / r/DataHoarder / r/ObsidianMD / r/autosar
 *   3. GitHub 涨星 —— 复用 tools/github-weekly-rank 最新周文件的 Top 名单
 *
 * 输出：JSON 到 stdout（{ date, hn: [], reddit: [], github: [], errors: {} }），
 * 供 Claude 按 SKILL.md 策展成 ideas/radar/<日期>.md
 *
 * 用法：node .claude/skills/topic-radar/scripts/fetch-radar.js
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VAULT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const UA = { 'User-Agent': 'Mozilla/5.0 (topic-radar; personal research)' };
const WEEK = 7 * 24 * 3600;
const now = Math.floor(Date.now() / 1000);
const errors = {};

async function getJson(url, ms = 10000) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function getText(url, ms = 10000) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

// ---------- ① HN Algolia：各线关键词近 7 天高分帖 ----------
// advancedSyntax=true 让多词引号短语精确匹配；关键词宁窄勿宽（裸 "NAS" 会撞航空管制新闻）
const HN_QUERIES = [
  { line: 'nas', kw: ['self-hosted', 'homelab', 'TrueNAS', 'Unraid', 'Synology', 'Proxmox', 'home server'] },
  { line: 'github', kw: ['open source alternative', 'open source tool'] },
  { line: 'autosar', kw: ['AUTOSAR', '"CAN bus"', 'OBD-II', 'automotive embedded'] },
  { line: 'obsidian', kw: ['Obsidian', 'personal knowledge management', 'note-taking', 'second brain'] },
];

async function fetchHN() {
  const out = [];
  const seen = new Set();
  for (const { line, kw } of HN_QUERIES) {
    for (const q of kw) {
      try {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&advancedSyntax=true&tags=story&numericFilters=points%3E40,created_at_i%3E${now - WEEK}`;
        const j = await getJson(url);
        for (const h of j.hits || []) {
          if (seen.has(h.objectID)) continue;
          seen.add(h.objectID);
          out.push({
            line,
            kw: q,
            title: h.title || '',
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
            points: h.points || 0,
            comments: h.num_comments || 0,
            hnId: h.objectID,
            created: h.created_at?.slice(0, 10) || '',
          });
        }
      } catch (e) { errors[`hn:${q}`] = String(e.message || e); }
    }
  }
  return out.sort((a, b) => b.points - a.points).slice(0, 40);
}

// ---------- ② Reddit RSS top/week ----------
const SUBS = ['selfhosted', 'homelab', 'DataHoarder', 'ObsidianMD', 'autosar', 'embedded'];
const SUB_LINE = { selfhosted: 'nas', homelab: 'nas', DataHoarder: 'nas', ObsidianMD: 'obsidian', autosar: 'autosar', embedded: 'autosar' };

function pick(str, re) { const m = str.match(re); return m ? m[1] : ''; }
function unesc(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function fetchReddit() {
  const out = [];
  for (const sub of SUBS) {
    try {
      const xml = await getText(`https://www.reddit.com/r/${sub}/top/.rss?t=week`);
      const entries = xml.split('<entry>').slice(1);
      for (const e of entries.slice(0, 10)) {
        const title = unesc(pick(e, /<title>([\s\S]*?)<\/title>/));
        const link = pick(e, /<link href="([^"]+)"/);
        const updated = pick(e, /<updated>([\s\S]*?)<\/updated>/).slice(0, 10);
        out.push({ line: SUB_LINE[sub], sub, title, url: link, created: updated });
      }
    } catch (e) { errors[`reddit:r/${sub}`] = String(e.message || e); }
  }
  return out;
}

// ---------- ②b Discourse 论坛 RSS（Obsidian 官方论坛最新热帖） ----------
async function fetchForum() {
  const out = [];
  try {
    const xml = await getText('https://forum.obsidian.md/latest.rss');
    for (const item of xml.split('<item>').slice(1).slice(0, 15)) {
      out.push({
        line: 'obsidian',
        sub: 'forum.obsidian.md',
        title: unesc(pick(item, /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || pick(item, /<title>([\s\S]*?)<\/title>/)),
        url: pick(item, /<link>([\s\S]*?)<\/link>/).trim(),
        created: pick(item, /<pubDate>([\s\S]*?)<\/pubDate>/).slice(5, 16),
      });
    }
  } catch (e) { errors['forum:obsidian'] = String(e.message || e); }
  return out;
}

// ---------- ③ GitHub 涨星：tools/github-weekly-rank 最新周 ----------
function latestRankFile() {
  const root = join(VAULT, 'tools/github-weekly-rank');
  if (!existsSync(root)) return null;
  const months = readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{4}$/.test(d.name))
    .map(d => d.name).sort();
  for (const y of months.reverse()) {
    for (const m of readdirSync(join(root, y)).sort().reverse()) {
      for (const f of readdirSync(join(root, y, m)).sort().reverse()) {
        const p = join(root, y, m, f);
        if (f.endsWith('.md')) return p;
      }
    }
  }
  return null;
}

function fetchGithub() {
  try {
    const f = latestRankFile();
    if (!f) { errors['github'] = 'tools/github-weekly-rank 不存在或没有数据文件'; return []; }
    const raw = readFileSync(f, 'utf8');
    const out = [];
    for (const block of raw.split('**榜单增长：').slice(1)) {
      const h = block.match(/第(\d)名:\s*(\S+?)\s*\*+/);
      if (!h) continue;
      out.push({
        no: Number(h[1]),
        repo: h[2],
        total: block.match(/总星标数量：\s*([\d.]+\s*[km]?)⭐/)?.[1] ?? '',
        growth: block.match(/周Star增长量：\s*([\d,]+)⭐/)?.[1] ?? '',
        desc: block.match(/项目描述：(.+)/)?.[1]?.trim() ?? '',
      });
    }
    return out.slice(0, 8);
  } catch (e) { errors['github'] = String(e.message || e); return []; }
}

// ---------- main ----------
const [hn, reddit, forum, github] = await Promise.all([fetchHN(), fetchReddit(), fetchForum(), Promise.resolve(fetchGithub())]);
console.log(JSON.stringify({
  date: new Date().toISOString().slice(0, 10),
  hn, reddit, forum, github, errors,
}, null, 2));
