import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CHART_PALETTE } from '../../utils/constants'
import React from 'react'
import { buildUnifiedTooltip } from './ChartTooltip'

export default function DonutChart({
  data,           // Array<{ name, value }>
  colors,         // optional color array
  height = 200,
  innerRadius = '55%',
  outerRadius = '80%',
  showLegend = true,
  formatter,      // (value) => string
}) {
  const palette = colors || CHART_PALETTE

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip
        cursor={{ fill: "transparent" }}
          content={buildUnifiedTooltip({
            valueFormatter: (value) => (formatter ? formatter(value) : value),
          })}
        />
        {/* {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 10, fontFamily: 'Inter' }}
          />
        )} */}
      </PieChart>
    </ResponsiveContainer>
  )
}
