import DataTable from "../components/ui/DataTable";
import { fmt } from "../utils/formatters";
import React, { useState, useMemo } from "react";

const COLUMNS = [
  {
    key: "proposal_id",
    label: "Proposal ID",
    render: (v) => (
      <span style={{ fontWeight: 700, color: "#111" }}>
        {Number(v)}
      </span>
    ),
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
    label: "Sanction (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  // 🔵 Outstanding bold blue
  {
    key: "outstanding_amt",
    label: "Outstanding (₹ Cr)",
    render: (v) => (
      <span style={{ fontWeight: 700, color: "#2E6090" }}>{fmt.cr(v)}</span>
    ),
  },

  {
    key: "exposure_amt",
    label: "Exposure (₹ Cr)",
    render: (v) => fmt.cr(v),
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
    label: "Interest Recv (₹ Cr)",
    render: (v) => fmt.cr(v),
  },

  {
    key: "upcoming_int",
    label: "Upcoming Int (₹ Cr)",
    render: (v) => fmt.cr(v),
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
  const kpi = data?.exposure?.kpi || {}
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;



  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const totalrecords = kpi?.Total_Records?.Title;
  const tlrecords = kpi?.TL_Disbursements?.Title;
  const debrecords = kpi?.DEB_Disbursements?.Title;

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        !search ||
        row.proposal_id?.toString().includes(search) ||
        row.customer?.toLowerCase().includes(search.toLowerCase()) ||
        row.group?.toLowerCase().includes(search.toLowerCase());

      const matchesProduct =
        !productFilter || row.product === productFilter;

      return matchesSearch && matchesProduct;
    });
  }, [rows, search, productFilter]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredRows.slice(start, start + PER_PAGE);
  }, [filteredRows, page]);

  const totalPages = Math.ceil(filteredRows.length / PER_PAGE);

  return (
    <div>
      <div className="section-label">Loans Analytics</div>

      <div className="card">
        <div className="card-title">
          Loan-Level Summary
          <span className="card-badge">{rows.length} RECORDS</span>
        </div>

        <div class="cio-note">All {totalrecords} disbursement records — {tlrecords} Term Loans and {debrecords} Debentures. Start dates: Feb 2016 - Mar 2026. Maturity: up to Jun 2051. All Standard Assets in INR.
        </div>
        <div className="txn-toolbar">
          <input
            className="txn-search"
            placeholder="Search Proposal, Customer, Group..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // reset page
            }}
          />

          <select
            className="txn-select"
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
              setPage(1); // reset page
            }}
          >
            <option value="">All Products</option>
            <option value="TL - Disbursements">TL - Disbursements</option>
            <option value="DEB - Disbursements">DEB - Disbursements</option>
          </select>

          <button
            className="txn-clear"
            onClick={() => {
              setSearch("");
              setProductFilter("");
              setPage(1);
            }}
          >
            Clear
          </button>

          <span className="txn-count">
            {rows.length} records
          </span>
        </div>

        <DataTable
          columns={COLUMNS}
          rows={paginatedRows}
          total={filteredRows.length}
          page={page}
          totalPages={totalPages}
          onPage={(p) => setPage(Number(p))}
          sortBy={null}
          sortDir={null}
          onSort={() => { }}
          loading={false}
        />
      </div>
    </div>
  );
}
