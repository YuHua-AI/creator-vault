#!/usr/bin/env node
/**
 * 贴图（图片消息 newspic）推草稿：公众号「发帖图」形态，图为主文为壳
 *
 * 流程：读 article.md → 按正文图片引用顺序逐张传永久素材 → draft/add 建 newspic 草稿
 *   - 首张图即帖图封面（约定 img/cover.jpg 排第一）
 *   - 标题：--title > frontmatter tietu_title > title（图片消息标题 ≤32 字，超长报错）
 *   - 文案：--text <文件> > 正文去图去格式后的纯文本（≤1000 字）
 *
 * 用法：node push-tietu.js <文章文件夹> [--title 标题] [--text 文案路径]
 * 依赖：~/.config/gzh/env（GZH_APPID / GZH_SECRET，可选 GZH_AUTHOR ≤8 字）
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));
if (!target) {
  console.error('用法: node push-tietu.js <文章文件夹> [--title 标题] [--text 文案路径]');
  process.exit(1);
}
const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : ''; };

const fail = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };

// ---------- 定位文章与 frontmatter ----------
const folder = resolve(target);
const mdPath = folder.endsWith('.md') ? folder : join(folder, 'article.md');
if (!existsSync(mdPath)) fail(`找不到 ${mdPath}`);
const raw = readFileSync(mdPath, 'utf8');
const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const fmText = fm ? fm[1] : '';
const body = fm ? raw.slice(fm[0].length).trimStart() : raw;
const pick = (k) => (fmText.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1] ?? '')
  .replace(/^['"]|['"]$/g, '').trim();

// ---------- 标题（newspic ≤32 字） ----------
const title = opt('title') || pick('tietu_title') || pick('title');
if (!title) fail('没有可用标题（--title / frontmatter tietu_title / title 均缺）');
const titleLen = Array.from(title).length;
if (titleLen > 32) fail(`标题 ${titleLen} 字，超过图片消息上限 32 字（可在 frontmatter 加 tietu_title: 短标题）`);

// ---------- 文案（纯文本，≤1000 字） ----------
const textPath = opt('text');
let caption;
if (textPath) {
  if (!existsSync(resolve(textPath))) fail(`找不到文案文件 ${textPath}`);
  caption = readFileSync(resolve(textPath), 'utf8').trim();
} else {
  caption = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')   // 去图（图单独走素材）
    .replace(/^\s*---\s*$/gm, '')           // 去分隔线
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .split('\n').map(s => s.trim()).filter(Boolean).join('\n');
}
const capLen = Array.from(caption).length;
if (capLen > 1000) fail(`文案 ${capLen} 字，超过图片消息上限 1000 字`);
if (!caption) fail('文案为空（正文没有可用文字，或用 --text 指定）');

// ---------- 图片：按正文引用顺序 ----------
const imgRefs = [...body.matchAll(/!\[[^\]]*\]\((img\/[^)]+)\)/g)].map(m => m[1]);
if (!imgRefs.length) fail('正文没有引用任何图片（贴图的图就是内容，用 ![…](img/…) 按顺序引用）');

// ---------- 凭据与 token（库外，不入 git 不入对话） ----------
const envPath = process.env.GZH_ENV || resolve(process.env.HOME, '.config/gzh/env');
if (!existsSync(envPath)) fail(`未找到凭据文件 ${envPath}（GZH_APPID / GZH_SECRET）`);
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
);
const { GZH_APPID: appid, GZH_SECRET: secret } = env;
if (!appid || !secret) fail('凭据文件缺少 GZH_APPID 或 GZH_SECRET');

const apiFail = (code, msg) => {
  const tips = {
    40164: 'IP 不在白名单：把 errmsg 里的 IP 加进 微信开发者平台 → 基础信息 → IP白名单 后重试',
    40005: '图片格式/大小不合规（支持 bmp/png/jpeg/jpg/gif，≤10M）',
    40009: '图片大小超限（≤10M）',
    48001: '账号无此 API 权限',
  };
  console.error(`✗ API errcode ${code}: ${msg}`);
  if (tips[code]) console.error(`  ↳ ${tips[code]}`);
  process.exit(1);
};

async function getToken() {
  const cacheFile = resolve(process.env.HOME, '.config/gzh/token.json');
  try {
    const c = JSON.parse(readFileSync(cacheFile, 'utf8'));
    if (c.expires_at > Date.now() + 300_000) return c.access_token;
  } catch { /* 无缓存则重新获取 */ }
  const j = await (await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
  )).json();
  if (j.errcode) apiFail(j.errcode, j.errmsg);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(cacheFile, JSON.stringify({ access_token: j.access_token, expires_at: Date.now() + j.expires_in * 1000 }));
  return j.access_token;
}

const token = await getToken();

// ---------- 逐张传永久素材（首张即封面） ----------
console.log(`① 上传 ${imgRefs.length} 张永久素材（首张为封面）...`);
const mediaIds = [];
for (const src of imgRefs) {
  const p = join(dirname(mdPath), src);
  if (!existsSync(p)) fail(`正文引用的图片不存在：${p}`);
  const form = new FormData();
  form.append('media', new Blob([readFileSync(p)], { type: 'image/jpeg' }), basename(src));
  const j = await (await fetch(
    `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
    { method: 'POST', body: form }
  )).json();
  if (j.errcode) apiFail(j.errcode, j.errmsg);
  mediaIds.push(j.media_id);
  console.log(`  ✓ ${src}`);
}

// ---------- 建图片消息（newspic）草稿 ----------
console.log('② 推送图片消息草稿 ...');
const article = {
  article_type: 'newspic',
  title, content: caption,
  need_open_comment: 1, only_fans_can_comment: 0,
  image_info: { image_list: mediaIds.map(id => ({ image_media_id: id })) },
};
if (env.GZH_AUTHOR) {
  if (Array.from(env.GZH_AUTHOR).length > 8) fail('GZH_AUTHOR 超过 8 个字符（公众号作者栏上限）');
  article.author = env.GZH_AUTHOR;
}
const draft = await (await fetch(
  `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articles: [article] }) }
)).json();
if (draft.errcode) apiFail(draft.errcode, draft.errmsg);

console.log(`✓ 图片消息已进草稿箱！《${title}》media_id: ${draft.media_id}`);
console.log(`  共 ${mediaIds.length} 张图，文案 ${capLen} 字`);
console.log('  下一步：后台 → 草稿箱 → 打开预览（确认首图封面裁剪）→ 勾选 AI 生成内容标识 → 发布');
