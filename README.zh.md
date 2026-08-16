# @deepseek-ai/dsh-turn-navigator

[English](README.md) | 中文

面向长 DSH Web 会话的紧凑轮次导航。它会跟随会话滚动，在鼠标悬停时预览用户轮次，并在点击后跳转到该轮次。会话至少包含 3 个用户轮次时才会显示。

## 效果预览

![紧凑的轮次导航高亮显示第 4 轮，并展示其悬停预览。](docs/assets/turn-navigator-hover.png)

它支持键盘聚焦、浅色与深色主题，以及减少动态效果偏好。需要时，它只加载足以判断是否应显示导航的更早历史，同时保持读者当前的位置不变。

## 安装

该插件未发布到 npm。本公开仓库为维护主场（`xiagaogaozi/dsh-turn-navigator`），从仓库安装后重启 Web：

```sh
dsh plugin --profile web add "git+https://github.com/xiagaogaozi/dsh-turn-navigator.git"
dsh web
```

或安装本地检出（开发模式）：

```sh
git clone https://github.com/xiagaogaozi/dsh-turn-navigator.git
dsh plugin --profile web add -w "/path/to/dsh-turn-navigator"
dsh web
```

已提交的 `lib/` 输出无需重新构建即可安装。插件使用 DSH Web 已有的标准会话页头 action 插槽，无需自改 Harness 源码。删除插件：

```sh
dsh plugin --profile web remove -w @deepseek-ai/dsh-turn-navigator
```

## 宿主兼容性

插件把生命周期桥接注册到已有的会话级
`conversation.session.header.actions` 插槽。它不会渲染页头按钮：宿主渲染当前会话后，桥接层会把导航条 Portal 到该会话滚动容器的开头。桥接层会点击宿主已有的第一个分页按钮，因此加载更早历史仍走 ChatView 原有的阅读锚点保持逻辑。

它只依赖以下公开的宿主 DOM 契约：

- 同时包含 `[data-chat-flow]` 的 `[data-conversation-scroll]` 是当前 transcript；
- `[data-chat-flow-kind="user"]` 按 DOM 顺序标记用户消息行；
- 存在更早历史时，`[data-chat-flow]` 的第一个子元素中包含宿主的历史分页按钮。

如果后续 DSH Web 版本改变这些 DOM 契约，导航条可能无法显示，或失去跳转/分页功能；但安装或移除本插件不再需要修改 Harness 源码。

## 开发与验证

项目 `.npmrc` 选择私有 `@deepseek-ai/*` scope；pnpm 11 使用 `${NPM_TOKEN}` 认证映射，该映射来自受信任的用户级 `~/.npmrc`。SDK 包固定为经过评审的 `0.0.1-rc.2` 版本组。请设置 `NPM_TOKEN`，安装时跳过 lifecycle scripts，然后运行检查：

```sh
pnpm install --ignore-scripts
pnpm run check
```

不要将 DSH 源码 checkout 链接到该目录。如需实时查看浏览器改动，请运行 `pnpm run watch`，同时运行 `dsh web --dev`。隔离组装的 Web fixture 见 [`compat/`](compat/README.md)。

## 模型体验

无。该插件只在浏览器中渲染现有会话数据。

#### KV Cache 影响

无。

## 已知限制与暂缓事项

- 行匹配遵循 transcript 的 DOM 契约（按 DOM 顺序取 `data-chat-flow-kind="user"` 行），而非宿主 key 方案；若宿主不再在用户行上输出 `data-chat-flow-kind`，跳转与高亮会失效。
- 只有已加载的历史记录才会生成标记；加载更早的历史后，更早的轮次才会显示。
- 预览仅显示文本。

## 变更记录（本 fork）

- `2026-08` 修复对公开 DSH transcript DOM 的跳转/高亮：用户行改为按 DOM 位置匹配（`[data-chat-flow-kind="user"]`），不再使用私有 `node:<seq>` anchor-key 方案（该方案与宿主行 key 完全不匹配）。
- `2026-08` 标记改从实时 chat 切片投影（`snapshot.chat.order` / `chat.nodes`，与 Chat 视图同源），不再使用顶层 legacy 节点投影，保证标记顺序恒等于 transcript DOM 顺序。
- `2026-08` 移除 `jumpTo` 中合成的 wheel 派发（滚动语义归宿主）；跳转对齐改用与 Chat 视图锚点相同的 flow-top 算法。
- `2026-08` 将对私有 `conversation.chat.navigator` 的依赖替换为基于标准会话页头 action 插槽的 Portal 桥接层；插件现在无需自改 Harness 源码即可工作。
