#!/usr/bin/env node
/**
 * 站外平台准自动推稿（知乎/CSDN）：打开发布编辑器 → 自动填标题/贴正文/传图 → 停在「发布」前
 * 人工只做：检查 + 点发布（准自动红线：发布动作永远留给人工）
 *
 * 用法：node push-platform-draft.js <文章文件夹> --platform zh|csdn
 *
 * 依赖：
 *   - 正文生成：gen-dist-versions.js（同目录，stdout 复用）
 *   - 本机 Chrome（channel:chrome，兼容 macOS 13）
 *   - 首次运行会打开浏览器等你登录该平台，会话存 ~/.config/gzh/profile-<platform>，此后免登
 *   - 图片：img/ 下本地文件以字节传入页面、DataTransfer 模拟拖放；失败则列清单人工拖
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const vaultRoot = resolve(scriptDir, '../../../../');

const args = process.argv.slice(2);
const platform = args.includes('--platform') ? args[args.indexOf('--platform') + 1] : '';
const target = resolve(args.find(a => !a.startsWith('--')));
if (!platform || !target) {
  console.error('用法: node push-platform-draft.js <文章文件夹> --platform zh|csdn');
  process.exit(1);
}

const PLATFORMS = {
  zh: {
    name: '知乎',
    profile: resolve(process.env.HOME, '.config/gzh/profile-zh'),
    url: 'https://zhuanlan.zhihu.com/write',
    editorReady: ['.public-DraftEditor-content', '.ProseMirror', '[contenteditable="true"]'],
    loginWall: /signin|login/,
    titleSelectors: ['textarea[placeholder*="标题"]', '.WriteIndex-titleInput textarea', 'input[placeholder*="标题"]', 'textarea.WriteIndex-titleInput'],
    editorSelectors: ['.public-DraftEditor-content[contenteditable="true"]', '.ProseMirror[contenteditable="true"]', '[contenteditable="true"]'],
  },
  csdn: {
    name: 'CSDN',
    profile: resolve(process.env.HOME, '.config/gzh/profile-csdn'),
    url: 'https://editor.csdn.net/md',
    editorReady: ['pre.editor__inner', '.CodeMirror', '[contenteditable="true"]', 'textarea'],
    loginWall: /login|passport/,
    titleSelectors: ['input.article-bar__title', 'input[placeholder*="文章标题"]', '.article-title input'],
    editorSelectors: ['pre.editor__inner', '.CodeMirror', '[contenteditable="true"]', 'textarea'],
    // 图片上传（探针实测 2026-11-15）：拖放触发 signature → 华为云 OBS POST → 响应含 imageUrl
    uploadResponseHost: 'myhuaweicloud.com',
  },
};
const cfg = PLATFORMS[platform];
if (!cfg) { console.error(`✗ 未知平台「${platform}」（支持：${Object.keys(PLATFORMS).join('/')}）`); process.exit(1); }

// ---------- 1. 生成分发正文（复用 gen-dist-versions 的 stdout） ----------
const gen = join(scriptDir, 'gen-dist-versions.js');
let content;
try {
  content = execFileSync('node', [gen, target, '--platform', platform], { encoding: 'utf8', cwd: vaultRoot });
} catch (e) { console.error(`✗ 生成正文失败：${e.stderr || e.message}`); process.exit(1); }
const articleDir = resolve(target).endsWith('.md') ? dirname(resolve(target)) : resolve(target);
const title = (readFileSync(join(articleDir, 'article.md'), 'utf8')
  .match(/^title:\s*(.+)$/m)?.[1] || '').replace(/^['"]|['"]$/g, '');
const imgs = [...content.matchAll(/!\[[^\]]*\]\((img\/[^)]+)\)/g)].map(m => m[1]);
console.log(`① 正文就绪（${content.length} 字符，图 ${imgs.length} 张）标题：《${title}》`);

// ---------- 2. 打开编辑器（有头，用户要看着点发布） ----------
console.log(`② 启动 ${cfg.name} 编辑器（profile: ${basename(cfg.profile)}）...`);
const context = await chromium.launchPersistentContext(cfg.profile, {
  channel: 'chrome', headless: false,
  viewport: { width: 1440, height: 900 },
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = context.pages()[0] || await context.newPage();
await page.goto(cfg.url, { waitUntil: 'domcontentloaded' });

// 等编辑器就位；撞登录墙则等人工登录（最多 3 分钟）
async function waitForEditor(p) {
  for (const sel of cfg.editorReady) {
    try { await p.waitForSelector(sel, { timeout: 5000 }); return sel; } catch { /* 试下一个 */ }
  }
  return null;
}
let editorSel = await waitForEditor(page);
if (!editorSel || cfg.loginWall.test(page.url())) {
  console.log('⚠ 需要登录：请在打开的浏览器窗口中登录（凭据自己输），最多等 3 分钟...');
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    await page.goto(cfg.url, { waitUntil: 'domcontentloaded' }).catch(() => {});
    editorSel = await waitForEditor(page);
    if (editorSel && !cfg.loginWall.test(page.url())) break;
    await page.waitForTimeout(5000);
  }
}
if (!editorSel) { console.error('✗ 编辑器未就位（登录超时或页面改版），退出'); await context.close(); process.exit(1); }
console.log(`  ✓ 编辑器就位（${editorSel}）`);

// ---------- 3. 填标题（等待出现 + 强制点击 + 读回验证） ----------
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(cfg.url).origin });
let titleOk = false;
for (const sel of cfg.titleSelectors) {
  try {
    await page.waitForSelector(sel, { timeout: 8000, state: 'attached' });
    const el = page.locator(sel).first();
    await el.click({ force: true }).catch(() => {});
    await el.fill(title).catch(async () => { await el.pressSequentially(title, { delay: 20 }); });
    const v = await el.inputValue().catch(() => '');
    if (v && v.slice(0, 8) === title.slice(0, 8)) {
      titleOk = true; console.log(`  ✓ 标题已填并验证（${sel}）`); break;
    }
    console.log(`  · ${sel} 填写未生效（读回为空），试下一候选`);
  } catch { /* 该候选不存在，试下一个 */ }
}
if (!titleOk) console.log(`⚠ 标题没填上，请手动填：《${title}》`);

// ---------- 4. CSDN 专用：先上传图片拿 URL，替换进 Markdown ----------
async function dropFile(p, sel) {
  const b64 = readFileSync(p).toString('base64');
  return page.evaluate(async ({ b64, name, sel }) => {
    try {
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const file = new File([bytes], name, { type: 'image/jpeg' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const target = document.querySelector(sel) || document.body;
      for (const type of ['dragenter', 'dragover', 'drop']) {
        target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
      }
      return true;
    } catch { return false; }
  }, { b64, name: basename(p), sel }).catch(() => false);
}

if (platform === 'csdn') {
  // 监听上传响应，按序截获 imageUrl
  const urls = [];
  page.on('response', async r => {
    if (r.url().includes(cfg.uploadResponseHost)) {
      try {
        const j = await r.json();
        if (j?.data?.imageUrl) urls.push(j.data.imageUrl);
      } catch { /* 非上传响应忽略 */ }
    }
  });
  const map = new Map();
  for (const rel of imgs) {
    const p = join(articleDir, rel);
    if (!existsSync(p)) { console.log(`  ⚠ ${rel} 文件不存在，保留本地引用`); continue; }
    const before = urls.length;
    const ok = await dropFile(p, editorSel);
    const deadline = Date.now() + 20_000;
    while (urls.length <= before && Date.now() < deadline) await page.waitForTimeout(300);
    if (urls.length > before) {
      map.set(rel, urls[before]);
      console.log(`  ✓ 上传 ${rel} → ${urls[before]}`);
    } else {
      console.log(`  ⚠ ${rel} 上传超时${ok ? '（拖放成功但无响应）' : '（拖放失败）'}，保留本地引用`);
    }
  }
  for (const [rel, url] of map) content = content.split(rel).join(url);
  console.log(`  ✓ 图片 URL 已替换进 Markdown（${map.size}/${imgs.length}）`);
}

// ---------- 5. 贴正文（清掉可能的草稿残留 → 写剪贴板 → Cmd+V） ----------
let pasteOk = false;
await page.evaluate(t => navigator.clipboard.writeText(t), content);
for (const sel of cfg.editorSelectors) {
  const el = page.locator(sel).first();
  if (await el.count() && await el.isVisible().catch(() => false)) {
    await el.click();
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+V');
    await page.waitForTimeout(1500);
    pasteOk = true; console.log(`  ✓ 正文已粘贴（${sel}，Cmd+V）`); break;
  }
}
if (!pasteOk) console.log('⚠ 自动粘贴失败——正文已在剪贴板，请点正文区按 Cmd+V');

// ---------- 6. 知乎：富文本编辑器不吃 Markdown，拖放插图兜底（待升级为 HTML 粘贴） ----------
if (platform === 'zh' && imgs.length) {
  let imgsOk = 0;
  const imgsFail = [];
  for (const rel of imgs) {
    const p = join(articleDir, rel);
    if (!existsSync(p)) { imgsFail.push(`${rel}（文件不存在）`); continue; }
    (await dropFile(p, editorSel)) ? imgsOk++ : imgsFail.push(rel);
  }
  console.log(imgsOk === imgs.length
    ? `  ✓ 图片 ${imgsOk}/${imgs.length} 已拖入（位置需人工核对）`
    : `  ⚠ 图片 ${imgsOk}/${imgs.length}：失败的从 ${join(articleDir, 'img/')} 手动拖 → ${imgsFail.join('、') || '(无)'}`);
}

// ---------- 6. 交棒人工 ----------
console.log('\n③ 预填完成——请在浏览器中：检查排版 → 补漏（标题/图）→ 勾选 AI 生成标识 → 点发布');
console.log(`   发布后 URL 登记 published/<专题>/links.json 的 "${platform}" 键`);
console.log('   发布完成回到终端 Ctrl+C 退出（浏览器随之关闭；15 分钟无操作自动退出）');
await new Promise(r => {
  process.on('SIGINT', r);
  setTimeout(r, 15 * 60_000);
});
await context.close();
console.log('✓ 结束');
