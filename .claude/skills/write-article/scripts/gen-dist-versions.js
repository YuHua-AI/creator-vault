#!/usr/bin/env node
/**
 * 生成分发版（单份）：article.md 去 frontmatter → 拼 footer.md → 按 --platform 注册表回填链接
 *   → distribution/<专题>/articles/<slug>.md
 * 内容各平台一致（一篇文章走天下）；贴哪个平台就用哪个 --platform 现生成，
 * 差别只在尾部系列目录的链接指向该平台自己的已发版本。
 *
 * 用法：node gen-dist-versions.js <文章文件夹> [--platform zh|csdn]   # 默认 zh
 *
 * 依赖约定（distribution/<专题>/）：
 *   - footer.md   尾部模板，占位符 {{链接:<slug>}}、{{公众号名}}
 *   - links.json  { "collection": "…", "公众号名": "", "zh": {"<slug>": "url"}, "csdn": {} }
 *                 collection 字段用于反查专题目录（目录名不必等于 frontmatter 的 collection）
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
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
if (!target) { console.error('用法: node gen-dist-versions.js <文章文件夹> [--platform zh|csdn]'); process.exit(1); }

const mdPath = target.endsWith('.md') ? target : join(target, 'article.md');
if (!existsSync(mdPath)) { console.error(`✗ 找不到 ${mdPath}`); process.exit(1); }

const raw = readFileSync(mdPath, 'utf8');
const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const fmText = fm ? fm[1] : '';
const body = (fm ? raw.slice(fm[0].length) : raw).trimStart();
const pick = (k) => (fmText.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1] ?? '').trim();
const collection = pick('collection');
const slug = basename(dirname(mdPath));
if (!collection) { console.error('✗ frontmatter 缺 collection（footer/注册表按 collection 定位）'); process.exit(1); }

// 注册表反查：扫描 distribution/*/links.json，按 collection 字段匹配
const distRoot = join(vaultRoot, 'distribution');
let reg = {}, topicDir = null;
if (existsSync(distRoot)) {
  for (const d of readdirSync(distRoot, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)) {
    const p = join(distRoot, d, 'links.json');
    if (!existsSync(p)) continue;
    const r = JSON.parse(readFileSync(p, 'utf8'));
    if (r.collection === collection) { reg = r; topicDir = d; break; }
  }
}
if (!topicDir) { console.error(`✗ distribution/ 下没有 collection 为「${collection}」的 links.json`); process.exit(1); }
if (!reg[platform]) { console.error(`✗ links.json 缺平台键「${platform}」（现有：${Object.keys(reg).filter(k => k !== 'collection' && k !== '公众号名').join(', ')}）`); process.exit(1); }

const footerPath = join(distRoot, topicDir, 'footer.md');
if (!existsSync(footerPath)) { console.error(`✗ 缺 ${footerPath}`); process.exit(1); }

const filled = (body + '\n\n' + readFileSync(footerPath, 'utf8').trim() + '\n')
  .replace(/\{\{链接:([^}]+)\}\}/g, (_, s) => reg[platform][s] || `{{链接:${s}}}`)
  .replace(/\{\{公众号名\}\}/g, reg['公众号名'] || '{{公众号名}}');

const out = join(distRoot, topicDir, 'articles', `${slug}.md`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, filled);
const left = filled.match(/\{\{[^}]+\}\}/g) ?? [];
console.log(`✓ [${platform}] ${out}${left.length ? `（残留占位 ${[...new Set(left)].join(' ')}）` : '，链接齐全'}`);
