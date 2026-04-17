/**
 * KpiCard — renders a single KPI tile.
 *
 * Props:
 *   label       string   — card heading
 *   value       string   — primary display value
 *   sub         string   — secondary line
 *   footer      string   — bottom line (optional)
 *   sparkPct    number   — 0–100 fill for spark bar (optional)
 *   accent      'c1'|'c2'|'c3'|'c4'
 *   badge       { label, variant }  — optional badge beside value
 *   icon        JSX      — optional SVG icon element
 */
import React from "react"
export default function KpiCard({
  label, value, sub, footer,
  sparkPct, accent = 'c1',
  badge, icon,
}) {
  return (
    <div className={`kpi-card ${accent}`}>
      <div className="kpi-body">
        {(icon || badge) && (
          <div className="kpi-top">
            {icon && <div className="kpi-icon-wrap">{icon}</div>}
            {badge && <span className={`kpi-badge ${badge.variant ?? 'neutral'}`}>{badge.label}</span>}
          </div>
        )}
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
        {sparkPct !== undefined && (
          <div className="kpi-spark">
            <div className="kpi-spark-fill" style={{ width: `${Math.min(100, Math.max(0, sparkPct))}%` }} />
          </div>
        )}
        {footer && (
          <>
            <div className="kpi-divider" />
            <div className="kpi-footer">
              <div className="kpi-footer-dot" />
              <span dangerouslySetInnerHTML={{ __html: footer }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
