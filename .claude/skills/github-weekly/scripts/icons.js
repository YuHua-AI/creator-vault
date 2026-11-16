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
  // 设计系统：2×2 组件格 + 主题滑杆（组件与 CSS 变量换肤）
  designsystem: `<g id="ic-designsystem" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-54" y="-54" width="46" height="46" rx="6" fill="#12294D"/>
      <rect x="8" y="-54" width="46" height="46" rx="6" fill="#12294D"/>
      <rect x="-54" y="8" width="46" height="46" rx="6" fill="#12294D"/>
      <rect x="8" y="8" width="46" height="46" rx="6" fill="#3EE8B0" fill-opacity="0.22" stroke="#3EE8B0"/>
      <circle cx="-31" cy="-31" r="8"/>
      <line x1="18" y1="-38" x2="44" y2="-38"/><line x1="18" y1="-26" x2="36" y2="-26"/>
      <line x1="-42" y1="24" x2="-16" y2="24"/><line x1="-42" y1="38" x2="-24" y2="38"/>
      <line x1="16" y1="38" x2="46" y2="38"/><circle cx="34" cy="38" r="5" fill="#3EE8B0" stroke="none"/></g>`,
  // 模拟器：横置掌机（屏 + 十字键 + 双钮）
  gamepad: `<g id="ic-gamepad" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-56" y="-30" width="112" height="60" rx="20" fill="#12294D"/>
      <rect x="-26" y="-16" width="52" height="32" rx="5"/>
      <path d="M-44 -5 H-32 M-38 -11 V1"/>
      <circle cx="40" cy="-8" r="4" fill="#3EE8B0" stroke="none"/>
      <circle cx="40" cy="9" r="4" fill="#3EE8B0" stroke="none"/>
      <path d="M-8 -38 Q0 -44 8 -38" stroke="#3EE8B0"/></g>`,
  // 播放器：窗口 + 播放键 + 进度条（聚合播放器）
  player: `<g id="ic-player" fill="none" stroke="#35D0FF" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="-50" y="-34" width="100" height="68" rx="8" fill="#12294D"/>
      <line x1="-50" y1="-16" x2="50" y2="-16"/>
      <circle cx="-39" cy="-25" r="2.5" fill="#35D0FF" stroke="none"/><circle cx="-30" cy="-25" r="2.5" fill="#35D0FF" stroke="none"/><circle cx="-21" cy="-25" r="2.5" fill="#3EE8B0" stroke="none"/>
      <path d="M-14 -6 L10 4 L-14 14 Z" fill="#3EE8B0" stroke="none"/>
      <line x1="22" y1="-2" x2="42" y2="-2"/><line x1="22" y1="10" x2="34" y2="10"/>
      <line x1="-38" y1="24" x2="42" y2="24"/><circle cx="-12" cy="24" r="4.5" fill="#3EE8B0" stroke="none"/></g>`,
};

module.exports = { ICONS };
