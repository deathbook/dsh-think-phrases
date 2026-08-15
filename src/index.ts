/**
 * Host half of dsh-think-phrases: registers the thinkPhrases session
 * projection. The projection framework folds init/apply eagerly over the
 * FULL committed session log (not just the client window), so the counts
 * cover every reasoning chain of the conversation; the browser half reads
 * the whole value through the session-scope useProjection hook.
 */
import type { Context } from '@deepseek-ai/cordis'
// Type-only: pulls the sessionProjections Context merge.
import type {} from '@deepseek-ai/dsh-session-projection'
import { createThinkPhrasesProjectionDefinition } from './projection.ts'

/** Plugin name (fiber diagnostics). */
export const name = 'dsh-think-phrases'

/**
 * Register the projection unit under ctx.inject so assemblies without the
 * projection registry stay unaffected (the documented seam pattern).
 * @param ctx - host context of this plugin's fiber.
 */
export function apply(ctx: Context): void {
  ctx.inject(['sessionProjections'], (host) => {
    host.effect(() => host.sessionProjections.register(createThinkPhrasesProjectionDefinition()), 'think-phrases: projection')
  })
}

export { createThinkPhrasesProjectionDefinition, PHRASES } from './projection.ts'
export type { PhraseCounts, ThinkPhrasesProjection } from './projection.ts'
