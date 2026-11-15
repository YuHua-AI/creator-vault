## 开场：最不该被当成故障的“故障”

刷写进行到一半，诊断仪屏幕上连续滚出：

```
→ 36 45 <data…>
← 7F 36 78
→ 36 45 <data…>（其实没发出去，还在等）
← 7F 36 78
…（十几次）
← 76 45
```

新手的第一反应：坏了，传输报错了。老手的第一反应：ECU 在擦 Flash，说“稍等”呢。

那串 `7F 36 78` 不是错误，是 UDS 里最体面的一个“不”。UDS 里 ECU 拒绝你的每一个“不行”都有编号、有语义、有使用规则——**NRC**（Negative Response Code，否定应答码，ISO 14229-1:2020 Annex A.1, Table A.1）。① 篇我们记住了“检查有先来后到”，这篇把 NRC 本身摊开：全部约 60 个码怎么分段、怎么分家族、哪些坑专等调试的人。

读懂它们，抓包里的每个 `7F xx yy` 都会变成信息，而不是噪音。

![NRC 全图鉴](img/cover.jpg)

## 先看分段：一个字节的三个世界

NRC 只有一个字节，0x00~0xFF，但标准给它切了三段（§A.1 开篇原文）：

| 段 | 含义 | 例子 |
|---|---|---|
| `0x00` | **正响应保留值**——服务器内部实现用，永远不会出现在负应答里 | positiveResponse（§8.7.5） |
| `0x01~0x7F` | **通信相关**的否定应答码 | 服务不支持、没解锁、稍等 |
| `0x80~0xFF` | **具体条件不满足**——0x22 conditionsNotCorrect 的精细化子类 | 电压太高、车速太低、挡位不对 |

第三段是精髓：0x22“条件不满足”是个筐，什么都往里装对调试没帮助。所以标准规定：凡是某服务允许回 0x22 的地方，实现都可以改回 0x80~0xFF 里更具体的码——把“不行”说清楚是**为什么**不行。

一个字节里藏着设计哲学：**拒绝也要拒绝得有信息量**。

## 六大家族图鉴

Table A.1 约 60 个码，逐个背没有意义，按家族记：

### 家族一：通用拒绝（0x10~0x14）

| NRC | 名字 | 人话 |
|---|---|---|
| 0x10 | generalReject | 拒绝，但其他码都套不上（标准明确要求：不得当万能筐用） |
| 0x11 | serviceNotSupported | 我没有这个服务 |
| 0x12 | subFunctionNotSupported | 服务有，子功能没有 |
| 0x13 | incorrectMessageLengthOrInvalidFormat | 长度或格式不对 |
| 0x14 | responseTooLong | 应答装不下（一次读太多 DID 的经典翻车，④ 篇见过） |

调试高频区。0x13 尤其值得敏感：它经常意味着你的多帧拼装出了问题，而不是服务本身。

### 家族二：会话身份（0x7E/0x7F，与 0x11/0x12 的微妙分工）

`0x7F serviceNotSupportedInActiveSession` 的原文很有讲究：**只有当这个服务“在别的会话里是支持的”时才允许回它**——boot 里跑的 ECU 不知道应用支持什么，就只能回 0x11（标准原文专门举了这个例子）。

所以同一个“不行”有两层语义：

- `0x11`：我没有这服务，换哪个会话都没有
- `0x7F`：我有，但不在你现在这个会话——**潜台词是“换房间再来”**

诊断仪拿到 0x7F 会自动先切会话重试，拿到 0x11 则直接放弃。一个字节的差别，两条完全不同的自动恢复路径。0x7E/0x12 是子功能层面的同样分工。

### 家族三：安全与认证（0x33~0x37、0x50~0x5D）

0x27 安全解锁那一族（③ 篇的防爆破三件套都在这）：

- 0x33 securityAccessDenied——没解锁
- 0x35 invalidKey——key 错了（算一次失败）
- 0x36 exceedNumberOfAttempts——失败次数超限
- 0x37 requiredTimeDelayNotExpired——延时惩罚还没到点

再看 0x50~0x5D 一整段**证书验证家族**（Certificate verification failed: 时间窗/签名/信任链/类型/格式/内容/吊销……）——这是 2020 版为 0x29 Authentication 铺的专用码段。认证失败具体败在哪一环，码直接告诉你。安全机制的“不”，比普通操作更讲究指哪打哪。

### 家族四：忙与等（0x21 vs 0x78）

这两个码最容易混，标准原文给了精确判据：

- **0x21 busyRepeatRequest**：我现在太忙，**干不了**——你等会儿把**同一条请求重发**一遍
- **0x78 requestCorrectlyReceived-ResponsePending**：请求我收到了、参数也对，**正在干**——别催，干完我一定给最终答复

一句话：0x21 是“回头再说”，0x78 是“马上就好”。0x78 还有三条硬规则（原文）：可以连发；发过 0x78 后**必须**给最终应答（不管抑制位怎么设）；它就是 P2→P2\* 切档的触发器（⑦ 篇刷写等 5 秒的那个机制）。

![0x78 连发时间线](img/02-pending-timeline.jpg)

### 家族五：刷写传输（0x70~0x73）

⑦ 篇的老熟人，刷写日志的常驻嘉宾：

- 0x70 uploadDownloadNotAccepted——内存不接受（没谈判就搬运？）
- 0x71 transferDataSuspended——传输被打断，序列作废
- 0x72 generalProgrammingFailure——Flash 擦/写失败
- 0x73 wrongBlockSequenceCounter——块序号错乱

### 家族六：具体条件（0x81~0x94）——0x22 的精细化答案

这段是“条件不满足”的展开式，几乎每个码背后都是一条安全逻辑：

- 0x81/0x82 rpmTooHigh/TooLow——转速不满足
- 0x83/0x84 engineIsRunning / IsNotRunning——发动机在转/没转（和转速高低是两码事，标准特意说明）
- 0x86/0x87 温度太高/太低
- 0x89 车速太低、0x8F 刹车没踩、0x90 挡杆不在 P 挡
- 0x92/0x93 voltageTooHigh/TooLow——⑦ 篇刷写路上的电源哨兵

为什么刷写前置条件是“车速为 0、挡位在 P”？因为写 Flash 时 ECU 最好别同时还在算喷油。这些码就是那条安全逻辑在协议层的投影。0x94 ResourceTemporarilyNotAvailable 收尾——应用暂时腾不出手。

`0x95~0xEF` 标准保留，`0xF0~0xFE` 留给车厂自定义条件——你会在各家刷写规范里看到这个段的私有码。

![家族速查表](img/01-nrc-families.jpg)

## 三个容易踩的坑

**坑一：功能寻址下，有些“不”不许说出口。** 广播（7DF）是全车 30 个 ECU一起听，如果都回“我不支持”，总线直接堵死。所以功能寻址请求下，部分 NRC 被抑制——0x78 的条文里明确列了五个：SNS、SFNS、SNSIAS、SFNSIAS、ROOR（即 0x11/0x12/0x7E/0x7F/0x31）。注意 0x78 本身**不**在抑制之列——广播也能喊“稍等”。

**坑二：0x26 是个“自动读码”信号。** requestSequenceError 之外还有个 0x26 FailurePreventsExecutionOfRequestedAction：有 DTC 实锤故障挡着，这事干不了。标准原文专门设计了一个联动：访问 DTC 的服务**不得**实现 0x26，因为外部诊断工具的约定是——收到 0x26 就自动去读 DTC。码与码之间有配合，不只是查表。

**坑三：0x25 是网关专属。** noResponseFromSubnetComponent——网关替子网里的 ECU 转发请求，子网部件超时没应，网关用这个码向诊断仪交代。做多 ECU 架构诊断时见到它，问题不在网关，在网关后面。

## 落到 AUTOSAR：NRC 是谁决定的

DCM 里 NRC 的产生路径值得一看——它不是 DCM 拍脑袋选的：

**大部分“条件类”NRC 由应用层回调决定。** 以读 DID 为例，DaVinci 生成的是 `ConditionCheckRead()` 端口函数（TechnicalReference_Dcm §6.5.2）：DCM 调它问应用“现在读合适吗”，应用回 E_NOT_OK 的同时在出参 `Dcm_NegativeResponseCodeType* ErrorCode` 里**自己挑一个 NRC**——你可以在应用里探测电压、车速，然后精确地回 0x92 或 0x89。

**不挑的后果：默认 0x22。** 文档写得很直白：E_NOT_OK 且不设具体码，DCM 发 conditionsNotCorrect。所以“为什么我们的 ECU 总是回 0x22”——十有八九是应用层偷懒没填 ErrorCode。想让诊断仪看到更友好的拒绝理由，这件事要在 SWC 里做。

**工程与标准的真实错位。** DaVinci 文档的 FAQ 里有个坦白的例子：0x28 外挂子功能的长度检查由用户实现负责时，双重错误（安全等级不对 + 子功能长度不对）的 NRC 优先级可能偏离标准顺序——因为配置粒度到不了子功能级。① 篇讲的“检查顺序”是标准的理想，落到工具链上存在边界情况。**收到意料之外的 NRC 时，别急着怀疑标准，先怀疑配置。**

## 收尾：NRC 是路标，不是路障

回到开头的场景。刷写日志里滚动的 `7F 36 78`，现在你能读出完整语义：请求收讫、参数正确、正在执行、别催、稍后必答——ECU 在用协议规定的最规范的方式说“稍等”。

调试心法就一句：**每一个 NRC 都是 ECU 主动递给你的二分查找路标**。0x33 意味着会话、存在性全过了只差钥匙；0x92 意味着谈判、解锁全过了只差电源；0x21 意味着重发一次就好。把 Table A.1 当字典放在手边，ECU 的每个“不”都会告诉你——下一步该查哪里。

系列正传七篇至此，番外补上了这块最常用的拼图。下一站回到路线图：DoIP、DEM 深讲、FiM，候选清单见选题池，我们江湖再见。

## 参考资料

- ISO 14229-1:2020 Annex A.1, Table A.1（NRC 全表与分段定义）、§8.6 负应答格式、§8.7.1 功能寻址 NRC 抑制、§8.7.5 positiveResponse 保留值
- 0x78 语义细则：Table A.1 原文（连发、最终应答、抑制豁免）
- 0x25/0x26 使用约束：Table A.1 原文
- VectorTechnicalReference_Dcm（MICROSAR DCM v9.5）§6.5.2 ConditionCheckRead/Write 与 ErrorCode 出参、§5.x 各服务 Configuration Aspects 与 FAQ（外挂子功能 NRC 优先级偏离）


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
