/**
 * thinkPhrases session projection: counts 'let me' / 'we' / 'let's' / 'I'll'
 * occurrences across every reasoning (thinking) block in the full session
 * log. The framework drives `apply` on every committed session event; the
 * client reads the whole wire value via useProjection('thinkPhrases').
 */
import { z } from 'zod'
// Type-only: the merge-extensible SessionProjectionMap table.
import type {} from '@deepseek-ai/dsh-session-projection/types'
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection'
import type { Message } from '@deepseek-ai/dsh-llm'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { isSurfaceEvent } from '@deepseek-ai/dsh-session'

/** Wire value: whole counts for one session. */
export interface ThinkPhrasesProjection {
  letMe: number
  weNeed: number
  lets: number
  iWill: number
  total: number
}

/** Per-message counts (kept per surface seq so replaces can subtract). */
export interface PhraseCounts {
  letMe: number
  weNeed: number
  lets: number
  iWill: number
}

/**
 * The phrase table. Case-insensitive. 'we' matches only the standalone word
 * (never inside a larger word or contraction such as "we're"). 'iWill' counts
 * both the contracted "I'll" (straight/curly apostrophes) and the full form
 * "I will", in any casing.
 */
export const PHRASES: readonly { id: keyof PhraseCounts; label: string; re: RegExp }[] = [
  { id: 'letMe', label: 'let me', re: /\blet\s+me\b/gi },
  { id: 'weNeed', label: 'we', re: /(?<![\p{L}\p{N}\p{M}_-])we(?![\p{L}\p{N}\p{M}_-]|['’‘][\p{L}\p{N}\p{M}_])/giu },
  { id: 'lets', label: "let's", re: /\blet(?:['’]s|s)\b/gi },
  { id: 'iWill', label: "I'll", re: /\bi(?:['’‘]ll|\s+will)\b/gi },
]

const zero = (): PhraseCounts => ({ letMe: 0, weNeed: 0, lets: 0, iWill: 0 })

const add = (a: PhraseCounts, b: PhraseCounts): PhraseCounts => ({
  letMe: a.letMe + b.letMe,
  weNeed: a.weNeed + b.weNeed,
  lets: a.lets + b.lets,
  iWill: a.iWill + b.iWill,
})

const subtract = (a: PhraseCounts, b: PhraseCounts): PhraseCounts => ({
  letMe: a.letMe - b.letMe,
  weNeed: a.weNeed - b.weNeed,
  lets: a.lets - b.lets,
  iWill: a.iWill - b.iWill,
})

/** Count phrase occurrences in one text (regexes are match()-stateless). */
function countText(text: string): PhraseCounts {
  const out = zero()
  for (const { id, re } of PHRASES) {
    const matched = text.match(re)
    if (matched !== null) out[id] = matched.length
  }
  return out
}

/** Count phrase occurrences across every reasoning block of one message. */
function countMessage(message: Message): PhraseCounts {
  const out = zero()
  for (const block of message.content) {
    if (block.type !== 'reasoning') continue
    for (const { id, re } of PHRASES) {
      const matched = block.text.match(re)
      if (matched !== null) out[id] += matched.length
    }
  }
  return out
}

interface State {
  totals: PhraseCounts
  /** Surface seq -> per-message counts (replace-aware, mirrors the live-stats surface map). */
  surface: Record<number, PhraseCounts>
}

const schema = z.object({
  letMe: z.number().int().nonnegative(),
  weNeed: z.number().int().nonnegative(),
  lets: z.number().int().nonnegative(),
  iWill: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
}).strict() as unknown as z.ZodType<ThinkPhrasesProjection>

/**
 * Create the replayable thinkPhrases projection definition.
 * @returns the projection unit the sessionProjections registry drives.
 */
export function createThinkPhrasesProjectionDefinition(): ProjectionDefinition<'thinkPhrases', State> {
  return {
    key: 'thinkPhrases',
    schema,
    init: () => ({ totals: zero(), surface: {} }),
    apply: (state, event: SessionEvent) => {
      // Only finalized assistant messages carry the canonical reasoning
      // blocks; chunks are token deltas and would double-count.
      if (!isSurfaceEvent(event) || event.type !== 'assistant/message') return state
      const counts = countMessage(event.data.message)
      const surface = { ...state.surface }
      let totals = state.totals
      if (event.surfaceOp === 'append') {
        surface[event.seq] = counts
        totals = add(totals, counts)
      } else {
        const { start, end } = event.surfaceOp
        for (let seq = start; seq <= end; seq++) {
          const previous = surface[seq]
          if (previous === undefined) continue
          totals = subtract(totals, previous)
          delete surface[seq]
        }
        surface[event.seq] = counts
        totals = add(totals, counts)
      }
      return { totals, surface }
    },
    view: (state) => ({
      ...state.totals,
      total: state.totals.letMe + state.totals.weNeed + state.totals.lets + state.totals.iWill,
    }),
    stateVersion: 2,
  }
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionMap {
    thinkPhrases: ThinkPhrasesProjection
  }
}
