import { useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { buildUnifiedTooltip } from './ChartTooltip'

const GRANULARITIES = [
  { key: 'yearly',    label: 'Yearly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'monthly',   label: 'Monthly' },
]

export default function ActivityChart({ timeseries }) {
  const [gran, setGran] = useState('yearly')

  const chartData = useMemo(() => {
    const pts = timeseries?.[gran] ?? []
    return pts.map((p) => ({
      period:      p.period,
      Loans:       p.count,
      'Loan Amt':  p.loan_amt_bn,
      Outstanding: p.outstanding_bn,
    }))
  }, [timeseries, gran])

  return (
    <div className="chart-card" style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div className="chart-title">Disbursement Activity Trend</div>
          <div className="chart-subtitle">{gran.toUpperCase()} · LOAN AMT (₹ BN) + COUNT</div>
        </div>
        <div className="act-tabs">
          {GRANULARITIES.map((g) => (
            <button
              key={g.key}
              className={`act-tab${gran === g.key ? ' active' : ''}`}
              onClick={() => setGran(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: 'var(--teal)', fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={buildUnifiedTooltip({
              valueFormatter: (value, _name, entry) =>
                entry.dataKey === 'Loans' ? value : `Rs ${value} Bn`,
            })}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Inter' }} />
          <Bar yAxisId="left" dataKey="Loans" fill="rgba(21,101,192,0.85)" radius={[3,3,0,0]} maxBarSize={28} />
          <Bar yAxisId="left" dataKey="Loan Amt" fill="rgba(144,202,249,0.7)" radius={[3,3,0,0]} maxBarSize={28} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Outstanding"
            stroke="var(--teal)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--teal)', r: 3, strokeWidth: 2, stroke: '#fff' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
