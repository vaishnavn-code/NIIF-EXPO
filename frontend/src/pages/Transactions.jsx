import React, { useState } from "react";
import {
  VerticalBar,
} from "../components/charts/BarCharts";
import DonutChart from "../components/charts/DonutChart";
import DataTable from "../components/ui/DataTable";
import KpiCard from "../components/ui/KpiCard";
import { TopNSelector } from "../components/ui/helpers";
import { fmt } from "../utils/formatters";
import { TOP_N_OPTIONS } from "../utils/constants";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

function BarLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

        <XAxis dataKey="year" />

        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10 }}
          label={{
            value: "No. of Loans",
            angle: -90,
            position: "insideLeft",
          }}
        />

        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10 }}
          label={{
            value: "Sanction (₹ Bn)",
            angle: 90,
            position: "insideRight",
          }}
        />

        <Tooltip
          formatter={(v, name) =>
            name.includes("Sanction")
              ? [`₹${v} Bn`, name]
              : [v, name]
          }
        />

        <Legend />

        <Bar
          yAxisId="left"
          dataKey="loans"
          fill="#4f8cc9"
          name="No. of Loans"
          radius={[4, 4, 0, 0]}
        />

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sanction"
          stroke="#00acc1"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Sanction (₹ Bn)"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Transactions({ data }) {
  const txn = data?.transactions || {};
  const txnTable = txn.table || [];
  const charts = txn.charts || {};
  const kpis = txn.kpi || {};

  const [topN, setTopN] = useState(10);

  // KPI
  const totalTxn = kpis?.Total_Transactions?.title || 0;
  const avgSanction = kpis?.Average_Sanction?.title || 0;
  const principalRecv = kpis?.Principal_Recieved?.title || 0;
  const currentFY = kpis?.Current_FY_Disb?.title || 0;

  // Loan Size
  const loanSizeData = Object.entries(
    charts["Loan Size Distribution"]?.values || {}
  ).map(([label, value]) => ({
    label,
    count: Number(value),
  }));

  // Yearly
  const yearlyData = Object.entries(
    charts["Disbursments by Year"]?.values || {}
  )
    .map(([year, v]) => ({
      year,
      loans: v.loan_count,
      sanction: +(v.sanction_amount / 1e9).toFixed(2),
    }))
    .sort((a, b) => a.year - b.year);

  // Quarterly
  const quarterlyData = Object.entries(
    charts["Quaterly Sanction Volume"]?.values || {}
  )
    .map(([quarter, v]) => ({
      quarter,
      value: +(v.sanction_amount / 1e9).toFixed(2),
    }))
    .sort((a, b) => a.quarter.localeCompare(b.quarter));

  // Donuts
  const productDonut = Object.entries(
    charts["Product Type"]?.values || {}
  ).map(([name, value]) => ({
    name,
    value,
  }));

  const rateDonut = Object.entries(
    charts["Rate_Band_Split"]?.values || {}
  ).map(([name, value]) => ({
    name,
    value,
  }));

  // %
  const totalRate = rateDonut.reduce((s, r) => s + r.value, 0);
  const rateWithPercent = rateDonut.map((r) => ({
    ...r,
    percent: totalRate ? ((r.value / totalRate) * 100).toFixed(1) : 0,
  }));

  const totalProduct = productDonut.reduce((s, r) => s + r.value, 0);
  const productWithPercent = productDonut.map((r) => ({
    ...r,
    percent: totalProduct
      ? ((r.value / totalProduct) * 100).toFixed(1)
      : 0,
  }));

  // Top Groups
  const topGroupsSanction = (charts["Groups_Sacntion_princ"]?.values || [])
    .slice()
    .sort((a, b) => b.sanction - a.sanction)
    .slice(0, topN)
    .map((g) => ({
      label: g.bp_group,
      value: +(g.sanction / 1e9).toFixed(2),
    }));

  const topGroupsPrincipal = (charts["Groups_Sacntion_princ"]?.values || [])
    .slice()
    .sort((a, b) => b.principal - a.principal)
    .slice(0, topN)
    .map((g) => ({
      label: g.bp_group,
      value: +(g.principal / 1e9).toFixed(2),
    }));

  // Table
  const TXN_COLUMNS = [
    { key: "proposal_id", label: "Proposal ID" },
    { key: "customer", label: "Customer" },
    { key: "group", label: "Group" },
    { key: "product", label: "Product" },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    {
      key: "sanction_amt",
      label: "Sanction",
      render: (v) => fmt.mn(v),
    },
    {
      key: "outstanding_amt",
      label: "Outstanding",
      render: (v) => (
        <span style={{ color: "#1565c0", fontWeight: 700 }}>
          {fmt.mn(v)}
        </span>
      ),
    },
    { key: "rate", label: "Rate" },
    { key: "int_recv", label: "Interest", render: (v) => fmt.mn(v) },
    { key: "princ_recv", label: "Principal", render: (v) => fmt.mn(v) },
    { key: "upcoming_int", label: "Upcoming", render: (v) => fmt.mn(v) },
  ];

  return (
    <div>
      <div className="section-label">Transaction Analytics</div>

      <div className="four-col">
        <KpiCard label="Total Transactions" value={totalTxn} />
        <KpiCard label="Avg Sanction" value={`₹${fmt.mn(avgSanction)}`} />
        <KpiCard label="Principal Received" value={`₹${fmt.bn(principalRecv)}`} />
        <KpiCard label="Current FY Disb" value={currentFY} />
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Loan Size Distribution</div>
          <VerticalBar data={loanSizeData} dataKey="count" nameKey="label" />
        </div>

        <div className="chart-card">
          <div className="chart-title">Disbursements by Year</div>
          <BarLineChart data={yearlyData} />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <VerticalBar data={quarterlyData} dataKey="value" nameKey="quarter" />
        </div>

        <div className="chart-card">
          <DonutChart data={rateDonut} />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <DonutChart data={productDonut} />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <TopNSelector options={TOP_N_OPTIONS} value={topN} onChange={setTopN} />
          <VerticalBar data={topGroupsSanction} dataKey="value" nameKey="label" />
        </div>

        <div className="chart-card">
          <TopNSelector options={TOP_N_OPTIONS} value={topN} onChange={setTopN} />
          <VerticalBar data={topGroupsPrincipal} dataKey="value" nameKey="label" />
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={TXN_COLUMNS}
          rows={txnTable}
          total={txnTable.length}
          page={1}
          totalPages={1}
          onPage={() => {}}
          sortBy={null}
          sortDir={null}
          onSort={() => {}}
          loading={false}
        />
      </div>
    </div>
  );
}