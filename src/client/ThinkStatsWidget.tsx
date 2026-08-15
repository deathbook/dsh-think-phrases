/**
 * The top-right stats widget: a pill showing the total phrase count, and a
 * pull-out panel with per-phrase counts. Session-scoped slot component —
 * PropsRuntime<'conversation.session.header.utilities'> composes the owner
 * share with the framework session kit (useSession/sessionId/useProjection)
 * and the global seat (useSessions/useWorkspaces).
 */
import { useEffect, useRef, useState } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: keeps the ui-conversation SlotMap merge in this module's scope.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import styles from './think-stats.module.css'

const ROWS = [
  { id: 'letMe', label: 'let me' },
  { id: 'weNeed', label: 'we' },
  { id: 'lets', label: "let's" },
  { id: 'iWill', label: "I'll" },
] as const

/**
 * Render the counter pill + collapsible panel.
 * @param props - composed slot props (see module doc).
 */
export function ThinkStatsWidget(props: PropsRuntime<'conversation.session.header.utilities'>) {
  const value = props.useProjection('thinkPhrases')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Collapse on outside pointer-down or Escape while open.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const letMe = value?.letMe ?? 0
  const weNeed = value?.weNeed ?? 0
  const lets = value?.lets ?? 0
  const iWill = value?.iWill ?? 0
  const total = value?.total ?? letMe + weNeed + lets + iWill
  const max = Math.max(1, letMe, weNeed, lets, iWill)
  const counts: Record<(typeof ROWS)[number]['id'], number> = { letMe, weNeed, lets, iWill }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.pill}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="思维链短语统计"
      >
        <span className={styles.pillDot} aria-hidden />
        <span className={styles.pillValue}>{total}</span>
        <span className={styles.pillChevron} aria-hidden>{open ? '\u25B4' : '\u25BE'}</span>
      </button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="思维链短语统计">
          <header className={styles.panelHeader}>
            <span className={styles.panelTitle}>思维链短语统计</span>
            <span className={styles.panelSub}>reasoning chains</span>
          </header>
          <ul className={styles.rows}>
            {ROWS.map(({ id, label }) => (
              <li key={id} className={styles.row}>
                <span className={styles.rowLabel}>{label}</span>
                <span className={styles.rowBar} aria-hidden>
                  <span className={styles.rowBarFill} style={{ width: `${counts[id] / max * 100}%` }} />
                </span>
                <span className={styles.rowCount}>{counts[id]}</span>
              </li>
            ))}
          </ul>
          <footer className={styles.panelFooter}>
            <span className={styles.footerLabel}>合计</span>
            <span className={styles.totalValue}>{total}</span>
          </footer>
        </div>
      )}
    </div>
  )
}
