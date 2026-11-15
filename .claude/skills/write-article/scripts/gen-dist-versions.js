#!/usr/bin/env node
/**
 * 生成分发版（stdout，不落库）：published 的 article.md 是归档产物，分发直接用它；
 * 本脚本只做贴前适配——去 frontmatter + 拼 footer + 按 --platform 回填链接，打进 stdout：
 *
 *   node gen-dist-versions.js published/AUTOSAR/<篇名> --platform zh | pbcopy
 *
 * 库内零副本；published/<专题>/ 只在文章文件夹之外放登记（footer.md / links.json / 平台目录 gzh/zh/csdn）。
 *
 * 依赖约定（published/<专题>/）：
 *   - footer.md   尾部模板，占位符 {{链接:<slug>}}、{{公众号名}}
 *   - links.json  { "collection": "…", "公众号名": "", "zh": {"<slug>": "url"}, "csdn": {} }
 *                 collection 字段用于反查专题目录（目录名不必等于 frontmatter 的 collection）
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const vaultRoot = resolve(scriptDir, '../../../../');

const args = process.argv.slice(2);
const val = (flag, dflt) => {
  const i = args.indexOf(flag);
  if (i === -1) return dflt;
  return args[i + 1] || dflt;
};
const platform = val('--platform', 'zh');
const target = resolve(args.find(a => !a.startsWith('--')));
if (!target) { console.error('用法: node gen-dist-versions.js <文章文件夹> [--platform zh|csdn] | pbcopy'); process.exit(1); }

const mdPath = target.endsWith('.md') ? target : join(target, 'article.md');
if (!existsSync(mdPath)) { console.error(`✗ 找不到 ${mdPath}`); process.exit(1); }

const raw = readFileSync(mdPath, 'utf8');
const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const fmText = fm ? fm[1] : '';
const body = (fm ? raw.slice(fm[0].length) : raw).trimStart();
const pick = (k) => (fmText.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1] ?? '').trim();
const collection = pick('collection');
if (!collection) { console.error('✗ frontmatter 缺 collection（footer/注册表按 collection 定位）'); process.exit(1); }

// 注册表反查：扫描 published/*/links.json，按 collection 字段匹配
const distRoot = join(vaultRoot, 'published');
let reg = {}, topicDir = null;
if (existsSync(distRoot)) {
  for (const d of readdirSync(distRoot, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)) {
    const p = join(distRoot, d, 'links.json');
    if (!existsSync(p)) continue;
    const r = JSON.parse(readFileSync(p, 'utf8'));
    if (r.collection === collection) { reg = r; topicDir = d; break; }
  }
}
if (!topicDir) { console.error(`✗ published/ 下没有 collection 为「${collection}」的 links.json`); process.exit(1); }
if (!reg[platform]) { console.error(`✗ links.json 缺平台键「${platform}」（现有：${Object.keys(reg).filter(k => k !== 'collection' && k !== '公众号名').join(', ')}）`); process.exit(1); }

const footerPath = join(distRoot, topicDir, 'footer.md');
if (!existsSync(footerPath)) { console.error(`✗ 缺 ${footerPath}`); process.exit(1); }

const filled = (body + '\n\n' + readFileSync(footerPath, 'utf8').trim() + '\n')
  .replace(/\{\{链接:([^}]+)\}\}/g, (_, s) => reg[platform][s] || `{{链接:${s}}}`)
  .replace(/\{\{公众号名\}\}/g, reg['公众号名'] || '{{公众号名}}');

process.stdout.write(filled); // 正文进 stdout（接 pbcopy）
const left = filled.match(/\{\{[^}]+\}\}/g) ?? [];
console.error(`✓ [${platform}] ${basename(dirname(mdPath))}${left.length ? `（残留占位 ${[...new Set(left)].join(' ')}）` : '，链接齐全'} → 剪贴板`);
