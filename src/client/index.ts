/** Browser entry: register the standalone turn navigator in the chat-owned rail slot. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { en, zh, type TurnNavigatorKey } from './locales.ts'
import { TurnNavigatorPortals } from './TurnNavigator.tsx'

export type { TurnNavigatorKey } from './locales.ts'

/** Dictionary namespace owned by this plugin. */
const NS = 'turnNavigator'

/** Required services: the chat slot registry and localized preview copy. */
export const inject = ['slots', 'locale']

/**
 * Register dictionaries and a session-owned bridge that portals the turn rail
 * into the existing transcript scroll owner.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-turn-navigator: dictionaries')
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register(
    { name: 'conversation.session.header.actions', id: 'turn-navigator-portals', order: 100, locale: NS },
    TurnNavigatorPortals,
  ))
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The turn navigator's accessible labels and preview chrome. */
    turnNavigator: TurnNavigatorKey
  }
}
