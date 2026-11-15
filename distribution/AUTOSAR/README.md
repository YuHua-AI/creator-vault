# AUTOSAR 站外分发 · 打通手册

**零副本原则**：`published/AUTOSAR/<篇名>/article.md` 就是归档产物，分发直接用它；本目录只存登记（footer、链接、平台操作），不复制内容。

## 结构

```
distribution/AUTOSAR/
├── README.md            # 本手册
├── footer.md            # 统一尾部模板（占位符 {{链接:slug}}、{{公众号名}}）
├── links.json           # 注册表：公众号名 + 各平台已发 URL
├── gzh/                 # 公众号：专题视图，源稿在 published/AUTOSAR/
├── zh/                  # 知乎：专栏/答题操作 + 登记（questions.md）
└── csdn/                # CSDN：发文操作 + 登记
```

## 贴稿流程（一条命令进剪贴板）

```bash
node .claude/skills/write-article/scripts/gen-dist-versions.js published/AUTOSAR/<篇名> --platform zh | pbcopy
node .claude/skills/write-article/scripts/gen-dist-versions.js published/AUTOSAR/<篇名> --platform csdn | pbcopy
```

去 frontmatter + 拼 footer + 按 `--platform` 回填该平台已发链接，直接粘贴到平台编辑器；图片从 `published/AUTOSAR/<篇名>/img/` 拖入。发出后 URL 登记 `links.json` 对应平台键。

## 节奏（2026-11-15 定：从缓）

- **每周 1 篇**：库存八篇铺两个月，等续作（DoIP/DEM/P2 并发…）接上，不烧库存
- 顺序按搜索热度：① uds-byte-by-byte → ③ 0x27 → ⑥ DTC → ② 0x10 → ④ DID → ⑤ 0x31 → ⑦ OTA → NRC 番外
- 知乎、CSDN 同篇同步贴（一次生成两次粘贴）
- 每篇发出：URL 登记 `links.json` → 平台目录登记表记一行
