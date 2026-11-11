#!/usr/bin/env node
// 生成竖版主图 SVG（1350×1800：标题区 + 8 行榜单，与子图同画幅成套）
// 用法: node gen-cover.js <img-src/data.json>  → 输出到 data.json 同目录 cover.svg
// 规则见 ../references/rules.md（版式变更=改本脚本并 commit）
const fs = require('fs');
const path = require('path');
const { ICONS } = require('./icons');

const dataPath = process.argv[2];
if (!dataPath || !dataPath.endsWith('.json')) {
  console.error('用法: node gen-cover.js <img-src/data.json 路径>');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(path.resolve(dataPath), 'utf8'));
const outDir = path.dirname(path.resolve(dataPath));

// 榜单行由 cards 派生：项目名/封面短介绍/封面标签/周增长
const ROWS = data.cards.map(c => ({
  icon: c.icon, name: c.repo, intro: c.coverIntro, tags: c.coverTags, growth: c.growth,
}));

const TOP = 412;      // 首行顶边
const PITCH = 158;    // 行距
const H = 142;        // 行高

function row(r, i) {
  const t = TOP + i * PITCH;
  const top3 = i < 3;
  const rankColor = top3 ? '#3EE8B0' : '#7FA8D0';
  const growthColor = top3 ? '#3EE8B0' : '#35D0FF';
  const glow = top3 ? ' filter="url(#glowGreen)"' : '';
  // 行内小标签胶囊
  let x = 316;
  let pills = '';
  r.tags.forEach(tag => {
    const w = tag.length * 16 * 0.98 + 30;
    pills += `<rect x="${x}" y="${t + 108}" width="${w.toFixed(1)}" height="27" rx="13.5" fill="#0E2A4A" stroke="#3E6E9E" stroke-width="1.2"/>
      <text x="${(x + w / 2).toFixed(1)}" y="${t + 127}" text-anchor="middle" font-size="16" fill="#9FBFDA">${tag}</text>`;
    x += w + 12;
  });
  return `<g>
    <rect x="50" y="${t}" width="1250" height="${H}" rx="16" fill="#0D2036" fill-opacity="0.92" stroke="#29527A" stroke-width="1.5"/>
    ${top3 ? `<rect x="50" y="${t + 14}" width="5" height="${H - 28}" rx="2.5" fill="#3EE8B0" opacity="0.85"/>` : ''}
    <text x="118" y="${t + 94}" text-anchor="middle" font-size="56" font-weight="800" fill="${rankColor}"${glow}>${String(i + 1).padStart(2, '0')}</text>
    <line x1="178" y1="${t + 26}" x2="178" y2="${t + 116}" stroke="#1E3A56" stroke-width="2"/>
    <use href="#ic-${r.icon}" transform="translate(248 ${t + 71}) scale(0.7)"/>
    <text x="316" y="${t + 62}" font-size="34" font-weight="700" fill="#FFFFFF">${r.name}</text>
    <text x="316" y="${t + 98}" font-size="22" fill="#8FAECB">${r.intro}</text>
    ${pills}
    <text x="1226" y="${t + 82}" text-anchor="end" font-size="34" font-weight="800" fill="${growthColor}">▲${r.growth}</text>
    <text x="1226" y="${t + 114}" text-anchor="end" font-size="15" letter-spacing="2" fill="#6B8299">周涨星</text>
  </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1350 1800" font-family="'PingFang SC','Hiragino Sans GB',sans-serif">
  <defs>
    <radialGradient id="bgGlow" cx="42%" cy="22%" r="90%">
      <stop offset="0%" stop-color="#16294A"/><stop offset="100%" stop-color="#0A1826"/>
    </radialGradient>
    <linearGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#35D0FF"/><stop offset="1" stop-color="#3EE8B0"/>
    </linearGradient>
    <filter id="glowCyan" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#35D0FF"/>
    </filter>
    <filter id="glowGreen" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#3EE8B0"/>
    </filter>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M80 0H0V80" fill="none" stroke="#132440" stroke-opacity="0.35" stroke-width="1.5"/>
    </pattern>
    ${Object.values(ICONS).join('\n    ')}
  </defs>

  <rect width="1350" height="1800" fill="url(#bgGlow)"/>
  <rect width="1350" height="1800" fill="url(#grid)"/>
  <ellipse cx="1100" cy="240" rx="420" ry="260" fill="#14405E" opacity="0.25"/>

  <!-- 顶部胶囊 -->
  <rect x="64" y="56" width="470" height="54" rx="27" fill="#0E2A4A" stroke="#3E6E9E" stroke-width="1.5"/>
  <text x="299" y="92" text-anchor="middle" font-size="26" letter-spacing="5" fill="#D6E6F5">GITHUB WEEKLY · 开源周榜</text>
  <rect x="790" y="56" width="496" height="54" rx="27" fill="#0E2A4A" stroke="#3E6E9E" stroke-width="1.5"/>
  <text x="1038" y="92" text-anchor="middle" font-size="24" letter-spacing="2" fill="#D6E6F5">统计周期 ${data.period}</text>

  <!-- 标题 -->
  <circle cx="1120" cy="196" r="5" fill="#3EE8B0" filter="url(#glowGreen)"/>
  <circle cx="1190" cy="252" r="3.5" fill="#35D0FF" opacity="0.8"/>
  <circle cx="1060" cy="286" r="3" fill="#7FA8D0" opacity="0.6"/>
  <text x="675" y="268" text-anchor="middle" font-size="118" font-weight="800" letter-spacing="6" fill="url(#titleGrad)" filter="url(#glowCyan)">GitHub 周榜</text>
  <text x="675" y="344" text-anchor="middle" font-size="36" fill="#D6E6F5">${data.subtitle} · <tspan fill="#3EE8B0" font-weight="700">${data.subtitleHighlight}</tspan></text>

  <!-- 8 行榜单 -->
  ${ROWS.map(row).join('\n  ')}

  <!-- 底部 -->
  <line x1="64" y1="1712" x2="1286" y2="1712" stroke="#1E3A56" stroke-width="2"/>
  <text x="64" y="1768" font-size="24" letter-spacing="3" fill="#8FAECB">屿华AI · YuHua-AIPlay</text>
  <text x="1286" y="1768" text-anchor="end" font-size="20" fill="#4E6A85">数据源 OpenGithubs/github-weekly-rank</text>
</svg>
`;

fs.writeFileSync(path.join(outDir, 'cover.svg'), svg);
console.log('✓ cover.svg');
