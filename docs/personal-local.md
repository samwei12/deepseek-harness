---
description: "Local personal DSH entry points, directory ownership, model configuration, and maintenance references for this fork."
---
# Personal DSH: local use and maintenance

English | [中文](personal-local.zh.md)

## Summary

Use this repository as the working entry for the personal DSH setup. This reference covers the existing local installation, not a portable installer. Private configuration, credentials, sessions, and runtime data remain outside the checkout.

Project goals and decisions belong to `~/Develop/PKM/00-Projects/本地个人 Agent.md`; read its latest content through Obsidian before discussing direction or next steps. The goals combine a personal Codex-like work entry, Pi-like customization, and an OpenClaw/dots-like proactive assistant. The assistant should offer useful suggestions from email, GitHub, and conversation context; the phone provides notifications and continued conversation. Local desktop and model integration form only part of that foundation.

The current plan selects the home Mac mini as the persistent assistant Host, adds a DSH personal-assistant entry connected to it, keeps ordinary sessions on their respective computers, and uses frpc for remote access. The assistant uses the model configuration available on mini; this does not require on-device inference. Phone form, notification channel, and other decisions remain in the project document. The user owns implementation; maintaining plans and documentation does not authorize deployment, frpc changes, or client development.

## Table of Contents

- [Start and switch models](#start-and-switch-models)
- [Directories and ownership](#directories-and-ownership)
- [Choose the change location](#choose-the-change-location)
- [Maintain and upgrade](#maintain-and-upgrade)
- [Evidence and limits](#evidence-and-limits)

<a id="start-and-switch-models"></a>

## Start and switch models

Use the Electron development app for daily work; standalone App packaging is deferred. Run these commands in a terminal to launch the existing build; the development launcher defaults to the existing `~/.dsh` data without environment overrides:

```sh
cd ~/Develop/deepseek-harness
pnpm run start:desktop
```

Debugging retains upstream development defaults; optionally set `DSH_DESKTOP_OPEN_DEVTOOLS=0` to close automatic DevTools or `DSH_DESKTOP_RENDERER_DEBUG_PORT=19322` to avoid a port 9222 conflict. The launcher records its bundled-runtime location in `apps/desktop/.desktop-build/development/Harness Dev.app`. After preparing it with the command above, open that app from Finder, Dock, or a Raycast shortcut for daily use; these launches need no terminal. `Cmd+W` hides its window while the Host stays running; `Cmd+Q` exits. When launching from a terminal, keep that terminal open.

Choose a workspace in the sidebar, then select a model beside the message input. The groups are `IDEA Lab · DS Flash`, `CloudCLI · Opus`, and `Qoder · DS Flash`. Qoder requires the local Magpie GUI to remain running. DSH owns the agent loop; the `pi-ai` model adapter does not run Pi Agent or load Pi extensions.

For continuous terminal chat, enter the workspace and run `dsh --profile pi-tui`. This native CLI profile loads community plugin `@xmoon76/dsh-pi-tui@0.5.3`. Use `/model` to switch models, `/sessions` to browse history, two quick Ctrl+C presses to exit, and `dsh --profile pi-tui --session <session-id>` to resume. Bare `dsh` retains upstream CLI behavior.

`~/.dsh/cordis.patch.yml` holds the shared model catalog, permissions, telemetry settings, and local credential-provider configuration. DSH composes this native home layer after each profile; no launcher copies or translates configuration. Interface preferences and default models remain profile-owned. Shared storage does not authorize simultaneous execution of the same session in two Hosts.

<a id="directories-and-ownership"></a>

## Directories and ownership

Paths below describe this machine. A clone of the fork does not contain private runtime configuration.

| Location | Responsibility |
| --- | --- |
| `~/Develop/deepseek-harness` | Source checkout: personal `origin`, official `upstream`, and built application artifacts. |
| `~/.dsh` | Default Harness home, using upstream configuration and persistence formats. |
| `~/.dsh/cordis.patch.yml` | Native shared configuration for all profiles. |
| `~/.dsh/profiles/{desktop,web,pi-tui}/` | Native profile manifests, installed plugins, and interface preferences. |
| `~/.dsh/profiles/shared-credentials/keychain.mjs` | Local Keychain credential provider; other references and records retain DSH's native credential store. |
| `~/.dsh/sessions/`, `storages/`, `user-history/`, `logs/` | Native sessions, plugin state, input history, and logs. |
| `~/.local/bin/dsh` | Symlink to the fork's official built CLI; uses Node from PATH. |
| `~/.agents/skills`, `~/Develop/ai-runtime` | Shared Skills and maintained sources; memory integration belongs to `skills/memory-runtime`. |
| `~/.dsh/AGENTS.md` | Symlink to the shared global rules; repository `AGENTS.md` owns source-work instructions. |
| `~/.local/share/dsh-personal` | Earlier trial workspaces and evidence; no active Harness home or launcher. Existing session working directories remain valid. |
| `~/.local/share/dsh-backups` | Recoverable migration backups and local verification records. |
| `~/Develop/PKM/00-Projects/本地个人 Agent.md` | Project goals and decisions; edits follow the Obsidian PKM workflow. |

Desktop UI preferences and the plugin manifest are maintained in `~/Develop/config/Mac/.dsh`. The desktop profile and Electron shell settings directories link there; the directory’s README owns the layout, plugin versions, and recovery steps. Whole-window zoom is available from the application menu. Session data and credentials retain their existing owners.

<a id="choose-the-change-location"></a>

## Choose the change location

Edit shared model labels and parameters in the home patch, then verify the model menu. Route identifiers such as `pi-idea` are distinct from display labels. The Keychain plugin resolves configured credential references directly, with no Pi runtime dependency or key copy into configuration. Model metadata is owned by DSH configuration, not synchronized from Pi.

For startup problems, inspect upstream launch diagnostics, the active profile, and its configured plugins. CloudCLI and Qoder require their existing model gateways. A quota or network failure does not establish a migration or configuration defect.

For product changes, follow [architecture](architecture.md), the owning package README, and [development](development.md). Desktop code belongs to `apps/desktop`; model adaptation belongs to `packages/llm/llm-pi-ai`. Add behavior through the owning plugin rather than putting personal integration logic into unrelated core packages.

For memory capture or explicit recall, use the existing `memory-runtime` Skill and its `references/dsh-capture.md` under the shared source repository. The existing external worker reads enabled DSH homes from `~/.memories/capture/incremental.json`, currently `~/.dsh`; it is not an in-process DSH plugin and does not require a Pi extension. Preserve native source filtering and stable identity deduplication. Captured conversation text is not automatically a confirmed long-term fact.

<a id="maintain-and-upgrade"></a>

## Maintain and upgrade

Before upgrading, inspect the working tree, actual versions, and relevant [upgrade guides](upgrade-guide/). Preserve personal documentation when integrating upstream changes. Read the version-matched [desktop instructions](../apps/desktop/README.md) and the local installation record before rebuilding or reinstalling.

After updating source, quit the old instance with `Cmd+Q`, then run the following commands in a terminal. `dev:desktop` rebuilds and launches; use `start:desktop` for subsequent daily launches.

```sh
cd ~/Develop/deepseek-harness
pnpm install --frozen-lockfile
pnpm run dev:desktop
```

The development app depends on this checkout and generated artifacts. Keep its generated launcher unchanged and add no personal launch wrapper; this rebuild preserves models, credentials, sessions in `~/.dsh`, and the existing memory-runtime capture configuration. Validate the official CLI, local Keychain provider, historical-session resume, and tools after an upgrade; preserve the repository-specific Git hook setting.

Keep private runtime files in place and outside commits. Before a runtime migration or destructive reset, establish the exact scope and a recoverable backup. Cloning or updating source alone does not authorize migrating sessions, changing credentials, or modifying Pi configuration. Validate the changed behavior; reuse still-applicable evidence for untouched paths.

<a id="evidence-and-limits"></a>

## Evidence and limits

The machine-local `~/.dsh/README.md` records current usage and dated verification references. Migration backups and acceptance records remain outside Git. Consult them for tested behavior and check live state when needed. Do not copy session bodies, credentials, endpoints, or machine-specific receipts into the public fork.

The current setup is a source-built development app, not a standalone installer. It has no configured automatic startup; phone access, real system sleep/reboot recovery, and complete scheduled-assistant behavior are not established by the desktop and memory acceptance.
