/**
 * Browser half of dsh-think-phrases: mounts the counter pill into the
 * right-aligned utilities group of the session header (the top-right
 * corner of the conversation) and expands a pull-out panel on click.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: merges the SlotMap table (this package registers into it).
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: merges ui-conversation's SlotMap entries — declares
// 'conversation.session.header.utilities', the right-aligned header group.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: our own SessionProjectionMap augmentation, so
// useProjection('thinkPhrases') is typed inside the widget.
import type {} from '../projection.ts'
import { ThinkStatsWidget } from './ThinkStatsWidget.tsx'

/** Required services (cordis fiber inject). */
export const inject = ['slots']

/**
 * Client plugin body: register one entry into the session header utilities.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // session scope: the framework supplies useSession/sessionId/useProjection
  // (the fifth hook seat reads the host's thinkPhrases projection).
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities',
    id: 'think-phrases',
    order: 400,
  }, ThinkStatsWidget))
}
