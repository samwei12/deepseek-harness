---
description: "本 fork 的个人 DSH 启动入口、目录职责、模型配置与维护导航。"
---
# 个人 DSH：本机使用与维护

[English](personal-local.md) | 中文

## 概要

本仓库是个人 DSH 的统一工作入口。本文说明现有本机安装的使用与维护，不是可移植安装器；私有配置、凭据、会话和运行数据继续留在源码仓外。

## 目录

- [启动与切换模型](#start-and-switch-models)
- [目录与职责](#directories-and-ownership)
- [按改动选择位置](#choose-the-change-location)
- [维护与升级](#maintain-and-upgrade)
- [证据与限制](#evidence-and-limits)

<a id="start-and-switch-models"></a>

## 启动与切换模型

现有安装依赖已构建的源码仓、本机 Node/Pi 路径及已配置的模型服务。打开 `~/Applications/Harness Dev.app`，或运行已安装的命令：

```sh
dsh-personal
```

在侧栏选择工作目录，再从输入框旁选择模型。分组为 `IDEA Lab · DS Flash` 和 `CloudCLI · Opus`；现有默认是 Flash / Medium，Opus 路由使用 High。这些名称表示模型入口。Agent 循环由 DSH 负责，模型适配器使用 `pi-ai`，不会因此运行 Pi Agent 或加载 Pi 扩展。

`Cmd+W` 隐藏桌面窗口并保留 Host，再次打开应用即可返回；`Cmd+Q` 完全退出。需要可选的本机 Web 入口时，先完全退出桌面，再运行：

```sh
node ~/.local/share/dsh-personal/start.mjs --open
```

Web 启动器监听 `127.0.0.1:3080`；保持终端运行，使用 Ctrl+C 停止。桌面和 Web profile 共享会话数据，并行 Host 未经验收，因此每次只运行一个。此 loopback 入口不提供手机或远程访问。

<a id="directories-and-ownership"></a>

## 目录与职责

下表描述现有机器的目录；只克隆 fork 不会自动复现这套安装。

| 位置 | 职责 |
| --- | --- |
| `~/Develop/deepseek-harness` | 源码仓：`origin` 为个人 fork，`upstream` 为官方仓库。 |
| `~/.local/share/dsh-personal` | 个人 `DSH_HOME`；既有 `~/.dsh` 是另一目录。 |
| `$DSH_HOME/profiles/{desktop,web}/cordis.patch.yml` | 各 profile 的模型与插件配置。 |
| `$DSH_HOME/start.mjs`、`desktop-official-launcher.sh` | 本地启动适配与既有凭据解析引用。 |
| `$DSH_HOME/sessions/`、`storages/`、`runtime.log` | 原生会话、插件状态和运行日志，均非源码。 |
| `$DSH_HOME/workspace/` | 现有试用工作目录，不是 DSH 源码根目录。 |
| `~/Applications/Harness Dev.app`、`~/.local/bin/dsh-personal` | 桌面应用软链接与命令入口；应用指向仓内 `apps/desktop/.desktop-build/development/`。 |
| `~/.agents/skills`、`~/Develop/ai-runtime` | 共享 Skill 发现与其维护源；记忆适配归 `skills/memory-runtime`。 |
| `$DSH_HOME/AGENTS.md` | 链接到 `~/Develop/ai-runtime/memory/.memories/AGENTS.md` 共享全局规则；源码工作约定归仓库 `AGENTS.md`。 |
| `~/Develop/PKM/00-Projects/本地个人 Agent.md` | 项目目标与决定；修改遵循 Obsidian PKM 流程。 |

<a id="choose-the-change-location"></a>

## 按改动选择位置

修改模型显示名或参数时，编辑对应 profile patch，再核对模型菜单；同时适用于桌面与 Web 时检查两处。`pi-idea` 等路由标识与显示名分开，凭据保持引用，不复制到文档或 Git。Pi 模型元数据变化不会自动更新 DSH profile 的值。

启动异常先检查本地启动器及其依赖。启动器解析既有 Pi 凭据引用，并注入 DSH 进程；CloudCLI 路由还依赖现有桥接服务及网络连接。额度或网络错误不能单独证明 DSH 配置有缺陷。

修改产品功能时，遵循[架构说明](architecture.zh.md)、所属包 README 和[开发指南](development.zh.md)。桌面代码在 `apps/desktop`，模型适配在 `packages/llm/llm-pi-ai`；行为扩展落到所属插件，不把个人接入逻辑塞入无关核心包。

处理记忆采集或显式召回时，使用既有 `memory-runtime` Skill 及共享源仓中的 `references/dsh-capture.md`。现有 worker 从 `~/.memories/capture/incremental.json` 读取已启用的 DSH 目录，不依赖 Pi 扩展。保留原生来源过滤和稳定身份去重；采集的对话原文不会自动成为已确认的长期事实。

<a id="maintain-and-upgrade"></a>

## 维护与升级

升级前检查工作区、实际版本及对应[升级指南](upgrade-guide/)，合入上游时保留个人入口文档。重新构建或安装前，阅读版本对应的[桌面说明](../apps/desktop/README.zh.md)与本机安装记录。

开发版应用依赖此 checkout 和生成产物；重新生成应用可能覆盖本地启动适配，之后需核对凭据注入、primary-runtime 路径、签名和正常应用启动。Node/Pi 升级也可能使启动器记录的路径失效。安装还可能影响 Git hooks，应保留本机记录中说明的仓库专属 hook 设置。

私有运行文件保持原位，不纳入提交。迁移运行数据或破坏性重置前，先明确精确范围并留可恢复备份。克隆或更新源码本身不授权迁移会话、更改凭据或修改 Pi 配置。验证实际改动的行为，未变路径复用仍适用的证据。

<a id="evidence-and-limits"></a>

## 证据与限制

本机 `~/.local/share/dsh-personal/README.md` 保留安装细节和带日期的验收证据，截图与 `memory-verification.json` 留在同目录。需要确认已测范围时读取该记录；决策依赖实时状态时再核对现场。不把会话正文、凭据、服务地址或机器专属回执复制到公开 fork。

当前是源码构建的开发版应用，不是独立安装包；未配置自动启动。桌面和记忆接入验收不代表手机访问、真实系统休眠或整机重启恢复、完整定时助理能力已通过。
