#!/usr/bin/env node
/**
 * 配图渲染：SVG 设计稿 → JPG（headless Chrome，复用系统 Chrome，兼容 macOS 13）
 *
 * 用法：node render-img.js <in.svg> [out.jpg]
 *   out.jpg 缺省为同目录同名 .jpg
 * 设计稿尺寸即输出像素尺寸（SVG viewBox 2400x1350 → 输出 2400x1350）
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !inPath.endsWith('.svg')) {
  console.error('用法: node render-img.js <in.svg> [out.jpg]');
  process.exit(1);
}
const svg = readFileSync(inPath, 'utf8');
const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
if (!m) { console.error('✗ SVG 缺少 viewBox="0 0 W H"'); process.exit(1); }
const [, w, h] = m.map(Number);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0;background:#0A1826">${svg}</body></html>`);
await page.evaluate(() => document.fonts.ready); // 等中文字体就绪
await page.waitForTimeout(400);
await page.screenshot({ path: outPath || inPath.replace(/\.svg$/, '.jpg'), type: 'jpeg', quality: 92 });
await browser.close();
console.log(`✓ ${outPath || inPath.replace(/\.svg$/, '.jpg')} (${w}x${h})`);
