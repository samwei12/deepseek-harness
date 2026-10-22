---
kind: upgrade-guide
description: "Desktop development commands now use ~/.dsh unless DSH_HOME selects another directory."
---
# Desktop development uses the ordinary Harness home

English | [中文](guide.zh.md)

## Change

`dev:desktop` and `start:desktop` default to `~/.dsh` instead of `apps/desktop/.desktop-build/development/home`. They share existing sessions, settings, and credentials with ordinary Harness use. Explicit `DSH_HOME` overrides remain supported; old development data is not moved or deleted.

## Migration

1. To use `~/.dsh`, run the development command without `DSH_HOME`.
2. To retain the old isolated data, set `DSH_HOME="$PWD/apps/desktop/.desktop-build/development/home"` when running the command from the repository root.
3. Check the printed `desktop development: DSH_HOME=` path and the expected history before starting a conversation.
