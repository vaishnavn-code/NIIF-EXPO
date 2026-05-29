import React from "react";
import { ICONS } from "../../data/Icons";

export default function KpiCard({
  label,
  value,
  sub,
  footer,
  sparkPct,
  accent = "c1",

  // Icon
  icon, // JSX (optional)
  iconName, // string key from ICONS

  // Badge
  badge, // { label, variant, bgColor, textColor }
}) {
  // Resolve icon (priority: direct JSX > iconName)
  const IconComponent = icon || (iconName && ICONS[iconName]);

  return (
    <div className={`kpi-card ${accent}`}>
      <div className="kpi-body">
        {/* Top section: Icon (left) + Badge (right) */}
        {(IconComponent || badge) && (
          <div className="kpi-top">
            {IconComponent && (
              <div className="kpi-icon-wrap">
                {typeof IconComponent === "function" ? (
                  <IconComponent />
                ) : (
                  IconComponent
                )}
              </div>
            )}

            {badge && (
              <span
                className={`kpi-badge ${badge.variant ?? "neutral"}`}
                style={{
                  backgroundColor: badge.bgColor,
                  color: badge.textColor,
                  "--dot-color": badge.dotColor || badge.textColor, // 👈 key line
                }}
              >
                {badge.label}
              </span>
            )}
          </div>
        )}

        {/* Label */}
        {label && <div className="kpi-label">{label}</div>}

        {/* Value */}
        {value && <div className="kpi-value">{value}</div>}

        {/* Sub text */}
        {sub && <div className="kpi-sub">{sub}</div>}

        {/* Spark bar */}
        {sparkPct !== undefined && (
          <div className="kpi-spark">
            <div
              className="kpi-spark-fill"
              style={{
                width: `${Math.min(100, Math.max(0, sparkPct))}%`,
              }}
            />
          </div>
        )}

        {/* Footer */}
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
  );
}
