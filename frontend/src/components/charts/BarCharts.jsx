import React from "react";

import {
  BarChart,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { buildUnifiedTooltip } from "./ChartTooltip";

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
          interval={0}
          tickLine={false}
          axisLine={false}
          height={60}
          tick={({ x, y, payload }) => {
            const words = payload.value.split(" ");

            return (
              <text
                x={x}
                y={y + 14}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize={10}
                fontFamily="Inter"
                transform={`rotate(-35, ${x}, ${y})`}
              >
                {words.slice(0, 2).map((word, i) => (
                  <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>
                    {word}
                  </tspan>
                ))}
              </text>
            );
          }}
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
          cursor={{ fill: "transparent" }}
          content={buildUnifiedTooltip({
            valueFormatter: (value) =>
              formatter ? formatter(value) : `${value}${unit}`,
          })}
        />
        <defs>
          <linearGradient id="tenorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(71, 136, 208, 1)" />
            <stop offset="100%" stopColor="rgba(144,202,249,0.22)" />
          </linearGradient>

          <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(40, 186, 204, 1)" />
            <stop offset="100%" stopColor="rgba(40, 186, 204, 0.2)" />
          </linearGradient>

          <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(168, 105, 194, 1)" />
            <stop offset="100%" stopColor="rgba(168, 105, 194, 0.2)" />
          </linearGradient>

          <linearGradient id="ratePurpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(145, 67, 177, 1)" />
            <stop offset="100%" stopColor="rgba(145, 67, 177, 0.2)" />
          </linearGradient>

          <linearGradient id="tenorOrangeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(251, 159, 42, 1)" />
            <stop offset="100%" stopColor="rgba(251, 159, 42, 0.2)" />
          </linearGradient>

          <linearGradient id="principalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(77, 145, 81, 1)" />
            <stop offset="100%" stopColor="rgba(77, 145, 81, 0.2)" />
          </linearGradient>
        </defs>

        <Bar
          dataKey={dataKey}
          fill={color?.startsWith("url") ? color : "url(#tenorGradient)"}
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
        barCategoryGap="25%"
        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
      >
        <defs>
          <linearGradient id="hbarBlueGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(220, 238, 253, 1)" />{" "}
            {/* light */}
            <stop offset="100%" stopColor="rgba(111, 164, 221, 1)" />{" "}
            {/* dark */}
          </linearGradient>
        </defs>
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
          width={140}
          tick={{
            fontSize: 11,
            fill: "#5f7ea3",
            fontFamily: "Inter",
            textAnchor: "end",
          }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "transparent" }} // ✅ ADD THIS
          content={buildUnifiedTooltip({
            valueFormatter: (value) =>
              formatter ? formatter(value) : `${value}${unit}`,
          })}
        />
        <Bar
          dataKey={dataKey}
          fill="url(#hbarBlueGrad)"
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
          interval={0}
          tickLine={false}
          axisLine={false}
          height={50}
          tick={({ x, y, payload }) => {
            const words = payload.value.split(" ");

            return (
              <text
                x={x}
                y={y + 8}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize={10}
                fontFamily="Inter"
              >
                {words.slice(0, 2).map((word, i) => (
                  <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>
                    {word}
                  </tspan>
                ))}
              </text>
            );
          }}
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
          cursor={{ fill: "transparent" }} // ✅ ADD THIS
          content={buildUnifiedTooltip({
            valueFormatter: (value) =>
              formatter ? formatter(value) : `${value}${unit}`,
          })}
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

export function VerticalBarWithLineOverview({ data, height = 320 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 22, right: 16, left: 8, bottom: 2 }}
        barCategoryGap="30%"
        barGap={2}
      >
        <defs>
          <linearGradient id="loanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(21,101,192,0.90)" />
            <stop offset="100%" stopColor="rgba(144,202,249,0.24)" />
          </linearGradient>

          <linearGradient id="sanctionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(144,202,249,0.72)" />
            <stop offset="100%" stopColor="rgba(144,202,249,0.10)" />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "#6a9cbf", fontFamily: "Inter" }}
        />
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

        <Tooltip
          cursor={{ fill: "transparent" }}
          content={buildUnifiedTooltip({
            valueFormatter: (value, _name, entry) =>
              entry.dataKey === "loan" ? value : `Rs ${value} Bn`,
          })}
        />

        <Bar
          yAxisId="left"
          dataKey="loan"
          name="No. of Loans"
          fill="url(#loanGrad)"
          radius={[5, 5, 0, 0]}
          maxBarSize={32}
        />

        <Bar
          yAxisId="left"
          dataKey="sanction"
          name="Sanction (Rs Bn)"
          fill="url(#sanctionGrad)"
          radius={[5, 5, 0, 0]}
          maxBarSize={32}
        />

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="outstanding"
          name="Outstanding (Rs Bn)"
          stroke="#00acc1"
          strokeWidth={2.5}
          tension={0.38}
          dot={{
            r: 4,
            stroke: "#fff",
            strokeWidth: 2,
            fill: "#00acc1",
          }}
          activeDot={{ r: 5 }}
          fill="rgba(0,172,193,0.07)"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function VerticalBarWithLineTransactions({ data, height = 320 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 22, right: 16, left: 8, bottom: 2 }}
        barCategoryGap="30%"
        barGap={2}
      >
        <defs>
          <linearGradient id="loanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(21,101,192,0.90)" />
            <stop offset="100%" stopColor="rgba(144,202,249,0.24)" />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="year"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "#6a9cbf", fontFamily: "Inter" }}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10, fill: "#6a9cbf" }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "No. of Loans",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 9, fill: "#6a9cbf" },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: "#00acc1" }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "Sanction (Rs Bn)",
            angle: 90,
            position: "insideRight",
            style: { fontSize: 9, fill: "#00acc1" },
          }}
        />

        <Tooltip
          cursor={{ fill: "transparent" }}
          content={buildUnifiedTooltip({
            valueFormatter: (value, _name, entry) =>
              entry.dataKey === "loans" ? value : `Rs ${value} Bn`,
          })}
        />

        <Legend
          verticalAlign="top"
          align="center"
          iconType="rect"
          wrapperStyle={{
            fontSize: 10,
            color: "#6a9cbf",
            fontFamily: "Inter",
          }}
        />

        <Bar
          yAxisId="left"
          dataKey="loans"
          name="No. of Loans"
          fill="url(#loanGrad)"
          radius={[5, 5, 0, 0]}
          maxBarSize={32}
        />

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sanction"
          name="Sanction (Rs Bn)"
          stroke="#00acc1"
          strokeWidth={2.5}
          tension={0.38}
          dot={{
            r: 4,
            stroke: "#fff",
            strokeWidth: 2,
            fill: "#00acc1",
          }}
          activeDot={{ r: 5 }}
          fill="rgba(0,172,193,0.07)"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Backward-compatible alias.
export function VerticalBarWithLine(props) {
  return <VerticalBarWithLineOverview {...props} />;
}
