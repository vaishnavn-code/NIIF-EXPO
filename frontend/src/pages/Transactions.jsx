import React, { useState, useMemo } from "react";
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
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState("");
  const [rate, setRate] = useState("");
  const [tenor, setTenor] = useState("");

  const txn = data?.transactions || {};
  const customer = data?.overview?.kpi || {};
  const txnTable = txn.table || [];
  const charts = txn.charts || {};
  const kpis = txn.kpi || {};

  const [topN, setTopN] = useState(10);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  // KPI
  const totalTxn = kpis?.Total_Transactions?.title || 0;
  const totalCust = customer?.Total_Sanction?.Footer || 0;
  const avgSanction = kpis?.Average_Sanction?.title || 0;
  const principalRecv = kpis?.Principal_Recieved?.title || 0;
  const currentFY = kpis?.Current_FY_Disb?.title || 0;

  const RATE_COLORS = [
    "#1565c0",
    "#1e88e5",
    "#42a5f5",
    "#90caf9",
    "#fb8c00",
    "#e65100",
    "#c62828",
  ];

  // Loan Size
  const loanSizeData = Object.entries(
    charts["Loan Size Distribution"]?.values || {},
  ).map(([label, value]) => ({
    label,
    value: Number(value),
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
    .sort((a, b) => a.quarter.localeCompare(b.quarter))
    .slice(-8);

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

  const TXN_COLUMNS = [
    {
      key: "proposal_id",
      label: "Proposal ID",
      render: (v) => {
        if (!v) return "";

        const cleaned = String(v).replace(/^0+/, "") || "0";

        return <span style={{ fontWeight: 700 }}>{cleaned}</span>;
      },
    },
    { key: "customer", label: "Customer" },
    {
      key: "group",
      label: "Group",
      render: (v) => <span className="spill grey">{v}</span>,
    },
    {
      key: "product",
      label: "Product",
      render: (v) => {
        if (!v) return "";

        const type = v.split("-")[0].trim().toUpperCase();

        const styles = {
          base: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            width: "fit-content",
          },
          dot: (color) => ({
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
          }),
        };

        const config = {
          TL: {
            bg: "#E3F2FD",
            text: "#1565C0",
            dot: "#1565C0",
          },
          DEB: {
            bg: "#E0F7FA",
            text: "#00ACC1",
            dot: "#00ACC1",
          },
        };

        const cfg = config[type] || {
          bg: "#ECEFF1",
          text: "#607D8B",
          dot: "#607D8B",
        };

        return (
          <span
            style={{
              ...styles.base,
              background: cfg.bg,
              color: cfg.text,
            }}
          >
            <span style={styles.dot(cfg.dot)} />
            {type}
          </span>
        );
      },
    },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    {
      key: "sanction_amt",
      label: "Sanction",
      render: (v) => fmt.cr(v),
    },
    {
      key: "outstanding_amt",
      label: "Outstanding",
      render: (v) => (
        <span style={{ color: "#2E6090", fontWeight: 700 }}>{fmt.cr(v)}</span>
      ),
    },
    {
      key: "exposure_amt",
      label: "Exposure",
      render: (v) => fmt.cr(v),
    },
    {
      key: "rate",
      label: "Rate",
      render: (v) => {
        if (v === null || v === undefined) return "";

        const rate = Number(v);

        let bg = "#E3F2FD"; // default (blue-ish)
        let text = "#1E88E5";

        if (rate < 8) {
          bg = "#E8F5E9"; // light green
          text = "#43A047";
        } else if (rate > 9) {
          bg = "#FFF3E0"; // light orange
          text = "#FB8C00";
        }

        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: bg,
              color: text,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: text,
              }}
            />
            {rate}%
          </span>
        );
      },
    },
    { key: "princ_recv", label: "Principal", render: (v) => fmt.cr(v) },
    { key: "int_recv", label: "Interest", render: (v) => fmt.cr(v) },
    { key: "upcoming_int", label: "Upcoming", render: (v) => fmt.cr(v) },
    {
      key: "asset_class",
      label: "Asset Class",
      render: (v) => {
        if (!v) return "";

        const styles = {
          base: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            width: "fit-content",
            background: "#E8F5E9",
            color: "#43A047",
          },
          dot: {
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#43A047",
          },
        };

        return (
          <span style={styles.base}>
            <span style={styles.dot} />
            {v}
          </span>
        );
      },
    },
  ];

  const filteredRows = useMemo(() => {
    return txnTable.filter((row) => {
      const matchSearch =
        !search ||
        row.proposal_id?.toString().includes(search) ||
        row.customer?.toLowerCase().includes(search.toLowerCase()) ||
        row.group?.toLowerCase().includes(search.toLowerCase());
      const matchProduct =
        !product || row.product?.toUpperCase().includes(product);

      const r = Number(row.rate || 0);
      const matchRate =
        !rate ||
        (rate === "low" && r < 8) ||
        (rate === "mid" && r >= 8 && r <= 9) ||
        (rate === "high" && r > 9);

      let matchTenor = true;
      if (tenor) {
        const start = new Date(row.start_date);
        const end = new Date(row.end_date);
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365);

        matchTenor =
          (tenor === "short" && years < 10) ||
          (tenor === "medium" && years >= 10 && years <= 15) ||
          (tenor === "long" && years > 15);
      }

      return matchSearch && matchProduct && matchRate && matchTenor;
    });
  }, [txnTable, search, product, rate, tenor]);

  const paginatedRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);

  const totalTxnSub =
    kpis?.Total_Transactions?.subtitle?.join?.(" ") ||
    kpis?.Total_Transactions?.subtitle ||
    "";

  const avgSanctionSub = kpis?.Average_Sanction?.subtitle || "";

  const principalSub = kpis?.Principal_Recieved?.subtitle || "";

  const currentFYSub = kpis?.Current_FY_Disb?.subtitle || "";

  const formatDisplay = (v) => {
    if (v === null || v === undefined || v === "") return "-";

    const str = String(v);

    // Extract numeric part
    const num = parseFloat(str.replace(/₹|,|Cr|%|Bn|Mn/gi, ""));

    if (isNaN(num)) return v;

    // % case
    if (str.includes("%")) {
      return `${num.toFixed(2)} %`;
    }

    // Already in Cr
    if (str.toLowerCase().includes("cr")) {
      return `₹${num.toLocaleString("en-IN")} Cr`;
    }

    // Already in Bn
    if (str.toLowerCase().includes("bn")) {
      return `₹${(num * 100).toLocaleString("en-IN")} Cr`;
    }

    // RAW INR → convert to Cr
    return `₹${(num / 1e7).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })} Cr`;
  };

  return (
    <div>
      <div className="section-label">Transaction Analytics</div>

      <div className="four-col">
        <KpiCard
          label="Total Transactions"
          value={totalTxn}
          sub={totalTxnSub} // ✅ added
          sparkPct={100}
          footer={kpis?.Total_Transactions?.footer}
          iconName="document"
          accent="c1"
          badge={{
            label: "Volume",
            bgColor: "#E8F1FF",
            textColor: "#1D4ED8",
          }}
        />

        <KpiCard
          label="Avg Sanction"
          value={formatDisplay(avgSanction)}
          sub={avgSanctionSub}
          footer={kpis?.Average_Sanction?.footer}
          iconName="dollar"
          sparkPct={80}
          accent="c2"
          badge={{
            label: "Avg Size",
            bgColor: "#E0F7FA",
            textColor: "#00ACC1",
          }}
        />

        <KpiCard
          label="Principal Received"
          value={formatDisplay(principalRecv)}
          sub={principalSub}
          footer={kpis?.Principal_Recieved?.footer}
          iconName="storage"
          sparkPct={60}
          accent="c3"
          badge={{
            label: "Receipts",
            bgColor: "#E8F5E9",
            textColor: "#43A047",
          }}
        />

        <KpiCard
          label="Current FY Disb"
          value={currentFY}
          sub={currentFYSub}
          footer={kpis?.Current_FY_Disb?.footer}
          iconName="graph"
          sparkPct={30}
          accent="c4"
          badge={{
            label: "Pipeline",
            bgColor: "#FFF3E0",
            textColor: "#FB8C00",
          }}
        />
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
            dataKey="value"
            nameKey="label"
            height={400}
            formatter={(v) => `₹${Number(v).toLocaleString("en-IN")} Cr`}
          />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Quarterly Sanction Volume</div>
          <div className="chart-subtitle">SANCTION ₹ BN — ALL QUARTERS</div>
          <VerticalBar
            data={quarterlyData}
            dataKey="value"
            nameKey="quarter"
            height={400}
            formatter={(v) => `₹${Number(v).toLocaleString("en-IN")} Cr`}
          />
        </div>

        <div className="chart-card">
          <div className="chart-title">Rate Band Split</div>
          <div className="chart-subtitle">LOANS BY INTEREST RATE BUCKET</div>
          <DonutChart data={rateDonut} colors={RATE_COLORS} />
          <div
            style={{
              marginTop: 16,
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: 30,
              rowGap: 8,
              fontSize: 12,
            }}
          >
            {rateWithPercent.map((item, idx) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: RATE_COLORS[idx % RATE_COLORS.length],
                      flexShrink: 0,
                    }}
                  />
                  <span>{item.name}</span>
                </span>
                <strong style={{ marginLeft: "auto", textAlign: "right" }}>
                  {Number(item.value || 0).toLocaleString("en-IN")}
                  <span style={{ marginLeft: 8 }}>({item.percent}%)</span>
                </strong>
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
            formatter={(v) => `₹${Number(v).toLocaleString("en-IN")} Cr`}
            slantLabels={true}
            height={400}
          />
        </div>

        <div className="chart-card">
          <div className="chart-title">Top Groups by Principal Collected</div>
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
            slantLabels={true}
            height={400}
            formatter={(v) => `₹${Number(v).toLocaleString("en-IN")} Cr`}
          />
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

                {/* VALUE + % */}
                <span style={{ fontWeight: 600 }}>
                  {Number(p.value || 0).toLocaleString("en-IN")}
                  <span style={{ marginLeft: 8 }}>({p.percent}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div class="card-title">
          All Disbursements <span className="card-badge" id="txnBadge"></span>
        </div>
        <div className="cio-note">
          Searchable register of all {totalTxn} disbursement transactions across{" "}
          {totalCust}. Filter by product, rate band, or tenor.
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
            value={product}
            onChange={(e) => {
              setProduct(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Products</option>
            <option value="TL">TL</option>
            <option value="DEB">DEB</option>
          </select>

          <select
            className="txn-select"
            value={rate}
            onChange={(e) => {
              setRate(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Rates</option>
            <option value="low">Rate &lt; 8%</option>
            <option value="mid">Rate 8–9%</option>
            <option value="high">Rate &gt; 9%</option>
          </select>

          <select
            className="txn-select"
            value={tenor}
            onChange={(e) => {
              setTenor(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Tenors</option>
            <option value="short">&lt; 10 yrs</option>
            <option value="medium">10–15 yrs</option>
            <option value="long">&gt; 15 yrs</option>
          </select>

          <button
            className="txn-clear"
            onClick={() => {
              setSearch("");
              setProduct("");
              setRate("");
              setTenor("");
              setPage(1);
            }}
          >
            Clear
          </button>

          <span className="txn-count">{filteredRows.length} records</span>
        </div>

        <DataTable
          columns={TXN_COLUMNS}
          rows={paginatedRows}
          total={filteredRows.length}
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
