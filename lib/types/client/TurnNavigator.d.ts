import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Minimum user-turn count at which navigation provides more value than noise. */
export declare const MIN_TURNS = 3;
/** One marker projected from a settled user message. */
export interface TurnMarker {
    /** Durable session-event sequence of the underlying user message. */
    readonly seq: number;
    /** Position of this user row in transcript DOM order (0-based). */
    readonly index: number;
    /** Compact hover preview text. */
    readonly preview: string;
}
/** Full props supplied by the portal bridge and locale seat. */
export type TurnNavigatorProps = PropsRuntime<'conversation.session.header.actions'> & PropsLocale<'turnNavigator'> & {
    /** Delegate older-history paging to ChatView's anchored host button. */
    readonly loadOlder: () => void;
};
/** Props supplied by the existing header-action seat to the portal bridge. */
export type TurnNavigatorPortalsProps = PropsRuntime<'conversation.session.header.actions'> & PropsLocale<'turnNavigator'>;
/**
 * Minimal structural view of one rendered business row, taken from the same
 * `chat.order` / `chat.nodes` the Chat view renders. `data` carries the
 * renderer payload; the user renderer payload is the `UserMessageNode`, so
 * `data.content` holds the message blocks used for hover previews.
 */
export interface ChatSliceNode {
    readonly key: string;
    readonly kind: string;
    readonly anchorSeq: number;
    readonly data: {
        content?: readonly {
            type: string;
            text?: string;
        }[];
    };
}
/**
 * Minimal structural view of the live chat slice (`snapshot.chat`). Kept
 * structural so the plugin stays compatible across DSH client SDK revisions
 * instead of pinning one snapshot shape: the host supplies
 * `{ chat: { order, nodes } }` at runtime.
 */
export interface ChatSlice {
    readonly order: readonly string[];
    readonly nodes: {
        get(key: string): ChatSliceNode | undefined;
    };
}
/** Find the active conversation's scroll owner without assuming host key formats. */
export declare function conversationScrollport(): HTMLElement | null;
/** Click the host's own paging control so ChatView preserves the reading anchor. */
export declare function loadOlderFromHost(scrollport: HTMLElement): void;
/**
 * Session-scoped compatibility bridge. The public header action seat gives
 * this plugin the normal session kit; its visual content is portaled into the
 * transcript scroll owner, which requires no private host slot.
 */
export declare function TurnNavigatorPortals({ useSession, t }: TurnNavigatorPortalsProps): import("react").JSX.Element | null;
/** Collapse the text blocks of one user message into a compact hover preview. */
export declare function messagePreview(content: readonly {
    type: string;
    text?: string;
}[] | undefined): string;
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
export declare function userRowByIndex(scrollport: HTMLElement, index: number): HTMLElement | null;
/**
 * Resolve the turn crossing the reading line. The bottom position always
 * selects the newest turn, including a transcript shorter than its viewport.
 */
export declare function activeTurnSeq(scrollport: HTMLElement, turns: readonly TurnMarker[]): number | null;
/** Turn rail with hover/focus previews and direct scroll navigation. */
export declare function TurnNavigator({ useSession, loadOlder, t }: TurnNavigatorProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=TurnNavigator.d.ts.map