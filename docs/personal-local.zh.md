---
description: "本 fork 的个人 DSH 启动入口、目录职责、模型配置与维护导航。"
---
# 个人 DSH：本机使用与维护

[English](personal-local.md) | 中文

## 概要

本仓库是个人 DSH 的统一工作入口。本文说明现有本机安装的使用与维护，不是可移植安装器；私有配置、凭据、会话和运行数据继续留在源码仓外。

项目目标与取舍由 `~/Develop/PKM/00-Projects/本地个人 Agent.md` 维护，讨论路线或下一步前先经 Obsidian 读取最新内容。目标同时包含个人版 Codex 的工作入口、Pi 式自定义和 OpenClaw / dots 式主动助理；主动助理需要根据邮件、GitHub 和对话上下文给出有价值的建议，手机承担提醒与续聊入口。本机桌面与模型接入只是其中的基础。

当前方案已确定家里 Mac mini 作为常驻助理 Host，DSH 增加连接 mini 的个人助理入口，普通会话留在各自电脑，远程通道使用 frpc。助理使用 mini 端现有模型配置，不预设模型必须在 mini 上本机推理。手机具体形态、推送通道等取舍继续以项目主文档为准；落地由用户自行推进，方案与文档维护不授权部署、修改 frpc 或开发客户端。

## 目录

- [启动与切换模型](#start-and-switch-models)
- [目录与职责](#directories-and-ownership)
- [按改动选择位置](#choose-the-change-location)
- [维护与升级](#maintain-and-upgrade)
- [证据与限制](#evidence-and-limits)

<a id="start-and-switch-models"></a>

## 启动与切换模型

日常使用 Electron 开发版，独立 App 打包暂缓。在终端执行以下命令启动已有构建；开发启动器默认使用现有数据目录 `~/.dsh`，无需设置环境变量：

```sh
cd ~/Develop/deepseek-harness
pnpm run start:desktop
```

调试窗口和端口沿用上游开发默认值；如需关闭自动调试窗口或避开 9222 端口占用，可按需设置 `DSH_DESKTOP_OPEN_DEVTOOLS=0` 或 `DSH_DESKTOP_RENDERER_DEBUG_PORT=19322`。启动器将随附运行库路径写入 `apps/desktop/.desktop-build/development/Harness Dev.app`。通过上述命令准备后，日常可从 Finder、Dock 或 Raycast 快捷键打开该应用，无需终端。`Cmd+W` 隐藏窗口并保持 Host 运行，`Cmd+Q` 退出；通过终端启动时，保持该终端打开。

在侧栏选择工作目录，再从输入框旁选择模型。分组为 `IDEA Lab · DS Flash`、`CloudCLI · Opus` 和 `Qoder · Magpie`。Qoder 需要本机 Magpie 图形应用保持运行。Agent 循环由 DSH 负责，`pi-ai` 模型适配器不会运行 Pi Agent 或加载 Pi 扩展。

终端连续对话使用 `dsh --profile pi-tui`，先进入工作目录再执行。这个原生 CLI profile 加载社区插件 `@xmoon76/dsh-pi-tui@0.5.3`。使用 `/model` 切换模型、`/sessions` 浏览历史、快速按两次 Ctrl+C 退出；`dsh --profile pi-tui --session <session-id>` 恢复会话。单独执行 `dsh` 保持上游 CLI 行为。

`~/.dsh/cordis.patch.yml` 保存权限、遥测设置和本地凭据 provider 配置。其原生 `!!js` 表达式通过 `~/.dsh/pi_model_routes.cjs` 从下文的唯一目录加载 IDEA Lab、CloudCLI 和 Qoder 路由。界面偏好和默认模型继续归各 profile；共享存储不代表两个 Host 可以同时执行同一会话。

<a id="directories-and-ownership"></a>

## 目录与职责

下表描述本机目录。克隆 fork 不包含私有运行配置。

| 位置 | 职责 |
| --- | --- |
| `~/Develop/deepseek-harness` | 源码仓：个人 `origin`、官方 `upstream`，以及构建产物。 |
| `~/.dsh` | 默认 Harness home，沿用上游配置与持久化格式。 |
| `~/.dsh/cordis.patch.yml` | 供所有 profile 使用的原生共享配置；三条路线的模型元数据均读取公共目录。 |
| `~/.dsh/profiles/{desktop,web,pi-tui}/` | 原生 profile 清单、已安装插件与界面偏好。 |
| `~/.dsh/profiles/shared-credentials/keychain.mjs` | 本地钥匙串凭据 provider；其他引用和记录沿用 DSH 原生凭据存储。 |
| `~/.dsh/sessions/`、`storages/`、`user-history/`、`logs/` | 原生会话、插件状态、输入历史与日志。 |
| `~/.local/bin/dsh` | 指向 fork 官方构建 CLI 的软链接，使用 PATH 中的 Node。 |
| `~/.agents/skills`、`~/Develop/ai-runtime` | 共享 Skill 与维护源；记忆接入归 `skills/memory-runtime`。 |
| `~/.dsh/AGENTS.md` | 共享全局规则的软链接；源码工作约定归仓库 `AGENTS.md`。 |
| `~/.local/share/dsh-personal` | 早期测试工作目录与证据，不再作为运行 home 或启动器；保留旧会话工作目录的有效性。 |
| `~/.local/share/dsh-backups` | 可恢复的迁移备份与本机验收记录。 |
| `~/Develop/PKM/00-Projects/本地个人 Agent.md` | 项目目标与决定；修改遵循 Obsidian PKM 流程。 |

桌面界面偏好与插件清单由 `~/Develop/config/Mac/.dsh` 维护，desktop profile 和 Electron 壳层设置目录通过软链接指向该目录；目录内 README 说明布局、插件版本与恢复步骤。整体界面缩放位于应用菜单。会话数据与凭据继续由现有目录维护。

<a id="choose-the-change-location"></a>

## 按改动选择位置

三条路线只维护 `~/.pi/agent/models.json` 中的 `idea`、`magpie-cloudcli`、`magpie-qoder` provider：两边共用其中的地址、模型、输入类型、容量和推理档位声明。DSH 加载 home 配置时读取该目录；修改后重启 DSH，Pi 打开 `/model` 重新读取。IDEA Lab 直接连接 IDEA；CloudCLI 和 Qoder 沿用各自的 Magpie 网关。凭据 provider 沿用各自 owner；目录读取器不运行 Pi，也不复制其凭据。已退役的 Pi Qoder `3100` 桥接不再使用。

启动异常先检查上游启动日志、实际 profile 及其插件配置。CloudCLI 和 Qoder 依赖现有模型网关；额度或网络失败不能单独证明迁移或配置有缺陷。

修改产品功能时，遵循[架构说明](architecture.zh.md)、所属包 README 和[开发指南](development.zh.md)。桌面代码在 `apps/desktop`，模型适配在 `packages/llm/llm-pi-ai`；行为扩展落到所属插件，不把个人接入逻辑塞入无关核心包。

处理记忆采集或显式召回时，使用既有 `memory-runtime` Skill 及共享源仓中的 `references/dsh-capture.md`。现有外部 worker 从 `~/.memories/capture/incremental.json` 读取已启用的 DSH 目录，当前为 `~/.dsh`；它不是 DSH 进程内插件，也不依赖 Pi 扩展。保留原生来源过滤和稳定身份去重；采集的对话原文不会自动成为已确认的长期事实。

<a id="maintain-and-upgrade"></a>

## 维护与升级

升级前检查工作区、实际版本及对应[升级指南](upgrade-guide/)，合入上游时保留个人入口文档。重新构建或安装前，阅读版本对应的[桌面说明](../apps/desktop/README.zh.md)与本机安装记录。

在此 checkout 的外部终端执行更新命令。它先检查工作区干净且目标可快进，再向现有 Host 发送 `SIGTERM` 请求收尾，等待 Host 和 Electron 壳退出，然后更新源码、安装锁定依赖、执行完整构建并启动官方桌面入口。执行命令即表示本次允许中断该实例中的任务。部署不依赖原生界面读取；交互检查作为命令行构建、版本和 Host 启动证据的补充。

```sh
cd ~/Develop/deepseek-harness
node scripts/update_personal_desktop.mjs
```

默认更新到当前分支配置的上游；若该上游已经是当前提交的祖先，则保留本地已有提交。`--ref <revision>` 指定一个已存在的精确版本；`--ref HEAD` 重建已提交的本地改动。仅在 Host 已退出、重新检查也未发现替代 Host 后，才向无响应的 Electron 壳发送 `SIGKILL`。工作区有改动、历史分叉、旧进程未退出或构建失败时，命令停止。它不会自动暂存、重置或推送。日志打印的起始提交仍保留在 Git 历史中，可用于恢复；构建失败时保留已停止的应用与源码现场，修复后再继续。最后的启动器运行期间保持终端打开。

开发应用依赖此 checkout 和生成产物。更新脚本复用已有 home、浏览器数据路径、调试端口和 DevTools 偏好，再调用 `start:desktop`；保留官方生成的启动器、模型、凭据、会话、已安装插件和 memory-runtime 采集配置，不跨机器复制配置。日常启动仍用 `start:desktop`。升级后验证官方 CLI、本地钥匙串插件、历史续聊及工具调用，并保留仓库专属 Git hook 设置。

私有运行文件保持原位，不纳入提交。迁移运行数据或破坏性重置前，先明确精确范围并留可恢复备份。克隆或更新源码本身不授权迁移会话、更改凭据或修改 Pi 配置。验证实际改动的行为，未变路径复用仍适用的证据。

<a id="evidence-and-limits"></a>

## 证据与限制

本机 `~/.dsh/README.md` 记录当前使用方式与带日期的验收入口。迁移备份和验收记录保留在 Git 之外；确认已测范围时读取记录，必要时再查现场。不把会话正文、凭据、服务地址或机器专属回执复制到公开 fork。

当前是源码构建的开发版应用，不是独立安装包；未配置自动启动。桌面和记忆接入验收不代表手机访问、真实系统休眠或整机重启恢复、完整定时助理能力已通过。
