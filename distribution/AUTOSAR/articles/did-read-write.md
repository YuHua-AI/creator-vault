## 开场：F190 背后的门牌系统

第 ① 篇那条开场报文，你已经会读了：

```
→ 22 F1 90
← 62 F1 90 57 30 4C …   "W0L00043MB5413261"
```

F190 不是随便编的号——它是标准保留的"车架号门牌"。这篇讲透整个门牌系统：**DID**（Data Identifier，数据标识符），以及它的两个主人：0x22 读、0x2E 写。

![DID 门牌系统](img/cover.jpg)

## 门牌号怎么编的

DID 是 2 字节标识符，指向 ECU 内部的一条数据记录 dataRecord（§11.2.1）——可以是模拟量（水温）、数字量（挡位）、内部状态（当前会话），甚至一段字符串。

号码段有讲究（Annex C.1，Table C.1）：

| 号段 | 归属 | 例子 |
|---|---|---|
| F18x / F19x | **标准保留** | F186 当前会话、F187 备件号、F188 软件号、F189 版本号、**F190 VIN**、F191 boot 标识 |
| 其余大量号段 | 车厂自定义 | 车型代码、标定值、传感器实时值 |

所以售后拿诊断仪一扫 `22 F1 88` 就能读出 ECU 软件号——不是工具神奇，是全行业约定了同一块门牌。

## 0x22 读：一次可以买多件

请求格式（Table 186）：`22` + DID 高字节 + 低字节，**可以连着写多个 DID**：

```
→ 22 F1 87 F1 88 F1 89          "备件号、软件号、版本号，一样来一份"
← 62 F1 87 <data> F1 88 <data> F1 89 <data>
```

正应答 62 + 多组「DID 回显 + data」依次排列（Table 188）。

![批量读 DID 的报文格式](img/02-multidid-format.jpg)

注意 0x22 **没有子功能字节**（§11.2.2.2）——第二个字节直接就是 DID 高位，所以也没有抑制位可用。

一次贪多会撞墙：应答总长超了传输层上限，NRC 0x14 responseTooLong（Table 190）。

## 0x2E 写：一条多帧报文的完整旅程

写 VIN 是教科书案例——20 字节数据，单帧装不下，正好把第 ① 篇埋的伏笔收了。标准原文的完整 CAN 报文序列（Table 523，§17.4.3）：

```
7E0  10 14 2E F1 90 57 41 4C   首帧 FF：PCI=1014，共 0x14=20 字节
7E8  30 00 00                  流控帧 FC：继续发（CTS），块大小不限，帧间隔 0
7E0  21 54 4F 4E 53 2D 57 45   连续帧 CF #1
7E0  22 42 2E 43 4F 4D 20 20   连续帧 CF #2
7E8  03 6E F1 90               单帧正应答：6E = 0x2E+0x40
```

三层分工完美呈现：**前缀字节（10 14 / 21 / 22…）是 15765-2 的快递面单**，中间的 `2E F1 90 <17字节VIN>` 才是 UDS 内容。

![写 VIN 的多帧抓包](img/01-write-vin-multiframe.jpg)

写操作的两个前提（NRC 会提醒你）：

- 会话得对：`7F 2E 7F`（默认会话不让写，回②篇）
- 解锁得有：`7F 2E 33`（没钥匙，回③篇）

而且这两个码有先来后到——0x2E 的 NRC 检查顺序（ISO Figure 26）正是 ① 篇那条流水线的原型：长度 → 会话支持 → 解锁 → 条件 → 数据合法性 → 写入失败。收到 0x33，说明前面全过了，真就差钥匙。

## 远亲们：2A、2C、2F

同一族还有几个服务，一句话记住：

- **0x2A 周期读**：订阅制——说一次，ECU 按周期自动推送（发送时机由 DSL 的周期任务统一调度，和普通应答排同一个队）
- **0x2C 动态定义 DID**：现场把几个现有 DID/片段拼成一个新组合号
- **0x23/0x3D 按地址读写**：不走门牌号，直接按内存地址读写一段数据——工程调试利器，也是 ⑦ 篇传输服务"按地址写"的近亲
- **0x2F IO 控制**：不读数据了，直接操纵执行器（⑤篇的邻居）

## 落到 AUTOSAR：一个 DID 在 DaVinci 里怎么配

DID 的配置容器是一条四层链（TechnicalReference_Dcm §5.20.4 / §5.21.4）：

```
DcmDspDid（一个门牌号）
└── 引用 DcmDspDidInfo
    └── DcmDspDidAccess
        ├── DcmDspDidSessionRefs   哪些会话可访问
        ├── DcmDspDidSecurityRefs  哪些安全等级可访问
        └── DcmDspDidRead / DcmDspDidWrite
```

读写权限不挂在 DID 本身，而是挂在 Access 这一层——门牌（What）和钥匙（Who）分离，这正是 ②③ 两篇"会话 × 安全等级"矩阵在配置里的落点。

每个 DID 数据信号在 `DcmDspData` 里接端口；写 DID 若要落到 NvM，配 `DcmDspDataUsePort = USE_BLOCK_ID` 并引用 `DcmDspDataBlockIdRef`（TR §5.21.4）——写 VIN 就是这样直接落到非易失存储块。

真实工程里还能看到另一条线（ETAS `Dcm_Cfg_SWCD.arxml`）：一批 DID 的数据类型映射直接指向 **DEM 的快照信号**（ECU 电压、时间戳……）——0x19 读出来的快照数据，底层正是复用 DID 体系采集的。DID 不只是给诊断仪看的门牌，它是 ECU 内部数据的一套统一编址。

## 收尾与预告

数据能读能写了。但"读水温"和"让风扇转起来自检"是两码事——后者需要 **RID**（Routine Identifier）：ECU 的"工单号"。下一篇 0x31 例程控制。

## 参考资料

- ISO 14229-1:2020 §11.2 ReadDataByIdentifier（Tables 185~192）、§11.4 WriteDataByIdentifier
- 保留 DID：Annex C.1, Table C.1
- 多帧写 VIN 报文：§17.4.3, Table 523
- AUTOSAR_SWS_DiagnosticCommunicationManager（DSP 数据服务）


---

**AUTOSAR 入门系列**（持续更新，协议事实均以 ISO 14229-1:2020 为准）：

1. [诊断仪和 ECU 在 CAN 上说什么？UDS 协议逐字节拆解]({{链接:uds-byte-by-byte}})
2. [ECU 的三重人格——0x10 会话控制]({{链接:0x10-session-control}})
3. [ECU 的钥匙怎么发？0x27 安全解锁]({{链接:0x27-security-access}})
4. [DID，ECU 数据的门牌号——0x22/0x2E]({{链接:did-read-write}})
5. [让 ECU 按指令干活——0x31 例程控制]({{链接:0x31-routine-control}})
6. [八盏故障灯的秘密——0x14/0x19 DTC]({{链接:dtc-fault-codes}})
7. [一次 OTA 刷写在总线上发生了什么——0x34~0x38]({{链接:ota-flash}})
- 番外：[ECU 说「不」的艺术——NRC 否定应答码全图鉴]({{链接:nrc-negative-response-codes}})

系列在公众号「{{公众号名}}」同步首发，欢迎关注；转载请注明出处。
