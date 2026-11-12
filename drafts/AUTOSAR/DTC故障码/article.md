---
title: AUTOSAR 入门 ⑥：八盏故障灯的秘密——0x14 清码与 0x19 读 DTC
date: 2026-11-12
status: draft
tags: [AUTOSAR, UDS, 诊断, DTC]
platform: [公众号]
---

## 开场：仪表盘上那个小扳手

仪表盘故障灯亮起，4S 店插上诊断仪，屏幕跳出 `P0A9B-17`——这串字符不是玄学，是 UDS 0x19 服务从 ECU 故障存储器里读出来的 **DTC**（Diagnostic Trouble Code，诊断故障码）。

这篇讲故障码的完整生命周期：怎么编码、怎么读（0x19）、怎么清（0x14）。

![八盏故障灯](img/cover.jpg)

## DTC 的三字节编码

DTC 用 3 字节编码（Table 346），`P0A9B-17` 在总线上就是 `0A 9B 17`：

```
0A 9B 17
└┬┘ └┬┘ └┬┘
 │   │   └── 故障子码（17 = 信号异常之类，SAE J2012 定义）
 │   └────── 具体故障号
 └────────── 类别位（P=动力系……第一位字母的二进制编码）
```

五万种故障都能装进这 3 字节，且全行业统一——4S 店的通用诊断仪和车厂专用工具读出来的是同一个码。

![DTC 三字节编码](img/01-dtc-encoding.jpg)

## 状态字节：八盏灯

每个 DTC 身后跟着 1 字节状态（Table 342），8 位各是一盏灯：

| Bit | 名字 | 含义 |
|---|---|---|
| 0 | testFailed | **此刻**故障正在发生 |
| 1 | testFailedThisOperationCycle | 本运行周期曾失败 |
| 2 | pendingDTC | 本或上周期失败过（待定） |
| 3 | confirmedDTC | 已确认是真故障 |
| 4 | testNotCompletedSinceLastClear | 清码后测试没跑完过 |
| 5 | testFailedSinceLastClear | 清码后又失败过 |
| 6 | testNotCompletedThisOperationCycle | 本周期测试没跑完 |
| 7 | warningIndicatorRequested | 请求点亮警告灯 |

实例（标准原文，Table 342/344）：

- `0x24` = 0010 0100 → pendingDTC + testFailedSinceLastClear："上周期失败过，清码后又犯了，还没实锤"
- `0x2F` = 0010 1111 → 前五盏亮："实锤 + 正在发生 + 历史重犯"

**pending 与 confirmed 的区别**是精妙设计：偶发抖动只进 pending，连续多个周期失败才 confirmed——防止一次电磁干扰就误报故障。

## 0x19 读码：子功能是个工具箱

0x19 的子功能多达 20 个（Table 317），常用的：

| 子功能 | 功能 |
|---|---|
| 0x01 | 按 mask 数个数（先问"有几个"，再决定要不要读） |
| **0x02** | 按 mask 读 DTC 列表（最常用） |
| 0x04 | 读快照（故障瞬间的定格数据） |
| 0x06 | 读扩展数据 |
| 0x0A | 读全量支持列表 |
| 0x15 | 永久 DTC（清不掉的） |

0x02 的报文（§12.3.5.3 原文示例）：

```
→ 19 02 84              "给我 bit2+bit7 亮的那些 DTC"
← 59 02 7F <DTC列表>    availability mask=0x7F + 每个 DTC 3字节+状态1字节
```

掩码匹配是**按位与，非零即中**：`(status & mask) != 0`（§12.3.1.3）。想只看实锤故障？mask 用 0x08（confirmedDTC）。

## 快照：故障发生瞬间的行车黑匣子

0x04 读的快照（snapshot）是事故分析的证据链：故障确认的瞬间，ECU 把当时的车速、水温、电压等打包定格。事故车鉴定、偶发故障复现，全靠它。

## 0x14 清码：清的是灯，不是病

```
→ 14 FF FF FF           "清所有 DTC"
← 54                    "清了"
```

三个 FF 是 groupOfDTC = 全部（§12.2.1）。也可以只填某一个具体 DTC 的 3 字节——"只清它"。清掉的内容标准列了清单：状态字节、快照、扩展数据、首次/最近发生时间等计数器——但故障的"因"不在其中（ Annex D.1）。

**关键认知**：清码清掉的是**状态字节和历史记录**，故障本身（硬件坏了、信号丢了）还在。清完码故障灯灭了，下个运行周期测试再失败，DTC 立刻回来——"清码治标"的协议层解释。

![读码 → 清码 → 复发全程](img/02-dem-pipeline.jpg)

还有清不掉的：**永久 DTC**（0x15）——法规要求必须故障真正修复、连续 N 个周期通过测试才自动消除，防止刷检蒙混年检。

## 落到 AUTOSAR：DCM 身后的 DEM

故障存储器不在 DCM 里——专门的 **DEM**（Diagnostic Event Manager）模块管：诊断事件监控、防抖（debouncing）、DTC 状态机、快照/扩展数据存储。DCM 读码时通过 Dem API 取数（`Dem_SetDTCFilter` → `Dem_GetDTCStatusAvailabilityMask` 一套接口）。

DEM 的世界不直接说 DTC，它说的是**事件**（Event）。监控器（SWC 或 BSW 里的监视逻辑）只负责报告：`Dem_SetEventStatus(PASSED/FAILED)`。Event 和 DTC 的绑定是一条配置引用（真实工程 `J6B_Dem_EcucValues.arxml`）：

```
DemEventParameter  "…Timeout"
├── DemDTCRef → /…/DemDTC_B384169_Acore_Timeout   ← Event→DTC 映射
└── DemDebounceAlgorithmClass
    └── DemDebounceCounterBasedClass
        ├── DemDebounceCounterIncrementStepSize = 1
        └── DemDebounceCounterPassed/FailedThreshold = …
```

**防抖就是上篇"pending vs confirmed"的实现**（TechnicalReference_Dem §3.4.1）：计数器防抖——每报一次 PreFailed 加一个步长，累计到 FailedThreshold 才置 confirmedDTC；计数范围 -32768~32767，对外线性映射成 UDS 的故障检测计数 FDC（-128~127，0x19 的 0x14 子功能可读）。另有基于时间的防抖（报一次持续 N ms 才算）和监控器内部防抖两种算法可选。

快照也有讲究（§3.12）：快照数据在 DEM 任务里统一采集，和事件确认之间有延迟。变化快的信号可用 `Dem_PrestoreFreezeFrame()` **预存**——先拍下来，真要存 DTC 时用这张照片。采不到的数据按标准以 0xFF 填充。

## 收尾与预告

故障码清了、钥匙有了、房间能进——最后一课，把新固件刷进 ECU：**0x34~0x38 传输五件套**，一次 OTA 刷写在总线上的完整剧本。

## 参考资料

- ISO 14229-1:2020 §12.3 ReadDTCInformation（Tables 295~346）、§12.2 ClearDiagnosticInformation
- DTC 状态位：Table 342，状态位行为：Annex D.2
- 报文示例：§12.3.5.3, Tables 345/346
- AUTOSAR_SWS_DiagnosticEventManager（DEM）
