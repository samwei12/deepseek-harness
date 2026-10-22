---
kind: upgrade-guide
description: "Desktop 开发命令现在使用 ~/.dsh，除非通过 DSH_HOME 选择其他目录。"
---
# Desktop 开发使用日常 Harness home

[English](guide.md) | 中文

## 变更

`dev:desktop` 与 `start:desktop` 默认使用 `~/.dsh`，不再使用 `apps/desktop/.desktop-build/development/home`。开发模式与日常 Harness 使用共享现有会话、设置和凭据。仍支持显式 `DSH_HOME` 覆盖；旧开发数据不会移动或删除。

## 迁移

1. 如需使用 `~/.dsh`，运行开发命令时不设置 `DSH_HOME`。
2. 如需保留原来的隔离数据，在仓库根目录运行命令时设置 `DSH_HOME="$PWD/apps/desktop/.desktop-build/development/home"`。
3. 开始对话前，检查输出的 `desktop development: DSH_HOME=` 路径及预期历史。
