import DataTable from "../components/ui/DataTable";
import { fmt } from "../utils/formatters";
import React, { useState, useMemo } from "react";

const COLUMNS = [
  // 🖤 Proposal ID (bold black)
  {
    key: "proposal_id",
    label: "Proposal ID",
    render: (v) => <span style={{ fontWeight: 700, color: "#111" }}>{v}</span>,
  },

  { key: "customer", label: "Customer" },

  {
    key: "group",
    label: "Group",
    render: (v) => <span style={{ fontWeight: 700 }}>{v}</span>,
  },

  // 🔵 Product badge
  {
    key: "product",
    label: "Product",
    render: (v) => (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(21,101,192,0.08)",
          color: "#1565c0",
          padding: "3px 8px",
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#1565c0",
          }}
        />
        {v}
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

  // 🔵 Outstanding bold blue
  {
    key: "outstanding_amt",
    label: "Outstanding (₹ Mn)",
    render: (v) => (
      <span style={{ fontWeight: 700, color: "#1565c0" }}>{fmt.mn(v)}</span>
    ),
  },

  {
    key: "exposure_amt",
    label: "Exposure (₹ Mn)",
    render: (v) => fmt.mn(v),
  },

  // 🟣 Rate badge
  {
    key: "rate",
    label: "Rate",
    render: (v) => (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(168,105,194,0.12)",
          color: "rgba(168,105,194,1)",
          padding: "3px 8px",
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "rgba(168,105,194,1)",
          }}
        />
        {v}%
      </span>
    ),
  },

  {
    key: "int_recv",
    label: "Interest Recv",
    render: (v) => fmt.mn(v),
  },

  {
    key: "upcoming_int",
    label: "Upcoming Int",
    render: (v) => fmt.mn(v),
  },

  // 🟢 Asset class badge
  {
    key: "asset_class",
    label: "Asset Class",
    render: (v) => (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(56,142,60,0.12)",
          color: "rgba(56,142,60,1)",
          padding: "3px 8px",
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "rgba(56,142,60,1)",
          }}
        />
        {v}
      </span>
    ),
  },
];

export default function Loans({ data }) {
  const rows = data?.loan_portfolio?.table || [];

  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return rows.slice(start, start + PER_PAGE);
  }, [rows, page]);

  const totalPages = Math.ceil(rows.length / PER_PAGE);

  return (
    <div>
      <div className="section-label">Loans Analytics</div>

      <div className="card">
        <div className="card-title">
          Loan-Level Summary
          <span className="card-badge">{rows.length} RECORDS</span>
        </div>

        <div className="cio-note">
          Portfolio includes <strong>{rows.length} loan records</strong>.
        </div>

        <DataTable
          columns={COLUMNS}
          rows={paginatedRows}
          total={rows.length}
          page={page}
          totalPages={totalPages}
          onPage={(p) => setPage(p)}
          sortBy={null}
          sortDir={null}
          onSort={() => {}}
          loading={false}
        />
      </div>
    </div>
  );
}
