window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-turn-navigator",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom = require("react-dom");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"nav.aria": "会话轮次导航",
			"marker.aria": "跳转到第 {index} 轮：{preview}",
			"preview.title": "第 {index} 轮",
			"preview.empty": "（无内容）"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"nav.aria": "Conversation turn navigation",
			"marker.aria": "Jump to turn {index}: {preview}",
			"preview.title": "Turn {index}",
			"preview.empty": "(No content)"
		};
		//#endregion
		//#region \0dsh-css:TurnNavigator.module.css.mjs
		const css = ".xo85bq_host{z-index:6;pointer-events:none;width:0;height:0;position:sticky;top:12px;overflow:visible}.xo85bq_rail{width:40px;height:clamp(140px, calc(100dvh - var(--dsh-composer-height,152px) - 116px), 720px);pointer-events:auto;flex-direction:column;justify-content:center;gap:2px;padding:2px 0;display:flex;position:absolute;top:0;left:8px}.xo85bq_marker{z-index:0;width:40px;min-height:3px;max-height:12px;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border:0;flex:1 1 0;align-items:center;padding:0;display:flex;position:relative}.xo85bq_marker:hover,.xo85bq_marker:focus-visible{z-index:1;outline:none}.xo85bq_marker:focus-visible:after{border:1px solid var(--dsw-alias-state-business-primary);content:\"\";border-radius:5px;width:34px;height:18px;position:absolute;left:-3px}.xo85bq_tick{background:var(--dsw-alias-label-dimmed);transform-origin:0;width:10px;height:1px;transition:transform .18s var(--ds-ease-in-out), background-color .18s var(--ds-ease-in-out);border-radius:1px}.xo85bq_marker:hover .xo85bq_tick,.xo85bq_marker:focus-visible .xo85bq_tick{background:var(--dsw-alias-label-secondary);transform:scaleX(2.1)}.xo85bq_marker[aria-current=step] .xo85bq_tick{background:var(--dsw-alias-label-primary);height:2px;transform:scaleX(3.1)}.xo85bq_preview{pointer-events:none;width:min(384px,100vw - 96px);position:absolute;top:50%;left:42px;transform:translateY(-50%)}.xo85bq_preview[data-edge=first]{top:0;transform:none}.xo85bq_preview[data-edge=last]{top:auto;bottom:0;transform:none}.xo85bq_previewCard{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-3);box-shadow:var(--dsw-shadow-lv2);text-align:left;animation:xo85bq_turn-preview-in .18s var(--ds-ease-in-out) both;border-radius:14px;flex-direction:column;gap:6px;padding:12px 14px;display:flex}.xo85bq_previewCard strong{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:18px}.xo85bq_previewCard>span{overflow-wrap:anywhere;-webkit-line-clamp:3;-webkit-box-orient:vertical;font-size:13px;line-height:20px;display:-webkit-box;overflow:hidden}@keyframes xo85bq_turn-preview-in{0%{opacity:0;transform:translate(-8px)}}@media (prefers-reduced-motion:reduce){.xo85bq_tick{transition:none}.xo85bq_previewCard{animation:none}}";
		const tagId = "@deepseek-ai/dsh-turn-navigator/TurnNavigator.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-turn-navigator";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var _dsh_css_TurnNavigator_module_css_default = {
			"preview": "xo85bq_preview",
			"previewCard": "xo85bq_previewCard",
			"rail": "xo85bq_rail",
			"turn-preview-in": "xo85bq_turn-preview-in",
			"host": "xo85bq_host",
			"marker": "xo85bq_marker",
			"tick": "xo85bq_tick"
		};
		/** Find the active conversation's scroll owner without assuming host key formats. */
		function conversationScrollport() {
			for (const candidate of document.querySelectorAll("[data-conversation-scroll]")) if (candidate.querySelector("[data-chat-flow]") !== null) return candidate;
			return null;
		}
		/**
		* Put the portal mount before transcript flow so the navigator's sticky rail
		* is available throughout the entire scroll range, not only after the last
		* message. `display: contents` keeps this plugin-owned mount layout-neutral.
		*/
		function portalMountFor(scrollport, current) {
			if (current !== null && current.isConnected && current.parentElement === scrollport) return current;
			const mount = document.createElement("div");
			mount.dataset.turnNavigatorPortal = "";
			mount.style.display = "contents";
			scrollport.prepend(mount);
			return mount;
		}
		/** Click the host's own paging control so ChatView preserves the reading anchor. */
		function loadOlderFromHost(scrollport) {
			const button = scrollport.querySelector("[data-chat-flow]")?.firstElementChild?.querySelector("button[type=\"button\"]");
			if (button !== void 0 && button !== null && !button.disabled) button.click();
		}
		/**
		* Session-scoped compatibility bridge. The public header action seat gives
		* this plugin the normal session kit; its visual content is portaled into the
		* transcript scroll owner, which requires no private host slot.
		*/
		function TurnNavigatorPortals({ useSession, t }) {
			const mountRef = (0, react.useRef)(null);
			const [mount, setMount] = (0, react.useState)(null);
			(0, react.useLayoutEffect)(() => {
				let active = true;
				let queued = false;
				const refresh = () => {
					if (!active) return;
					const scrollport = conversationScrollport();
					const next = scrollport === null ? null : portalMountFor(scrollport, mountRef.current);
					if (mountRef.current !== null && mountRef.current !== next && mountRef.current.isConnected) mountRef.current.remove();
					mountRef.current = next;
					setMount((current) => current === next ? current : next);
				};
				const queueRefresh = () => {
					if (queued || !active) return;
					queued = true;
					queueMicrotask(() => {
						queued = false;
						refresh();
					});
				};
				refresh();
				const observer = new MutationObserver(queueRefresh);
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
				return () => {
					active = false;
					observer.disconnect();
					mountRef.current?.remove();
					mountRef.current = null;
				};
			}, []);
			if (mount === null) return null;
			return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TurnNavigator, {
				useSession,
				loadOlder: () => {
					const scrollport = mount.parentElement;
					if (scrollport instanceof HTMLElement) loadOlderFromHost(scrollport);
				},
				t
			}), mount);
		}
		/** Collapse the text blocks of one user message into a compact hover preview. */
		function messagePreview(content) {
			if (content === void 0) return "";
			return content.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join("\n").replace(/\s+/g, " ").trim();
		}
		/**
		* Find the Nth rendered user-message row in the transcript.
		*
		* The Chat view marks every business row with `data-chat-flow-kind` (the
		* node's renderer kind); user rows are exactly `[data-chat-flow-kind="user"]`
		* in DOM order, which matches the order of `chat.order` from which the
		* markers are projected. Matching by DOM position — instead of by a key
		* scheme owned by the host — keeps this plugin decoupled from
		* host-internal key formats.
		*/
		function userRowByIndex(scrollport, index) {
			let seen = 0;
			for (const row of scrollport.querySelectorAll("[data-chat-flow-kind=\"user\"]")) {
				if (seen === index) return row;
				seen += 1;
			}
			return null;
		}
		/**
		* Resolve the turn crossing the reading line. The bottom position always
		* selects the newest turn, including a transcript shorter than its viewport.
		*/
		function activeTurnSeq(scrollport, turns) {
			const earliest = turns.at(0);
			const latest = turns.at(-1);
			if (earliest === void 0 || latest === void 0) return null;
			if (scrollport.scrollHeight - scrollport.clientHeight - scrollport.scrollTop <= 1) return latest.seq;
			if (scrollport.scrollTop <= 1) return earliest.seq;
			const viewport = scrollport.getBoundingClientRect();
			const visibleBottom = scrollport.querySelector("[data-composer-seat]")?.getBoundingClientRect().top ?? viewport.bottom;
			const readingLine = viewport.top + Math.min(120, Math.max(24, (visibleBottom - viewport.top) * .28));
			let active = earliest;
			let found = false;
			for (const turn of turns) {
				const row = userRowByIndex(scrollport, turn.index);
				if (row === null) continue;
				found = true;
				if (row.getBoundingClientRect().top > readingLine) break;
				active = turn;
			}
			return found ? active.seq : latest.seq;
		}
		/** Turn rail with hover/focus previews and direct scroll navigation. */
		function TurnNavigator({ useSession, loadOlder, t }) {
			const chat = useSession((snapshot) => snapshot.chat);
			const openState = useSession((snapshot) => snapshot.openState);
			const hasMore = useSession((snapshot) => snapshot.hasMore);
			const loadingOlder = useSession((snapshot) => snapshot.loadingOlder);
			const turns = (0, react.useMemo)(() => {
				if (chat === void 0) return [];
				const markers = [];
				for (const key of chat.order) {
					const node = chat.nodes.get(key);
					if (node === void 0 || node.kind !== "user") continue;
					markers.push({
						seq: node.anchorSeq,
						index: markers.length,
						preview: messagePreview(node.data.content)
					});
				}
				return markers;
			}, [chat]);
			const rootRef = (0, react.useRef)(null);
			const [activeSeq, setActiveSeq] = (0, react.useState)(null);
			const [hoveredSeq, setHoveredSeq] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (openState !== "open" || turns.length >= 3 || !hasMore || loadingOlder) return;
				loadOlder();
			}, [
				hasMore,
				loadOlder,
				loadingOlder,
				openState,
				turns.length
			]);
			(0, react.useEffect)(() => {
				if (turns.length < 3) return;
				const scrollport = rootRef.current?.closest("[data-conversation-scroll]");
				if (scrollport === null || scrollport === void 0) return;
				let frame = null;
				const update = () => {
					setActiveSeq(activeTurnSeq(scrollport, turns));
				};
				const schedule = () => {
					if (frame !== null) return;
					frame = requestAnimationFrame(() => {
						frame = null;
						update();
					});
				};
				update();
				scrollport.addEventListener("scroll", schedule, { passive: true });
				window.addEventListener("resize", schedule);
				return () => {
					scrollport.removeEventListener("scroll", schedule);
					window.removeEventListener("resize", schedule);
					if (frame !== null) cancelAnimationFrame(frame);
				};
			}, [turns]);
			if (turns.length < 3) return null;
			let latestSeq = null;
			for (const turn of turns) latestSeq = turn.seq;
			const currentSeq = turns.some((turn) => turn.seq === activeSeq) ? activeSeq : latestSeq;
			const jumpTo = (turn) => {
				const scrollport = rootRef.current?.closest("[data-conversation-scroll]");
				if (scrollport === null || scrollport === void 0) return;
				const row = userRowByIndex(scrollport, turn.index);
				if (row === null) return;
				scrollport.scrollTop += row.getBoundingClientRect().top - scrollport.getBoundingClientRect().top;
				setActiveSeq(turn.seq);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: rootRef,
				className: _dsh_css_TurnNavigator_module_css_default.host,
				"data-turn-navigator": "",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("nav", {
					className: _dsh_css_TurnNavigator_module_css_default.rail,
					"aria-label": t("nav.aria"),
					children: turns.map((turn, index) => {
						const number = index + 1;
						const preview = turn.preview === "" ? t("preview.empty") : turn.preview;
						const edge = index === 0 ? "first" : index === turns.length - 1 ? "last" : "middle";
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: _dsh_css_TurnNavigator_module_css_default.marker,
							"aria-label": t("marker.aria", {
								index: number,
								preview
							}),
							"aria-current": turn.seq === currentSeq ? "step" : void 0,
							onClick: () => {
								jumpTo(turn);
							},
							onMouseEnter: () => {
								setHoveredSeq(turn.seq);
							},
							onMouseLeave: () => {
								setHoveredSeq(null);
							},
							onFocus: () => {
								setHoveredSeq(turn.seq);
							},
							onBlur: () => {
								setHoveredSeq(null);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: _dsh_css_TurnNavigator_module_css_default.tick,
								"aria-hidden": "true"
							}), hoveredSeq === turn.seq && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: _dsh_css_TurnNavigator_module_css_default.preview,
								"data-edge": edge,
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: _dsh_css_TurnNavigator_module_css_default.previewCard,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("preview.title", { index: number }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: preview })]
								})
							})]
						}, turn.seq);
					})
				})
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "turnNavigator";
		/** Required services: the chat slot registry and localized preview copy. */
		const inject = ["slots", "locale"];
		/**
		* Register dictionaries and a session-owned bridge that portals the turn rail
		* into the existing transcript scroll owner.
		* @param ctx - Client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-turn-navigator: dictionaries");
			ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "turn-navigator-portals",
				order: 100,
				locale: NS
			}, TurnNavigatorPortals));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map