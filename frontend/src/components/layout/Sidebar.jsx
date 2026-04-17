/**
 * components/layout/Sidebar.jsx
 * ==============================
 * Left navigation sidebar.
 */

import React, { useMemo } from 'react'
import { NAV_PAGES } from '../../utils/constants'
import FSlogo from '../../data/images/FSlogo.png'

const NAV_ICONS = {
  overview: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />,
  exposure: <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />,
  rates: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />,
  borrowers: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
  transactions: <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />,
  loans: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-2.83.48-5.52-.99-6.99-3.8-.46-.86-.74-1.8-.93-2.8h1.98c.16.7.39 1.37.68 2 .77 1.44 2.25 2.28 3.94 1.8s2.88-2.25 2.88-4.02c0-.46-.05-.9-.14-1.32h1.98c-.19 1-0.47 1.94-.93 2.8-1.47 2.81-4.16 4.28-6.99 3.8V19z" />
}

export default function Sidebar({ activePage, onNavigate }) {
  const sections = useMemo(() => {
    const map = {}
    NAV_PAGES.forEach((p) => {
      if (!map[p.section]) map[p.section] = []
      map[p.section].push(p)
    })
    return map
  }, [])

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoWrap}>
        <img src={FSlogo} alt="TFSIN Logo" style={{ width: 40, height: 40, borderRadius: 9 }} />
        <div>
          <div style={styles.logoText}>NIIF DASHBOARD</div>
          <div style={styles.logoSub}>A Product by Fourth Signal</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {Object.entries(sections).map(([section, pages], idx) => (
          <div key={section}>
            {idx > 0 && <div style={styles.divider} />}
            <div style={styles.sectionLabel}>{section}</div>
            {pages.map((p) => {
              const isActive = activePage === p.id
              return (
                <button
                  key={p.id}
                  style={{ ...styles.navBtn, ...(isActive ? styles.navBtnActive : {}) }}
                  onClick={() => onNavigate(p.id)}
                >
                  <svg viewBox="0 0 24 24" width={17} height={17} fill="currentColor" style={{ flexShrink: 0 }}>
                    {NAV_ICONS[p.id] || NAV_ICONS.overview}
                  </svg>
                  <span>{p.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: 'var(--white)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 24px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '2px 0 12px rgba(21,101,192,.07)',
    transition: 'background .4s'
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '22px 18px 20px',
    borderBottom: '1px solid var(--border)',
    marginBottom: 12
  },
  logoText: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--blue-dark)' },
  logoSub: {
    fontSize: '.45rem',
    fontWeight: 600,
    letterSpacing: '.2em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginTop: 2
  },
  sectionLabel: {
    fontSize: '.57rem',
    fontWeight: 800,
    letterSpacing: '.18em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    padding: '4px 14px 2px'
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 3, padding: '0 10px', flex: 1 },
  navBtn: {
    fontFamily: 'var(--font)',
    fontSize: '.79rem',
    fontWeight: 500,
    padding: '9px 14px',
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--text-muted)',
    transition: 'all .2s',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: 9
  },
  navBtnActive: {
    background: 'var(--blue-pale)',
    color: 'var(--blue-dark)',
    fontWeight: 700,
    boxShadow: 'inset 0 0 0 1px var(--blue-light)'
  },
  divider: { height: 1, background: 'var(--border)', margin: '10px 16px' }
}
