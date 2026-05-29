import { useCallback, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import domtoimage from "dom-to-image";

export default function PdfExportButton({
  data,
  pages = [],
  filePrefix = "dashboard-report",
  disabled = false,
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [pdfError, setPdfError] = useState("");

  const buildPdfBlob = useCallback(async () => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a3",
      compress: true,
    });

    const exportRoot = document.getElementById("pdf-export-root");

    if (!exportRoot) {
      throw new Error("PDF export container not found");
    }

    const pdfPages = Array.from(exportRoot.querySelectorAll("[data-pdf-page]"));

    if (!pdfPages.length) {
      throw new Error("No PDF pages found");
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 5;
    const pageTopSafeMm = 4;

    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2 - pageTopSafeMm;

    let isFirstPdfPage = true;

    const loadImage = (dataUrl) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
      });

    const cropImage = (img, sourceY, sourceHeight) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      canvas.width = img.width;
      canvas.height = sourceHeight;

      ctx.drawImage(
        img,
        0,
        sourceY,
        img.width,
        sourceHeight,
        0,
        0,
        img.width,
        sourceHeight,
      );

      return {
        dataUrl: canvas.toDataURL("image/jpeg", 0.85),
        canvas,
        ctx,
      };
    };

    const isMostlyBlank = (ctx, width, height) => {
      const sampleStep = 24;
      let checked = 0;
      let nonWhite = 0;

      for (let y = 0; y < height; y += sampleStep) {
        for (let x = 0; x < width; x += sampleStep) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const [r, g, b, a] = pixel;

          checked++;

          const isWhite =
            a === 0 ||
            (r > 245 && g > 245 && b > 245) ||
            (r > 248 && g > 248 && b > 248);

          if (!isWhite) {
            nonWhite++;
          }
        }
      }

      if (!checked) return true;

      return nonWhite / checked < 0.002;
    };

    for (let pageIndex = 0; pageIndex < pdfPages.length; pageIndex++) {
      const pageEl = pdfPages[pageIndex];

      const captureWidth = pageEl.scrollWidth;
      const captureHeight = pageEl.scrollHeight;

      const dataUrl = await domtoimage.toJpeg(pageEl, {
        quality: 0.85,
        bgcolor: "#ffffff",
        cacheBust: true,
        width: captureWidth,
        height: captureHeight,
        style: {
          width: `${captureWidth}px`,
          height: `${captureHeight}px`,
          background: "#ffffff",
          color: "#111111",
          overflow: "visible",
        },
        filter: (node) => {
          if (
            node.id === "export-overlay" ||
            node.id === "chart-tooltip" ||
            node.getAttribute?.("data-pdf-exclude") === "true"
          ) {
            return false;
          }

          return true;
        },
      });

      const img = await loadImage(dataUrl);

      const fullImageHeightMm = (img.height * usableWidth) / img.width;
      const pxToMm = fullImageHeightMm / img.height;
      const mmToPx = img.height / fullImageHeightMm;
      const maxSliceHeightPx = Math.floor(usableHeight * mmToPx);

      const pageRect = pageEl.getBoundingClientRect();
      const scaleY = img.height / captureHeight;

      const sections = Array.from(pageEl.querySelectorAll("[data-pdf-section]"))
        .map((el) => {
          const rect = el.getBoundingClientRect();

          return {
            top: Math.round((rect.top - pageRect.top) * scaleY),
            bottom: Math.round((rect.bottom - pageRect.top) * scaleY),
          };
        })
        .filter((section) => section.bottom > section.top)
        .sort((a, b) => a.top - b.top);

      let sliceTopPx = 0;

      while (sliceTopPx < img.height - 1) {
        const idealSliceBottomPx = Math.min(
          sliceTopPx + maxSliceHeightPx,
          img.height,
        );

        let safeSliceBottomPx = idealSliceBottomPx;

        const cuttingSection = sections.find(
          (section) =>
            section.top < idealSliceBottomPx &&
            section.bottom > idealSliceBottomPx,
        );

        if (cuttingSection) {
          const sectionHeightPx = cuttingSection.bottom - cuttingSection.top;

          if (sectionHeightPx <= maxSliceHeightPx) {
            if (cuttingSection.top > sliceTopPx + 30) {
              safeSliceBottomPx = cuttingSection.top;
            } else {
              safeSliceBottomPx = cuttingSection.bottom;
            }
          }
        }

        if (safeSliceBottomPx <= sliceTopPx + 30) {
          safeSliceBottomPx = idealSliceBottomPx;
        }

        const sliceHeightPx = Math.min(
          safeSliceBottomPx - sliceTopPx,
          img.height - sliceTopPx,
        );

        if (sliceHeightPx <= 5) {
          sliceTopPx = safeSliceBottomPx + 1;
          continue;
        }

        const cropped = cropImage(img, sliceTopPx, sliceHeightPx);

        const blank = isMostlyBlank(
          cropped.ctx,
          cropped.canvas.width,
          cropped.canvas.height,
        );

        if (!blank) {
          const sliceHeightMm = sliceHeightPx * pxToMm;

          if (!isFirstPdfPage) {
            pdf.addPage();
          }

          isFirstPdfPage = false;

          pdf.addImage(
            cropped.dataUrl,
            "JPEG",
            margin,
            margin + pageTopSafeMm,
            usableWidth,
            sliceHeightMm,
            undefined,
            "FAST",
          );
        }

        sliceTopPx += sliceHeightPx;
      }
    }

    return pdf.output("blob");
  }, []);

  useEffect(() => {
    if (!data || disabled || !pages.length) {
      setIsPreparing(false);
      return;
    }

    let cancelled = false;
    let currentUrl = null;

    const preparePdf = async () => {
      try {
        setIsPreparing(true);
        setPdfError("");

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const blob = await buildPdfBlob();

        if (cancelled) return;

        currentUrl = URL.createObjectURL(blob);
        setPdfUrl(currentUrl);
      } catch (err) {
        console.error("Background PDF preparation failed:", err);
        setPdfError("PDF preparation failed");
      } finally {
        if (!cancelled) {
          setIsPreparing(false);
        }
      }
    };

    preparePdf();

    return () => {
      cancelled = true;

      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [data, disabled, pages.length, buildPdfBlob]);

  const handleDownload = () => {
    if (!pdfUrl) {
      alert("PDF is still preparing. Please wait a moment.");
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace("T", "_")
      .replace(/:/g, "");

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${filePrefix}_${timestamp}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <button
        className="pdf-btn"
        onClick={handleDownload}
        disabled={isPreparing || !pdfUrl || disabled}
        style={{
          padding: "6px 12px",
          fontSize: ".72rem",
          opacity: isPreparing || !pdfUrl || disabled ? 0.6 : 1,
          cursor:
            isPreparing || !pdfUrl || disabled ? "not-allowed" : "pointer",
        }}
        title={pdfError || ""}
      >
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <path d="M14 2v6h6" />
        </svg>
        Download PDF
      </button>

      {!disabled && data && (
        <div
          id="pdf-export-root"
          data-pdf-exclude="true"
          style={{
            position: "fixed",
            left: "-100000px",
            top: 0,
            width: "1600px",
            background: "#ffffff",
            color: "#111111",
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <style>
            {`
      #pdf-export-root .section-label {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        font-size: 16px !important;
        font-weight: 900 !important;
        letter-spacing: 0.06em !important;
        color: #0d2a4a !important;
        opacity: 1 !important;
        margin: 26px 0 18px !important;
        text-transform: uppercase !important;
        line-height: 1.7 !important;
        padding: 6px 0 !important;
        position: relative !important;
        z-index: 5 !important;
        background: #ffffff !important;
        overflow: visible !important;
      }

      #pdf-export-root .section-label::after {
        content: "" !important;
        flex: 1 !important;
        display: block !important;
        height: 2px !important;
        background: #8fbce3 !important;
        opacity: 1 !important;
        margin-left: 10px !important;
      }

      #pdf-export-root .pdf-section-block,
      #pdf-export-root [data-pdf-section] {
        overflow: visible !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      #pdf-export-root .chart-title,
      #pdf-export-root .card-title {
        color: #0d2a4a !important;
        opacity: 1 !important;
      }

      #pdf-export-root .chart-subtitle,
      #pdf-export-root .card-badge {
        opacity: 1 !important;
      }
    `}
          </style>

          {pages.map(({ key, title, Component }) => (
            <div
              key={key}
              data-pdf-page
              style={{
                width: "1600px",
                background: "#ffffff",
                padding: "24px",
                boxSizing: "border-box",
                overflow: "visible",
              }}
            >
              <div style={{ width: "100%" }}>
                <div
                  data-pdf-section
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    marginBottom: "16px",
                    color: "#111111",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "10px",
                  }}
                >
                  {title}
                </div>

                <Component data={data} pdfMode />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
