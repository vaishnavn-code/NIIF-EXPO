import React from "react";
import { fmt } from "../../utils/formatters";

function defaultValueFormatter(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  }

  return value;
}

export function UnifiedChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  showValueBars = true,
}) {
  if (!active || !payload || payload.length === 0) return null;

  const uniqueMap = {};

  payload.forEach((entry) => {
    if (!entry || entry.value === undefined || entry.value === null) return;

    // skip area duplicate (same dataKey)
    if (!uniqueMap[entry.dataKey]) {
      uniqueMap[entry.dataKey] = entry;
    }
  });

  const colorMap = {
    loan: "rgba(21,101,192,0.9)", // blue
    sanction: "rgba(144,202,249,0.9)", // light blue
    outstanding: "#00acc1", // teal
  };

  const rows = Object.values(uniqueMap);

  if (!rows.length) return null;

  const title = labelFormatter ? labelFormatter(label, rows) : label;
  const numericValues = rows
    .map((entry) => Number(entry.value))
    .filter((num) => Number.isFinite(num));
  const maxValue = numericValues.length ? Math.max(...numericValues) : 0;

  return (
    <div
      style={{
        background: "#f4f7fa",
        border: "1px solid var(--border2)",
        borderRadius: 10,
        boxShadow: "0 8px 16px rgba(13, 42, 74, 0.10)",
        minWidth: 176,
        padding: "8px 10px 6px",
        fontFamily: "Inter",
      }}
    >
      {title !== undefined && title !== null && title !== "" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 700,
            color: "#1f3e62",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#2d6fbe",
              flexShrink: 0,
            }}
          />
          {title}
        </div>
      )}

      {rows.map((entry, index) => {
        const markerColor =
          entry.color ||
          entry.stroke ||
          colorMap[entry.dataKey] || // 👈 move this UP
          "#6a9cbf";
        const rawNumeric = Number(entry.value);
        const lineWidthPct =
          showValueBars && Number.isFinite(rawNumeric) && maxValue > 0
            ? Math.max(8, Math.round((rawNumeric / maxValue) * 100))
            : 0;
        const lineColor = markerColor;

        const formattedValue = valueFormatter
          ? valueFormatter(entry.value, entry.name, entry, label)
          : entry.dataKey === "loan" || entry.dataKey === "count"
            ? fmt.int(entry.value) // counts
            : fmt.cr(entry.value); // ₹ Cr everywhere

        return (
          <div
            key={`${entry.dataKey || entry.name || "row"}-${index}`}
            style={{
              paddingTop: index === 0 ? 0 : 7,
              marginTop: index === 0 ? 0 : 7,
              borderTop:
                index === 0 ? "none" : "1px solid rgba(130, 148, 168, 0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: markerColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "#2f4f73",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {entry.name}
                </span>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: index === 0 ? "#0c8fa1" : "#0d2a4a",
                  whiteSpace: "nowrap",
                }}
              >
                {formattedValue}
              </span>
            </div>

            {showValueBars && (
              <div
                style={{
                  marginTop: 5,
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(130, 148, 168, 0.16)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${lineWidthPct}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: lineColor,
                    transition: "width 120ms linear",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function buildUnifiedTooltip(options = {}) {
  return function renderTooltip(props) {
    return <UnifiedChartTooltip {...props} {...options} />;
  };
}
