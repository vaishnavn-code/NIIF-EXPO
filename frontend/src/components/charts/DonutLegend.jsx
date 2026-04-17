import React from "react";

export default function DonutLegend({
  data = [],
  colors = [],
  showPercent = true,
  showValue = false,
}) {
  const total = data.reduce((sum, i) => sum + (i.value || 0), 0);

  const getPercent = (val) =>
    total ? ((val / total) * 100).toFixed(1) + "%" : "0%";

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
            <strong style={{ marginLeft: "6px" }}>
              {getPercent(data[0].value)}
            </strong>
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
            <strong style={{ marginLeft: "6px" }}>
              {getPercent(data[1].value)}
            </strong>
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
          <strong style={{ marginLeft: "6px" }}>
            {getPercent(item.value)}
          </strong>
        </div>
      ))}
    </div>
  );
}
