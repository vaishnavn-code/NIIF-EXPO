import React, { useState } from "react";
import {
  VerticalBar,
  VerticalBarWithLineTransactions,
} from "../components/charts/BarCharts";
import DonutChart from "../components/charts/DonutChart";
import DataTable from "../components/ui/DataTable";
import KpiCard from "../components/ui/KpiCard";
import { TopNSelector } from "../components/ui/helpers";
import { fmt } from "../utils/formatters";
import { TOP_N_OPTIONS } from "../utils/constants";

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
    charts["Loan Size Distribution"]?.values || {},
  ).map(([label, value]) => ({
    label,
    count: Number(value),
  }));

  // Yearly
  const yearlyData = Object.entries(
    charts["Disbursments by Year"]?.values || {},
  )
    .map(([year, v]) => ({
      year,
      loans: v.loan_count,
      sanction: +(v.sanction_amount / 1e9).toFixed(2),
    }))
    .sort((a, b) => a.year - b.year);

  // Quarterly
  const quarterlyData = Object.entries(
    charts["Quaterly Sanction Volume"]?.values || {},
  )
    .map(([quarter, v]) => ({
      quarter,
      value: +(v.sanction_amount / 1e9).toFixed(2),
    }))
    .sort((a, b) => a.quarter.localeCompare(b.quarter));

  // Donuts
  const productDonut = Object.entries(charts["Product Type"]?.values || {}).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  const rateDonut = Object.entries(charts["Rate_Band_Split"]?.values || {}).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  // %
  const totalRate = rateDonut.reduce((s, r) => s + r.value, 0);
  const rateWithPercent = rateDonut.map((r) => ({
    ...r,
    percent: totalRate ? ((r.value / totalRate) * 100).toFixed(1) : 0,
  }));

  const totalProduct = productDonut.reduce((s, r) => s + r.value, 0);
  const productWithPercent = productDonut.map((r) => ({
    ...r,
    percent: totalProduct ? ((r.value / totalProduct) * 100).toFixed(1) : 0,
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
        <span style={{ color: "#1565c0", fontWeight: 700 }}>{fmt.mn(v)}</span>
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
        <KpiCard label="Total Transactions" value={totalTxn} iconName="document"
          badge={{
            label: "Volume",
            bgColor: "#E8F1FF",
            textColor: "#1D4ED8",
          }}/>
        <KpiCard label="Avg Sanction" value={`₹${fmt.mn(avgSanction)}`} iconName="dollar"
          badge={{
            label: "Avg Size",
            bgColor: "#E0F7FA",
            textColor: "#43A047",
          }} />
        <KpiCard
          label="Principal Received"
          value={`₹${fmt.bn(principalRecv)}`}
          iconName="storage"
          badge={{
            label: "Recipts",
            bgColor: "#FFF3E0",
            textColor: "#FB8C00",
          }}

        />
        <KpiCard label="Current FY Disb" value={currentFY} iconName="graph"
          badge={{
            label: "PIPELINE",
            bgColor: "#F3E5F5",
            textColor: "#7B1FA2",
          }} />
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Disbursements by Year</div>
          <div className="chart-subtitle">
            LOAN COUNT (BARS) vs SANCTION ₹ BN (LINE)
          </div>
          <VerticalBarWithLineTransactions data={yearlyData} height={350} />
        </div>

        <div className="chart-card">
          <div className="chart-title">Loan Size Distribution</div>
          <div className="chart-subtitle">SANCTION AMOUNT BUCKETS</div>
          <VerticalBar
            data={loanSizeData}
            dataKey="count"
            nameKey="label"
            height={400}
          />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Quarterly Sanction Volume</div>
          <div className="chart-subtitle">SANCTION ₹ BN — ALL QUARTERS</div>
          <VerticalBar data={quarterlyData} dataKey="value" nameKey="quarter" />
        </div>

        <div className="chart-card">
          <div className="chart-title">Rate Band Split</div>
          <div className="chart-subtitle">LOANS BY INTEREST RATE BUCKET</div>
          <DonutChart data={rateDonut} />

          {/* ✅ LEGEND */}
          <div
            style={{
              marginTop: 16,
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 20px",
            }}
          >
            {rateWithPercent.map((r, i) => (
              <div
                key={r.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                {/* LEFT SIDE */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: [
                        "#1e88e5",
                        "#42a5f5",
                        "#90caf9",
                        "#64b5f6",
                        "#fb8c00",
                        "#ef6c00",
                        "#e53935",
                      ][i % 7],
                    }}
                  />
                  <span>{r.name}</span>
                </div>

                {/* RIGHT SIDE */}
                <span style={{ fontWeight: 600 }}>{r.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Product Type Mix</div>
          <div className="chart-subtitle">TL vs DEB — BY COUNT</div>
          <DonutChart data={productDonut} />
          <div
            style={{
              marginTop: 16,
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              gap: "40px",
              fontSize: 12,
            }}
          >
            {productWithPercent.map((p, i) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* COLOR DOT */}
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: i === 0 ? "#1e88e5" : "#26a69a",
                  }}
                />

                {/* LABEL */}
                <span>{p.name}</span>

                {/* % VALUE */}
                <span style={{ fontWeight: 600 }}>{p.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Top Groups by Sanction</div>
          <div className="chart-subtitle" style={{ marginBottom: "10px" }}>
            ₹ BILLIONS
          </div>
          <TopNSelector
            options={TOP_N_OPTIONS}
            value={topN}
            onChange={setTopN}
          />
          <VerticalBar
            data={topGroupsSanction}
            dataKey="value"
            nameKey="label"
          />
        </div>

        <div className="chart-card">
          <div className="chart-title">Top Groups by Collected</div>
          <div className="chart-subtitle" style={{ marginBottom: "10px" }}>
            ₹ BILLIONS
          </div>
          <TopNSelector
            options={TOP_N_OPTIONS}
            value={topN}
            onChange={setTopN}
          />
          <VerticalBar
            data={topGroupsPrincipal}
            dataKey="value"
            nameKey="label"
          />
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
