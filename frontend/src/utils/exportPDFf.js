/**
 * exportPDF.js — Fixed for gradient / non-finite addColorStop error
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useState } from 'react';

function sanitizeGradients(clonedDoc) {
  const elements = clonedDoc.querySelectorAll('*');
  elements.forEach((el) => {
    // Check both inline style and computed style
    let bgImage = el.style.backgroundImage || '';
    if (!bgImage) {
      bgImage = window.getComputedStyle(el).backgroundImage;
    }

    if (bgImage && bgImage.includes('gradient')) {
      // Safest fix: remove gradient completely and use solid white
      // (charts are already converted to images, so visual loss is minimal)
      el.style.backgroundImage = 'none';
      el.style.backgroundColor = '#ffffff';
    }

    // Also fix any problematic SVG gradients or filters
    if (el.tagName === 'svg' || el.tagName === 'linearGradient') {
      el.style.display = 'none'; // rare case
    }
  });
}

function resolveComputedStyles(clone, original) {
  const cloneEls = clone.querySelectorAll('*');
  const origEls = original.querySelectorAll('*');
  resolveSingleElement(clone, original);
  cloneEls.forEach((el, i) => resolveSingleElement(el, origEls[i]));
}

function resolveSingleElement(cloneEl, sourceEl) {
  if (!sourceEl) return;
  const computed = window.getComputedStyle(sourceEl);
  const props = ['color','backgroundColor','background','borderColor','boxShadow','fontFamily','fontSize','fontWeight','opacity'];
  props.forEach(prop => {
    let val = computed.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
    if (val && val !== 'none' && val !== 'normal' && val.trim() !== '') {
      cloneEl.style[prop] = val;
    }
  });
}

function replaceCanvasesWithImages(clonedDoc) {
  const clonedCanvases = clonedDoc.querySelectorAll('canvas');
  const sourceCanvases = document.querySelectorAll('canvas');
  clonedCanvases.forEach((cloned, i) => {
    const source = sourceCanvases[i];
    if (!source) return;
    try {
      const img = clonedDoc.createElement('img');
      img.src = source.toDataURL('image/png', 1.0);
      img.style.cssText = `width:${source.offsetWidth}px;height:${source.offsetHeight}px;display:block;`;
      cloned.replaceWith(img);
    } catch (e) {}
  });
}

function freezeAnimations(clonedDoc) {
  const style = clonedDoc.createElement('style');
  style.textContent = `* { animation:none !important; transition:none !important; }`;
  clonedDoc.head.appendChild(style);
}

function addMultiPageImage(pdf, canvas, margin = 10) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const printW = pageW - margin * 2;
  const printH = pageH - margin * 2;
  const ratio = printW / canvas.width;
  let y = 0;
  let remaining = canvas.height * ratio;

  while (remaining > 0) {
    if (y > 0) pdf.addPage();
    const sliceH_mm = Math.min(printH, remaining);
    const sliceH_px = sliceH_mm / ratio;

    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceH_px;
    slice.getContext('2d').drawImage(canvas, 0, y, canvas.width, sliceH_px, 0, 0, canvas.width, sliceH_px);

    pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, printW, sliceH_mm, undefined, 'NONE');
    y += sliceH_px;
    remaining -= sliceH_mm;
  }
}

export async function exportPDF({
  element,
  filename = 'tfsin-hana-full-report.pdf',
  format = 'a3',
  orientation = 'landscape',
  scale = 3,
  margin = 10,
  onStart,
  onEnd,
} = {}) {
  if (!element) {
    console.error('[exportPDF] No element provided');
    return;
  }

  onStart?.();

  try {
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));

    const canvas = await html2canvas(element, {
      scale: Math.max(scale, 2),
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      onclone: (clonedDoc, clonedEl) => {
        freezeAnimations(clonedDoc);
        resolveComputedStyles(clonedEl, element);
        sanitizeGradients(clonedDoc);           // ← THIS FIXES THE ERROR
        replaceCanvasesWithImages(clonedDoc);
      },
    });

    const pdf = new jsPDF({ orientation, unit: 'mm', format });
    addMultiPageImage(pdf, canvas, margin);
    pdf.save(filename);

    console.log(`✅ PDF saved successfully: ${filename}`);
  } catch (err) {
    console.error('[exportPDF] Error during capture:', err);
    throw err;
  } finally {
    onEnd?.();
  }
}

export function usePDFExport() {
  const [isExporting, setIsExporting] = useState(false);
  const run = (options = {}) => exportPDF({
    ...options,
    onStart: () => { setIsExporting(true); options.onStart?.(); },
    onEnd: () => { setIsExporting(false); options.onEnd?.(); },
  });
  return { exportPDF: run, isExporting };
}