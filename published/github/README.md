# GitHub 专题 · 分发登记

**零副本原则**：文章文件夹（article.md + img/）即归档产物，目录级只放登记（footer、links、操作手册），不复制内容。

## 结构

```
published/github/
├── README.md            # 本手册
├── footer.md            # 统一尾部模板（站外分发红线：无公众号/微信引流）
├── links.json           # 注册表：collection「GitHub 实战」+ 公众号名 + 各平台已发 URL
├── weekly-*/            # GitHub 周榜帖图（image-post 管线，不走本登记）
└── <各篇文章文件夹>/      # GitHub 实战文章：article.md + img/ + img-src/
```

## 推稿（脚本全自动，串行：公众号 → CSDN → 知乎）

```bash
node .claude/skills/write-article/scripts/push-draft.js drafts/github/<篇名>                 # 公众号
node .claude/skills/write-article/scripts/push-platform-draft.js drafts/github/<篇名> --platform csdn --save-draft
node .claude/skills/write-article/scripts/push-platform-draft.js drafts/github/<篇名> --platform zh --save-draft
```

文章 frontmatter 必带 `collection: GitHub 实战`（footer/注册表按它定位）。发布后 URL 由人工登记 `links.json` 对应平台键；未登记时容忍占位残留，不阻塞。

## 文风

GitHub 实战系列：亲历实测、第一人称、致谢原作者 + repo 地址两处，细则见 `.claude/skills/github-in-action/SKILL.md`（英文稿）与 write-article 通用规范（中文稿）。
