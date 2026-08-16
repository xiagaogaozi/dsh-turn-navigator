/** Scroll-synced turn rail derived from settled user-message nodes. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './TurnNavigator.module.css'

/** Minimum user-turn count at which navigation provides more value than noise. */
export const MIN_TURNS = 3

/** One marker projected from a settled user message. */
export interface TurnMarker {
  /** Durable session-event sequence of the underlying user message. */
  readonly seq: number
  /** Position of this user row in transcript DOM order (0-based). */
  readonly index: number
  /** Compact hover preview text. */
  readonly preview: string
}

/** Full props supplied by the portal bridge and locale seat. */
export type TurnNavigatorProps =
  PropsRuntime<'conversation.session.header.actions'> & PropsLocale<'turnNavigator'> & {
    /** Delegate older-history paging to ChatView's anchored host button. */
    readonly loadOlder: () => void
  }

/** Props supplied by the existing header-action seat to the portal bridge. */
export type TurnNavigatorPortalsProps =
  PropsRuntime<'conversation.session.header.actions'> & PropsLocale<'turnNavigator'>

/**
 * Minimal structural view of one rendered business row, taken from the same
 * `chat.order` / `chat.nodes` the Chat view renders. `data` carries the
 * renderer payload; the user renderer payload is the `UserMessageNode`, so
 * `data.content` holds the message blocks used for hover previews.
 */
export interface ChatSliceNode {
  readonly key: string
  readonly kind: string
  readonly anchorSeq: number
  readonly data: { content?: readonly { type: string; text?: string }[] }
}

/**
 * Minimal structural view of the live chat slice (`snapshot.chat`). Kept
 * structural so the plugin stays compatible across DSH client SDK revisions
 * instead of pinning one snapshot shape: the host supplies
 * `{ chat: { order, nodes } }` at runtime.
 */
export interface ChatSlice {
  readonly order: readonly string[]
  readonly nodes: { get(key: string): ChatSliceNode | undefined }
}

/** Find the active conversation's scroll owner without assuming host key formats. */
export function conversationScrollport(): HTMLElement | null {
  for (const candidate of document.querySelectorAll<HTMLElement>('[data-conversation-scroll]')) {
    if (candidate.querySelector('[data-chat-flow]') !== null) return candidate
  }
  return null
}

/**
 * Put the portal mount before transcript flow so the navigator's sticky rail
 * is available throughout the entire scroll range, not only after the last
 * message. `display: contents` keeps this plugin-owned mount layout-neutral.
 */
function portalMountFor(scrollport: HTMLElement, current: HTMLElement | null): HTMLElement {
  if (current !== null && current.isConnected && current.parentElement === scrollport) return current
  const mount = document.createElement('div')
  mount.dataset.turnNavigatorPortal = ''
  mount.style.display = 'contents'
  scrollport.prepend(mount)
  return mount
}

/** Click the host's own paging control so ChatView preserves the reading anchor. */
export function loadOlderFromHost(scrollport: HTMLElement): void {
  const button = scrollport
    .querySelector<HTMLElement>('[data-chat-flow]')
    ?.firstElementChild
    ?.querySelector<HTMLButtonElement>('button[type="button"]')
  if (button !== undefined && button !== null && !button.disabled) button.click()
}

/**
 * Session-scoped compatibility bridge. The public header action seat gives
 * this plugin the normal session kit; its visual content is portaled into the
 * transcript scroll owner, which requires no private host slot.
 */
export function TurnNavigatorPortals({ useSession, t }: TurnNavigatorPortalsProps) {
  const mountRef = useRef<HTMLElement | null>(null)
  const [mount, setMount] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    let active = true
    let queued = false
    const refresh = () => {
      if (!active) return
      const scrollport = conversationScrollport()
      const next = scrollport === null ? null : portalMountFor(scrollport, mountRef.current)
      if (mountRef.current !== null && mountRef.current !== next && mountRef.current.isConnected) {
        mountRef.current.remove()
      }
      mountRef.current = next
      setMount(current => current === next ? current : next)
    }
    const queueRefresh = () => {
      if (queued || !active) return
      queued = true
      queueMicrotask(() => {
        queued = false
        refresh()
      })
    }
    refresh()
    const observer = new MutationObserver(queueRefresh)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      active = false
      observer.disconnect()
      mountRef.current?.remove()
      mountRef.current = null
    }
  }, [])

  if (mount === null) return null
  return createPortal(
    <TurnNavigator
      useSession={useSession}
      loadOlder={() => {
        const scrollport = mount.parentElement
        if (scrollport instanceof HTMLElement) loadOlderFromHost(scrollport)
      }}
      t={t}
    />,
    mount,
  )
}

/** Collapse the text blocks of one user message into a compact hover preview. */
export function messagePreview(
  content: readonly { type: string; text?: string }[] | undefined,
): string {
  if (content === undefined) return ''
  return content
    .filter((block): block is { type: 'text'; text: string } =>
      block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim()
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
export function userRowByIndex(scrollport: HTMLElement, index: number): HTMLElement | null {
  let seen = 0
  for (const row of scrollport.querySelectorAll<HTMLElement>('[data-chat-flow-kind="user"]')) {
    if (seen === index) return row
    seen += 1
  }
  return null
}

/**
 * Resolve the turn crossing the reading line. The bottom position always
 * selects the newest turn, including a transcript shorter than its viewport.
 */
export function activeTurnSeq(scrollport: HTMLElement, turns: readonly TurnMarker[]): number | null {
  const earliest = turns.at(0)
  const latest = turns.at(-1)
  if (earliest === undefined || latest === undefined) return null
  if (scrollport.scrollHeight - scrollport.clientHeight - scrollport.scrollTop <= 1) return latest.seq
  if (scrollport.scrollTop <= 1) return earliest.seq

  const viewport = scrollport.getBoundingClientRect()
  const composer = scrollport.querySelector<HTMLElement>('[data-composer-seat]')
  const visibleBottom = composer?.getBoundingClientRect().top ?? viewport.bottom
  const readingLine = viewport.top + Math.min(120, Math.max(24, (visibleBottom - viewport.top) * 0.28))
  let active = earliest
  let found = false
  for (const turn of turns) {
    const row = userRowByIndex(scrollport, turn.index)
    if (row === null) continue
    found = true
    if (row.getBoundingClientRect().top > readingLine) break
    active = turn
  }
  return found ? active.seq : latest.seq
}

/** Turn rail with hover/focus previews and direct scroll navigation. */
export function TurnNavigator({ useSession, loadOlder, t }: TurnNavigatorProps) {
  // Markers come from the live chat slice the Chat view renders, so marker
  // order always matches transcript DOM order (including older pages loaded
  // later). The legacy top-level node projection is not used: it can carry
  // rows the transcript does not render, which would misalign the rail.
  const chat = useSession(snapshot => (snapshot as unknown as { chat?: ChatSlice }).chat)
  const openState = useSession(snapshot => snapshot.openState)
  const hasMore = useSession(snapshot => snapshot.hasMore)
  const loadingOlder = useSession(snapshot => snapshot.loadingOlder)
  const turns = useMemo<TurnMarker[]>(() => {
    if (chat === undefined) return []
    const markers: TurnMarker[] = []
    for (const key of chat.order) {
      const node = chat.nodes.get(key)
      if (node === undefined || node.kind !== 'user') continue
      markers.push({
        seq: node.anchorSeq,
        index: markers.length,
        preview: messagePreview(node.data.content),
      })
    }
    return markers
  }, [chat])
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeSeq, setActiveSeq] = useState<number | null>(null)
  const [hoveredSeq, setHoveredSeq] = useState<number | null>(null)

  useEffect(() => {
    if (openState !== 'open' || turns.length >= MIN_TURNS || !hasMore || loadingOlder) return
    loadOlder()
  }, [hasMore, loadOlder, loadingOlder, openState, turns.length])

  useEffect(() => {
    if (turns.length < MIN_TURNS) return
    const scrollport = rootRef.current?.closest<HTMLElement>('[data-conversation-scroll]')
    if (scrollport === null || scrollport === undefined) return

    let frame: number | null = null
    const update = () => { setActiveSeq(activeTurnSeq(scrollport, turns)) }
    const schedule = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        update()
      })
    }
    update()
    scrollport.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      scrollport.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [turns])

  if (turns.length < MIN_TURNS) return null

  let latestSeq: number | null = null
  for (const turn of turns) latestSeq = turn.seq
  const currentSeq = turns.some(turn => turn.seq === activeSeq)
    ? activeSeq
    : latestSeq

  const jumpTo = (turn: TurnMarker): void => {
    const scrollport = rootRef.current?.closest<HTMLElement>('[data-conversation-scroll]')
    if (scrollport === null || scrollport === undefined) return
    const row = userRowByIndex(scrollport, turn.index)
    if (row === null) return
    // Align the row top with the scrollport top (the same flow-top math the
    // Chat view uses for its own anchors). The resulting scroll event flows
    // through the ordinary listener path, so the reading-line highlight
    // follows through the coalesced update.
    scrollport.scrollTop += row.getBoundingClientRect().top - scrollport.getBoundingClientRect().top
    setActiveSeq(turn.seq)
  }

  return (
    <div ref={rootRef} className={css.host} data-turn-navigator="">
      <nav className={css.rail} aria-label={t('nav.aria')}>
        {turns.map((turn, index) => {
          const number = index + 1
          const preview = turn.preview === '' ? t('preview.empty') : turn.preview
          const edge = index === 0 ? 'first' : index === turns.length - 1 ? 'last' : 'middle'
          return (
            <button
              key={turn.seq}
              type="button"
              className={css.marker}
              aria-label={t('marker.aria', { index: number, preview })}
              aria-current={turn.seq === currentSeq ? 'step' : undefined}
              onClick={() => { jumpTo(turn) }}
              onMouseEnter={() => { setHoveredSeq(turn.seq) }}
              onMouseLeave={() => { setHoveredSeq(null) }}
              onFocus={() => { setHoveredSeq(turn.seq) }}
              onBlur={() => { setHoveredSeq(null) }}
            >
              <span className={css.tick} aria-hidden="true" />
              {hoveredSeq === turn.seq && (
                <span className={css.preview} data-edge={edge} aria-hidden="true">
                  <span className={css.previewCard}>
                    <strong>{t('preview.title', { index: number })}</strong>
                    <span>{preview}</span>
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
