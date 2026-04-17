import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Overview from "./pages/Overview";
import Exposure from "./pages/Exposure";
import Rates from "./pages/Rates";
import Borrowers from "./pages/Borrowers";
import Transactions from "./pages/Transactions";
import { Spinner, ErrorMsg } from "./components/ui/helpers";
import { useDashboardData } from "./hooks/useDashboardData";
import Loans from "./pages/Loans";
import mockData from "./data/mockOverview.json";
import React from "react";

const PAGE_TITLES = {
  overview: "Portfolio Overview",
  exposure: "Exposure Analytics",
  rates: "Interest Rate & Tenor Analysis",
  borrowers: "Borrower / Customer View",
  transactions: "Transaction Analytics",
};

export default function App() {
  const [page, setPage] = useState("overview");
  const [darkMode, setDark] = useState(false);
  const { data, loading, error } = useDashboardData();

  const toggleDark = () => {
    const next = !darkMode;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
  };

  const renderPage = () => {
    if (!data) return null;

    const computed = {
      total_records: data?.row_count || 0,
      unique_proposals: 0,
      unique_groups: 0,
      unique_customers: 0,
      min_rate: 0,
      max_rate: 0,
      avg_rate: 0,
    };

    switch (page) {
      case "overview":
        return <Overview data={data} />;
      case "exposure":
        return <Exposure data={data} />;
      case "loans":
        return <Loans data={data} />;
      case "rates":
        return <Rates data={data} />;
      case "borrowers":
        return <Borrowers data={data} />;
      case "transactions":
        return <Transactions data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-wrapper">
      <Sidebar activePage={page} onNavigate={setPage} />

      <div className="main-area">
        <Header
          title={PAGE_TITLES[page]}
          darkMode={darkMode}
          onToggleDark={toggleDark}
        />

        <div className="page-content">
          {loading && <Spinner />}
          {error && <ErrorMsg message={error} />}
          {!loading && !error && renderPage()}
        </div>
      </div>
    </div>
  );
}
