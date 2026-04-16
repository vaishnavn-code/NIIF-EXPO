import {
  BarChart,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--white)",
    border: "1px solid var(--border2)",
    borderRadius: 8,
    fontSize: 11,
    fontFamily: "Inter",
  },
};

/** Vertical bar chart */
export function VerticalBar({
  data,
  dataKey,
  nameKey = "label",
  color = "var(--blue)",
  height = 280,
  unit = "",
  formatter,
  barSize = 32, 
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 25, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey={nameKey}
          tick={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "Inter" }}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={48}
          axisLine={false}
        />
        <YAxis
          tick={{
            fontSize: 10,
            fill: "var(--text-muted)",
            fontFamily: "Inter",
          }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatter}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: "transparent" }}
          formatter={(v) => [formatter ? formatter(v) : `${v}${unit}`, dataKey]}
        />
        <defs>
          <linearGradient id="tenorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(71, 136, 208, 1)" />
            <stop offset="100%" stopColor="rgba(144,202,249,0.22)" />
          </linearGradient>
        </defs>

        <Bar
          dataKey={dataKey}
          fill="url(#tenorGradient)"
          radius={[4, 4, 0, 0]}
          maxBarSize={barSize}
          activeBar={false} // ✅ ADD THIS
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bar chart — best for named group comparisons */
export function HorizontalBar({
  data,
  dataKey,
  nameKey = "name",
  color = "var(--blue)",
  height,
  unit = "",
  formatter,
}) {
  const h = height || Math.max(220, data.length * 28);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{
            fontSize: 10,
            fill: "var(--text-muted)",
            fontFamily: "Inter",
          }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatter}
        />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={90}
          tick={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "Inter" }}
          tickLine={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: "transparent" }} // ✅ ADD THIS
          formatter={(v) => [formatter ? formatter(v) : `${v}${unit}`, dataKey]}
        />
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
        >
          <LabelList
            dataKey={dataKey}
            position="right"
            style={{
              fontSize: 9,
              fill: "var(--text-muted)",
              fontFamily: "Inter",
            }}
            formatter={(v) => (formatter ? formatter(v) : `${v}${unit}`)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Multi-series grouped bar */
export function GroupedBar({
  data,
  series,
  nameKey = "name",
  height = 280,
  formatter,
  unit = "",
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <defs>
          {/* Blue gradient (Sanction) */}
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(71, 136, 208, 1)" />
            <stop offset="100%" stopColor="rgba(144,202,249,0.22)" />
          </linearGradient>

          {/* Green gradient (Outstanding) */}
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(160, 227, 236, 1)" />
            <stop offset="100%" stopColor="rgba(178,223,219,0.25)" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey={nameKey}
          axisLine={false}
          tick={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "Inter" }}
          tickLine={false}
          angle={-30}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tick={{
            fontSize: 10,
            fill: "var(--text-muted)",
            fontFamily: "Inter",
          }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: "transparent" }} // ✅ ADD THIS
          formatter={(v) => (formatter ? formatter(v) : `${v}${unit}`)}
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.gradient ? `url(#${s.gradient})` : s.color}
            radius={[3, 3, 0, 0]}
            maxBarSize={20}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VerticalBarWithLine({ data, height = 320 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 25, right: 20, left: 0, bottom: 4 }}
        barCategoryGap="33%"
        barGap={2}
      >
        {/* ✅ Gradients */}
        <defs>
          {/* Loans (dark blue) */}
          <linearGradient id="loanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(21,101,192,0.88)" />
            <stop offset="100%" stopColor="rgba(144,202,249,0.22)" />
          </linearGradient>

          {/* Sanction (light blue) */}
          <linearGradient id="sanctionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(144,202,249,0.72)" />
            <stop offset="100%" stopColor="rgba(144,202,249,0.10)" />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

        {/* X */}
        <XAxis
          dataKey="name"
          axisLine={false}
          tick={{ fontSize: 9, fill: "#6a9cbf", fontFamily: "Inter" }}
        />

        {/* LEFT AXIS */}
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10, fill: "#6a9cbf" }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "Loans / Rs Bn",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 9, fill: "#6a9cbf" },
          }}
        />

        {/* RIGHT AXIS */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: "#00acc1" }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "Outstanding (Rs Bn)",
            angle: 90,
            position: "insideRight",
            style: { fontSize: 9, fill: "#00acc1" },
          }}
        />

        <Tooltip cursor={{ fill: "transparent" }} />

        {/* 🔵 Loans */}
        <Bar
          yAxisId="left"
          dataKey="loan"
          fill="url(#loanGrad)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />

        {/* 🔷 Sanction */}
        <Bar
          yAxisId="left"
          dataKey="sanction"
          fill="url(#sanctionGrad)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />

        {/* 🟢 Outstanding line */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="outstanding"
          stroke="#00acc1"
          strokeWidth={2.5}
          dot={{
            r: 4,
            stroke: "#fff",
            strokeWidth: 2,
            fill: "#00acc1",
          }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}