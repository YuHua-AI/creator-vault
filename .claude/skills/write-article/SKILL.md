---
name: write-article
description: 文章全流程管线：选题 → 调研 → 起草/改稿 → Obsidian 人工终审 → 按平台排版 → 多平台发布 → 归档。写新文章、继续写/改稿、推进某篇文章、发布归档时使用；支持公众号、掘金、知乎等平台。
argument-hint: [选题文字 或 drafts/ 下的文章短名；留空则报告当前进度]
---

# 文章全流程

管线：**Claude Code 生成/改稿 → Obsidian 人工终审 → 按目标平台排版 → 粘贴各平台后台发布**。

本 skill 是一台状态机：每次调用先定位文章所处阶段，再只做该阶段的事，不跳步。

## 第 0 步：定位阶段（每次必做）

- **有参数**：
  - 参数匹配 `drafts/` 下现有文件夹 → 读其 `article.md` 的 frontmatter `status`，进入对应阶段
  - 不匹配任何现有文件夹 → 当作新选题，从阶段 1 开始
- **无参数**：扫描 `ideas/` 与 `drafts/*/*/article.md` 的 `status`，列表报告每篇文章的进度，问用户推进哪篇

status → 阶段映射：

| status | 进入阶段 |
|---|---|
| （无文件） | 阶段 1 选题 |
| idea / draft | 阶段 3 起草/改稿 |
| review | 阶段 4 人工终审（等用户确认） |
| published 但仍在 drafts/ | 阶段 7 归档 |

## 阶段 1：选题入库

- 想法先落到 `ideas/`（一行一个，可按需建文件如 `ideas/pool.md`）
- 动笔前和用户对齐：选题角度、目标读者、大体结构、**目标发布平台**（公众号 / 掘金 / 知乎 / 其他，可多选）
- 目标平台记入 frontmatter 可选字段 `platform`（如 `platform: [公众号, 掘金]`）；分期发布时可在此备注各平台进度

## 阶段 2：素材调研（写前必做）

- 实例取材自 nas-ops 真实运维库 `/Users/yaohua/Workspace/06_Tools/nas-ops`，重点读：`docs/architecture.md`、`docs/network_topology.md`、`docker-compose/`、`configs-backup/`、`scripts/`
- 写真实发生过的事，不编造与真实环境矛盾的"假实例"
- 调研结论若值得长期复用 → 走 claude-obsidian 的 wiki-ingest 存 `wiki/`（可选）
- **脱敏红线**：个人信息数据绝不入文——密码/token/密钥/内网真实 IP/账号凭据等；产品品牌、具体网站、设备型号、具体实物可直接点名写（2026-11-11 起，旧「通用指引」要求作废）

## 阶段 3：起草与改稿

建文件夹（每篇一个，按专题归层，专题名与 `published/` 一致）：

- `drafts/<专题>/<文章短名>/article.md` + `img/`（现有专题：`autosar` / `nas` / `github-weekly`，新专题先建目录）；短名全小写用连字符连接
- 正文用相对路径 `img/…` 引用插图，插图紧跟其诠释的小标题

配图（cover + 分节插图，阶段 3 内完成，不拖到终审后；**由 AI 自己生成**）：

- **命名**：主图 `cover.jpg`，分节插图 `01-xxx.jpg` 递增（xxx 用小节关键词，如 `01-铁三角分工.jpg`）
- **先列清单再出图**：AI 按正文小节给出插图清单（哪几节配图、各画什么、封面画什么），与用户确认后再产出，避免整批返工
- **生成管线（AI 执行）**：AI 手写 SVG 设计稿存文章目录 `img-src/`（源码留存，可改可重渲）→ `node .claude/skills/write-article/scripts/render-img.js <in.svg> <out.jpg>` 用 headless Chrome 渲染成 JPG 落到 `img/`，正文以 `img/…` 相对路径引用
- **风格一致**：全系列共用一套设计语言（深蓝霓虹线框风：`#0A1826` 底 + 青色发光描边 + 青绿强调 + 顶部胶囊 + 底部金句），规格与可复用图形库见 `references/illustration-spec.md`，新图照规格画；封面尤其要成体系
- **提交节奏**：配图随本批改动在收尾时统一 commit（遵循「改动先积累，收尾时统一 commit」）

frontmatter 必带（`platform` 可选）：

```yaml
---
title: 文章标题
date: YYYY-MM-DD
status: draft
tags: [主题标签]
platform: [公众号, 掘金]
---
```

写作规范要点（规则持续沉淀在本 skill 的 `references/writing-rules.md`，以该文件为准）：

- 正文不以一级标题开头：标题已放 frontmatter `title`（进公众号标题栏/各平台标题位），正文再放 H1 会重复；正文小标题从 `##` 起
- 面向移动端碎片化阅读：段落短（3~5 行内），金句/结论前置，小标题分节
- 中英文与数字之间加空格，全角标点
- 代码块给最小可运行示例（各平台渲染主题不同，以平台实际效果为准）
- 正文不写平台特定话术（「点击关注」「进入合集」等）——站外分发的引导统一由 `published/<专题>/footer.md` 在交付时拼接，正文保持平台中立
- 文章草稿绝不能写进 `wiki/`（双体系分界）

改稿循环：

- 改动先积累，收尾时统一 git commit（或用户明确要求时再提交），message 用「文章名: 改了什么」
- 用户确认终稿 → `status: review`，进入下一阶段

## 阶段 4：人工终审（人工关卡，AI 不代替）

- 提醒用户在 Obsidian 中通读、修改
- 用户明确表示终稿确认后，才进入下一阶段

## 阶段 5：排版交付（公众号全自动；其他平台直接用 Markdown）

- **公众号（AI 自动执行）**：运行
  `node .claude/skills/write-article/scripts/push-draft.js <文章文件夹>`
  一条命令完成：doocs/md 渲染富文本 → 插图逐张换微信图床 URL（外链图在公众号正文不显示）→ 封面传永久素材 → 直推草稿箱
  - 前提：doocs/md 在 http://localhost:8080 运行；凭据在 `~/.config/gzh/env`（`GZH_APPID` / `GZH_SECRET`，可选 `GZH_AUTHOR` ≤8 字），凭据永不入库
  - 主题：首次运行为默认主题；跑一次 `--show`（有头模式）手动选好主题，配置留在 `~/.config/gzh/browser-profile`，此后无头运行沿用。自定义主题 CSS 备份在 `assets/theme.css`
  - 家宽 IP 变化会报 40164：按 errmsg 里报的新 IP 去微信开发者平台更新白名单后重跑
- **Markdown 原生平台**（掘金、知乎、CSDN、语雀、个人博客等）：无需排版，直接粘贴或导入 `article.md`（published 即产物，库内不另存平台副本），代码块由平台自带主题渲染。要拼系列尾部/回填链接的分发流，一条命令进剪贴板：
  `node .claude/skills/write-article/scripts/gen-dist-versions.js <文章文件夹> [--platform zh|csdn] | pbcopy`
  （去 frontmatter + 拼 `published/<专题>/footer.md` + 按 `links.json` 对应平台键回填）；分发登记（footer/links/gzh/zh/csdn 平台目录）与操作手册在 `published/<专题>/README.md`，与文章同目录
- **知乎/CSDN 准自动推稿**：`node .claude/skills/write-article/scripts/push-platform-draft.js <文章文件夹> --platform zh|csdn`
  自动完成：打开编辑器（首次需人工登录一次，会话存 `~/.config/gzh/profile-<platform>`）→ 填标题 → 贴正文 → 拖图；**停在发布前**，检查、勾 AI 生成标识、点发布是人工动作。发布是外向且不可控的操作，永不无人值守
- **站外分发红线**：`published/<专题>/footer.md` 绝不出现公众号/微信引流（CSDN/知乎审核即拒），CTA 用站内关注收藏；不放系列目录（持续更新会过时）；摘要公式与 frontmatter `digest` 约定见 `references/writing-rules.md`
- 一稿多平台时：以 `article.md` 为唯一源，各平台只做排版适配，不改动内容本身

## 阶段 6：发布（人工操作，给提醒即可）

- 公众号：后台 → 草稿箱 → 打开管线推入的草稿 → 预览
- 其他平台：粘贴 Markdown / 导入 `article.md`
- **公众号必须勾选平台的 AI 生成内容标识**；其他平台按各自规则标注 AI 生成内容（如有）

## 阶段 7：归档

所有目标平台发布完成后执行：

1. frontmatter 改 `status: published`，发布链接可补进 `platform` 字段备注
2. 整个文章文件夹 `drafts/<专题>/<短名>/` 移入 `published/<专题>/`
3. git commit（message 如「文章名: 发布归档」）
4. 若含可复用观点，可选 claude-obsidian 的 `save` 存回 `wiki/`

## 始终遵守

- 永不在此库存放任何密码、token、密钥
- 不手工编辑 `wiki/meta/ledgers/`
- 文章 frontmatter 用本库约定（title/date/status/tags，另加可选 platform）；wiki 页跟随插件自己的元数据格式，两套不互用
