// 生成 8 张竖版项目卡 SVG（同一模板换数据，保证风格一致）
// 用法: node img-src/gen-cards.js  → 输出 img-src/01-xxx.svg … 08-xxx.svg
const fs = require('fs');
const path = require('path');

// 图标定义（与 cover.svg 同一套，中心在原点，覆盖范围约 ±80）
const ICONS = {
  robot: `<g id="ic-robot" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <line x1="0" y1="-38" x2="0" y2="-26"/><circle cx="0" cy="-42" r="5" fill="#3EE8B0" stroke="none"/>
      <rect x="-33" y="-26" width="66" height="52" rx="12" fill="#12294D"/>
      <circle cx="-14" cy="-2" r="6" fill="#3EE8B0" stroke="none"/><circle cx="14" cy="-2" r="6" fill="#3EE8B0" stroke="none"/>
      <path d="M-12 14 H12"/></g>`,
  gamepad: `<g id="ic-gamepad" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-38 -14 Q-38 -26 -24 -26 H24 Q38 -26 38 -14 V10 Q38 24 24 22 L14 16 H-14 L-24 22 Q-38 24 -38 10 Z" fill="#12294D"/>
      <path d="M-20 -6 V8 M-27 1 H-13"/>
      <circle cx="16" cy="-4" r="4.5" fill="#3EE8B0" stroke="none"/><circle cx="27" cy="6" r="4.5" fill="#3EE8B0" stroke="none"/></g>`,
  phone: `<g id="ic-phone" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-24" y="-34" width="42" height="68" rx="9" fill="#12294D"/><line x1="-10" y1="24" x2="4" y2="24"/>
      <path d="M-8 -8 L6 0 L-8 8 Z" fill="#3EE8B0" stroke="none"/><path d="M28 -18 Q40 0 28 18" stroke="#3EE8B0"/></g>`,
  shield: `<g id="ic-shield" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M0 -36 L30 -24 V4 Q30 26 0 38 Q-30 26 -30 4 V-24 Z" fill="#12294D"/>
      <path d="M-13 0 L-3 11 L15 -12" stroke="#3EE8B0"/></g>`,
  brush: `<g id="ic-brush" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-30 30 L-8 8"/><path d="M-8 8 L22 -30 L34 -18 L2 14 Z" fill="#12294D"/>
      <path d="M-8 8 L2 14 L-14 20 Z" fill="#3EE8B0" stroke="none"/>
      <path d="M-36 -18 Q-24 -26 -12 -18" stroke="#3EE8B0"/></g>`,
  wrench: `<g id="ic-wrench" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M24 -34 Q4 -30 -2 -12 Q-6 -2 -14 6 L-30 22 Q-36 28 -30 34 Q-24 40 -18 34 L-2 18 Q6 10 16 6 Q32 0 34 -20 Z" fill="#12294D"/>
      <circle cx="-26" cy="26" r="5" fill="#3EE8B0" stroke="none"/></g>`,
  cube: `<g id="ic-cube" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M0 -36 L32 -18 L32 18 L0 36 L-32 18 L-32 -18 Z" fill="#12294D"/>
      <path d="M0 -36 L0 0 L32 18 M0 0 L-32 18"/>
      <path d="M0 -36 L32 -18 L0 0 L-32 -18 Z" fill="#3EE8B0" fill-opacity="0.22" stroke="none"/></g>`,
  android: `<g id="ic-android" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-28 -6 Q-28 -30 0 -30 Q28 -30 28 -6 V18 H-28 Z" fill="#12294D"/>
      <line x1="-18" y1="-30" x2="-24" y2="-40"/><line x1="18" y1="-30" x2="24" y2="-40"/>
      <circle cx="-11" cy="-14" r="4" fill="#3EE8B0" stroke="none"/><circle cx="11" cy="-14" r="4" fill="#3EE8B0" stroke="none"/>
      <line x1="-38" y1="-4" x2="-38" y2="10"/><line x1="38" y1="-4" x2="38" y2="10"/></g>`,
};

const CARDS = [
  {
    file: '01-dsh-superagent', icon: 'robot', no: 1, owner: 'deepseek-ai',
    repo: 'dsh-superagent-prototype', repoSize: 56,
    pitch: '迈向更自主的 Agent',
    desc: ['DeepSeek 团队的研究原型，来自同名论文工作。', 'README 坦言：大量工程由 coding agent 完成，', '仅供参考，不是官方产品——「AI 写的 AI」。'],
    stats: [['总星标', '16.4k'], ['周增长', '+14286'], ['开源时间', '2026-11-01'], ['主语言', 'TypeScript']],
    tags: ['DeepSeek 官方', 'Agent', '研究原型'],
  },
  {
    file: '02-game-studios', icon: 'gamepad', no: 2, owner: 'Donchitos',
    repo: 'Claude-Code-Game-Studios', repoSize: 54,
    pitch: '一句话，出一个能玩的游戏',
    desc: ['描述一个游戏，Claude Code 追问几个问题、写一页', '策划案，直接产出能玩的浏览器游戏。49 个 AI agent', '按真实游戏工作室的层级分工协作。'],
    stats: [['总星标', '34.5k'], ['周增长', '+6071'], ['开源时间', '2026-02-12'], ['主语言', 'Shell']],
    tags: ['Claude Code', '游戏开发', 'Agent 协作'],
  },
  {
    file: '03-dsh-go', icon: 'phone', no: 3, owner: 'ccch1mneyyy',
    repo: 'dsh-Go', repoSize: 92,
    pitch: '把 Agent 遥控器装进口袋',
    desc: ['DeepSeek Harness 的 Android 客户端：手机本地直接跑，', '也能遥控电脑上的 DSH。躺在沙发刷手机，', '顺手盯一眼 Agent 干活、发个新指令。'],
    stats: [['总星标', '7.3k'], ['周增长', '+4915'], ['开源时间', '2026-10-31'], ['主语言', 'Dart']],
    tags: ['Android', 'Flutter', '遥控电脑'],
  },
  {
    file: '04-ub-mode', icon: 'shield', no: 4, owner: 'unclebob',
    repo: 'ub-mode', repoSize: 92,
    pitch: '给 Agent 立工程纪律',
    desc: ['《代码整洁之道》作者 Robert C. Martin 出品，仓库里', '只有一份 SKILL.md：先让它工作、再让它正确、保持', '实践，配套 Crapper / Dryer / Mutator 三个质量门。'],
    stats: [['总星标', '6.8k'], ['周增长', '+4603'], ['开源时间', '2026-10-28'], ['主语言', 'Skill 文件']],
    tags: ['Agent Skill', '工程纪律', 'TDD'],
  },
  {
    file: '05-unslop', icon: 'brush', no: 5, owner: 'heydamir',
    repo: 'unslop', repoSize: 92,
    pitch: '去掉界面的一眼 AI 味',
    desc: ['Claude Code / Codex / Antigravity 通用的技能：先找出', '紫色渐变、到处发光、emoji 标签这些 slop，再按你的', '产品气质定方向，把整个界面修出性格。'],
    stats: [['总星标', '7.3k'], ['周增长', '+3945'], ['开源时间', '2026-11-01'], ['主语言', 'JavaScript']],
    tags: ['Claude Skill', 'UI 设计', '反 AI 味'],
  },
  {
    file: '06-craft-anything', icon: 'wrench', no: 6, owner: 'storytold',
    repo: 'craft-anything', repoSize: 76,
    pitch: '看懂它，然后复刻它',
    desc: ['ArtCraft 桌面应用：Study 拆解原件 → Build 按你的', '技术栈重建 → Check 对比差距 → Ready 交付。', '320 个工具，每个都是 CLI + MCP 双形态。'],
    stats: [['总星标', '7.7k'], ['周增长', '+3836'], ['开源时间', '2026-11-03'], ['主语言', 'Rust']],
    tags: ['桌面应用', 'Rust', '复刻软件'],
  },
  {
    file: '07-anatomy', icon: 'cube', no: 7, owner: 'wheresryan22',
    repo: 'anatomy', repoSize: 92,
    pitch: '把概念画成会动的机器',
    desc: ['解释一个概念的方式，是把它建成真实运转的物体：', '零件精确的等距插画，SVG / WebGL / 3D，还能交互。', 'Claude Code 之外，多家 Agent 平台都能跑。'],
    stats: [['总星标', '24.4k'], ['周增长', '+3391'], ['开源时间', '2026-10-12'], ['主语言', 'JavaScript']],
    tags: ['Agent Skill', '等距插画', '可视化'],
  },
  {
    file: '08-mika', icon: 'android', no: 8, owner: 'wangzan101',
    repo: 'Mika', repoSize: 96,
    pitch: '手机里的贴身 Agent',
    desc: ['Android 端侧 AI 助手：说一句话，它在隐藏的后台屏', '里替你操作 App 和网页，直到事情办完——前台照常', '归你用。Kotlin 原生开发，APK 直接装。'],
    stats: [['总星标', '6.0k'], ['周增长', '+3339'], ['开源时间', '2026-11-01'], ['主语言', 'Kotlin']],
    tags: ['Android', '端侧 Agent', '自动化'],
  },
];

function capsuleRow(tags) {
  // 居中的一排标签胶囊
  const pad = 30, gap = 24, h = 56, fs = 28;
  const widths = tags.map(t => t.length * fs * 1.02 + pad * 2);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
  let x = (1350 - total) / 2;
  let s = '';
  tags.forEach((t, i) => {
    s += `<rect x="${x.toFixed(1)}" y="1306" width="${widths[i].toFixed(1)}" height="${h}" rx="${h / 2}" fill="#0E2A4A" stroke="#3E6E9E" stroke-width="1.5"/>
      <text x="${(x + widths[i] / 2).toFixed(1)}" y="1344" text-anchor="middle" font-size="${fs}" fill="#D6E6F5">${t}</text>`;
    x += widths[i] + gap;
  });
  return s;
}

function statGrid(stats) {
  // 2×2 数据格
  const pos = [[110, 1000], [690, 1000], [110, 1124], [690, 1124]];
  return stats.map(([label, value], i) => {
    const [x, y] = pos[i];
    const isGrowth = label === '周增长';
    return `<rect x="${x}" y="${y}" width="550" height="104" rx="16" fill="#0E2038" fill-opacity="0.9" stroke="#29527A" stroke-width="1.5"/>
      <text x="${x + 275}" y="${y + 38}" text-anchor="middle" font-size="22" letter-spacing="3" fill="#6B8299">${label}</text>
      <text x="${x + 275}" y="${y + 84}" text-anchor="middle" font-size="42" font-weight="700" fill="${isGrowth ? '#3EE8B0' : '#FFFFFF'}">${value}</text>`;
  }).join('\n');
}

function card(c) {
  const top3 = c.no <= 3;
  const noColor = top3 ? '#3EE8B0' : '#7FA8D0';
  const noStroke = top3 ? '#3EE8B0' : '#3E6E9E';
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
  <ellipse cx="240" cy="1560" rx="480" ry="300" fill="#14405E" opacity="0.28"/>
  <circle cx="1200" cy="180" r="3" fill="#7FA8D0" opacity="0.45"/>
  <circle cx="130" cy="760" r="2.5" fill="#7FA8D0" opacity="0.3"/>
  <circle cx="1240" cy="980" r="2.5" fill="#7FA8D0" opacity="0.35"/>

  <!-- 顶部胶囊 -->
  <rect x="64" y="64" width="470" height="54" rx="27" fill="#0E2A4A" stroke="#3E6E9E" stroke-width="1.5"/>
  <text x="299" y="100" text-anchor="middle" font-size="26" letter-spacing="5" fill="#D6E6F5">GITHUB WEEKLY · 开源周榜</text>
  <text x="64" y="152" font-size="20" letter-spacing="2" fill="#4E6A85">统计周期 2026.11.03 – 11.08</text>
  <rect x="1074" y="64" width="212" height="54" rx="27" fill="#0E2A4A" stroke="${noStroke}" stroke-width="1.8"/>
  <text x="1180" y="101" text-anchor="middle" font-size="28" font-weight="800" letter-spacing="3" fill="${noColor}">NO.${String(c.no).padStart(2, '0')}</text>

  <!-- 图标 -->
  <use href="#ic-${c.icon}" x="675" y="330" transform="translate(675 330) scale(1.75) translate(-675 -330)"/>

  <!-- 项目名 -->
  <text x="675" y="492" text-anchor="middle" font-size="30" letter-spacing="3" fill="#6B8299">${c.owner}</text>
  <text x="675" y="${c.repoSize > 60 ? 590 : 600}" text-anchor="middle" font-size="${c.repoSize}" font-weight="800" fill="#FFFFFF">${c.repo}</text>

  <!-- 定位句 -->
  <text x="675" y="706" text-anchor="middle" font-size="46" font-weight="700" fill="#3EE8B0" filter="url(#glowGreen)">${c.pitch}</text>

  <!-- 分隔线 -->
  <line x1="220" y1="768" x2="1130" y2="768" stroke="#29527A" stroke-width="2"/>
  <circle cx="675" cy="768" r="6" fill="#0A1826" stroke="#35D0FF" stroke-width="2.5"/>

  <!-- 描述 -->
  ${c.desc.map((line, i) => `<text x="675" y="${846 + i * 54}" text-anchor="middle" font-size="30" fill="#B8CCDF">${line}</text>`).join('\n  ')}

  <!-- 数据 2×2 -->
  ${statGrid(c.stats)}

  <!-- 标签 -->
  ${capsuleRow(c.tags)}

  <!-- 底部 -->
  <line x1="64" y1="1656" x2="1286" y2="1656" stroke="#1E3A56" stroke-width="2"/>
  <text x="64" y="1712" font-size="26" letter-spacing="3" fill="#8FAECB">屿华AI · YuHua-AIPlay</text>
  <text x="1286" y="1712" text-anchor="end" font-size="24" fill="#4E6A85">github.com/${c.owner}/${c.repo}</text>
</svg>
`;
}

const outDir = __dirname;
CARDS.forEach(c => {
  fs.writeFileSync(path.join(outDir, `${c.file}.svg`), card(c));
  console.log(`✓ ${c.file}.svg`);
});
