import { useMemo, useState } from "react";
import KpiCard from "../components/ui/KpiCard";
import ActivityChart from "../components/charts/ActivityChart";
import DonutChart from "../components/charts/DonutChart";
import {
  VerticalBar,
  GroupedBar,
  VerticalBarWithLine,
} from "../components/charts/BarCharts";
import { Spinner, ErrorMsg } from "../components/ui/helpers";
import { useInsights } from "../hooks/useDashboardData";
import { fmt } from "../utils/formatters";
import DonutLegend from "../components/charts/DonutLegend";

export default function Overview({ data }) {
  const {
    insights,
    loading: aiLoading,
    error: aiError,
    generate,
  } = useInsights();

  // const { kpis: k, computed: c, product_types, timeseries, rate_dist, tenor_dist } = {
  //   kpis: {
  //     total_sanction: data.render_state.totals.total_sanction,
  //     total_exposure: data.render_state.totals.total_exposure,
  //     total_prin_rec: data.render_state.totals.total_prin_rec,
  //     total_os_amt: data.render_state.totals.total_os_amt,
  //     sanction_amt: data.render_state.totals.total_sanction,
  //     outstanding_amt: data.render_state.totals.total_os_amt,
  //     loan_amt: data.render_state.totals.loan_amt,
  //     principal_received: data.render_state.totals.total_prin_rec,
  //     interest_received: 0, // placeholder
  //   },
  //   computed: {
  //     total_records: data.row_count,
  //     unique_proposals: 0, // placeholder
  //     unique_groups: data.render_state.totals.lv_grp_cnt,
  //     unique_customers: data.render_state.totals.lv_cust_cnt,
  //     min_rate: 0, // placeholder
  //     max_rate: 0, // placeholder
  //     avg_rate: 0, // placeholder
  //   },
  //   product_types: [], // placeholder
  //   timeseries: { yearly: [], quarterly: [] }, // placeholder
  //   rate_dist: [], // placeholder
  //   tenor_dist: [], // placeholder
  // }
  const [topN, setTopN] = useState(15);
  const [viewMode, setViewMode] = useState("monthly");

  const kpi = data?.overview?.kpi || {};
  const productDonut = useMemo(() => {
    const productChart = data?.overview?.charts?.find(
      (c) => c.title === "Product type",
    );

    if (!productChart) return [];

    return Object.entries(productChart.values).map(([key, value]) => ({
      name: key.replace(" - Disbursements", ""),
      value: parseFloat(value || 0),
    }));
  }, [data]);

  const tenorChartData = useMemo(() => {
    const tenorChart = data?.overview?.charts?.find(
      (c) => c.title === "Tenor Distribution",
    );

    if (!tenorChart) return [];

    return Object.entries(tenorChart.values).map(([label, count]) => ({
      label,
      count: parseInt(count || 0),
    }));
  }, [data]);

  const rateChartData = useMemo(() => {
    const rateChart = data?.overview?.charts?.find(
      (c) => c.title === "Rate Distribution",
    );

    if (!rateChart) return [];

    return Object.entries(rateChart.values).map(([label, count]) => ({
      label,
      count: parseInt(count || 0),
    }));
  }, [data]);

  const collectionDonut = useMemo(() => {
    const collectionChart = data?.overview?.charts?.find(
      (c) => c.title === "Collections Overview",
    );

    if (!collectionChart) return [];

    return [
      {
        name: "Principal Received",
        value: parseFloat(collectionChart.values["Principal Recieved"] || 0),
      },
      {
        name: "Interest Received",
        value: parseFloat(collectionChart.values["Interest Recieved"] || 0),
      },
      {
        name: "Outstanding Remaining",
        value: parseFloat(collectionChart.values["Outstanding Remaining"] || 0),
      },
    ];
  }, [data]);

  const topGroupsOutstanding = useMemo(() => {
    const groupChart = data?.overview?.charts?.find(
      (c) => c.title === "Group by Outsanding & Sanction",
    );

    if (!groupChart) return [];

    return groupChart.values
      .map((item) => ({
        label: item.bp_group,
        count: parseFloat(item.outstanding || 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  }, [data, topN]);

  const topGroupsDual = useMemo(() => {
    const groupChart = data?.overview?.charts?.find(
      (c) => c.title === "Group by Outsanding & Sanction",
    );

    if (!groupChart) return [];

    return groupChart.values
      .map((item) => ({
        name: item.bp_group,
        sanction: parseFloat(item.sanction || 0),
        outstanding: parseFloat(item.outstanding || 0),
      }))
      .sort((a, b) => b.outstanding - a.outstanding) // ✅ sort by outstanding
      .slice(0, 10); // ✅ top 10
  }, [data]);

  const disbursementData = useMemo(() => {
  const chart = data?.overview?.charts?.find(
    (c) => c.title === "Disbursements Activity"
  );

  if (!chart) return [];

  const raw = Object.entries(chart.values).map(([date, val]) => ({
    date,
    label: date,
    loan: +val.loan_count,
    sanction: +val.sanction_amount,
    outstanding: +val.outstanding,
    quarter: val.Quater,
    year: val.Year,
  }));

  // ✅ HANDLE AUTO
  const mode = viewMode === "auto" ? "quarterly" : viewMode;

  if (mode === "monthly") {
    return raw.map((r) => ({
      name: r.date,
      loan: r.loan,
      sanction: r.sanction,
      outstanding: r.outstanding,
    }));
  }

  const groupBy = (key) => {
    const map = {};
    raw.forEach((r) => {
      const k = r[key];

      if (!map[k]) {
        map[k] = { name: k, loan: 0, sanction: 0, outstanding: 0 };
      }

      map[k].loan += r.loan;
      map[k].sanction += r.sanction;
      map[k].outstanding += r.outstanding;
    });

    return Object.values(map);
  };

  if (mode === "quarterly") return groupBy("quarter");
  if (mode === "yearly") return groupBy("year");

  return [];
}, [data, viewMode]);

  // const rateSparkPct =
  //   c.max_rate > c.min_rate
  //     ? ((c.avg_rate - c.min_rate) / (c.max_rate - c.min_rate)) * 100
  //     : 50;

  // const productDonut = useMemo(() =>
  //   product_types.map((p) => ({ name: p.label.replace(' - Disbursements', ''), value: p.outstanding_bn })),
  // [product_types])

  // const productDonut = useMemo(() => {
  //   const products = data?.render_state?.products || [];

  //   console.log("ACTUAL PRODUCTS:", products);

  //   if (!products.length) return [];

  //   return products.map((p) => {
  //     const label = (p.zprd_desc || "").toUpperCase();

  //     let name = "OTHER";
  //     if (label.includes("TL")) name = "TL";
  //     else if (label.includes("DEB")) name = "DEB";

  //     const raw = parseFloat(p.zos_amt);

  //     return {
  //       name,
  //       value: parseFloat((raw / 1e7).toFixed(2)), // CR
  //     };
  //   });
  // }, [data]);

  // const collectionDonut = useMemo(() => [
  //   { name: 'Principal Received', value: parseFloat((k.principal_received / 1e9).toFixed(2)) },
  //   { name: 'Interest Received',  value: parseFloat((k.interest_received / 1e9).toFixed(2)) },
  //   { name: 'Remaining O/S',      value: parseFloat(((k.outstanding_amt - k.principal_received) / 1e9).toFixed(2)) },
  // ], [k])

  // const collectionDonut = useMemo(
  //   () => [
  //     {
  //       name: "Principal Received",
  //       value: parseFloat((k.principal_received / 1e7).toFixed(2)),
  //     },
  //     {
  //       name: "Interest Received",
  //       value: parseFloat((k.interest_received / 1e7).toFixed(2)),
  //     },
  //     {
  //       name: "Remaining O/S",
  //       value: parseFloat(
  //         ((k.outstanding_amt - k.principal_received) / 1e7).toFixed(2),
  //       ),
  //     },
  //   ],
  //   [],
  // );

  // const tenorChartData = tenor_dist.map((t) => ({
  //   label: t.label,
  //   count: t.count,
  // }));
  // const rateChartData = rate_dist.map((r) => ({
  //   label: r.label,
  //   count: r.count,
  // }));

  return (
    <div>
      <div className="section-label">Portfolio KPIs — All Figures in INR</div>
      <div className="four-col">
        {/* <KpiCard
          label="Total Sanction"
          value={fmt.cr(k.total_sanction)}
          sub={`${fmt.int(c.total_records)} records · ${fmt.int(c.unique_proposals)} proposals`}
          footer={`${c.unique_groups} Borrower Groups · ${c.unique_customers} Customers`}
          sparkPct={100}
          accent="c1"
        /> */}

        <KpiCard
          label="Total Sanction"
          value={kpi.Total_Sanction?.Title}
          sub={kpi.Total_Sanction?.Subtitle}
          footer={kpi.Total_Sanction?.Footer}
          sparkPct={100}
          accent="c1"
        />

        {/* <KpiCard
          label="Total Exposure"
          value={fmt.cr(k.total_exposure)}
          sub={`Disbursed: ${fmt.cr(k.loan_amt)}`}
          footer={`Principal Received: ${fmt.cr(k.principal_received)}`}
          sparkPct={
            k.total_sanction > 0
              ? (k.total_exposure / k.total_sanction) * 100
              : 0
          }
          accent="c2"
        /> */}

        <KpiCard
          label="Total Exposure"
          value={kpi.Total_Exposure?.Title}
          sub={kpi.Total_Exposure?.Subtitle}
          footer={kpi.Total_Exposure?.Footer}
          sparkPct={80}
          accent="c2"
        />

        {/* <KpiCard
          label="Principal Received"
          value={fmt.cr(k.total_prin_rec)}
          sub={`Total Records: ${fmt.int(c.total_records)}`}
          footer={`Unique Customers: ${fmt.int(c.unique_customers)}`}
          sparkPct={
            k.total_sanction > 0
              ? (k.total_prin_rec / k.total_sanction) * 100
              : 0
          }
          accent="c3"
        /> */}

        <KpiCard
          label="Principal Received"
          value={kpi.Principal_Recieved?.Title}
          sub={kpi.Principal_Recieved?.Subtitle}
          footer={kpi.Principal_Recieved?.Footer}
          sparkPct={40}
          accent="c3"
        />

        {/* <KpiCard
          label="Outstanding Amount"
          value={fmt.cr(k.total_os_amt)}
          sub={`Borrower Groups: ${fmt.int(c.unique_groups)}`}
          footer={`Total Exposure: ${fmt.cr(k.total_exposure)}`}
          sparkPct={
            k.total_sanction > 0 ? (k.total_os_amt / k.total_sanction) * 100 : 0
          }
          accent="c4"
        /> */}

        <KpiCard
          label="Outstanding Amount"
          value={kpi.Outstanding_Amount?.Title}
          sub={kpi.Outstanding_Amount?.Subtitle}
          footer={kpi.Outstanding_Amount?.Footer}
          sparkPct={60}
          accent="c4"
        />
      </div>
      <div className="section-label">Disbursement Activity Trend</div>
      <div className="chart-card">
        {/* TITLE */}
        <div className="chart-title">Quarterly Disbursement Activity</div>
        <div className="chart-subtitle">QUARTERLY GROUPING • ALL PERIODS</div>

        {/* TOGGLE BUTTONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between", // left + right split
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "8px",
            marginBottom: "12px",
          }}
        >
          {/* LEFT SIDE → LEGEND */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            {/* Loans */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  background: "rgba(21,101,192,0.7)",
                }}
              />
              No. of Loans
            </div>

            {/* Sanction */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "3px",
                  background: "rgba(144,202,249,0.75)",
                }}
              />
              Sanction (₹ Bn)
            </div>

            {/* Outstanding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "3px",
                  borderRadius: "2px",
                  background: "#00acc1",
                }}
              />
              Outstanding (₹ Bn)
            </div>
          </div>

          {/* RIGHT SIDE → TEXT + BUTTONS + BADGE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Bars = Loans & Sanction &nbsp;|&nbsp; Line = Outstanding
            </span>

            <div
              style={{
                display: "flex",
                gap: "2px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "3px",
              }}
            >
              {["auto", "monthly", "quarterly", "yearly"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: "4px 8px",
                    fontSize: "10px",
                    borderRadius: "6px",
                    background: viewMode === mode ? "#fff" : "transparent",
                    color:
                      viewMode === mode ? "var(--blue)" : "var(--text-muted)",
                    border:
                      viewMode === mode ? "1px solid var(--border)" : "none",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>

            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                background: "rgba(0,172,193,0.1)",
                color: "#00acc1",
                border: "1px solid rgba(0,172,193,0.3)",
                padding: "3px 9px",
                borderRadius: "12px",
                letterSpacing: "0.06em",
              }}
            >
              {viewMode.toUpperCase()}
            </span>
          </div>
        </div>
        <VerticalBarWithLine data={disbursementData} height={320} />
      </div>
      {/* <ActivityChart timeseries={timeseries} /> */}
      <div className="section-label">Gen AI Insights</div>
      <div className="card">
        <div className="card-title">
          Portfolio Intelligence
          <button
            className="insights-btn"
            onClick={generate}
            disabled={aiLoading}
          >
            {aiLoading ? "⏳ Analysing…" : "✦ Generate AI Insights"}
          </button>
        </div>
        {aiError && <ErrorMsg message={aiError} />}
        {insights && (
          <div className="insights-grid">
            {[
              { label: "📊 Headline", text: insights.headline },
              { label: "⚠ Risk Flag", text: insights.risk_flag },
              { label: "💡 Opportunity", text: insights.opportunity },
              { label: "👁 Watchlist", text: insights.watchlist },
            ].map((tile) => (
              <div key={tile.label} className="insight-tile">
                <div className="insight-tile-label">{tile.label}</div>
                <div className="insight-tile-text">{tile.text}</div>
              </div>
            ))}
          </div>
        )}
        {!insights && !aiLoading && (
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: ".76rem",
              padding: "8px 0",
            }}
          >
            Click the button above to generate AI-powered portfolio insights.
          </div>
        )}
      </div>
      <div className="section-label">Portfolio Distribution</div>
      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: "6px" }}>
            Top {topN} Groups by Outstanding
          </div>
          <div className="chart-subtitle" style={{ marginBottom: "6px" }}>
            HIGHEST EXPOSURE GROUPS
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "8px",
              marginBottom: "30px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text-muted)",
                marginRight: "4px",
              }}
            >
              TOP
            </span>

            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => setTopN(n)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: topN === n ? "var(--blue)" : "transparent",
                  color: topN === n ? "#fff" : "var(--text)",
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <VerticalBar
            data={topGroupsOutstanding}
            dataKey="count"
            nameKey="label"
            height={260}
            barSize={20}
            formatter={(v) => `₹${v} Cr`}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Product Type Split</div>
          <div className="chart-subtitle">TL vs DEB — BY OUTSTANDING</div>
          <DonutChart
            data={productDonut}
            colors={["#1565c0", "#00acc1"]}
            height={220}
            formatter={(v) => `₹${(v || 0).toFixed(2)} Cr`}
          />
          <DonutLegend
            data={productDonut}
            colors={["#1565c0", "#00acc1"]}
            showPercent={true}
          />
        </div>
      </div>
      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Tenor Distribution</div>
          <div className="chart-subtitle">LOAN COUNT BY MATURITY BAND</div>
          <VerticalBar
            data={tenorChartData}
            dataKey="count"
            nameKey="label"
            height={220}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Interest Rate Distribution</div>
          <div className="chart-subtitle">LOAN COUNT BY RATE BUCKET</div>
          <VerticalBar
            data={rateChartData}
            dataKey="count"
            nameKey="label"
            height={220}
          />
        </div>
      </div>
      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Outstanding vs Sanction</div>
          <div className="chart-subtitle" style={{ marginBottom: "20px" }}>
            TOP 10 GROUPS COMPARISON
          </div>

          <GroupedBar
            data={topGroupsDual}
            series={[
              {
                key: "sanction",
                label: "Sanction",
                gradient: "blueGrad",
              },
              {
                key: "outstanding",
                label: "Outstanding",
                gradient: "greenGrad",
              },
            ]}
            height={280}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Collection Breakdown</div>
          <div className="chart-subtitle">PRINCIPAL & INTEREST RECEIVED</div>
          <DonutChart
            data={collectionDonut}
            colors={["#2e7d32", "#43a047", "#e53935"]}
            height={220}
            formatter={(v) => `₹${v} Cr`}
          />
          <DonutLegend
            data={collectionDonut}
            colors={["#2e7d32", "#43a047", "#e53935"]}
            showPercent={true}
          />
        </div>
      </div>
    </div>
  );
}
