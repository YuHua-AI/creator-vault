#!/usr/bin/env node
/**
 * 公众号草稿箱权限验证脚本（零依赖，Node >= 18）
 *
 * 用法：
 *   1. 白名单：把当前出口 IPv4 加进 公众号后台 → 设置与开发 → 基本配置 → IP白名单
 *   2. 凭据：~/.config/gzh/env 写两行并 chmod 600（此文件在库外，绝不入库）
 *        GZH_APPID=wx....
 *        GZH_SECRET=....
 *   3. 运行：node verify-draft.js [--image 某个cover.jpg路径]
 *
 * 做三件事：取 access_token → 传封面永久素材 → 推一篇测试草稿
 * 成功标志：后台草稿箱出现「写作管线验证草稿（可删）」
 * 返回 48001 则此账号无草稿箱 API 权限，需退回剪贴板方案
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

async function main() {
  // ---------- ① 凭据（从库外环境文件读，不进 git 不进对话） ----------
  const envPath = process.env.GZH_ENV || resolve(process.env.HOME, '.config/gzh/env');
  if (!existsSync(envPath)) {
    console.error(`✗ 未找到凭据文件 ${envPath}`);
    console.error('  请创建并写入两行（建议 chmod 600）：');
    console.error('  GZH_APPID=...');
    console.error('  GZH_SECRET=...');
    process.exit(1);
  }
  const env = Object.fromEntries(
    readFileSync(envPath, 'utf8').split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => l.split('=').map(s => s.trim()))
  );
  const { GZH_APPID: appid, GZH_SECRET: secret } = env;
  if (!appid || !secret) {
    console.error('✗ 凭据文件缺少 GZH_APPID 或 GZH_SECRET');
    process.exit(1);
  }

  const fail = (code, msg) => {
    const tips = {
      40013: 'appid 无效：检查 GZH_APPID 是否抄对',
      40125: 'secret 无效：后台「基本配置」重置后更新 GZH_SECRET',
      40164: 'IP 不在白名单：把下面 errmsg 里报出的 IP 加进后台 IP 白名单后重试',
      48001: '账号无此 API 权限：此号调不了草稿箱接口，退回剪贴板方案',
    };
    console.error(`✗ errcode ${code}: ${msg}`);
    if (tips[code]) console.error(`  ↳ ${tips[code]}`);
    process.exit(1);
  };

  // ---------- ② access_token ----------
  console.log('① 获取 access_token ...');
  const tokenJson = await (await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
  )).json();
  if (tokenJson.errcode) fail(tokenJson.errcode, tokenJson.errmsg);
  const token = tokenJson.access_token;
  console.log('  ✓ token 获取成功（有效期内复用，输出中不展示）');

  // ---------- ③ 上传封面永久素材 ----------
  const imgArgIdx = process.argv.indexOf('--image');
  const imgPath = imgArgIdx > -1 ? process.argv[imgArgIdx + 1] : defaultCover();
  if (!imgPath) {
    console.error('✗ 找不到封面图：drafts/*/img/ 下没有 cover.jpg，请用 --image 指定一张 jpg');
    process.exit(1);
  }
  console.log(`② 上传封面永久素材：${imgPath}`);
  const form = new FormData();
  form.append('media', new Blob([readFileSync(imgPath)], { type: 'image/jpeg' }), 'cover.jpg');
  const matJson = await (await fetch(
    `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
    { method: 'POST', body: form }
  )).json();
  if (matJson.errcode) fail(matJson.errcode, matJson.errmsg);
  console.log(`  ✓ thumb_media_id: ${matJson.media_id}`);

  // ---------- ④ 推送测试草稿 ----------
  console.log('③ 推送测试草稿 ...');
  const draftJson = await (await fetch(
    `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articles: [{
          title: '写作管线验证草稿（可删）',
          author: '写作管线',
          digest: '用于验证草稿箱 API 权限的测试草稿。',
          content: '<p>这是一篇由写作管线自动推送的验证草稿。<strong>权限验证成功</strong>，本条草稿及上传的封面素材可安全删除。</p>',
          thumb_media_id: matJson.media_id,
          need_open_comment: 0,
          only_fans_can_comment: 0,
        }],
      }),
    }
  )).json();
  if (draftJson.errcode) fail(draftJson.errcode, draftJson.errmsg);

  console.log(`✓ 验证成功！草稿 media_id: ${draftJson.media_id}`);
  console.log('  打开 公众号后台 → 草稿箱，应能看到「写作管线验证草稿（可删）」');
  console.log('  验证后请清理：① 删除该草稿  ② 素材管理里删掉刚上传的封面图');
}

// 默认取最近改动的 drafts/*/img/cover.jpg 当测试封面
function defaultCover() {
  const draftsDir = resolve(VAULT_ROOT, 'drafts');
  if (!existsSync(draftsDir)) return null;
  const candidates = readdirSync(draftsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => resolve(draftsDir, d.name, 'img/cover.jpg'))
    .filter(p => existsSync(p))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return candidates[0] ?? null;
}

main().catch(e => { console.error('✗ 网络或脚本异常：', e.message); process.exit(1); });
