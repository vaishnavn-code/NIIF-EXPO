import { useState, useCallback, useMemo } from "react";
import {
  HorizontalBar,
  GroupedBar,
  VerticalBar,
} from "../components/charts/BarCharts";
import DataTable from "../components/ui/DataTable";
import { TopNSelector } from "../components/ui/helpers";
import KpiCard from "../components/ui/KpiCard";
import { usePaginatedData } from "../hooks/useDashboardData";
import { dashboardApi } from "../api/client";
import { fmt } from "../utils/formatters";
import { TOP_N_OPTIONS } from "../utils/constants";
import React from "react";

const COLUMNS = [
  {
    key: "bp_group",
    label: "Group",
    render: (v) => (
      <span style={{ fontWeight: 700, color: "#111" }}>
        {v}
      </span>
    ),
  },

  { key: "loan_count", label: "Loans" },

  {
    key: "sanction_amt",
    label: "Sanction (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "loan_amt",
    label: "Loan Amt (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "outstanding_amt",
    label: "Outstanding (₹ Cr)",
    render: (v) => (
      <span style={{ fontWeight: 700, color: "#2E6090" }}>
        {fmt.cr(v)}
      </span>
    ),
  },

  {
    key: "exposure_amt",
    label: "Exposure (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "principle_recv", // correct key
    label: "Princ Recv (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "int_recv",
    label: "Int Recv (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "upcoming_int",
    label: "Upcoming Int (₹ Cr)",
    render: (v) => fmt.cr(v),
  },
  {
    key: "avg_rate",
    label: "Avg Rate",
    render: (_, row) => {
      const outstanding = Number(row.outstanding_amt || 0);
      const interest = Number(row.int_recv || 0);

      const rate =
        outstanding > 0 ? ((interest / outstanding) * 100).toFixed(1) : 0;

      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(21,101,192,0.08)",
            color: "#1565c0",
            padding: "3px 8px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "11px",
          }}
        >
          {/* blue dot */}
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#1565c0",
            }}
          />
          {rate}%
        </span>
      );
    },
  },
];

export default function Exposure({ data }) {
  console.log("Exposure data:", data);
  const kpis = data?.exposure?.kpi || {};
  const exposureTable = data?.exposure?.table || [];
  const [topN, setTopN] = useState({
    hbar: 15,
    triple: 8,
    intBar: 15,
    rateBar: 15,
  });
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 25;
  const fetcher = useCallback((p) => dashboardApi.getGroups(p), []);
  const { rows, total, totalPages, loading, params, updateParams } =
    usePaginatedData(fetcher, {
      sort_by: "outstanding_amt",
      sort_dir: "desc",
      per_page: 20,
    });

  const allFetcher = useCallback(
    (p) => dashboardApi.getGroups({ ...p, per_page: 100 }),
    [],
  );
  const { rows: allGroups } = usePaginatedData(allFetcher, {
    sort_by: "outstanding_amt",
    sort_dir: "desc",
  });

  const hBarData = useMemo(() => {
    if (!exposureTable.length) return [];

    return exposureTable
      .map((item) => ({
        name: item.bp_group,
        value: Number(item.outstanding_amt || 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN.hbar);
  }, [exposureTable, topN.hbar]);

  const tripleData = useMemo(() => {
    if (!exposureTable.length) return [];

    return exposureTable
      .map((g) => ({
        name: g.bp_group,

        // CORRECT KEYS
        Sanction: Number(g.sanction_amt || 0),
        "Loan Amt": Number(g.loan_amt || 0),
        Outstanding: Number(g.outstanding_amt || 0),
      }))
      .sort((a, b) => b.Outstanding - a.Outstanding) // 🔥 important
      .slice(0, topN.triple);
  }, [exposureTable, topN.triple]);

  const intBarData = useMemo(() => {
    if (!exposureTable.length) return [];

    return exposureTable
      .map((g) => ({
        name: g.bp_group,
        value: Number(g.int_recv || 0), // ₹ Mn
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN.intBar);
  }, [exposureTable, topN.intBar]);

  const rateBarData = useMemo(() => {
    if (!exposureTable.length) return [];

    return exposureTable
      .map((g) => ({
        name: g.bp_group,

        // 🎯 MOCK RANDOM RATE (6% - 14%)
        value: Number((6 + Math.random() * 8).toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN.rateBar);
  }, [exposureTable, topN.rateBar]);

const handleSearch = (e) => {
  setSearch(e.target.value);
  updateParams({ page: 1 }); 
};
  const handleSort = (key) => {
    const dir =
      params.sort_by === key && params.sort_dir === "desc" ? "asc" : "desc";
    updateParams({ sort_by: key, sort_dir: dir });
  };

  const KPI_ORDER = [
    "Total_Records",
    "Borrower_Groups",
    "TL_Disbursements",
    "DEB_Disbursements",
  ];
const filteredRows = useMemo(() => {
  const source = allGroups?.length ? allGroups : exposureTable;

  if (!search) return source;

  return source.filter((row) =>
    row.bp_group?.toLowerCase().includes(search.toLowerCase())
  );
}, [search, allGroups, exposureTable]);
const paginatedRows = useMemo(() => {
  const start = (params.page - 1) * PAGE_SIZE;
  return filteredRows.slice(start, start + PAGE_SIZE);
}, [filteredRows, params.page]);
const totalPagesLocal = Math.ceil(filteredRows.length / PAGE_SIZE);  return (
    <div>
      <div className="section-label">Exposure Analytics — Group Breakdown</div>

      <div className="four-col">
        {KPI_ORDER.map((key, index) => {
          console.log("Exposure KPI:", data?.exposure?.kpi);
          const item = kpis[key];
          if (!item) return null;

          return (
            <KpiCard
              key={key}
              label={item.Subtitle}
              value={Number(item.Title)}
              footer={item.Footer}
              accent={`c${index + 1}`}
            />
          );
        })}
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Outstanding Amount by Group</div>
          <div className="chart-subtitle">HORIZONTAL BAR · ₹ Cr</div>
          <TopNSelector
            options={TOP_N_OPTIONS}
            value={topN.hbar}
            onChange={(n) => setTopN((p) => ({ ...p, hbar: n }))}
          />
          <HorizontalBar
            data={hBarData}
            dataKey="value"
            nameKey="name"
            height={320}
            barSize={18}
            formatter={(v) => `₹${(v / 1e7).toLocaleString("en-IN")} Cr`}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Sanction vs Loan vs Outstanding</div>
          <div className="chart-subtitle" style={{ marginBottom: "20px" }}>
            TOP {topN.triple} GROUPS · 3-WAY ₹ BN
          </div>
          <GroupedBar
            data={tripleData}
            nameKey="name"
            series={[
              {
                key: "Sanction",
                label: "Sanction",
                gradient: "blueGrad", //  same as other charts
              },
              {
                key: "Loan Amt",
                label: "Loan Amt",
                color: "rgba(123, 214, 226, 1)", // your color
              },
              {
                key: "Outstanding",
                label: "Outstanding",
                color: "rgba(252, 218, 172, 1)", //  your color
              },
            ]}
            height={300}
            formatter={(v) => `₹${(v / 1e7).toLocaleString("en-IN")} Cr`}
          />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Interest Received by Group</div>
          <div className="chart-subtitle">₹ Cr</div>
          <TopNSelector
            options={TOP_N_OPTIONS}
            value={topN.intBar}
            onChange={(n) => setTopN((p) => ({ ...p, intBar: n }))}
          />
          <VerticalBar
            data={intBarData}
            dataKey="value"
            nameKey="name"
            color="url(#intGrad)"
            height={360}
            barSize={30}
            slantLabels={true}
            isCurrency={true}
            formatter={(v) => `₹${(v / 1e7).toLocaleString("en-IN")} Cr`}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Avg Interest Rate per Group</div>
          <div className="chart-subtitle">RATE COMPARISON %</div>
          <TopNSelector
            options={TOP_N_OPTIONS}
            value={topN.rateBar}
            onChange={(n) => setTopN((p) => ({ ...p, rateBar: n }))}
          />
          <VerticalBar
            data={rateBarData}
            dataKey="value"
            nameKey="name"
            color="url(#rateGrad)"
            height={360}
            barSize={30}
            unit="%"
            slantLabels={true}
            formatter={(v) => `${v}%`}
          />
        </div>
      </div>

      <div className="section-label">Group Summary Table</div>
      <div className="card">
        <div className="card-title">
          Group-Level Exposure Summary
          <span className="card-badge">{exposureTable.length} GROUPS</span>
        </div>
        <div className="cio-note">
          Portfolio covers <strong>{exposureTable.length} borrower groups</strong>
          with active exposure data.
        </div>
        <div className="toolbar">
          <input
            className="toolbar-input"
            placeholder="Search Group Name…"
            value={search}
            onChange={handleSearch}
          />
          <button
            className="toolbar-btn"
            onClick={() => {
              setSearch("");
              updateParams({ search: "", page: 1 });
            }}
          >
            Clear
          </button>
          <span className="toolbar-count">
            {total.toLocaleString("en-IN")} groups
          </span>
        </div>
        <DataTable
          columns={COLUMNS}
          rows={paginatedRows}
          total={filteredRows.length}
          page={params.page}
          totalPages={totalPagesLocal}
          onPage={(p) => updateParams({ page: p })}
          sortBy={params.sort_by}
          sortDir={params.sort_dir}
          onSort={handleSort}
          loading={loading}
        />
      </div>
    </div>
  );
}
