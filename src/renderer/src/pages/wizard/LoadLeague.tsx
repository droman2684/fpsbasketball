import { useEffect, useState } from 'react'
import { COLORS, FONTS } from '@renderer/styles/theme'
import { useWizardStore } from '@renderer/state/wizardStore'
import { buildLeagueTeams } from '@renderer/data/engine'
import type { PersistedSave } from '@shared/types'

interface LoadLeagueProps {
  onLoad: (save: PersistedSave) => void
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}

export default function LoadLeague({ onLoad }: LoadLeagueProps): React.JSX.Element {
  const backToLanding = useWizardStore((s) => s.backToLanding)
  const [saves, setSaves] = useState<PersistedSave[] | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    window.api.list().then((list) => {
      if (cancelled) return
      setSaves([...list].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleDeleteClick = (id: string): void => {
    if (confirmingId === id) {
      window.api.delete(id).then(() => {
        setSaves((prev) => (prev ? prev.filter((s) => s.id !== id) : prev))
        setConfirmingId(null)
      })
    } else {
      setConfirmingId(id)
      setTimeout(() => setConfirmingId((cur) => (cur === id ? null : cur)), 3000)
    }
  }

  const backButton = (
    <button
      onClick={backToLanding}
      className="cta-btn"
      style={{
        padding: '14px 28px',
        background: COLORS.accent,
        color: 'white',
        border: 'none',
        fontFamily: FONTS.display,
        fontWeight: 900,
        fontSize: 16,
        letterSpacing: 2,
        textTransform: 'uppercase',
        cursor: 'pointer'
      }}
    >
      ← BACK TO HOME
    </button>
  )

  if (saves !== null && saves.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: COLORS.bg
        }}
        className="pg"
      >
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div
            style={{
              width: 60,
              height: 60,
              background: '#EDECE9',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#AEACA8"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h2
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 38,
              color: COLORS.textPrimary,
              marginBottom: 10,
              letterSpacing: -0.5
            }}
          >
            No Saved Leagues
          </h2>
          <p style={{ fontSize: 15, color: COLORS.textMuted, marginBottom: 32, lineHeight: 1.6 }}>
            No saved league files found. Create a new league to get started.
          </p>
          {backButton}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '64px 24px',
        background: COLORS.bg
      }}
      className="pg"
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        <h2
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 38,
            color: COLORS.textPrimary,
            marginBottom: 28,
            letterSpacing: -0.5
          }}
        >
          Load League
        </h2>
        {saves === null ? (
          <p style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 28 }}>Loading saved leagues…</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {saves.map((save) => {
              const teams = buildLeagueTeams(save.league)
              const myTeamInfo = teams.find((t) => t.abbr === save.game.myTeam)
              const rec = save.game.records[save.game.myTeam] ?? { w: 0, l: 0, l10: '0-0' }
              const confirming = confirmingId === save.id
              const incompatible = save.version !== 2
              return (
                <div
                  key={save.id}
                  style={{
                    background: 'white',
                    border: `1px solid ${COLORS.border}`,
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: myTeamInfo?.primary ?? COLORS.textFaint,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 10, color: 'white' }}>
                        {myTeamInfo?.abbr ?? save.game.myTeam}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 18, color: COLORS.textPrimary }}>
                        {save.league.leagueName}
                      </div>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                        {myTeamInfo ? `${myTeamInfo.city} ${myTeamInfo.name}` : save.game.myTeam} · Season{' '}
                        {save.game.seasonNumber} · {rec.w}-{rec.l} · {save.game.seasonPhase}
                      </div>
                      <div
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 9,
                          color: COLORS.textFaint,
                          marginTop: 4,
                          letterSpacing: 1,
                          textTransform: 'uppercase'
                        }}
                      >
                        Saved {formatSavedAt(save.savedAt)}
                      </div>
                      {incompatible ? (
                        <div style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.accent, marginTop: 6 }}>
                          This save predates a major update and can&apos;t be loaded.
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => onLoad(save)}
                      disabled={incompatible}
                      className="cta-btn"
                      style={{
                        padding: '10px 20px',
                        background: incompatible ? '#D8D6D1' : COLORS.accent,
                        color: incompatible ? '#9A9894' : 'white',
                        border: 'none',
                        fontFamily: FONTS.display,
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        cursor: incompatible ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteClick(save.id)}
                      style={{
                        padding: '10px 18px',
                        background: 'white',
                        color: confirming ? COLORS.accent : COLORS.textFaint,
                        border: `1.5px solid ${confirming ? COLORS.accent : COLORS.border}`,
                        fontFamily: FONTS.display,
                        fontWeight: 800,
                        fontSize: 12,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {confirming ? 'Confirm?' : 'Delete'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {backButton}
      </div>
    </div>
  )
}
