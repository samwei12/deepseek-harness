---
description: "Local personal DSH entry points, directory ownership, model configuration, and maintenance references for this fork."
---
# Personal DSH: local use and maintenance

English | [中文](personal-local.zh.md)

## Summary

Use this repository as the working entry for the personal DSH setup. This reference covers the existing local installation, not a portable installer. Private configuration, credentials, sessions, and runtime data remain outside the checkout.

## Table of Contents

- [Start and switch models](#start-and-switch-models)
- [Directories and ownership](#directories-and-ownership)
- [Choose the change location](#choose-the-change-location)
- [Maintain and upgrade](#maintain-and-upgrade)
- [Evidence and limits](#evidence-and-limits)

<a id="start-and-switch-models"></a>

## Start and switch models

The existing installation requires its built checkout, local Node/Pi paths, and configured model services. Open `~/Applications/Harness Dev.app` or run the installed command:

```sh
dsh-personal
```

Choose a workspace in the sidebar, then select a model beside the message input. The groups are `IDEA Lab · DS Flash` and `CloudCLI · Opus`; the existing default is Flash / Medium, and the Opus route uses High. These labels identify model routes. DSH owns the agent loop; its model adapter uses `pi-ai`, without running Pi Agent or loading Pi extensions.

`Cmd+W` hides the desktop window while its Host remains running; reopen the app to return. `Cmd+Q` exits the application. For the optional local Web entry, fully quit desktop first, then run:

```sh
node ~/.local/share/dsh-personal/start.mjs --open
```

The Web launcher listens on `127.0.0.1:3080`; keep its terminal running and use Ctrl+C to stop it. Desktop and Web profiles share session data. Concurrent Hosts have not been validated, so run one at a time. This loopback entry does not provide phone or remote access.

<a id="directories-and-ownership"></a>

## Directories and ownership

Paths below describe the existing machine. A clone of the fork alone does not reproduce this installation.

| Location | Responsibility |
| --- | --- |
| `~/Develop/deepseek-harness` | Source checkout: `origin` is the personal fork and `upstream` is the official repository. |
| `~/.local/share/dsh-personal` | Personal `DSH_HOME`; existing `~/.dsh` is a separate directory. |
| `$DSH_HOME/profiles/{desktop,web}/cordis.patch.yml` | Per-profile model and plugin configuration. |
| `$DSH_HOME/start.mjs`, `desktop-official-launcher.sh` | Local launch adaptation and references to existing credential resolution. |
| `$DSH_HOME/sessions/`, `storages/`, `runtime.log` | Native sessions, plugin state, and runtime log; not source files. |
| `$DSH_HOME/workspace/` | Existing trial workspace; not the DSH source root. |
| `~/Applications/Harness Dev.app`, `~/.local/bin/dsh-personal` | Desktop app symlink and command entry. The app points into `apps/desktop/.desktop-build/development/`. |
| `~/.agents/skills`, `~/Develop/ai-runtime` | Shared Skill discovery and its maintained sources; memory adaptation belongs to `skills/memory-runtime`. |
| `$DSH_HOME/AGENTS.md` | Symlink to the shared global rules in `~/Develop/ai-runtime/memory/.memories/AGENTS.md`. Repository `AGENTS.md` owns source-work instructions. |
| `~/Develop/PKM/00-Projects/本地个人 Agent.md` | Project goals and decisions; edits follow the Obsidian PKM workflow. |

<a id="choose-the-change-location"></a>

## Choose the change location

For a model label or parameter, edit the owning profile patch and verify the model menu. Check both desktop and Web when the change applies to both. Route identifiers such as `pi-idea` are separate from display labels; credentials remain references and must not be copied into documentation or Git. Changes to Pi model metadata do not automatically update DSH profile values.

For startup problems, inspect the local launcher and its dependencies. It resolves existing Pi credential references and injects them into the DSH process. The CloudCLI route also requires its existing bridge service and network connection. A quota or network error does not establish a DSH configuration defect.

For product changes, follow [architecture](architecture.md), the owning package README, and [development](development.md). Desktop code belongs to `apps/desktop`; model adaptation belongs to `packages/llm/llm-pi-ai`. Add behavior through the owning plugin rather than putting personal integration logic into unrelated core packages.

For memory capture or explicit recall, use the existing `memory-runtime` Skill and its `references/dsh-capture.md` under the shared source repository. The existing worker reads enabled DSH homes from `~/.memories/capture/incremental.json`; it does not require a Pi extension. Preserve native source filtering and stable identity deduplication. Captured conversation text is not automatically a confirmed long-term fact.

<a id="maintain-and-upgrade"></a>

## Maintain and upgrade

Before upgrading, inspect the working tree, actual versions, and relevant [upgrade guides](upgrade-guide/). Preserve personal documentation when integrating upstream changes. Read the version-matched [desktop instructions](../apps/desktop/README.md) and the local installation record before rebuilding or reinstalling.

The development app depends on this checkout and generated artifacts. Regenerating it can overwrite its local launch adaptation; verify credential injection, primary-runtime resolution, signing, and a normal app launch afterward. Node/Pi upgrades can invalidate paths recorded by the local launcher. Installation can also affect Git hooks; preserve the repository-specific hook setup described in the local record.

Keep private runtime files in place and outside commits. Before a runtime migration or destructive reset, establish the exact scope and a recoverable backup. Cloning or updating source alone does not authorize migrating sessions, changing credentials, or modifying Pi configuration. Validate the changed behavior; reuse still-applicable evidence for untouched paths.

<a id="evidence-and-limits"></a>

## Evidence and limits

The machine-local `~/.local/share/dsh-personal/README.md` retains installation details and dated acceptance evidence; screenshots and `memory-verification.json` remain beside it. Consult that record for what was tested, then check live state when a decision depends on it. Do not copy session bodies, credentials, endpoints, or machine-specific receipts into the public fork.

The current setup is a source-built development app, not a standalone installer. It has no configured automatic startup; phone access, real system sleep/reboot recovery, and complete scheduled-assistant behavior are not established by the desktop and memory acceptance.
