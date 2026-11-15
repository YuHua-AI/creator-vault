#!/usr/bin/env node
/**
 * 生成分发平台版（知乎/CSDN/掘金等 Markdown 平台）：
 *   article.md 去 frontmatter → 拼平台 footer → 回填系列链接/公众号名 → versions/<platform>/<slug>.md
 * 发布仍是人工粘贴（各平台无公开发布 API）；本脚本只负责「生成即可贴」。
 *
 * 用法：node gen-dist-versions.js <文章文件夹> [--platform zhihu,csdn] [--out <输出目录>]
 *   --platform  逗号分隔，默认 zhihu,csdn
 *   --out       输出根目录，默认 <vault>/distribution/<collection>/versions
 *
 * 依赖约定：
 *   - footer 模板：<vault>/distribution/<collection>/footer-<platform>.md
 *     占位符 {{链接:<slug>}}（系列各篇）、{{公众号名}}
 *   - 注册表：<vault>/distribution/<collection>/links.json
 *     { "公众号名": "…", "platforms": { "zhihu": {"<slug>": "url"}, "csdn": {…} } }
 *     没注册的链接保持占位符原样，发出一篇登记一条后重跑即可
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const vaultRoot = resolve(scriptDir, '../../../../');

const args = process.argv.slice(2);
const val = (flag, dflt) => {
  const i = args.indexOf(flag);
  if (i === -1) return dflt;
  const eq = args[i].slice(flag.length + 1);
  return eq || args[i + 1] || dflt;
};
const platforms = String(val('--platform', 'zhihu,csdn')).split(',');
const target = resolve(args.find(a => !a.startsWith('--')));
if (!target) { console.error('用法: node gen-dist-versions.js <文章文件夹> [--platform zhihu,csdn]'); process.exit(1); }

const mdPath = target.endsWith('.md') ? target : join(target, 'article.md');
if (!existsSync(mdPath)) { console.error(`✗ 找不到 ${mdPath}`); process.exit(1); }

const raw = readFileSync(mdPath, 'utf8');
const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const fmText = fm ? fm[1] : '';
const body = (fm ? raw.slice(fm[0].length) : raw).trimStart();
const pick = (k) => (fmText.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1] ?? '').trim();
const collection = pick('collection');
const slug = basename(dirname(mdPath));
if (!collection) { console.error('✗ frontmatter 缺 collection（分发 footer 按 collection 定位）'); process.exit(1); }

// 注册表反查：扫描 distribution/*/links.json，按 collection 字段匹配（目录名不必等于 collection）
import { readdirSync } from 'node:fs';
const distRoot = join(vaultRoot, 'distribution');
let reg = {}, collectionDir = collection;
if (existsSync(distRoot)) {
  for (const d of readdirSync(distRoot, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)) {
    const p = join(distRoot, d, 'links.json');
    if (!existsSync(p)) continue;
    const r = JSON.parse(readFileSync(p, 'utf8'));
    if (r.collection === collection) { reg = r; collectionDir = d; break; }
  }
}
const distDir = join(distRoot, collectionDir, 'versions');

const fill = (text, platform) => text
  .replace(/\{\{链接:([^}]+)\}\}/g, (_, s) => reg.platforms?.[platform]?.[s] ?? `{{链接:${s}}}`)
  .replace(/\{\{公众号名\}\}/g, reg['公众号名'] || '{{公众号名}}');

let failed = false;
for (const p of platforms.map(s => s.trim()).filter(Boolean)) {
  const footerPath = join(vaultRoot, 'distribution', collectionDir, `footer-${p}.md`);
  const footer = existsSync(footerPath) ? `\n\n${readFileSync(footerPath, 'utf8').trim()}\n` : '';
  if (!footer) { console.error(`⚠ 无 ${footerPath}，该平台只出正文`); failed = true; }
  const out = join(distDir, p, `${slug}.md`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, body + fill(footer, p));
  const left = (body + fill(footer, p)).match(/\{\{[^}]+\}\}/g) ?? [];
  console.log(`✓ ${p}: ${out}${left.length ? `（残留占位 ${[...new Set(left)].join(' ')}）` : ''}`);
}
if (failed) process.exit(2);
