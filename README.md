# @deepseek-ai/dsh-turn-navigator

English | [中文](README.zh.md)

A compact turn navigator for long DSH Web conversations. It follows the conversation scroll, previews a user turn on hover, and jumps to that turn on click. It stays hidden until the conversation contains at least three user turns.

## Preview

![The compact turn navigator highlighting the fourth turn and showing its hover preview.](docs/assets/turn-navigator-hover.png)

It supports keyboard focus, light and dark themes, and reduced-motion preferences. When needed, it loads only enough older history to decide whether the navigator should appear without moving the reader's current position.

## Installation

The plugin is not published to npm. This public repository is the maintained
home (`xiagaogaozi/dsh-turn-navigator`); install it from the repo and restart
Web:

```sh
dsh plugin --profile web add "git+https://github.com/xiagaogaozi/dsh-turn-navigator.git"
dsh web
```

Or install a local checkout (development):

```sh
git clone https://github.com/xiagaogaozi/dsh-turn-navigator.git
dsh plugin --profile web add -w "/path/to/dsh-turn-navigator"
dsh web
```

The checked-in `lib/` output installs without rebuilding. The plugin uses the
standard session-header action seat that DSH Web already ships; it does not
need a custom Harness source patch. To remove the plugin:

```sh
dsh plugin --profile web remove -w @deepseek-ai/dsh-turn-navigator
```

## Host compatibility

The plugin registers a lifecycle bridge in the existing
`conversation.session.header.actions` session slot. It renders no header
button: after the host renders the active conversation, the bridge portals the
navigator into the start of that conversation's scroll container. The bridge
uses the host's own first paging button, so loading older history continues to
use ChatView's anchored paging behavior.

This deliberately depends only on public host DOM contracts:

- `[data-conversation-scroll]` containing `[data-chat-flow]` identifies the active transcript;
- `[data-chat-flow-kind="user"]` identifies user rows in DOM order;
- the first child of `[data-chat-flow]` contains the host's older-history paging button when one is available.

If a future DSH Web release changes those DOM contracts, the navigator may stop
appearing or lose jump/paging behavior, but Harness source does not need to be
modified to install or remove this plugin.

## Development and verification

The project `.npmrc` selects the private `@deepseek-ai/*` scope; pnpm 11 reads its `${NPM_TOKEN}` authentication mapping from the trusted user-level `~/.npmrc`. The SDK packages are pinned to the reviewed `0.0.1-rc.2` set. Set `NPM_TOKEN`, install without lifecycle scripts, then run the checks:

```sh
pnpm install --ignore-scripts
pnpm run check
```

Do not link a DSH source checkout into this directory. Use `pnpm run watch` beside `dsh web --dev` for live browser changes. See [`compat/`](compat/README.md) for the isolated assembled Web fixture.

## Model Experience

None. The plugin only renders existing conversation data in the browser.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

- Row matching follows the transcript DOM contract (`data-chat-flow-kind="user"` in DOM order) rather than a host key scheme; a host that stops emitting `data-chat-flow-kind` on user rows breaks jump/highlight.
- Only loaded history receives markers; earlier turns appear after older history is loaded.
- Previews show text only.

## Changelog (this fork)

- `2026-08` Fix jump/highlight against the public DSH transcript DOM: user rows are
  matched by DOM position (`[data-chat-flow-kind="user"]`) instead of the private
  `node:<seq>` anchor-key scheme, which never matched the host rows.
- `2026-08` Markers now project from the live chat slice (`snapshot.chat.order` /
  `chat.nodes`, the same source the Chat view renders) instead of the legacy
  top-level node projection, so marker order always equals transcript DOM order.
- `2026-08` Drop the synthetic wheel dispatch from `jumpTo` (the host owns wheel
  semantics); jump alignment uses the same flow-top math as the Chat view anchors.
- `2026-08` Replace the private `conversation.chat.navigator` dependency with a
  portal bridge rooted in the standard session-header action slot. The plugin
  now works without a Harness source patch.
