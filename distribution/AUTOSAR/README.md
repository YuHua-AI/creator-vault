# AUTOSAR 站外分发 · 打通手册

**一篇文章走天下**：内容各平台一致，`articles/<slug>.md` 单份分发版即贴即用；`--platform` 只影响尾部系列目录的链接指向。

## 结构

```
distribution/AUTOSAR/
├── README.md            # 本手册
├── footer.md            # 统一尾部模板（占位符 {{链接:slug}}、{{公众号名}}）
├── links.json           # 注册表：公众号名 + 各平台已发 URL
├── articles/<slug>.md   # 单份分发版（八篇）
├── gzh/                 # 公众号：专题视图，源稿在 published/AUTOSAR/
├── zh/                  # 知乎：专栏/答题操作 + 登记（questions.md）
└── csdn/                # CSDN：发文操作 + 登记
```

## 生成（贴之前现跑）

```bash
node .claude/skills/write-article/scripts/gen-dist-versions.js published/AUTOSAR/<篇名> --platform zh
node .claude/skills/write-article/scripts/gen-dist-versions.js published/AUTOSAR/<篇名> --platform csdn
# 产出同一路径 articles/<篇名>.md，内容一致，仅目录链接指向对应平台
```

## 节奏（2026-11-15 定：从缓）

- **每周 1 篇**：库存八篇铺两个月，等续作（DoIP/DEM/P2 并发…）接上，不烧库存
- 顺序按搜索热度：① uds-byte-by-byte → ③ 0x27 → ⑥ DTC → ② 0x10 → ④ DID → ⑤ 0x31 → ⑦ OTA → NRC 番外
- 知乎、CSDN 同篇同步贴（一次粘贴两个平台）
- 每篇发出：URL 登记 `links.json` 对应平台键 → 重跑生成 → 平台目录登记表记一行
