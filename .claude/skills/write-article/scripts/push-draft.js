#!/usr/bin/env node
/**
 * 全自动推草稿：article.md → doocs/md 渲染富文本 → 插图换微信图床 → 封面永久素材 → 草稿箱
 *
 * 用法：node push-draft.js <文章文件夹 | article.md路径> [--show]
 *   --show  有头模式（首次配置主题用：手动选好主题后配置会留在 profile 里）
 *
 * 依赖：
 *   - ~/.config/gzh/env：GZH_APPID / GZH_SECRET（必填）、GZH_AUTHOR（可选，≤8字）
 *   - 本机 Chrome（channel:chrome，兼容 macOS 13，无需下载 Chromium）
 *   - doocs/md 已在 http://localhost:8080 运行
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const show = args.includes('--show');
const target = args.find(a => !a.startsWith('--'));
if (!target) {
  console.error('用法: node push-draft.js <文章文件夹 | article.md路径> [--show]');
  process.exit(1);
}

const fail = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };

// ---------- 定位文章 ----------
const t = resolve(target);
const folder = t.endsWith('.md') ? dirname(t) : t;
const mdPath = t.endsWith('.md') ? t : join(folder, 'article.md');
if (!existsSync(mdPath)) fail(`找不到 ${mdPath}`);

// ---------- frontmatter ----------
const raw = readFileSync(mdPath, 'utf8');
const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
const fmText = fm ? fm[1] : '';
const body = fm ? raw.slice(fm[0].length).trimStart() : raw;
const pick = (k) => (fmText.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1] ?? '')
  .replace(/^['"]|['"]$/g, '').trim();
const title = pick('title');
if (!title) fail('frontmatter 缺 title');

// digest：优先 frontmatter，否则取正文第一个自然段，截到 120 字内
const digestSrc = pick('digest') || body
  .replace(/```[\s\S]*?```/g, '')
  .replace(/^#{1,6}\s.*$/gm, '')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[*_>`#|-]/g, '')
  .split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)[0] || '';
const digest = digestSrc.slice(0, 117) + (digestSrc.length > 117 ? '…' : '');

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
    40005: '图片格式/大小不合规（uploadimg 支持 bmp/png/jpeg/jpg/gif，≤10M）',
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
  writeFileSync(cacheFile, JSON.stringify({ access_token: j.access_token, expires_at: Date.now() + j.expires_in * 1000 }));
  return j.access_token;
}

// ---------- 浏览器：doocs/md 渲染 ----------
console.log('① doocs/md 渲染 ...');
const context = await chromium.launchPersistentContext(
  resolve(process.env.HOME, '.config/gzh/browser-profile'),
  { channel: 'chrome', headless: !show }
);
try {
  const page = context.pages()[0] || await context.newPage();
  // 拦截应用写入剪贴板的内容（拿到的正是点「复制」时的最终 HTML，含内联样式）
  const CLIP_PATCH = () => {
    window.__clipPayload = null;
    const keep = (html) => { if (!window.__clipPayload) window.__clipPayload = html; };
    navigator.clipboard.writeText = async (data) => { keep(String(data)); };
    navigator.clipboard.write = async (items) => {
      for (const item of items) for (const type of item.types)
        keep(await item.getType(type).then(r => r.text()));
    };
    const orig = document.execCommand.bind(document);
    document.execCommand = (cmd, ...a) => {
      if (cmd === 'copy') {
        const s = getSelection();
        if (s.rangeCount) {
          const d = document.createElement('div');
          d.appendChild(s.getRangeAt(0).cloneContents());
          keep(d.innerHTML);
        }
      }
      return orig(cmd, ...a);
    };
  };
  await page.addInitScript(CLIP_PATCH);
  await page.goto('http://localhost:8080', { waitUntil: 'load' });
  await page.waitForSelector('.cm-editor', { timeout: 20000 });
  await page.waitForTimeout(1500);

  // 预置正文：直接写 IndexedDB documents 记录的 content，重载后应用按初始文档加载
  // （绕开输入通道：直接输入会被应用的状态同步节拍回写冲掉）
  await page.evaluate(({ md, ttl }) => new Promise((res, rej) => {
    const req = indexedDB.open('doocs-md');
    req.onsuccess = () => {
      const db = req.result;
      const cur = db.transaction('documents', 'readwrite').objectStore('documents').openCursor();
      cur.onsuccess = () => {
        const c = cur.result;
        if (!c) return rej(new Error('documents 表为空'));
        const rec = c.value;
        rec.content = md;
        rec.title = ttl;
        const put = c.update(rec);
        put.onsuccess = () => res(rec.id);
        put.onerror = () => rej(put.error);
      };
      cur.onerror = () => rej(cur.error);
    };
    req.onerror = () => rej(req.error);
  }), { md: body, ttl: title }).catch(e => fail(`IndexedDB 写入失败: ${e.message}`));

  // 不 reload（会触发应用的退出保存，把写入冲掉）：开新标签页，让应用从 IDB 重新加载
  const page2 = await context.newPage();
  await page2.addInitScript(CLIP_PATCH);
  await page2.goto('http://localhost:8080', { waitUntil: 'load' });
  await page2.waitForSelector('.cm-editor', { timeout: 20000 });
  await page2.waitForTimeout(2500);
  // 校验全文加载：CM6 编辑器 DOM 是虚拟渲染（只有可视区），必须用完整渲染的 #output 预览区判断
  // 以正文最后一段的前几个字为「尾部标记」，它出现即代表全文已加载渲染
  // 注意：标记与输出文本两侧做同样的归一化（剥 Markdown 符号与空白）再比对，
  // 否则「AUTOSAR_SWS_Di…」这类带下划线/空格的尾部会在渲染文本里永远匹配不上
  const NORM_RE = /[*_`#>\[\]()!\-\s]/g;
  const tailMarker = (body.trim().split('\n').filter(Boolean).pop() || '')
    .replace(NORM_RE, '').slice(0, 12);
  await page2.waitForFunction(
    (m) => ((document.querySelector('#output')?.textContent || '').replace(/[*_`#>\[\]()!\-\s]/g, '')).includes(m),
    tailMarker, { timeout: 20000 }
  ).catch(() => fail(`预览未渲染完整正文（尾部标记「${tailMarker}」未出现）`));

  // 点「复制」
  const clicked = await page2.evaluate(() => {
    const btn = [...document.querySelectorAll('button')]
      .find(b => /^复制/.test((b.textContent || '').trim()));
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!clicked) fail('没找到「复制」按钮（doocs/md 界面可能改版，需更新选择器）');
  await page.waitForTimeout(1500);

  var html = await page2.evaluate(() => window.__clipPayload);
  if (!html) {
    console.error('⚠ 未拦截到剪贴板写入，回退为直接抓取 #output（可能缺内联样式，需人工检查）');
    html = await page2.evaluate(() => document.querySelector('#output')?.innerHTML ?? '');
  }
} finally {
  await context.close();
}
console.log(`  ✓ 富文本就绪（${html.length} 字符）`);

// ---------- 图片：插图换微信图床，封面传永久素材 ----------
const token = await getToken();
console.log('② 处理插图 ...');
const imgMap = new Map();
for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
  const src = m[1];
  if (/^img\//.test(src) && !imgMap.has(src)) imgMap.set(src, null);
}
for (const src of imgMap.keys()) {
  const p = join(folder, src);
  if (!existsSync(p)) fail(`正文引用的图片不存在：${p}`);
  const form = new FormData();
  form.append('media', new Blob([readFileSync(p)], { type: 'image/jpeg' }), basename(src));
  const j = await (await fetch(
    `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`,
    { method: 'POST', body: form }
  )).json();
  if (j.errcode) apiFail(j.errcode, j.errmsg);
  imgMap.set(src, j.url);
  console.log(`  ✓ ${src} → 微信图床`);
}
for (const [src, url] of imgMap) {
  html = html.split(`src="${src}"`).join(`src="${url}"`)
             .split(`src='${src}'`).join(`src='${url}'`);
}

console.log('③ 上传封面永久素材 ...');
const coverPath = join(folder, 'img/cover.jpg');
if (!existsSync(coverPath)) fail(`找不到封面 ${coverPath}（约定主图命名 img/cover.jpg）`);
const matForm = new FormData();
matForm.append('media', new Blob([readFileSync(coverPath)], { type: 'image/jpeg' }), 'cover.jpg');
const mat = await (await fetch(
  `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
  { method: 'POST', body: matForm }
)).json();
if (mat.errcode) apiFail(mat.errcode, mat.errmsg);
console.log('  ✓ 封面就绪');

// ---------- 推草稿 ----------
console.log('④ 推送草稿 ...');
const article = {
  title, digest, content: html,
  thumb_media_id: mat.media_id,
  need_open_comment: 0, only_fans_can_comment: 0,
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

console.log(`✓ 已进草稿箱！《${title}》media_id: ${draft.media_id}`);
console.log('  下一步：后台 → 草稿箱 → 预览 → 勾选 AI 生成内容标识 → 发布');
