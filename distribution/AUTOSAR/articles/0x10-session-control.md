## 开场：为什么这句被拒了？

上篇我们拿到 26 个服务的地图。现在真刀真枪干活：你想调怠速、想写 VIN、想刷固件，发请求——

```
→ 2E F1 90 <17字节VIN>
← 7F 2E 7F        "serviceNotSupportedInActiveSession"
```

NRC 0x7F：这个服务**当前会话**不支持（§8.6，Table A.1）。（NRC 的回是有检查顺序的——会话这道墙排在安全、条件之前，① 篇《NRC 是有先来后到的》。）

不是权限不够，不是参数错——是你**进错房间了**。上电之后 ECU 默认待在"默认会话"里，只开放最基础的服务。想干敏感的事？先敲门换房间：

```
→ 10 03
← 50 03 00 32 01 F4
```

这节课讲 0x10 DiagnosticSessionControl——UDS 里所有故事的起点。

![三重人格：三个会话房间](img/cover.jpg)

## 三重人格：前台、维修间、刷写间

0x10 的子功能就一个字节 diagnosticSessionType（Table 25），常用三个值，对应 ECU 的三张面孔：

| 值 | 会话 | 人格 | 开放什么 |
|---|---|---|---|
| 0x01 | defaultSession | 前台 | 基础服务：读 VIN、读版本、读基本数据 |
| 0x03 | extendedDiagnosticSession | 维修间 | 扩展诊断、怠速/CO 调整、写数据、IO 控制 |
| 0x02 | programmingSession | 刷写间 | 刷写全家桶：0x34/36/37、擦除例程 |

三者之外还有 0x04 safetySystemDiagnosticSession（气囊等安全系统），0x40~0x5F 留给车厂自定义（Table 25）——不少车厂用它定义"下线检测会话""售后会话"。

**为什么这样设计？** 安全。默认会话下 90% 的危险操作直接被 DSD 拦截（回想上篇的流水线，会话校验就在质检员手里）；换会话是一个明确的、可审计的"升级动作"。

## 逐字节：50 03 00 32 01 F4

正应答 `50` + 会话值回显 + 4 字节 sessionParameterRecord（Table 26/28/29），这 4 个字节是精华：

```
50 03 | 00 32 | 01 F4
 ↑  ↑     ↑       ↑
SID 会话  P2Server_max  P2*Server_max
         =50ms        =0x01F4×10ms=5000ms
```

- P2Server_max：2 字节，分辨率 1ms——"你问我话，我最迟 50ms 内接"
- P2\*Server_max：2 字节，分辨率 10ms——"我说'稍等'（NRC 0x78）后，5000ms 内必给最终答复"

![0x50 正应答逐字节](img/01-p2p2star.jpg)

上篇说过：**这俩是 ECU 自报家门的，不是标准强制值**。每个会话可以有自己的时限——比如刷写会话里 P2\* 往往放宽到 5 秒以上，因为擦 Flash 就是慢。

## 打回原形：S3 超时与 TesterPresent

进扩展会话不是一劳永逸的。

会话有个"保活时限"（S3，语义在 ISO 14229-2 定义）：**默认会话不需要保活，非默认会话超时没人吭声，自动打回默认会话**。

所以诊断仪在扩展/编程会话里干活时，会周期性广播心跳：

```
→ 7DF: 3E 80        "TesterPresent，抑制应答版"
```

`0x3E` 是 TesterPresent 服务，`80` 的 bit 7 是抑制位（上篇讲过）——广播 + 不要求应答，全车 ECU 都确认"诊断仪还在"，会话定时器归零重计。

拔掉诊断仪，3 秒内全车自动回到默认会话——一个优雅的故障安全设计。

![S3 心跳与超时](img/02-s3-heartbeat.jpg)

## 会话切换的规则

不是想跳哪就跳哪（Table 25 + §10.2）：

- 任何会话 → 任何会话：允许（包括自切自，用来自报时序参数）
- 切会话会复位安全解锁状态——多数实现里，切会话后 0x27 要重新解锁（③篇展开）
- programmingSession 常跑在 boot 里，退出途径受限：ECUReset、切回 default、会话超时

## 落到 AUTOSAR：DCM 怎么配会话

在 Vector DaVinci 里，会话配在 `DcmDspSession/DcmDspSessionRow`，一行一个会话（TechnicalReference_Dcm §5.1.4）：

```
/Dcm/DcmConfigSet/DcmDsp/DcmDspSession/DcmDspSessionRow
├── DcmDspSessionLevel            0x01/0x02/0x03…
├── DcmDspSessionP2ServerMax      ← 应答进 0x50 正应答
└── DcmDspSessionP2StarServerMax  ← 同上
```

看一份真实工程配置（ETAS RTA-CAR 项目 `J6B_Dcm_EcucValues.arxml`）——三个会话行，参数是这样的：

| 会话 | DcmDspSessionLevel | P2ServerMax | P2StarServerMax |
|---|---|---|---|
| DEFAULT_SESSION | 1 | 0.05 s | 2.0 s |
| PROGRAMMING_SESSION | 2 | 0.05 s | 2.0 s |
| EXTENDED_DIAGNOSTIC_SESSION | 3 | 0.05 s | 2.0 s |

注意：**P2\* 是 2 秒，不是 5000ms**。上文那个 `01 F4` 只是标准示例值；真实 ECU 自报多少，取决于车厂对"最慢操作"（通常是擦 Flash）的实测——这也正是把参数放进应答报文、而不是写死在标准里的意义。

至于 S3 定时器：ISO 14229-2 只给语义（"非默认会话超时回默认"），具体数值和实现位置（DCM 内部定时器）由各家实现决定——诊断仪侧约定俗成按 5s 内发一次 TesterPresent，留足余量。

## 收尾与预告

0x10 讲完，你已经会"换房间"了。但进了维修间，贵重操作还有第二道锁——

```
→ 2E F1 90 …
← 7F 2E 33        "securityAccessDenied"
```

NRC 0x33：没解锁。下一篇，0x27 SecurityAccess——ECU 的钥匙怎么发，Seed 与 Key 的攻防。

## 参考资料

- ISO 14229-1:2020 §10.2 DiagnosticSessionControl（Table 22~32）
- 会话保活 S3 语义：ISO 14229-2（库内为预览样张）
- AUTOSAR_SWS_DiagnosticCommunicationManager（会话校验在 DSD，§7.4）


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
