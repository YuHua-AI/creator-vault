<!-- AUTOSAR 七篇排版稿：逐篇复制「==」分隔线以下内容到 doocs/md；图片在正文 img/ 标记处手动上传插入 -->

==================================================================
== 【AUTOSAR 入门 ①：诊断仪和 ECU 在 CAN 上说什么？UDS 协议逐字节拆解】  （草稿目录：UDS协议逐字节拆解）
------------------------------------------------------------------
## 开场：一条 CAN 报文引发的"对话"

修车时，师傅把诊断仪插上 OBD 口，屏幕上跳出车架号、软件版本、故障码。

看起来像魔法，其实在 CAN 总线上，只发生了一次极简的对话：

```
诊断仪 → ECU:  22 F1 90          "把 F190 号数据给我看看"
ECU → 诊断仪:  62 F1 90 57 30 4C 30 30 30 34 33 4D 42 35 34 31 33 32 36 31
                                    "给，这是车架号"
```

后面那串数字，每个字节都是 ASCII 字符，拼出来正是一个 17 位 VIN 码。
![读 VIN 的完整交互](img/00-vin-trace.jpg)


这不是哪家车厂的私有协议。全世界的 ECU，讲的都是同一种"诊断语言"——**UDS**（Unified Diagnostic Services，统一诊断服务），标准编号 ISO 14229。

这个系列，我们就把这门语言拆开揉碎讲。今天是第一课：先看懂一条报文的每个字节，再拿到全部 26 个服务的地图。

![系列开篇：UDS 逐字节拆解](img/cover.jpg)

## UDS 是什么：不是协议栈，是一套"对话剧本"

先纠正一个常见误解：UDS 不是一个"协议栈"，它只管**应用层**——规定诊断仪（client，客户端）和 ECU（server，服务端）**说什么**，不管**怎么送**。

ISO 把这件事拆成了三层（ISO 14229-1, Table 1）：

| 层 | 标准 | 管什么 |
|---|---|---|
| 应用层 | ISO 14229-1 | 说什么：服务、SID、参数、应答语义 |
| 会话层 | ISO 14229-2 | 什么时候说：超时、重试、会话保持 |
| 传输层（CAN 上） | ISO 15765-2 | 怎么送：单帧装不下怎么办 |

一个类比：14229-1 是剧本，14229-2 是导演的调度规则，15765-2 是快递系统。
![三层分工](img/01-layers.jpg)


所以别把 `7F 22 31` 这种字节流归功于"CAN 协议"——CAN 只负责把这 3 个字节送到，至于它们什么意思，全是 UDS 说了算。

## 解剖第一条报文：SID、+0x40 与子功能

回到开头那条报文。`22 F1 90` 三个字节，逐个拆：

**第一个字节 `22`：SID（Service Identifier，服务标识符）。**

UDS 里每个"动作"有一个编号，`0x22` 是 ReadDataByIdentifier（按标识符读数据）。你让它干活，先报工号。

**应答的第一个字节 `62`：就是 SID + 0x40。**

这是 UDS 最漂亮的规律：**正应答 SID = 请求 SID + 0x40**。对应到二进制，就是把 bit 6 置 1（ISO 14229-1, §8.4, Table 2）。

所以你看到的每一对请求/应答，都遵循这个规律：

| 请求 | 正应答 | 服务 |
|---|---|---|
| 0x10 | 0x50 | 会话控制 |
| 0x22 | 0x62 | 读数据 |
| 0x19 | 0x59 | 读故障码 |
| 0x2E | 0x6E | 写数据 |
| 0x31 | 0x71 | 例程控制 |

下次抓 CAN 报文，看到 `5x/6x/7x` 开头的应答，减去 0x40 就知道在应答谁。
![报文格式逐字段](img/02-message-format.jpg)


**负应答则统一用 `0x7F`**，格式固定三字节：

```
7F <请求SID> <NRC>
```

比如 `7F 22 31`：你用 0x22 读数据，被拒了，拒绝理由 NRC=0x31（请求超出范围——这个 DID 不存在）。

**还有一个隐藏角色：子功能字节的 bit 7——抑制位。**

带子功能的服务（如 0x10、0x19、0x3E），请求第二个字节是子功能，它的最高位是 suppressPosRspMsgIndicationBit——置 1 表示"这事办了别回话"（§8.7.3）。诊断仪保活常用的 `0x3E 80`，那个 80 就是"我在，但不用回我"。（注意 0x22 没有子功能——第二个字节直接就是 DID 高位，别把 `F1` 的最高位当成抑制位。）

## ECU 说"不"的方式：NRC 速览

UDS 里 ECU 拒绝你的方式，比你想的有礼貌得多——每一个"不行"都有编号，叫 **NRC**（Negative Response Code，否定应答码，Annex A.1, Table A.1）。

写代码调试时 90% 的挫败感，来自这几个：

| NRC | 名称 | 人话 |
|---|---|---|
| 0x11 | serviceNotSupported | 我不提供这个服务 |
| 0x12 | subFunctionNotSupported | 服务有，子功能没有 |
| 0x22 | conditionsNotCorrect | 现在条件不满足（车速不为 0 想刷写？） |
| 0x31 | requestOutOfRange | 参数越界，没这个 DID |
| 0x33 | securityAccessDenied | 没解锁，别碰（下篇主角） |
| 0x78 | responsePending | 收到了，在处理，稍等（刷写擦 Flash 期间的高频应答） |

后面五篇，几乎每一篇的开场都是一个 NRC 引发的血案——记住这张小表，系列就赢了一半。

## NRC 是有先来后到的

新手最容易忽略的一件事：**一次请求可能同时踩好几条红线，但 ECU 只回一个 NRC——回哪个，标准规定了检查顺序。**

每个服务在 ISO 14229-1 里都配了一张 NRC 处理流程图。拿 0x2E 写数据当例子（Figure 26），ECU 收到请求后从头到尾过筛子：

1. 报文长度够不够？→ 不够，**0x13**（格式错误）
2. 这个 DID 在当前会话支持写吗？→ 不支持，**0x31**
3. （2020 版新增）认证过没过？→ 没过，**0x34**
4. 安全等级解锁了吗？→ 没解锁，**0x33**
5. 现在的条件允许写吗？→ 不允许，**0x22**
6. 数据本身合法吗？→ 不合法，**0x31**
7. 最后一关：真写进内存失败 → **0x72**

顺序有讲究：**先查身份，再查条件，最后才干活**。所以你在默认会话、没解锁、车速还 60 km/h 的状态下发 `2E F1 90`，同时踩了三条红线，但回给你的只有一个——排在最前面的"这个 DID 当前会话不支持"（② 篇的 0x7F/0x31 一族）。条件 0x22 和解锁 0x33 排在它后面，轮不到开口。

实战意义：**调试时 NRC 是二分查找的线索**。收到 0x33 别急着查算法——先确认前面的关卡（会话、DID 存在性）都已经过了，0x33 才真的意味着"就差钥匙"。后面各篇遇到 NRC 时，记住它只是这条流水线上**第一个没过的检查站**。

## 广播与点名：功能寻址 vs 物理寻址

诊断报文在 CAN 上怎么寻址？两种方式（§7.4）：

**物理寻址——点名。** 一对一，请求发 `0x7E0~0x7E7`，应答固定用 `0x7E8~0x7EF`。不管你怎么问，**应答永远走物理寻址**。

**功能寻址——广播。** 统一发 `0x7DF`，总线上所有 ECU 都听。典型用途：`7DF: 02 11 01`，一句话让全车 ECU 硬复位——刷写前的"全体起立"。

一个细节：广播模式下，部分 NRC（如 0x11 服务不支持）**不允许应答**（§8.7.1）——不然全车 30 个 ECU 同时喊"我不支持"，总线直接堵死。
![寻址拓扑](img/03-addressing.jpg)


**那 VIN 那 20 个字节的应答怎么塞进一帧 8 字节的 CAN 报文？** 塞不进。这时候传输层 ISO 15765-2 出场：拆成首帧（FF）、等流控帧（FC）、连续帧（CF）搬运。本篇只记一句：**多帧搬运是 15765-2 的活，与 UDS 无关**，细节等第 ⑦ 篇刷写时展开。

## 全景地图：26 个服务，六本"对话手册"

重头戏。UDS 一共定义了 26 个服务（25 个经典服务 + 2020 版新增的 0x29 认证），按功能分成六组（各组的 Overview 表，Table 22/185/295/398/424/439）。

先给个冷知识：**标准里其实没有一张"全部 SID 总表"**——它们散落在六个功能单元各自的章节里。下面这张合并表，就是你网上很难一次找齐的完整地图：

**① 诊断管理（9 个）——管的是"对话规则"**

| SID | 服务 | 干什么 |
|---|---|---|
| 0x10 | DiagnosticSessionControl | 切会话（第②篇） |
| 0x11 | ECUReset | 让 ECU 复位 |
| 0x27 | SecurityAccess | 安全解锁（第③篇） |
| 0x28 | CommunicationControl | 开关通信 |
| 0x3E | TesterPresent | 诊断仪在场心跳 |
| 0x84/0x85/0x86/0x87 | 安全传输/控制DTC/事件响应/链路控制 | 低频但各有神通 |

**② 数据传送（7 个）——读写 ECU 的数据**

| SID | 服务 | 干什么 |
|---|---|---|
| 0x22 | ReadDataByIdentifier | 按 DID 读（第④篇） |
| 0x2E | WriteDataByIdentifier | 按 DID 写（第④篇） |
| 0x23/0x3D | 按地址读写内存 | 工程调试用得多 |
| 0x2A | 周期读 | 订阅式数据上报 |
| 0x2C | 动态定义 DID | 现场拼一个组合数据 |
| 0x24 | 读缩放信息 | 拿到原始值怎么换算 |

**③ 存储信息（2 个）——故障码的清与读**

| SID | 服务 | 干什么 |
|---|---|---|
| 0x14 | ClearDiagnosticInformation | 清码（第⑥篇） |
| 0x19 | ReadDTCInformation | 读码（第⑥篇） |

**④ IO 控制（1 个）**

| SID | 服务 | 干什么 |
|---|---|---|
| 0x2F | InputOutputControlByIdentifier | 直接控制执行器/替代信号 |

**⑤ 例程控制（1 个）**

| SID | 服务 | 干什么 |
|---|---|---|
| 0x31 | RoutineControl | 启动/停止/查询例程（第⑤篇） |

**⑥ 上传下载（5 个）——刷写全家桶**

| SID | 服务 | 干什么 |
|---|---|---|
| 0x34/0x35 | 请求下载/上传 | 传输前协商（第⑦篇） |
| 0x36 | TransferData | 逐块搬运（第⑦篇） |
| 0x37 | RequestTransferExit | 传输结束（第⑦篇） |
| 0x38 | RequestFileTransfer | 文件级传输 |

加上 2020 版新增的 **0x29 Authentication**（基于证书的认证，安全强度高于 0x27 的 Seed&Key），正好 26 个。

这张表建议收藏——它是这个系列的地图，后面每一篇，都是把其中一行展开讲透。
![26 服务全地图](img/04-service-map.jpg)


## 时序：P2 与 P2\*，接话的时限

对话要有节奏。UDS 规定了两条"接话时限"（§10.2.3.2, Table 28/29）：

- **P2Server_max**：ECU 收到请求后，最迟多久必须应答（或先回一句 0x78 "稍等"）
- **P2\*Server_max**：ECU 说了"稍等"（NRC 0x78）之后，最迟多久给最终答复

这里要**纠正一个流传很广的误传**：网上大量文章写"P2 标准规定 50ms、P2\* 规定 5000ms"。

不准确。50ms/5000ms 只是**标准正文里的示例值**（Table 31）。真实机制漂亮得多——这两个时限是 **ECU 自己报的**，就在 0x10 会话控制的正应答里：

```
10 03                  "进扩展会话"
50 03 00 32 01 F4      "已进。我接话最快 0x0032=50ms，说'稍等'后 0x01F4×10=5000ms 内必答"
```

每个 ECU 的脾气不一样，问一句 `10 03`，它就把两个时限写在应答里告诉你了。第 ② 篇讲会话时，这段报文我们逐字节再拆一遍。

## 落到 AUTOSAR：DCM 模块在哪里

讲了这么多 ISO 标准，它在 AUTOSAR 软件里由谁实现？答案是一个 BSW 模块：**DCM**（Diagnostic Communication Manager）。

分层上很干净：前面说的三层剧本里，**DCM 包办 OSI 第 5~7 层**——UDS 服务（第 7 层）、会话层时序（第 5 层）都是它的活；而拆装多帧的 ISO 15765-2 属于第 2~4 层，归传输层模块（CanTp）管（AUTOSAR_SWS_DCM, Table 1.1）。

DCM 内部分工也很讲道理，三个子模块像一条流水线（SWS Figure 7.1）：

- **DSL**（Diagnostic Session Layer）：前台接待——管会话状态、安全等级、定时、TesterPresent 保活，从 PduR 收请求、把应答发回去
- **DSD**（Diagnostic Service Dispatcher）：质检员——校验"当前会话允不允许、解没解锁、格式对不对"，然后分发给处理者
- **DSP**（Diagnostic Service Processing）：干活的——解析 0x22/0x19/0x31 各服务，去应用层（经 RTE）或 DEM 拿数据、执行动作、组装应答

一条 `22 F1 90` 进来：CanTp 重组多帧 → PduR → DSL 收下 → DSD 校验 → DSP 发现要读 DID，经 RTE 端口向应用拿 VIN → 原路返回应答。

工程里怎么配？以 Vector MICROSAR 为例，DaVinci Configurator 里 Dcm 的配置树就是按这条流水线组织的：`DcmDslProtocol` 配协议和 P2 定时、`DcmDspSession` 配会话、`DcmDspSecurity` 配安全等级、`DcmDspDid` 配每一个 DID 的读写权限——本系列后面每讲一个服务，都会带你回到这棵树上找到它对应的位置。

顺带一提，`DcmDslProtocol` 可以配多行：一个 DCM 同时挂 CAN、CAN FD、DoIP（以太网）多条诊断通道，各自独立 P2 定时、互不干扰。同一套 UDS 服务原样跑在不同总线上——这是分层的红利，DoIP 值得单开一篇，先挖个坑。

这也是 AUTOSAR 的价值所在：**协议是 ISO 的，实现是 AUTOSAR 的**。车厂换供应商、换芯片，诊断行为不变——因为大家用的是同一本剧本、同一套模块接口。
![DCM 流水线](img/05-dcm-pipeline.jpg)


## 收尾与预告

回头看，你已经具备三个能力：

- 看懂任意一条诊断报文的骨架（SID / +0x40 / 子功能 / NRC）
- 分清广播与点名（7DF vs 7E0-7E7，应答永远物理寻址）
- 手握 26 个服务的完整地图

下一篇我们进入第一个服务：**0x10 会话控制**。为什么很多操作之前都要先发一句 `10 03`？因为 ECU 有"三重人格"——前台、维修间、刷写间，进错房间，寸步难行。

## 参考资料

- ISO 14229-1:2020 — Unified diagnostic services (UDS), Part 1: Specification and requirements
  - 服务全景：各功能单元 Overview（Table 22, 185, 295, 398, 424, 439）
  - SID 值域与 +0x40 规则：§8.4, Table 2；负应答格式：§8.6, Table 3；抑制位：§8.7.3
  - 寻址：§7.4；功能寻址 NRC 抑制：§8.7.1
  - 示例报文：0x10（Tables 31/32）、0x22 读 VIN（Tables 191/192）、多帧/功能寻址（Tables 523/524）
  - 时序参数：§10.2.3.2, Tables 28/29（P2/P2\* 语义详见 ISO 14229-2）
  - NRC 全表：Annex A.1, Table A.1；NRC 检查顺序示例：0x2E WriteDataByIdentifier 的 Figure 26
- AUTOSAR_SWS_DiagnosticCommunicationManager（DCM 规范，R4.3.0）：分层 Table 1.1；DSL/DSD/DSP Figure 7.1 及 §7.3~7.5
- Vector TechnicalReference_Dcm（MICROSAR DCM v9.5）：DaVinci 配置容器结构（各服务 Configuration Aspects 节）

==================================================================
== 【AUTOSAR 入门 ②：ECU 的三重人格——0x10 会话控制，从默认会话到编程会话】  （草稿目录：0x10会话控制）
------------------------------------------------------------------
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

==================================================================
== 【AUTOSAR 入门 ③：ECU 的钥匙怎么发？0x27 安全解锁，Seed 与 Key 的攻防】  （草稿目录：0x27安全解锁）
------------------------------------------------------------------
## 开场：第二道锁

上篇换了房间（`10 03` 进扩展会话），兴冲冲去写 VIN：

```
→ 2E F1 90 <20字节>
← 7F 2E 33        "securityAccessDenied"
```

NRC 0x33：安全访问未解锁。房间进对了，但**柜子还锁着**。

会话（0x10）决定"你能进哪个房间"，安全等级（0x27）决定"你能开哪个柜子"。这是 UDS 权限体系的第二层。

![Seed 与 Key 的攻防](img/cover.jpg)

## Seed & Key：一场挑战应答

0x27 的流程是一场标准的挑战-应答（challenge-response，§10.4）：

```
→ 27 01           "给我一把钥匙胚（seed）"
← 67 01 4A 7B 22 91 <seed>      "拿去"
   （诊断仪用车厂保密算法算出 key）
→ 27 02 33 8C AA 10 <key>       "这是配好的钥匙"
← 67 02                        "咔哒，开了"
```

精髓在于：**密钥算法（Seed→Key 的换算）永远不经过总线**。ECU 只发随机 seed、只验 key，算法本身握在车厂手里，烧进 ECU 和发配给诊断仪厂商。抓遍总线上所有报文，也凑不出算法。

![一次完整解锁的抓包](img/01-seedkey-trace.jpg)

## 子功能的配对密码：奇数要，偶数给

0x27 的子功能成对出现（Table 40/41）：

- **requestSeed 恒为奇数**：0x01、0x03、0x05……0x7D
- **sendKey = requestSeed + 1**：0x02、0x04、0x06……0x7E

每对（如 0x01/0x02）对应一个**安全等级**。等级不是"从低到高爬楼梯"，而是不同柜子的不同锁——比如等级 1 开"写标定数据"的柜子，等级 3 开"刷写"的柜子。

## 冷知识：全零 seed 的暗号

一个写工具时常用的技巧（§10.4.1）：

- **锁定状态**：请求 seed，返回随机非零值
- **已解锁状态**：再请求 seed，返回**全零**

所以 `27 01` 本身就是一把"探测锁"——收到全零 seed，说明这级已经解锁，直接干活；收到非零，老老实实算 key。标准还特意注明：锁定状态下 seed **永不为零**，避免歧义。

## ECU 的防御机制：三道闸

对抗暴力试 key，规范给了三件武器（§10.4.1 + Table A.1）：

| 防线 | 触发 | NRC |
|---|---|---|
| 尝试计数 | 错 key 计一次，超限锁定 | 0x36 exceedNumberOfAttempts |
| 延时定时器 | 锁定后必须等冷却期（常见 10s 级） | 0x37 requiredTimeDelayNotExpired |
| 顺序校验 | 没要 seed 直接发 key | 0x24 requestSequenceError |

三条组合：试错 3 次锁 10 秒，一秒试一个 key 的暴力破解在车规场景里基本无解。（0x27 服务自己的 NRC 检查也讲先来后到：已解锁后再发 27 01 之类顺序不对，先回 0x24，再轮到延时/计数的码——① 篇那张流水线。）

还有一条隐蔽规则：**同一时刻只有一个等级生效**，且低等级解锁会撤销高等级已解锁的功能（§10.4.1）——防止"降级攻击"后残留权限。

## 报文逐字节

```
27 01                      请求 seed（等级 1）
67 01 <seed 4字节>          正应答 0x67 = 0x27+0x40
27 02 <key 4字节>           发送 key
67 02                      解锁成功
7F 27 36                   "次数超限"
```

典型的完整解锁序列（§10.4.1 给出的前置链）：

```
10 03 → 27 01 → <算key> → 27 02 → 2E F1 90 …
```

会话 → 解锁 → 操作，三步曲。

## 落到 AUTOSAR：DCM 怎么配安全等级

安全等级配在 `DcmDspSecurity/DcmDspSecurityRow`（TechnicalReference_Dcm §5.4）。看真实工程里的一行（ETAS `J6B_Dcm_EcucValues.arxml`，等级 L1）：

```
DcmDspSecurityRow "Unlocked_L1"
├── DcmDspSecurityLevel                = 1
├── DcmDspSecuritySeedSize / KeySize   = 4 / 4 字节
├── DcmDspSecurityNumAttDelay          = 2        ← 错 2 次进入延时
├── DcmDspSecurityDelayTime            = 10.0 s   ← 冷却期
├── DcmDspSecurityDelayTimeOnBoot      = 10.0 s   ← 上电即锁 10s（防断电绕过）
├── DcmDspSecurityAttemptCounterEnabled = true
├── DcmDspSecurityGetSeedFnc           = AppSecurityGetSeed
└── DcmDspSecurityCompareKeyFnc        = AppSecurityCompareKey
```

三个细节值得停下来看：

- **DelayTimeOnBoot 是防"拔插头"的**：错误次数被清零？没关系，断电重启后照样锁 10 秒——计数器可以清，时间躲不掉。这份工程里同一 ECU 的 boot 侧还配了另一个等级（`BootSecurityGetSeed`），App 和 Boot 各一把锁，互不通用。
- **ECU 侧根本没有"算法 DLL"**：`AppSecurityGetSeed`/`AppSecurityCompareKey` 就是两个 C 回调函数，算法实现编译在应用代码里，DaVinci 只负责在配置里挂上函数名。传说中的 Seed&Key DLL 是**诊断仪侧**的东西——车厂把同一个算法编成 DLL 发给工具商，供其本地算 key。
- **参数怎么组合有讲究**：TR 的 FAQ 明确列了哪些防爆破参数允许同时启用。这份配置用了"错误计数 + 延时"组合；另一个等级（level 49，seed/key 各 16 字节）则干脆关掉了计数器，只留长 key + 延时——安全策略是每个等级独立定的。

![真实工程的安全等级配置](img/02-security-config.jpg)

## 从 Seed&Key 到证书：0x29 的故事

2020 版标准新增了 0x29 Authentication（§10.6）——基于证书的挑战应答。Seed&Key 的问题在于：算法一旦泄露（车企供应商之间流转多年），全线失守，且无法远程吊销。证书体系可以。目前量产里 0x27 仍是主流，0x29 是电动智能时代的备胎转正之路。

## 收尾与预告

钥匙到手，柜门打开。下一篇把柜子里的东西摆出来看：**DID，ECU 数据的门牌号**——0x22 读与 0x2E 写。

## 参考资料

- ISO 14229-1:2020 §10.4 SecurityAccess（Tables 33~45）、Annex I 安全访问状态机
- ISO 14229-1:2020 §10.5 Authentication（2020 版新增）
- AUTOSAR_SWS_DiagnosticCommunicationManager（安全等级校验在 DSD，§7.4.4）

==================================================================
== 【AUTOSAR 入门 ④：DID，ECU 数据的门牌号——0x22 读数据与 0x2E 写数据】  （草稿目录：DID数据读写）
------------------------------------------------------------------
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

==================================================================
== 【AUTOSAR 入门 ⑤：让 ECU 按指令干活——0x31 例程控制与 RID 工单】  （草稿目录：0x31例程控制）
------------------------------------------------------------------
## 开场：读数据不够用了

前四篇你已经能"看"了：换会话、拿钥匙、按门牌号读写数据。但车间里真实的活儿是这样的：

- "让风扇转起来，我听听轴承响不响"
- "把 Flash 擦了，我要刷新固件"
- "跑一遍线束自检，技师去晃插头"

这些是**动作**，不是数据——DID 装不下"执行一段程序并等结果"这个语义。UDS 给动作另开了一套编号：**RID**（Routine Identifier），操作它的服务是 0x31 RoutineControl。

如果说 DID 是门牌号，RID 就是**工单号**：派活、撤活、要结果。

![RID 工单：三个动词](img/cover.jpg)

## 三段式：start / stop / requestResults

0x31 的子功能只有三个动词（§14.2.1.1，Table 425）：

| 子功能 | 动词 | 语义 |
|---|---|---|
| 0x01 | startRoutine | 派活 |
| 0x02 | stopRoutine | 撤活 |
| 0x03 | requestRoutineResults | 要结果 |

报文骨架：

```
→ 31 <子功能> <RID 高> <RID 低> [参数…]
← 71 <子功能回显> <RID 回显> [结果…]
```

RID 和 DID 一样是 2 字节，但语义完全不同：DID 指向"一条数据"，RID 指向"一段可执行的程序"。

## 标准原文的例子：晃线束测试

ISO 14229-1 §14.2.5.1 给了一个特别接地气的官方例程——**wiggle test**（晃动测试）：技师晃动线束插头，ECU 以最快速度连续监测所有输入输出信号的通断，把间歇性接触不良抓出来。这个例程的 RID 是 **0x0201**，条件是点火 ON、发动机 OFF、车速 0。

完整报文（Tables 431/432 原文）：

```
→ 31 01 02 01           "启动 RID 0201：开始晃线测试"
← 71 01 02 01 32        "已启动（0x32 是厂商自定义的状态字）"
   … 技师疯狂晃插头，ECU 默默记录 …
→ 31 02 02 01           "停止"
← 71 02 02 01           "停了"
→ 31 03 02 01           "结果呢？"
← 71 03 02 01 <结果>    "哪根线在闪断，看这里"
```

注意三个子功能的正应答 SID 都是 0x71——子功能区分动作，SID+0x40 的规则不变。

![wiggle test 报文格式](img/01-routine-format.jpg)

![wiggle test 完整抓包](img/02-wiggle-trace.jpg)

## 方法 A 与方法 B：谁来停例程

标准留了一个有意思的自由度（§14.2.1，Table 424）：例程的停止责任归谁？

- **方法 A**：客户端负责——启动了就必须显式 stop，ECU 不自作主张
- **方法 B**：服务器负责——例程按编程自动结束（比如自检跑完自己停）

选哪种是车厂和供应商的事，标准只要求想清楚。这类"标准不锁死、留实现自由"的设计，在 UDS 里俯拾皆是——这也是为什么不同车厂的诊断行为总有微妙差异。

## 典型工单清单

量产项目里常见的 RID（号码多为厂商自定义）：

- **Flash 擦除/校验**——OTA 刷写的前置工单（⑦篇主角）
- **自检序列**——继电器、风扇、指示灯逐个动作
- **自适应值学习**——怠速学习、节气门复位
- **快照预存触发**——配合 ⑥ 篇的 DEM

前提条件同 ②③ 篇：不少例程要求先切对会话、先解锁（§14.2.1.2 原文明确说了）。NRC 老三样也适用：没 start 就 stop → 0x24 顺序错误；例程访问 Flash 失败 → **0x72 generalProgrammingFailure**（这个码 ⑦ 篇还会见面）。0x31 自己也有一张 NRC 流程图（标准 §14.2），检查顺序同 ① 篇那条流水线——格式、会话、安全一路排下来，谁先挡住回谁。

和 0x2F IO 控制的边界：0x2F 是"瞬时操纵一个执行器"，0x31 是"执行一段有始有终的程序"。拧一下灯（2F）和跑一遍全车灯光自检（31），粒度不同。

## 落到 AUTOSAR：DCM 只管派单，活儿在 SWC

DaVinci 里的配置出奇地薄（TechnicalReference_Dcm §5.23.4）：

```
/Dcm/DcmConfigSet/DcmDsp/DcmDspRoutine
├── DcmDspRoutineIdentifier   2 字节 RID
├── DcmDspRoutineUsePort      true → 走 RTE 端口
└── DcmDspStartRoutine / Stop / RequestResult  ← 支持哪些动词，按 RID 配
```

协议处理全由 DCM 代劳，但**例程本体是应用的事**：通过 RTE 的 `RoutineServices_<RoutineName>` 端口回调到 SWC。标准 0x31 的"start 之后必须先 stop 才能要结果"这类顺序校验，DCM 也不强制——SWC 自己实现状态机，顺序不对就回 NRC 0x24。还有一条工程细节：**切换会话时 DCM 不会自动停掉运行中的例程**，SWC 得自己监听模式切换去收尾。

看真实工程（ETAS `J6B_Dcm_EcucValues.arxml`）配的四个例程：

| RID | 十六进制 | 用途（从命名与配置推断） |
|---|---|---|
| 515 / 518 | 0x0203 / 0x0206 | 应用侧例程 |
| 44030 / 44031 | **0xABFE / 0xABFF** | Boot 侧：Flash 校验/擦除——⑦ 篇的伏笔就在这 |

0xABFF 正是刷写流程里"擦除 Flash"的那张工单。

## 收尾与预告

会话（②）、钥匙（③）、数据（④）、动作（⑤）——手上凑齐了刷写前的全部前置能力。但动作可能出错，出错谁来记？下一篇先讲**故障码**：DTC 三字节编码、八位状态字节，0x19 读码与 0x14 清码。

## 参考资料

- ISO 14229-1:2020 §14.2 RoutineControl（Tables 424~438）、wiggle test 示例 §14.2.5.1（RID 0201）
- Vector TechnicalReference_Dcm v9.5 §5.23 RoutineControl 配置
- ETAS RTA-CAR 实例工程 J6B_Dcm_EcucValues.arxml（DcmDspRoutine 配置）

==================================================================
== 【AUTOSAR 入门 ⑥：八盏故障灯的秘密——0x14 清码与 0x19 读 DTC】  （草稿目录：DTC故障码）
------------------------------------------------------------------
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
- `0x2F` = 0010 1111 → bits 0~3 + bit5："实锤 + 正在发生 + 本周期失败过 + 待定 + 清码后又犯"

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

三个 FF 是 groupOfDTC = 全部（§12.2.1）。也可以只填某一个具体 DTC 的 3 字节——"只清它"。清掉的内容标准列了清单：状态字节、快照、扩展数据、首次/最近发生时间等计数器——但故障的"因"不在其中（Annex D.1）。

**关键认知**：清码清掉的是**状态字节和历史记录**，故障本身（硬件坏了、信号丢了）还在。清完码故障灯灭了，下个运行周期测试再失败，DTC 立刻回来——"清码治标"的协议层解释。

![读码 → 清码 → 复发全程](img/02-dem-pipeline.jpg)

还有清不掉的：**永久 DTC**（0x15）——法规要求必须故障真正修复、连续 N 个周期通过测试才自动消除，防止刷检蒙混年检。

## 0x85：先别记了——暂停 DTC 记录

0x14 清的是存量，0x85 ControlDTCSetting 管的是增量（§10.8.1）：让 ECU **停止/恢复 DTC 状态位的更新**。

```
→ 85 02     "DTC 记录，off"
← C5 02
   … 干活（典型：刷写）…
→ 85 01     "恢复记录"
← C5 01
```

动机很实际：刷写时电压波动、总线静音、应用停跑，监控器会"看什么都像故障"——不先关记录，刷完一读全是假码。所以真实刷写剧本里，`85 02` 和 ⑦ 篇的 `28 03`（静音总线）总是成对出现在传输开始前。注意它停的只是**状态位更新**，监控本身还在跑，`85 01` 一到立刻恢复。顺带一提：0x85 的 NRC 检查极简，只有 0x12/0x13 两关（Table 132）——不带安全等级，这是它和 0x2E/0x31 那些重锁服务的差别（顺序规则见 ① 篇）。

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

至于故障诊断的另一半——DEM 的事件存储管理、老化自愈，以及故障发生后自动降级功能的 **FiM**（Function Inhibition Manager，水温传感器坏了就限扭的那只手）——它们在 AUTOSAR 里是和 DCM 并列的独立模块，值得另一个专题，本系列先埋个伏笔。

## 参考资料

- ISO 14229-1:2020 §12.3 ReadDTCInformation（Tables 295~346）、§12.2 ClearDiagnosticInformation
- DTC 状态位：Table 342，状态位行为：Annex D.2
- 报文示例：§12.3.5.3, Tables 345/346
- AUTOSAR_SWS_DiagnosticEventManager（DEM）

==================================================================
== 【AUTOSAR 入门 ⑦：一次 OTA 刷写，在总线上发生了什么——0x34~0x38 传输五件套】  （草稿目录：OTA刷写）
------------------------------------------------------------------
## 开场：4S 店那 20 分钟

刷 ECU 的进度条走了 20 分钟。这 20 分钟里，总线上没有黑魔法，只有一套谈判严密的报文剧本——本系列前六篇攒下的所有能力，在这一刻全部登场。

主角是传输五件套（§15）：

![一次刷写的时间线](img/cover.jpg)

| 服务 | 名字 | 角色 |
|---|---|---|
| **0x34** | RequestDownload | 谈判：往哪写、写多大、每块多大 |
| **0x36** | TransferData | 搬运：数据一块一块过总线 |
| **0x37** | RequestTransferExit | 签收：运输结束 |
| 0x35 | RequestUpload | 反向：从 ECU 读出（标定数据导出） |
| 0x38 | RequestFileTransfer | 文件版：按文件名传输（非内存寻址） |

## 0x34：三件事的谈判

请求（§15.2.2，Table 440）：

```
→ 34 <DFI> <ALFID> <memoryAddress…> <memorySize…>
```

两个一字节参数各自半个字节一组用（Table 441）：

- **dataFormatIdentifier**：高半字节 = 压缩方法，低半字节 = 加密方法，`0x00` = 都不用（其余值厂商自定义）
- **addressAndLengthFormatIdentifier**：高半字节 = memorySize 占几字节，低半字节 = memoryAddress 占几字节——一个字节同时声明两个可变长字段的长度

memoryAddress 的高位字节还可以当**内存选择器**用（Table 441 原文）：双处理器 ECU 或内外 Flash 并存时，地址重叠，用最高位字节区分写到哪块器件。

正应答（Table 442/443）：

```
← 74 <lengthFormatIdentifier> <maxNumberOfBlockLength…>
```

**maxNumberOfBlockLength 是 ECU 报出的"每块最多收多少字节"**——注意它含 SID 和参数在内的整条报文长度。诊断仪据此切割数据，适配 ECU 的接收缓冲区。这是标准的流量协商：发送方的节奏由接收方定。

## 0x36：块计数器的容错设计

搬运阶段的每一块（Table 450）：

```
→ 36 <blockSequenceCounter> <transferRequestParameterRecord…>
← 76 <blockSequenceCounter 回显>
```

blockSequenceCounter 的规则（Table 451，原文值得细读）：

- 由 RequestDownload/Upload/FileTransfer 初始化为 **0x01**，每块 +1
- 到 0xFF 翻回 **0x00**（不是 01！）
- **收到重复的计数器 = 重传请求**：ECU 直接补发应答，不再写一遍 Flash——应答丢了但数据写成功了的重试场景
- 计数器没到预期的块 = 新数据，正常处理

一个字节的计数器，把"应答丢失"和"数据丢失"两种故障区分开了——这是整套刷写协议里最精巧的容错设计。

![0x34 与 0x36 报文格式](img/01-download-negotiate.jpg)

刷写途中 ECU 还会盯着电源：NRC 0x92/0x93（电压过高/过低）保护 Flash 写入——半途断电写坏 Bootloader 是最贵的事故。其他常客：0x71 transferDataSuspended（流程被打断后继续发 36）、0x72 generalProgrammingFailure（Flash 操作失败，⑤ 篇见过）、0x73 wrongBlockSequenceCounter（块序号错乱）。电压检查排在 0x36 流水线的很后面——收到 0x92 时说明谈判、会话、解锁全过了，纯粹是电源的锅（顺序规则见 ① 篇）。还有一个高频角色：**NRC 0x78 responsePending**——擦 Flash、算校验这种耗时步骤，ECU 会先回一句 `7F 36 78`"稍等"续命。① 篇的 P2/P2\* 就是为这一刻设计的：说完"稍等"，接话时限就从 50ms 档切换到秒级的 P2\* 档——刷写会话里 P2\* 往往放宽到 5 秒以上，因为擦除就是慢。

## 0x37 与 0x38

`→ 37 <transferResponseParameterRecord>` → `← 77`（§15.5）——签收仪式，通常带上厂商自定义的校验信息。0x38 RequestFileTransfer（§15.6）把 memoryAddress 换成文件名路径，其余机制同 0x34——给车机这类有文件系统的 ECU 用的。

## 配角三件套：刷写前的预备动作

五件套开演前，还有一串配角服务把舞台收拾干净：

- **0x28 CommunicationControl**：静音总线（§10.5）。controlType 四档收发组合（Table 54），`28 03 <通信类型>` = 收发全停；通信类型是位编码、可组合（如同时关应用报文和网络管理报文，Annex B.1）。目的：给传输腾带宽，也防止半死不活的应用报文干扰刷写
- **0x85 ControlDTCSetting**：关掉 DTC 记录（⑥ 篇已拆——`85 02`/`85 01`），防止刷写中的电压波动写成假故障码
- **0x87 LinkControl**：切换波特率——500K 的诊断段刷 2MB 太慢，刷写前常用它协商提速（Table 22）
- **0x3E TesterPresent**：② 篇的老朋友，编程会话里照常保活
- **0x11 ECUReset**：落幕动作——`11 01` hardReset 让新固件真正跑起来；rapidPowerShutdown 变体还带 powerDownTime 参数（§10.3, Table 34）

配角们在 0x34 之前集体亮相，构成刷写的"预备节拍"。

## 完整剧本：一次刷写的报文级回放

把七篇文章串成一条时间线：

![完整刷写剧本抓包](img/02-flash-trace.jpg)

```
→ 7E0: 10 02                    进编程会话          （②）
← 7E8: 50 02 …
→ 7E0: 27 01 / 27 02 <key>      解锁（boot 侧等级） （③）
→ 7E0: 31 01 0A FF              派工单：擦 Flash    （⑤）
← 7E8: 71 01 0A FF
→ 7DF: 28 03 <通信类型>          静音总线            （本篇配角）
→ 7DF: 85 02                    暂停 DTC 记录       （⑥）
→ 7E0: 34 00 44 <addr> <size>   谈判：往哪写多大    （本篇）
← 7E8: 74 0F <maxBlockLen>
→ 7E0: 36 01 <data…>            第 1 块
→ 7E0: 36 02 <data…>            第 2 块 …（成百上千块）
→ 7E0: 37 <校验>                签收
→ 7E0: 31 01 0A FE              派工单：校验 Flash  （⑤）
→ 7E0: 11 01                    ECU 复位生效        （①提过 0x11）
← 7E8: 51 01
→ 7E0: 10 01                    回默认会话          （②）
```

擦除 RID 0xABFF / 校验 RID 0xABFE 不是标准号，是 ⑤ 篇那份真实工程（ETAS J6B）里的实际配置——**0x34~0x38 只管搬运，擦和校验是 0x31 例程的活**，两套服务在刷写流程里咬合在一起。

## 落到 AUTOSAR：这些服务不住在 DCM 里

翻遍 Vector DCM 的技术参考，你会发现一个事实：**0x34~0x38 不在应用侧 DCM 的服务清单里**。原因回看 ② 篇那句话——programmingSession 通常跑在 **Bootloader** 里。刷写时 App 要先复位进 Boot，传输五件套由 Boot 里的精简诊断栈实现；Flash 驱动、看门狗喂狗、电源监控也在 Boot 侧配合。AUTOSAR 的 FBL（Flash Bootloader）是独立于 Classic Platform 标准栈的一套实现生态。

这也是工程现实和协议理想的错位之处：ISO 14229 把五件套定义得整整齐齐，AUTOSAR 标准栈却基本不管刷写——各家 FBL 供应商（Vector、EB、ETAS 各有方案）在这一层各显神通。OTA 的更上层——差分包、回滚、双分区——则在 AUTOSAR 之外，属于每个 OEM 自己的软件资产管理。

CAN 上的限制也值得知道：经典 CAN + ISO-TP 的有效带宽有限，刷一个 2MB 的固件要十几分钟，这就是 4S 店那 20 分钟的物理来源；换以太网 + DoIP（UDP 13400），同样是 0x36 报文，几分钟跑完——UDS 服务层不变，传输层换代，这是协议分层的红利。

## 系列收尾：知识地图

七篇回望，一张图收拢：

- **①** 26 个服务全景：SID+0x40、NRC、功能/物理寻址——语法
- **②** 0x10 会话：进哪个房间——状态
- **③** 0x27 安全：开哪个柜子——权限
- **④** 0x22/0x2E DID：门牌号——数据
- **⑤** 0x31 RID：工单号——动作
- **⑥** 0x14/0x19 DTC：八盏灯——故障
- **⑦** 0x34~0x38：搬运——交付

从读一句 `22 F1 90` 到看懂整场刷写，这套协议的每个设计都值得多看一眼。下次诊断仪连上车，你听到的不该是蜂鸣，而是报文在唱歌。

## 参考资料

- ISO 14229-1:2020 §15.2 RequestDownload（Tables 440~444）、§15.4 TransferData（Tables 450~454，blockSequenceCounter 语义与重传设计）、§15.5 RequestTransferExit、§15.6 RequestFileTransfer
- ISO 15765-2:2016（CAN 传输层多帧机制，④ 篇已拆）
- ETAS RTA-CAR 实例工程 J6B_Dcm_EcucValues.arxml（擦除/校验例程 RID 0xABFF/0xABFE）

