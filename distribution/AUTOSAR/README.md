# AUTOSAR 站外分发 · 打通手册（知乎 + CSDN）

唯一源：`published/AUTOSAR/<篇名>/article.md`。**平台版由脚本一键生成**：

```bash
node .claude/skills/write-article/scripts/gen-dist-versions.js published/AUTOSAR/<篇名>
# 产出 distribution/AUTOSAR/versions/{zhihu,csdn}/<篇名>.md，即贴即用
```

- 标题：编辑器标题框填 frontmatter 的 `title`
- 配图：每篇 `img/` 下的 jpg 按位置拖入编辑器（知乎/CSDN 均自动转存）
- 链接回填：发出一篇后把 URL 登记进 `links.json` → 重跑脚本，后续所有版本自动带上系列目录链接（发布顺序在前面的篇目链接自然先就位）

## 首次开通（一次性，人工）

**知乎**
1. 登录网页版知乎 → 个人中心 → 「我的专栏」→ 创建专栏，名称建议与合集同名「AUTOSAR 入门」
2. 发 ①：粘贴 `versions/zhihu/uds-byte-by-byte.md`（先补 `links.json` 的 公众号名），图片拖入
3. 发布时勾选「包含 AI 创作内容」

**CSDN**
1. 登录 CSDN → 「创作」→ Markdown 编辑器，同样流程发 `versions/csdn/` 版
2. CSDN 也需勾选 AI 生成内容标识；百度收录约 1~3 天生效

## 节奏（2026-11-15 调整：从缓）

- **每周 1 篇**：库存八篇铺两个月，等续作（DoIP/DEM/P2 并发…）写出来正好接上，不烧库存
- 发布顺序按搜索热度：① → ③ 0x27 → ⑥ DTC → ② 0x10 → ④ → ⑤ → ⑦ → NRC 番外
- CSDN 与知乎同篇同步发（一次粘贴两个平台，不占额外节奏）
- 每篇发出后：URL 登记 `links.json` → 重跑脚本 → 本文件登记一行

## 答题（比发文更重要）

见 `zhihu-questions.md`：第一波 3 个问题现在就能答，答题改编对应章节正文，尾部才挂目录。

## 登记

| 日期 | 平台 | 篇目/问题 | 链接 |
|---|---|---|---|
| | | | |
