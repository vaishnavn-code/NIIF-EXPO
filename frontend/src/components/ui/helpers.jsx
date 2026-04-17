import React from 'react'
export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  )
}

export function ErrorMsg({ message }) {
  return <div className="error-msg">⚠ {message}</div>
}

export function TopNSelector({ options, value, onChange }) {
  return (
    <div className="topn-wrap">
      <span className="topn-label">Top</span>
      {options.map((n) => (
        <button
          key={n}
          className={`topn-btn${value === n ? ' active' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ label, value, max, fillColor = 'var(--blue)' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="prog-row">
      <div className="prog-header">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="prog-bar">
        <div className="prog-fill" style={{ width: `${pct}%`, background: fillColor }} />
      </div>
    </div>
  )
}
