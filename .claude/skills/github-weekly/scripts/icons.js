// 周榜项目图标库（线框风：#35D0FF 描边 / #12294D 填充 / #3EE8B0 点缀）
// 中心在原点，覆盖约 ±60；cover 行内 scale(0.7)、子图 scale(1.6)
// 每期给新项目画贴题图标后追加到这里，随本批 commit——库逐期积累
const ICONS = {
  // 超级 Agent：机器人 + 环绕轨道节点（自主性）
  superagent: `<g id="ic-superagent" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="0" cy="16" rx="54" ry="20" stroke="#5B8CFF" stroke-dasharray="5 9" opacity="0.85"/>
      <circle cx="-54" cy="16" r="5.5" fill="#3EE8B0" stroke="none"/>
      <circle cx="47" cy="-2" r="4.5" fill="#35D0FF" stroke="none"/>
      <line x1="0" y1="-14" x2="0" y2="-25"/><circle cx="0" cy="-29" r="4.5" fill="#3EE8B0" stroke="none"/>
      <rect x="-27" y="-14" width="54" height="48" rx="11" fill="#12294D"/>
      <circle cx="-12" cy="8" r="5" fill="#3EE8B0" stroke="none"/><circle cx="12" cy="8" r="5" fill="#3EE8B0" stroke="none"/>
      <path d="M-10 26 H10"/></g>`,
  // 游戏工作室：手柄 + 播放键（不是玩，是产出游戏）
  gamestudio: `<g id="ic-gamestudio" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-40 -12 Q-40 -26 -24 -26 H24 Q40 -26 40 -12 V10 Q40 24 26 22 L14 15 H-14 L-26 22 Q-40 24 -40 10 Z" fill="#12294D"/>
      <path d="M-22 -6 V8 M-29 1 H-15"/>
      <path d="M12 -9 L28 0 L12 9 Z" fill="#3EE8B0" stroke="none"/>
      <path d="M32 -20 Q42 -16 40 -6" stroke="#3EE8B0"/></g>`,
  // 口袋遥控器：手机 + 信号波 → 显示器（遥控电脑）
  remote: `<g id="ic-remote" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-56" y="-32" width="36" height="64" rx="8" fill="#12294D"/>
      <line x1="-46" y1="22" x2="-30" y2="22"/>
      <path d="M-14 -14 Q0 0 -14 14"/>
      <path d="M-6 -24 Q16 0 -6 24" stroke="#3EE8B0"/>
      <rect x="10" y="-26" width="46" height="34" rx="5" fill="#12294D"/>
      <line x1="33" y1="8" x2="33" y2="16"/>
      <line x1="21" y1="16" x2="45" y2="16"/>
      <path d="M22 -15 L33 -7 L25 -1 Z" fill="#3EE8B0" stroke="none"/></g>`,
  // 工程纪律：文档 + 两勾一线（SKILL.md 与质量门禁）
  skillfile: `<g id="ic-skillfile" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-30 -40 H12 L34 -18 V40 H-30 Z" fill="#12294D"/>
      <path d="M12 -40 V-18 H34"/>
      <path d="M-20 -4 L-14 2 L-2 -10" stroke="#3EE8B0"/>
      <path d="M-20 16 L-14 22 L-2 10" stroke="#3EE8B0"/>
      <line x1="-8" y1="32" x2="16" y2="32"/></g>`,
  // 去 AI 味：浏览器窗口 + 布局块（界面设计）
  uiwin: `<g id="ic-uiwin" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-46" y="-32" width="92" height="64" rx="8" fill="#12294D"/>
      <line x1="-46" y1="-12" x2="46" y2="-12"/>
      <circle cx="-36" cy="-22" r="2.5" fill="#35D0FF" stroke="none"/><circle cx="-27" cy="-22" r="2.5" fill="#35D0FF" stroke="none"/><circle cx="-18" cy="-22" r="2.5" fill="#3EE8B0" stroke="none"/>
      <rect x="-34" y="-2" width="32" height="26" rx="4" fill="#3EE8B0" fill-opacity="0.25" stroke="#3EE8B0"/>
      <line x1="6" y1="2" x2="34" y2="2"/><line x1="6" y1="14" x2="26" y2="14"/><line x1="6" y1="26" x2="34" y2="26"/></g>`,
  // 复刻机：应用窗口 + 锤子（把软件造出来）
  craft: `<g id="ic-craft" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-50" y="-30" width="80" height="58" rx="8" fill="#12294D"/>
      <line x1="-50" y1="-12" x2="30" y2="-12"/>
      <circle cx="-40" cy="-21" r="2.5" fill="#35D0FF" stroke="none"/><circle cx="-31" cy="-21" r="2.5" fill="#3EE8B0" stroke="none"/>
      <line x1="-38" y1="4" x2="6" y2="4"/>
      <circle cx="-20" cy="16" r="4" fill="#3EE8B0" stroke="none"/>
      <line x1="14" y1="34" x2="42" y2="6" stroke-width="5"/>
      <line x1="31" y1="-5" x2="55" y2="19" stroke-width="10"/></g>`,
  // 动画解剖：等距方块 + 播放键 + 运动弧线
  isoplay: `<g id="ic-isoplay" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M0 -36 L32 -18 L32 18 L0 36 L-32 18 L-32 -18 Z" fill="#12294D"/>
      <path d="M0 -36 L0 0 L32 18 M0 0 L-32 18"/>
      <path d="M-26 -6 L-12 2 L-26 10 Z" fill="#3EE8B0" stroke="none"/>
      <path d="M36 -34 Q46 -22 40 -8" stroke="#3EE8B0"/></g>`,
  // 端侧隐形屏：手机 + 闪电 + 虚线副屏
  boltphone: `<g id="ic-boltphone" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-40" y="-26" width="44" height="72" rx="9" stroke="#5B8CFF" stroke-dasharray="5 7" opacity="0.75"/>
      <rect x="-18" y="-36" width="44" height="72" rx="9" fill="#12294D"/>
      <line x1="-6" y1="24" x2="14" y2="24"/>
      <path d="M10 -20 L-2 2 L4 2 L0 20 L12 -2 L6 -2 Z" fill="#3EE8B0" stroke="none"/></g>`,
  // 设计系统：三层可组合组件板 + 主题色点（Meta astryx）
  astryx: `<g id="ic-astryx" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-38" y="-46" width="64" height="40" rx="7" stroke="#5B8CFF" stroke-dasharray="5 7" opacity="0.7"/>
      <rect x="-30" y="-30" width="64" height="40" rx="7" stroke="#5B8CFF" stroke-dasharray="5 7" opacity="0.85"/>
      <rect x="-22" y="-14" width="64" height="44" rx="7" fill="#12294D"/>
      <rect x="-12" y="-4" width="26" height="10" rx="5" fill="#3EE8B0" fill-opacity="0.25" stroke="#3EE8B0"/>
      <line x1="18" y1="1" x2="32" y2="1"/>
      <circle cx="-12" cy="20" r="5" fill="#3EE8B0" stroke="none"/><circle cx="4" cy="20" r="5" fill="#35D0FF" stroke="none"/><circle cx="20" cy="20" r="5" fill="#35D0FF" stroke="none"/></g>`,
  // 掌机模拟器：横置机身 + 左右摇杆圆（Switch 风，Lichii）
  lichii: `<g id="ic-lichii" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-56" y="-24" width="112" height="48" rx="22" fill="#12294D"/>
      <circle cx="-34" cy="0" r="13"/>
      <circle cx="-34" cy="0" r="4" fill="#3EE8B0" stroke="none"/>
      <circle cx="34" cy="0" r="13" fill="#3EE8B0" fill-opacity="0.2" stroke="#3EE8B0"/>
      <circle cx="34" cy="0" r="4" fill="#3EE8B0" stroke="none"/>
      <line x1="-6" y1="-12" x2="6" y2="-12"/><line x1="-10" y1="-2" x2="2" y2="-2"/>
      <line x1="-4" y1="14" x2="4" y2="14"/></g>`,
  // 插件化播放器：播放圆键 + 外接插头（HGhub）
  hghub: `<g id="ic-hghub" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="-22" cy="0" r="30" fill="#12294D"/>
      <path d="M-31 -12 L3 0 L-31 12 Z" fill="#3EE8B0" stroke="none"/>
      <line x1="8" y1="0" x2="24" y2="0"/>
      <rect x="24" y="-10" width="14" height="20" rx="4" fill="#12294D"/>
      <line x1="38" y1="-5.5" x2="48" y2="-5.5" stroke="#3EE8B0"/>
      <line x1="38" y1="5.5" x2="48" y2="5.5" stroke="#3EE8B0"/></g>`,
  // 漏洞狩猎：放大镜里一只虫子（Claude-BugHunter）
  bughunt: `<g id="ic-bughunt" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="8" cy="8" r="30" fill="#12294D"/>
      <line x1="-13" y1="-13" x2="-38" y2="-38" stroke-width="6"/>
      <ellipse cx="8" cy="8" rx="11" ry="14" stroke="#3EE8B0"/>
      <path d="M-3 4 H19 M-3 14 H19" stroke="#3EE8B0"/>
      <line x1="8" y1="-6" x2="8" y2="-13" stroke="#3EE8B0"/>
      <line x1="-7" y1="-1" x2="-15" y2="-7" stroke="#3EE8B0"/>
      <line x1="23" y1="-1" x2="31" y2="-7" stroke="#3EE8B0"/></g>`,
  // 方法论流水线：规格 → 多个子代理 → 验收勾（superpowers）
  flow: `<g id="ic-flow" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-30" y="-52" width="60" height="22" rx="6" fill="#12294D"/>
      <line x1="-14" y1="-46" x2="14" y2="-46" stroke="#3EE8B0"/>
      <line x1="-10" y1="-24" x2="-24" y2="0"/>
      <line x1="10" y1="-24" x2="24" y2="0"/>
      <circle cx="-32" cy="12" r="12" fill="#12294D"/>
      <circle cx="0" cy="22" r="12" fill="#12294D"/>
      <circle cx="32" cy="12" r="12" fill="#12294D"/>
      <path d="M-12 50 L0 60 L20 36" stroke="#3EE8B0" stroke-width="5"/></g>`,
  // Office 套件：表格网格 + 高亮单元格（univer）
  office: `<g id="ic-office" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-46" y="-38" width="92" height="76" rx="8" fill="#12294D"/>
      <line x1="-46" y1="-16" x2="46" y2="-16"/>
      <line x1="-16" y1="-16" x2="-16" y2="38"/>
      <line x1="16" y1="-16" x2="16" y2="38"/>
      <line x1="-46" y1="4" x2="46" y2="4"/>
      <line x1="-46" y1="22" x2="46" y2="22"/>
      <rect x="-12" y="-10" width="24" height="10" rx="2" fill="#3EE8B0" fill-opacity="0.3" stroke="#3EE8B0"/>
      <rect x="-42" y="-34" width="16" height="12" rx="2" fill="#3EE8B0" fill-opacity="0.5" stroke="none"/></g>`,
  // 性能仪表：半圆刻度 + 指针（ECC harness 调优）
  gauge: `<g id="ic-gauge" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-46 26 A 46 46 0 0 1 46 26" fill="#12294D"/>
      <path d="M-46 26 A 46 46 0 0 1 -32 -14" stroke="#3EE8B0"/>
      <line x1="0" y1="26" x2="22" y2="-14" stroke="#3EE8B0" stroke-width="5"/>
      <circle cx="0" cy="26" r="6" fill="#3EE8B0" stroke="none"/>
      <line x1="-23" y1="-24" x2="-18" y2="-18"/><line x1="0" y1="-34" x2="0" y2="-26"/><line x1="23" y1="-24" x2="18" y2="-18"/></g>`,
  // 近 30 天检索：日历 + 放大镜（last30days）
  search30: `<g id="ic-search30" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-48" y="-34" width="56" height="54" rx="8" fill="#12294D"/>
      <line x1="-48" y1="-16" x2="8" y2="-16"/>
      <line x1="-32" y1="-44" x2="-32" y2="-28"/>
      <line x1="-8" y1="-44" x2="-8" y2="-28"/>
      <circle cx="24" cy="16" r="22" fill="#0A1826"/>
      <line x1="39" y1="31" x2="54" y2="46" stroke-width="6"/>
      <circle cx="18" cy="16" r="2.5" fill="#3EE8B0" stroke="none"/>
      <circle cx="24" cy="10" r="2.5" fill="#3EE8B0" stroke="none"/>
      <circle cx="30" cy="16" r="2.5" fill="#3EE8B0" stroke="none"/></g>`,
  // 交付回路：循环箭头 + 中心方块（LoopForge）
  loop: `<g id="ic-loop" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-40 -8 A 42 42 0 1 1 -14 38"/>
      <path d="M-52 -16 L-38 -8 L-46 6" stroke="#3EE8B0"/>
      <path d="M40 8 A 42 42 0 1 1 14 -38"/>
      <path d="M52 16 L38 8 L46 -6" stroke="#3EE8B0"/>
      <rect x="-13" y="-13" width="26" height="26" rx="5" fill="#12294D" stroke="#3EE8B0"/></g>`,
  // 官方技能集：四宫格 + 一格星芒（anthropics/skills）
  skillgrid: `<g id="ic-skillgrid" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-46" y="-46" width="34" height="34" rx="7" fill="#12294D"/>
      <rect x="8" y="-46" width="34" height="34" rx="7" fill="#12294D"/>
      <rect x="-46" y="8" width="34" height="34" rx="7" fill="#12294D"/>
      <rect x="8" y="8" width="34" height="34" rx="7" fill="#12294D" stroke="#3EE8B0"/>
      <line x1="25" y1="15" x2="25" y2="35" stroke="#3EE8B0"/>
      <line x1="15" y1="25" x2="35" y2="25" stroke="#3EE8B0"/>
      <line x1="18" y1="18" x2="32" y2="32" stroke="#3EE8B0"/>
      <line x1="32" y1="18" x2="18" y2="32" stroke="#3EE8B0"/></g>`,
};

module.exports = { ICONS };
