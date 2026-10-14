# Fork changelog

Releases of [rubimpassos/oh-my-openagent](https://github.com/rubimpassos/oh-my-openagent), the OpenCode 2 line of Oh-My-OpenAgent. Each release is built from `main` (upstream plus this fork's OpenCode 2 work) and tagged `v<upstream version>-fork.<n>`; the `releases` branch always points at the latest one. Install it in `opencode.json`:

```json
{ "plugins": ["oh-my-opencode@git+https://github.com/rubimpassos/oh-my-openagent.git#releases"] }
```

`#releases` follows new releases: OpenCode flags the plugin as outdated when the branch moves, and Update in OpenChamber's Settings → Plugins installs it. Use a tag (`#v5.0.1-fork.1`) to stay on one version or to roll back. Either way the plugin arrives built, so OpenCode loads it without building anything. Upstream's own changes are in [CHANGELOG.md](CHANGELOG.md).

To release: add a `## [<version>] - YYYY-MM-DD` section here on `main` (with the `Fork-Patch: v2-support` trailer), then run the **Fork release** workflow with that version.

## [5.0.1-fork.3] - 2026-10-14

### Fixes

- The sidebar no longer keeps a CPU core busy in sessions with image attachments. It read each active session's whole history every two seconds just to show the agent's name, and OpenCode revalidates every stored image on each read. It now reads the session's current agent instead.

## [5.0.1-fork.2] - 2026-10-13

### Fixes

- Pause and Resume on an OMO goal in OpenChamber now take effect. Pause no longer flips back to active or lets the next continuation through, and Resume continues an idle session right away instead of waiting for an event that never came.

## [5.0.1-fork.1] - 2026-10-11

**The first release of the OpenCode 2 line.** Until now the fork ran from a checkout built on the machine. It now ships as built releases that OpenCode installs and updates from the repository.

### New

- Runs on OpenCode 2: delegation, background tasks, team mode and every OMO tool work, and the tools are offered to the model directly instead of through Code Mode.
- Publishes its state for clients such as OpenChamber in `.omo/v2-state`: todos, background tasks with every retry attempt, team runs with unread messages, Atlas plans, goals, model health and the config files it loads.
- Cancel and retry background tasks from a client: a retry runs on a model of the category that is not failing.
- `/goal` tracks tokens and time, waits for its background tasks, and stops at a token budget or a turn cap. In OpenChamber it shows and is controlled with OpenChamber's own goal UI.
- Native notifications in OpenChamber when a background task fails, a chat's tasks all finish, a plan completes or a goal settles.
- `browser_automation_engine.provider: "external"` leaves browsing to another plugin, such as OpenChamber's browser.
- `OMO_CONFIG_DIR` points OMO at its own config folder.

### Fixes

- Tool results reach the model as text, not as a JSON dump of their parts, and tool metadata no longer breaks recording a background launch.
- Projected tools carry their real parameter schema, so `task` runs in the background when asked.
- `todowrite` returns the saved list, like it did on OpenCode 1.
- A goal is no longer replaced by the next ordinary message, and its loop keeps going after short turns.
