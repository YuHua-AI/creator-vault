// 生成 8 张竖版项目卡 SVG（1350×1800，同一模板换数据，保证风格一致）
// 版式：项目名标题 / 作者·语言小字 / 一句话介绍 / 星数（总星标+周增长）/ 正文三段（是什么·能做什么·适合谁）
// 用法: node img-src/gen-cards.js  → 输出 img-src/01-xxx.svg … 08-xxx.svg
const fs = require('fs');
const path = require('path');
const { ICONS } = require('./icons');

const CARDS = [
  {
    file: '01-dsh-superagent', icon: 'superagent', no: 1, owner: 'deepseek-ai',
    repo: 'dsh-superagent-prototype', lang: 'TypeScript',
    pitch: '迈向更自主的 Agent',
    total: '16.4k', growth: '14,286',
    what: ['DeepSeek 官方放出的研究原型，最大胆的一点：训练', '反馈全部由 AI 给出，没有人工标注——「AI 写的 AI」。'],
    can: ['把长任务自主拆解、执行、复盘，README 自述大量工程', '由 coding agent 完成，可当 Agent 工作流的参考实现。'],
    who: ['做 Agent 研究与开发的工程师，想提前摸一摸下一代', '自主系统形态的人。'],
    tags: ['DeepSeek 官方', 'Agent', '研究原型'],
  },
  {
    file: '02-game-studios', icon: 'gamestudio', no: 2, owner: 'Donchitos',
    repo: 'Claude-Code-Game-Studios', lang: 'Shell',
    pitch: '一句话，出一个能玩的游戏',
    total: '34.5k', growth: '6,071',
    what: ['把 Claude Code 变成完整游戏工作室：49 个 AI agent、', '72 项工作流技能，按真实工作室的层级分工协作。'],
    can: ['描述一个游戏想法，agent 先追问细节、写一页策划案，', '然后直接产出能在浏览器里玩的游戏。'],
    who: ['想体验多 agent 协作威力、快速产出游戏原型的', '独立开发者和小团队。'],
    tags: ['Claude Code', '游戏开发', 'Agent 协作'],
  },
  {
    file: '03-dsh-go', icon: 'remote', no: 3, owner: 'ccch1mneyyy',
    repo: 'dsh-Go', lang: 'Dart',
    pitch: '把 Agent 遥控器装进口袋',
    total: '7.3k', growth: '4,915',
    what: ['DeepSeek Harness 的 Android 客户端，手机本地直接', '跑，也能连回电脑上的 DSH 一起用。'],
    can: ['躺在沙发刷手机时，顺手盯一眼电脑里 Agent 的进度，', '发个新指令让它接着干。'],
    who: ['挂着长任务出门、需要随时照看 Agent 干活状态', '的重度 Agent 用户。'],
    tags: ['Android', 'Flutter', '遥控电脑'],
  },
  {
    file: '04-ub-mode', icon: 'skillfile', no: 4, owner: 'unclebob',
    repo: 'ub-mode', lang: 'Skill 文件',
    pitch: '给 Agent 立工程纪律',
    total: '6.8k', growth: '4,603',
    what: ['《代码整洁之道》作者 Uncle Bob 出品的 Agent 技能，', '仓库里只有一份 SKILL.md，没有一行多余代码。'],
    can: ['先让 Agent 读懂你的工程规范，改完自动跑质量门禁：', '圈复杂度、重复率超标就不放行。'],
    who: ['团队技术负责人，想让 AI 按自家规矩写代码、', '守住工程质量底线的人。'],
    tags: ['Agent Skill', '工程纪律', 'TDD'],
  },
  {
    file: '05-unslop', icon: 'uiwin', no: 5, owner: 'heydamir',
    repo: 'unslop', lang: 'JavaScript',
    pitch: '去掉界面的一眼 AI 味',
    total: '7.3k', growth: '3,945',
    what: ['一份通用界面设计技能，专治「一眼 AI」的模板脸：', '紫色渐变、到处发光、emoji 堆砌。'],
    can: ['先揪出界面里的 slop 套路，再按你的产品气质', '重新定方向，把整个界面修出性格。'],
    who: ['用 AI 做产品、却总被用户吐槽「太 AI」的', '独立开发者与设计师。'],
    tags: ['Claude Skill', 'UI 设计', '反 AI 味'],
  },
  {
    file: '06-craft-anything', icon: 'craft', no: 6, owner: 'storytold',
    repo: 'craft-anything', lang: 'Rust',
    pitch: '看懂它，然后复刻它',
    total: '7.7k', growth: '3,836',
    what: ['Rust 桌面应用，内置 Study → Build → Check → Ready', '四步流水线，320 个工具个个是 CLI + MCP 双形态。'],
    can: ['给它一个想复刻的软件：先拆解学习它的结构，', '再按你的技术栈重建、自检差距后交付。'],
    who: ['想快速复刻工具类桌面软件、验证产品想法的', '原型党。'],
    tags: ['桌面应用', 'Rust', '复刻软件'],
  },
  {
    file: '07-anatomy', icon: 'isoplay', no: 7, owner: 'wheresryan22',
    repo: 'anatomy', lang: 'JavaScript',
    pitch: '把概念画成会动的机器',
    total: '24.4k', growth: '3,391',
    what: ['一个 Agent 技能：把真实机器和复杂系统画成零件', '精确的等距插画，支持 SVG / WebGL / 3D 效果。'],
    can: ['输入一个概念，生成分层、可交互、会动的「解剖图」，', 'Claude Code 之外多家 Agent 平台都能跑。'],
    who: ['做技术科普、产品演示，需要把复杂原理', '讲明白的内容创作者。'],
    tags: ['Agent Skill', '等距插画', '可视化'],
  },
  {
    file: '08-mika', icon: 'boltphone', no: 8, owner: 'wangzan101',
    repo: 'Mika', lang: 'Kotlin',
    pitch: '手机里的贴身 Agent',
    total: '6.0k', growth: '3,339',
    what: ['Android 端侧 AI 助手：利用手机隐藏的后台屏替你', '操作 App 和网页，前台照常归你用。'],
    can: ['说一句话，它在后台把事情办完才向你汇报；', 'Kotlin 原生开发，APK 装上就能用。'],
    who: ['想在安卓机上常驻 Agent、又不想被前台', '打断的极客玩家。'],
    tags: ['Android', '端侧 Agent', '自动化'],
  },
];

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
  <text x="64" y="146" font-size="20" letter-spacing="2" fill="#4E6A85">统计周期 2026.11.03 – 11.08</text>
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

const outDir = __dirname;
CARDS.forEach(c => {
  fs.writeFileSync(path.join(outDir, `${c.file}.svg`), card(c));
  console.log(`✓ ${c.file}.svg`);
});
