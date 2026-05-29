import React from "react";

export default function DonutLegend({
  data = [],
  colors = [],
  showPercent = true,
  showValue = false,
  valueFormatter,
}) {
  const total = data.reduce((sum, i) => sum + (i.value || 0), 0);

  const getPercent = (val) =>
    total ? ((val / total) * 100).toFixed(1) + "%" : "0%";

  const getValue = (val) =>
    valueFormatter ? valueFormatter(val || 0) : String(val || 0);

  const renderStats = (item) => {
    if (showValue && showPercent) {
      return (
        <strong style={{ marginLeft: "6px" }}>
          {getValue(item.value)}
          <span style={{ marginLeft: "10px" }}>
            ({getPercent(item.value)})
          </span>
        </strong>
      );
    }

    if (showValue) {
      return <strong style={{ marginLeft: "6px" }}>{getValue(item.value)}</strong>;
    }

    if (showPercent) {
      return <strong style={{ marginLeft: "6px" }}>{getPercent(item.value)}</strong>;
    }

    return null;
  };

  return (
    <div style={{ marginTop: "12px", fontSize: "12px" }}>
      {/* TOP ROW */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        {/* LEFT */}
        {data[0] && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: colors[0],
              }}
            />
            {data[0].name}
            {renderStats(data[0])}
          </div>
        )}

        {/* RIGHT */}
        {data[1] && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: colors[1],
              }}
            />
            {data[1].name}
            {renderStats(data[1])}
          </div>
        )}
      </div>

      {/* BOTTOM ROW */}
      {data.slice(2).map((item, index) => (
        <div
          key={item.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: colors[index + 2],
            }}
          />
          {item.name}
          {renderStats(item)}
        </div>
      ))}
    </div>
  );
}
