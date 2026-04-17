import React, { useState } from "react";
import {
  VerticalBar,
  HorizontalBar,
  GroupedBar,
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

  // ================= KPI =================
  const totalTxn = kpis?.Total_Transactions?.title || 0;
  const avgSanction = kpis?.Average_Sanction?.title || 0;
  const principalRecv = kpis?.Principal_Recieved?.title || 0;
  const currentFY = kpis?.Current_FY_Disb?.title || 0;

  // ================= GROUP CHART =================
  const groupData =
    charts["Groups_Sacntion_princ"]?.values
      ?.sort((a, b) => b.sanction - a.sanction)
      .slice(0, topN)
      .map((g) => ({
        name: g.bp_group,
        sanction: +(g.sanction / 1e9).toFixed(2),
        principal: +(g.principal / 1e9).toFixed(2),
      })) || [];

  // ================= PRODUCT DONUT =================
  const productDonut = Object.entries(charts["Product Type"]?.values || {}).map(
    ([name, value]) => ({
      name: name.replace(" - Disbursements", ""),
      value,
    }),
  );

  // ================= RATE DONUT =================
  const rateDonut = Object.entries(charts["Rate_Band_Split"]?.values || {}).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  // ================= TABLE =================
  const TXN_COLUMNS = [
    { key: "proposal_id", label: "Proposal ID" },

    { key: "customer", label: "Customer" },

    {
      key: "group",
      label: "Group",
      render: (v) => <span className="spill grey">{v}</span>,
    },

    {
      key: "product",
      label: "Product",
      render: (v) => (
        <span className={`spill ${v.includes("TL") ? "blue" : "teal"}`}>
          {v.includes("TL") ? "TL" : "DEB"}
        </span>
      ),
    },

    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },

    {
      key: "sanction_amt",
      label: "Sanction (₹ Mn)",
      render: (v) => fmt.mn(v),
    },

    {
      key: "outstanding_amt",
      label: "Outstanding",
      render: (v) => (
        <span style={{ fontWeight: 700, color: "#1565c0" }}>{fmt.mn(v)}</span>
      ),
    },

    {
      key: "rate",
      label: "Rate",
      render: (v) => <span className="spill purple">{v}%</span>,
    },

    {
      key: "int_recv",
      label: "Interest",
      render: (v) => fmt.mn(v),
    },

    {
      key: "princ_recv",
      label: "Principal",
      render: (v) => fmt.mn(v),
    },

    {
      key: "upcoming_int",
      label: "Upcoming",
      render: (v) => fmt.mn(v),
    },

    {
      key: "asset_class",
      label: "Asset",
      render: () => <span className="spill green">Std</span>,
    },
  ];

  return (
    <div>
      <div className="section-label">Transaction Analytics</div>

      {/* KPI */}
      <div className="four-col">
        <KpiCard label="Total Transactions" value={totalTxn} />
        <KpiCard label="Avg Sanction" value={`₹${fmt.mn(avgSanction)}`} />
        <KpiCard
          label="Principal Received"
          value={`₹${fmt.bn(principalRecv)}`}
        />
        <KpiCard label="Current FY Disb" value={currentFY} />
      </div>

      {/* GROUP CHART */}
      <div className="chart-card">
        <div className="chart-title">Top Groups — Sanction vs Principal</div>
        <div className="chart-subtitle">₹ BN</div>

        <TopNSelector options={TOP_N_OPTIONS} value={topN} onChange={setTopN} />

        <GroupedBar
          data={groupData}
          nameKey="name"
          series={[
            { key: "sanction", label: "Sanction", color: "var(--blue)" },
            { key: "principal", label: "Principal", color: "var(--green)" },
          ]}
          height={300}
        />
      </div>

      {/* DONUTS */}
      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Product Type</div>
          <DonutChart data={productDonut} height={220} />
        </div>

        <div className="chart-card">
          <div className="chart-title">Rate Band Split</div>
          <DonutChart data={rateDonut} height={220} />
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="card-title">
          Transactions Table
          <span className="card-badge">{txnTable.length} RECORDS</span>
        </div>

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
