import React, { useState, useMemo } from "react";
import { HorizontalBar, VerticalBar } from "../components/charts/BarCharts";
import DataTable from "../components/ui/DataTable";
import { TopNSelector } from "../components/ui/helpers";
import { fmt } from "../utils/formatters";
import { TOP_N_OPTIONS } from "../utils/constants";

const COLUMNS = [
  { key: "customer", label: "Customer" },

  {
    key: "group",
    label: "Group",
    render: (v) => <span className="spill grey">{v}</span>,
  },

  {
    key: "sanction_amt",
    label: "Sanction (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "outstanding",
    label: "Outstanding (₹ Cr)",
    render: (v) => (
      <span style={{ fontWeight: 700, color: "#2E6090" }}>
        {fmt.cr(v)}
      </span>
    ),
  },

  {
    key: "exposure",
    label: "Exposure (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "princ_recv",
    label: "Princ Recv (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "int_recv",
    label: "Int Recv (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "avg_rate",
    label: "Avg Rate",
    render: (v) => (
      <span
        style={{
          background: "rgba(123,31,162,0.08)",
          color: "#7b1fa2",
          padding: "3px 8px",
          borderRadius: "10px",
          fontWeight: 600,
          fontSize: "11px",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#7b1fa2",
          }}
        />
        {v}%
      </span>
    ),
  },
];

export default function Borrowers({ data }) {
  const [page, setPage] = useState(1);
const PER_PAGE = 25;
  const [topN, setTopN] = useState({ outstanding: 15, sanction: 15 });

  const borrowersTable = data?.borrowers?.table || [];

  // 🔹 Derived metrics
  const uniqueCustomers = borrowersTable.length;

  const uniqueGroups = new Set(borrowersTable.map((b) => b.group)).size;

  const topCustomer = borrowersTable.reduce(
    (max, b) => (b.outstanding > max ? b.outstanding : max),
    0
  );

  const avgRate =
    borrowersTable.reduce((sum, b) => sum + (b.avg_rate || 0), 0) /
    (borrowersTable.length || 1);

  // 🔹 Charts
  const osData = borrowersTable
    .slice()
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, topN.outstanding)
    .map((c) => ({
      name: c.customer,
      value: c.outstanding
    }));

  const sancData = borrowersTable
    .slice()
    .sort((a, b) => b.sanction_amt - a.sanction_amt)
    .slice(0, topN.sanction)
    .map((c) => ({
      name: c.customer,
      value: c.sanction_amt
    }));

    const paginatedRows = useMemo(() => {
  const start = (page - 1) * PER_PAGE;
  return borrowersTable.slice(start, start + PER_PAGE);
}, [borrowersTable, page]);


const totalPages = Math.ceil(borrowersTable.length / PER_PAGE);

  return (
    <div>
      <div className="section-label">Borrower / Customer View</div>

      {/* CHARTS */}
      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Top {topN.outstanding} Customers by Outstanding</div>
          <div className="chart-subtitle">₹ BILLIONS</div>

          <TopNSelector
            options={TOP_N_OPTIONS}
            value={topN.outstanding}
            onChange={(n) =>
              setTopN((p) => ({ ...p, outstanding: n }))
            }
          />

          <VerticalBar
            data={osData}
            dataKey="value"
            nameKey="name"
            color="url(#intGrad)"
            slantLabels={true}
            isCurrency={true}
            height={360}
            formatter={(v) => `₹${(v / 1e7).toLocaleString("en-IN")} Cr`} 
          />
        </div>

        <div className="chart-card">
          <div className="chart-title">Top {topN.sanction} Customers by Sanction</div>
          <div className="chart-subtitle">₹ BILLIONS</div>

          <TopNSelector
            options={TOP_N_OPTIONS}
            value={topN.sanction}
            onChange={(n) =>
              setTopN((p) => ({ ...p, sanction: n }))
            }
          />

          <VerticalBar
            data={sancData}
            dataKey="value"
            nameKey="name"
            color="url(#intGrad)"
            slantLabels={true}
            isCurrency={true}
            height={360}
            formatter={(v) => `₹${(v / 1e7).toLocaleString("en-IN")} Cr`} 
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="card-title">
          Customer Exposure Register
          <span className="card-badge">
            {uniqueCustomers} CUSTOMERS
          </span>
        </div>

        <div className="cio-note">
          <strong>{uniqueCustomers} customers</strong> across{" "}
          <strong>{uniqueGroups} groups</strong>. Top customer outstanding:{" "}
          <strong>₹{(topCustomer / 1e9).toFixed(2)} Bn</strong>. Avg interest rate:{" "}
          <strong>{avgRate.toFixed(1)}%</strong>.
        </div>

        <DataTable
          columns={COLUMNS}
          rows={paginatedRows}
          total={borrowersTable.length}
          page={page}
          totalPages={totalPages}
          onPage={(p) => setPage(Number(p))}
          sortBy={null}
          sortDir={null}
          onSort={() => {}}
          loading={false}
        />
      </div>
    </div>
  );
}