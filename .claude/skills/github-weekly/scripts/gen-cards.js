#!/usr/bin/env node
// 生成 8 张竖版项目卡 SVG（1350×1800，同一模板换数据，保证风格一致）
// 版式：项目名标题 / 作者·语言小字 / 一句话介绍 / 星数（总星标+周增长）/ 正文三段（项目速览·核心玩法·适用人群）
// 用法: node gen-cards.js <img-src/data.json>  → 输出到 data.json 同目录 <file>.svg
// 规则见 ../references/rules.md（版式变更=改本脚本并 commit）
const fs = require('fs');
const path = require('path');
const { ICONS } = require('./icons');

const dataPath = process.argv[2];
if (!dataPath || !dataPath.endsWith('.json')) {
  console.error('用法: node gen-cards.js <img-src/data.json 路径>');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(path.resolve(dataPath), 'utf8'));
const outDir = path.dirname(path.resolve(dataPath));

// 三段正文的小节：标签胶囊 + 两行左对齐文字
const SECTIONS = [
  { key: 'what', label: '项目速览' },
  { key: 'can', label: '核心玩法' },
  { key: 'who', label: '适用人群' },
];
const SECTION_TOPS = [952, 1168, 1384]; // 每节顶边 y

function sectionBlocks(c) {
  return SECTIONS.map((s, i) => {
    const top = SECTION_TOPS[i];
    const w = s.label.length * 24 + 44;
    const lines = c[s.key].map((line, j) =>
      `<text x="110" y="${top + 92 + j * 46}" font-size="27" fill="#B8CCDF">${line}</text>`).join('\n  ');
    return `<rect x="110" y="${top}" width="${w}" height="42" rx="21" fill="none" stroke="#3EE8B0" stroke-opacity="0.75" stroke-width="1.8"/>
    <text x="${110 + w / 2}" y="${top + 29}" text-anchor="middle" font-size="24" letter-spacing="4" fill="#3EE8B0">${s.label}</text>
    ${lines}`;
  }).join('\n  ');
}

function starsBlock(c) {
  return `<rect x="65" y="706" width="560" height="140" rx="18" fill="#0E2038" fill-opacity="0.9" stroke="#29527A" stroke-width="1.5"/>
  <text x="345" y="748" text-anchor="middle" font-size="20" letter-spacing="6" fill="#6B8299">总星标 TOTAL</text>
  <text x="345" y="816" text-anchor="middle" font-size="56" font-weight="800" fill="#FFFFFF"><tspan fill="#35D0FF">★</tspan> ${c.total}</text>
  <rect x="725" y="706" width="560" height="140" rx="18" fill="#0E2038" fill-opacity="0.9" stroke="#3EE8B0" stroke-opacity="0.55" stroke-width="1.8"/>
  <text x="1005" y="748" text-anchor="middle" font-size="20" letter-spacing="6" fill="#6B8299">本周增长 WEEKLY</text>
  <text x="1005" y="816" text-anchor="middle" font-size="56" font-weight="800" fill="#3EE8B0" filter="url(#glowGreen)">▲ ${c.growth}</text>`;
}

function capsuleRow(tags) {
  const pad = 28, gap = 22, h = 52, fs = 26;
  const widths = tags.map(t => t.length * fs * 1.02 + pad * 2);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
  let x = (1350 - total) / 2;
  let s = '';
  tags.forEach((t, i) => {
    s += `<rect x="${x.toFixed(1)}" y="1564" width="${widths[i].toFixed(1)}" height="${h}" rx="${h / 2}" fill="#0E2A4A" stroke="#3E6E9E" stroke-width="1.5"/>
    <text x="${(x + widths[i] / 2).toFixed(1)}" y="1600" text-anchor="middle" font-size="${fs}" fill="#D6E6F5">${t}</text>`;
    x += widths[i] + gap;
  });
  return s;
}

function card(c) {
  const top3 = c.no <= 3;
  const noColor = top3 ? '#3EE8B0' : '#7FA8D0';
  const noStroke = top3 ? '#3EE8B0' : '#3E6E9E';
  const titleFs = c.repo.length > 16 ? 54 : 72; // 长项目名缩小一档，防止撑爆宽度
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1350 1800" font-family="'PingFang SC','Hiragino Sans GB',sans-serif">
  <defs>
    <radialGradient id="bgGlow" cx="42%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#16294A"/><stop offset="100%" stop-color="#0A1826"/>
    </radialGradient>
    <filter id="glowGreen" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#3EE8B0"/>
    </filter>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M80 0H0V80" fill="none" stroke="#132440" stroke-opacity="0.35" stroke-width="1.5"/>
    </pattern>
    ${ICONS[c.icon]}
  </defs>

  <rect width="1350" height="1800" fill="url(#bgGlow)"/>
  <rect width="1350" height="1800" fill="url(#grid)"/>
  <ellipse cx="240" cy="1600" rx="480" ry="300" fill="#14405E" opacity="0.28"/>
  <circle cx="1200" cy="180" r="3" fill="#7FA8D0" opacity="0.45"/>
  <circle cx="130" cy="760" r="2.5" fill="#7FA8D0" opacity="0.3"/>
  <circle cx="1240" cy="980" r="2.5" fill="#7FA8D0" opacity="0.35"/>

  <!-- 顶部胶囊 -->
  <rect x="64" y="56" width="470" height="54" rx="27" fill="#0E2A4A" stroke="#3E6E9E" stroke-width="1.5"/>
  <text x="299" y="92" text-anchor="middle" font-size="26" letter-spacing="5" fill="#D6E6F5">GITHUB WEEKLY · 开源周榜</text>
  <text x="64" y="146" font-size="20" letter-spacing="2" fill="#4E6A85">统计周期 ${data.period}</text>
  <rect x="1074" y="56" width="212" height="54" rx="27" fill="#0E2A4A" stroke="${noStroke}" stroke-width="1.8"/>
  <text x="1180" y="93" text-anchor="middle" font-size="28" font-weight="800" letter-spacing="3" fill="${noColor}">NO.${String(c.no).padStart(2, '0')}</text>

  <!-- 专属图标 -->
  <use href="#ic-${c.icon}" transform="translate(675 305) scale(1.6)"/>

  <!-- 项目名标题 + 作者·语言小字 -->
  <text x="675" y="505" text-anchor="middle" font-size="${titleFs}" font-weight="800" fill="#FFFFFF">${c.repo}</text>
  <text x="675" y="562" text-anchor="middle" font-size="26" letter-spacing="1" fill="#8FAECB">${c.owner} · ${c.lang}</text>

  <!-- 一句话介绍 -->
  <text x="675" y="655" text-anchor="middle" font-size="46" font-weight="700" fill="#3EE8B0" filter="url(#glowGreen)">${c.pitch}</text>

  <!-- 星数 -->
  ${starsBlock(c)}

  <!-- 分隔线 -->
  <line x1="220" y1="880" x2="1130" y2="880" stroke="#29527A" stroke-width="2"/>
  <circle cx="675" cy="880" r="6" fill="#0A1826" stroke="#35D0FF" stroke-width="2.5"/>

  <!-- 正文三段 -->
  ${sectionBlocks(c)}

  <!-- 标签 -->
  ${capsuleRow(c.tags)}

  <!-- 底部 -->
  <line x1="64" y1="1664" x2="1286" y2="1664" stroke="#1E3A56" stroke-width="2"/>
  <text x="64" y="1722" font-size="26" letter-spacing="3" fill="#8FAECB">屿华AI · YuHua-AIPlay</text>
  <text x="1286" y="1722" text-anchor="end" font-size="24" fill="#4E6A85">github.com/${c.owner}/${c.repo}</text>
</svg>
`;
}

data.cards.forEach(c => {
  fs.writeFileSync(path.join(outDir, `${c.file}.svg`), card(c));
  console.log(`✓ ${c.file}.svg`);
});
