import { useEffect, useState, useCallback } from "react";
import PdfExportButton from "../pdf/PdfExportButton";
function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const formatted = now.toLocaleTimeString("en-GB", {
        hour12: false, // 24-hour format
      });

      setTime(formatted);
    };

    updateTime(); // initial call
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval); // cleanup
  }, []);

  return (
    <span
      className="time-pill"
      id="clock"
      style={{ padding: "4px 10px", fontSize: ".68rem" }}
    >
      {time}
    </span>
  );
}

export default function Header({
  title,
  subtitle,
  darkMode,
  onToggleDark,
  pdfData,
  pdfPages,
  pdfFilePrefix,
  pdfDisabled,
}) {
  const PAGE_TITLES = {
    overview: "Overview",
    exposure: "Exposure Analysis",
    loans: "Loan Portfolio",
    rates: "Interest & Rates",
    borrowers: "Borrower View",
    transactions: "Transactions",
  };
  const PAGE_MAP = {
    overview: true,
    exposure: true,
    loans: true,
    rates: true,
    borrowers: true,
    transactions: true,
  };
  // const handleExport = async () => {
  //   setIsExportingFull(true);
  //   setExportStatus("Preparing full report…");

  //   const pdf = new jsPDF({
  //     orientation: "portrait",
  //     unit: "mm",
  //     format: "a4",
  //   });

  //   const pagesToExport = Object.keys(PAGE_MAP);
  //   const originalActivePage = activePage;

  //   try {
  //     for (let i = 0; i < pagesToExport.length; i++) {
  //       const pageKey = pagesToExport[i];
  //       const pageTitle = PAGE_TITLES[pageKey] || pageKey;

  //       setExportStatus(
  //         `Capturing ${pageTitle} (${i + 1}/${pagesToExport.length})…`,
  //       );
  //       setActivePage(pageKey);
  //       await new Promise((r) => setTimeout(r, 2200));

  //       const fullPageEl = document.querySelector(".wrapper");
  //       if (!fullPageEl) continue;

  //       let dataUrl;
  //       try {
  //         dataUrl = await domtoimage.toJpeg(fullPageEl, {
  //           quality: 0.55,
  //           bgcolor: "#ffffff",
  //           width: fullPageEl.scrollWidth,
  //           height: fullPageEl.scrollHeight,
  //           style: {
  //             transform: "scale(1)",
  //             transformOrigin: "top left",
  //             width: fullPageEl.scrollWidth + "px",
  //             height: fullPageEl.scrollHeight + "px",
  //             background: "#ffffff",
  //           },
  //           filter: (node) => {
  //             if (
  //               node.id === "export-overlay" ||
  //               node.id === "chart-tooltip" ||
  //               node.getAttribute?.("data-pdf-exclude") === "true"
  //             ) {
  //               return false;
  //             }
  //             return true;
  //           },
  //         });
  //       } catch (err) {
  //         console.error(`Capture failed for ${pageKey}`, err);
  //         continue;
  //       }

  //       if (i > 0) pdf.addPage();

  //       const pageWidth = pdf.internal.pageSize.getWidth();
  //       const pageHeight = pdf.internal.pageSize.getHeight();

  //       const img = new Image();
  //       img.src = dataUrl;

  //       await new Promise((res) => (img.onload = res));

  //       const imgRatio = img.width / img.height;
  //       const pageRatio = pageWidth / pageHeight;

  //       const finalWidth = pageWidth;
  //       const finalHeight = (img.height * pageWidth) / img.width;

  //       pdf.addImage(dataUrl, 'JPEG', 0, 0, finalWidth, finalHeight, undefined, 'FAST');
  //     }

  //     const timestamp = new Date()
  //       .toISOString()
  //       .slice(0, 16)
  //       .replace("T", "_")
  //       .replace(/:/g, "");
  //     pdf.save(`niif-exposure-full-report_${timestamp}.pdf`);
  //   } catch (err) {
  //     console.error("Export failed:", err);
  //     alert("Export failed. Check console (F12).");
  //   } finally {
  //     setActivePage(originalActivePage);
  //     setIsExportingFull(false);
  //     setExportStatus("");
  //   }
  // };

  return (
    <div className="header-bar">
      <div className="header-text">
        <span className="header-title">{title}</span>
        <span className="header-subtitle">{subtitle}</span>
      </div>

      <div className="header-actions">
        <span className="live-badge" style={{ fontSize: ".6rem" }}>
          Live
        </span>

        <LiveClock />

        <PdfExportButton
          data={pdfData}
          pages={pdfPages}
          filePrefix={pdfFilePrefix}
          disabled={pdfDisabled}
        />

        <button
          className="icon-btn"
          title={darkMode ? "Light mode" : "Dark mode"}
          onClick={onToggleDark}
        >
          {darkMode ? (
            <svg viewBox="0 0 24 24">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0zM7.05 18.36l-1.06 1.06a.996.996 0 0 0 0 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
