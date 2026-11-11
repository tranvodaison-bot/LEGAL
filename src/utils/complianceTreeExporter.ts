import { jsPDF } from 'jspdf';
import { LegalDocument, ComplianceRequirementNode } from '../types/legal';

export interface ProjectDossierExportMetadata {
  projectName: string;
  organizationName: string;
  dossierCode: string;
  clusterTitle: string;
  clusterSubtitle: string;
  validityFilterLabel: string;
  priorityFilterLabel: string;
  activeNodeLabel?: string;
  includeAppendixTable: boolean;
  scaleFactor: number; // e.g., 2.5 for high-DPI export
}

export interface DossierSummaryRow {
  codeOrNumber: string;
  title: string;
  statusText: string;
  priorityText: string;
  effectiveOrExpireText: string;
  crossRefOrNote: string;
}

/**
 * Prepares a standalone, self-contained SVG string from the live d3-hierarchy SVG DOM element,
 * converting Tailwind text size/weight classes into explicit inline SVG attributes so that
 * offscreen Canvas and standalone SVG viewers render identically to the browser screen.
 */
export function serializeComplianceSvgElement(
  svgElement: SVGSVGElement,
  width: number,
  height: number
): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Insert warm archival background rect as first child of cloned SVG
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', String(width));
  bgRect.setAttribute('height', String(height));
  bgRect.setAttribute('fill', '#FCFBF8');
  clone.insertBefore(bgRect, clone.firstChild);

  // Normalize all <text> elements so they don't rely on external Tailwind stylesheet
  const textNodes = clone.querySelectorAll('text');
  textNodes.forEach((txt) => {
    const classAttr = txt.getAttribute('class') || '';
    txt.setAttribute(
      'font-family',
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    );
    if (classAttr.includes('font-bold')) {
      txt.setAttribute('font-weight', '700');
    } else if (classAttr.includes('font-semibold')) {
      txt.setAttribute('font-weight', '600');
    } else {
      txt.setAttribute('font-weight', '500');
    }

    if (classAttr.includes('text-[10.5px]')) {
      txt.setAttribute('font-size', '10.5px');
    } else if (classAttr.includes('text-[10px]')) {
      txt.setAttribute('font-size', '10px');
    } else if (classAttr.includes('text-[9.5px]')) {
      txt.setAttribute('font-size', '9.5px');
    } else {
      txt.setAttribute('font-size', '10px');
    }

    if (classAttr.includes('fill-purple-700')) {
      txt.setAttribute('fill', '#6D28D9');
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(clone);
}

/**
 * Renders the SVG diagram plus an institutional Vietnamese Project Dossier Title Block
 * (Header, Legend, Active Filter Badges, and Signature Approval Footer) onto a high-DPI HTML5 Canvas.
 */
export async function renderComplianceDossierCanvas(
  svgElement: SVGSVGElement,
  svgWidth: number,
  svgHeight: number,
  meta: ProjectDossierExportMetadata,
  stats: {
    activeCount: number;
    expiredCount: number;
    veryHighCount: number;
    highCount: number;
    mediumCount: number;
    totalReqsCount: number;
  }
): Promise<HTMLCanvasElement> {
  const serializedSvg = serializeComplianceSvgElement(svgElement, svgWidth, svgHeight);
  const svgBlob = new Blob([serializedSvg], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = svgUrl;
    });

    const headerHeight = 148;
    const footerHeight = 132;
    const horizontalPadding = 40;
    const totalLogicalWidth = Math.max(1180, svgWidth + horizontalPadding * 2);
    const totalLogicalHeight = headerHeight + svgHeight + footerHeight;

    const scale = meta.scaleFactor || 2.5;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(totalLogicalWidth * scale);
    canvas.height = Math.round(totalLogicalHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Không thể khởi tạo bộ đệm đồ họa 2D Canvas.');
    }

    ctx.scale(scale, scale);

    // 1. Fill Archival Paper Background
    ctx.fillStyle = '#FBF9F5';
    ctx.fillRect(0, 0, totalLogicalWidth, totalLogicalHeight);

    // Outer Institutional Double Frame
    ctx.strokeStyle = '#152D42';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, totalLogicalWidth - 28, totalLogicalHeight - 28);
    ctx.strokeStyle = '#C6A342';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, totalLogicalWidth - 36, totalLogicalHeight - 36);

    // 2. Top Institutional Header Banner
    ctx.fillStyle = '#152D42';
    ctx.fillRect(20, 20, totalLogicalWidth - 40, 108);

    // Gold Accent Stripe
    ctx.fillStyle = '#C6A342';
    ctx.fillRect(20, 125, totalLogicalWidth - 40, 3);

    // Left Header Text: System & Dossier Title
    const fontStack = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = '#E5C158';
    ctx.font = `700 11px ${fontStack}`;
    ctx.fillText(
      `HỆ SINH THÁI PHÁP LUẬT ĐẠI SƠN · HỒ SƠ ĐỐI SOÁT TUÂN THỦ SSoT (${meta.dossierCode})`,
      38,
      44
    );

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 22px ${fontStack}`;
    ctx.fillText(`SƠ ĐỒ CÂY KIỂM TRA PHÁP LÝ: ${meta.clusterTitle.toUpperCase()}`, 38, 72);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = `500 12px ${fontStack}`;
    ctx.fillText(
      `Dự án / Hồ sơ: ${meta.projectName}  |  Đơn vị: ${meta.organizationName}`,
      38,
      95
    );

    ctx.fillStyle = '#FDE68A';
    ctx.font = `600 11.5px ${fontStack}`;
    ctx.fillText(
      `Bộ lọc nhánh: ${meta.validityFilterLabel} · Ưu tiên: ${meta.priorityFilterLabel}${
        meta.activeNodeLabel ? ` · Tâm điểm: ${meta.activeNodeLabel}` : ''
      }`,
      38,
      115
    );

    // Right Header Box: Quantitative SSoT Summary
    const statsBoxWidth = 340;
    const statsBoxX = totalLogicalWidth - statsBoxWidth - 36;
    ctx.fillStyle = '#1E3A54';
    ctx.fillRect(statsBoxX, 32, statsBoxWidth, 82);
    ctx.strokeStyle = '#C6A342';
    ctx.lineWidth = 1;
    ctx.strokeRect(statsBoxX, 32, statsBoxWidth, 82);

    const nowStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    ctx.fillStyle = '#E5C158';
    ctx.font = `700 10.5px ${fontStack}`;
    ctx.fillText(`THỐNG KÊ SSoT · KẾT XUẤT: ${nowStr}`, statsBoxX + 14, 50);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 12px ${fontStack}`;
    ctx.fillText(
      `• Đang có hiệu lực: ${stats.activeCount} VB  |  Hết hiệu lực: ${stats.expiredCount} VB`,
      statsBoxX + 14,
      72
    );

    ctx.fillStyle = '#E2E8F0';
    ctx.font = `500 11.5px ${fontStack}`;
    ctx.fillText(
      `• Rất cao: ${stats.veryHighCount} | Cao: ${stats.highCount} | TB: ${stats.mediumCount} (${stats.totalReqsCount} YC)`,
      statsBoxX + 14,
      94
    );

    // 3. Draw the Rendered D3-Hierarchy SVG Diagram Centered
    const diagramX = Math.round((totalLogicalWidth - svgWidth) / 2);
    const diagramY = headerHeight;

    ctx.fillStyle = '#FCFBF8';
    ctx.fillRect(22, diagramY - 6, totalLogicalWidth - 44, svgHeight + 12);

    ctx.drawImage(img, diagramX, diagramY, svgWidth, svgHeight);

    // Divider line above Footer
    const footerY = headerHeight + svgHeight + 6;
    ctx.strokeStyle = '#D6D3D1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, footerY);
    ctx.lineTo(totalLogicalWidth - 28, footerY);
    ctx.stroke();

    // 4. Legend & Institutional Approval Stamp Block in Footer
    ctx.fillStyle = '#152D42';
    ctx.font = `700 11.5px ${fontStack}`;
    ctx.fillText('CHÚ GIẢI PHÂN NHÁNH & KÝ HIỆU ĐỒ THỊ (D3-HIERARCHY SSoT):', 36, footerY + 24);

    // Legend Pills
    const legendItems: Array<{ color: string; label: string }> = [
      { color: '#10B981', label: 'Nhánh Đang có hiệu lực' },
      { color: '#57534E', label: 'Nhánh Đã hết hiệu lực (Lịch sử)' },
      { color: '#DC2626', label: 'Ưu tiên Rất cao (Chế tài nghiêm trọng)' },
      { color: '#D97706', label: 'Ưu tiên Cao (Nghĩa vụ bắt buộc)' },
      { color: '#2563EB', label: 'Ưu tiên Trung bình' },
      { color: '#7C3AED', label: 'Cung Đối soát chéo / Thay thế' },
    ];

    let curLegendX = 36;
    legendItems.forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(curLegendX + 5, footerY + 42, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#292524';
      ctx.font = `600 11px ${fontStack}`;
      ctx.fillText(item.label, curLegendX + 15, footerY + 46);
      curLegendX += ctx.measureText(item.label).width + 34;
    });

    ctx.fillStyle = '#57534E';
    ctx.font = `500 10.5px ${fontStack}`;
    ctx.fillText(
      'Ghi chú pháp lý: Sơ đồ được sinh tự động từ Kho dữ liệu chuẩn SSoT ĐẠI SƠN. Đính kèm hồ sơ trình duyệt chủ trương đầu tư, thẩm định thiết kế & rà soát tuân thủ.',
      36,
      footerY + 72
    );

    // Right Signature Stamp Boxes in Footer
    const sigWidth = 175;
    const sigStartY = footerY + 14;
    const sigLabels = ['NGƯỜI LẬP HỒ SƠ', 'PHÁP CHẾ RÀ SOÁT', 'BAN QLDA PHÊ DUYỆT'];
    sigLabels.forEach((label, idx) => {
      const boxX = totalLogicalWidth - (sigLabels.length - idx) * (sigWidth + 12) - 28;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(boxX, sigStartY, sigWidth, 88);
      ctx.strokeStyle = '#D6D3D1';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, sigStartY, sigWidth, 88);

      ctx.fillStyle = '#152D42';
      ctx.font = `700 10px ${fontStack}`;
      ctx.fillText(label, boxX + 12, sigStartY + 18);

      ctx.fillStyle = '#A8A29E';
      ctx.font = `500 9.5px ${fontStack}`;
      ctx.fillText('(Ký, ghi rõ họ tên & đóng dấu)', boxX + 12, sigStartY + 34);
    });

    return canvas;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/**
 * Renders Page 2 Appendix Table Canvas containing the structured list of Legal Documents
 * and Compliance Requirements so Vietnamese Unicode text embeds cleanly in the PDF.
 */
function renderAppendixTableCanvas(
  meta: ProjectDossierExportMetadata,
  documents: LegalDocument[],
  requirements: ComplianceRequirementNode[]
): HTMLCanvasElement {
  const width = 1400;
  const height = 990; // Landscape A4/A3 aspect ratio
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  const fontStack = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Background & Border
  ctx.fillStyle = '#FBF9F5';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#152D42';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Header
  ctx.fillStyle = '#152D42';
  ctx.fillRect(22, 22, width - 44, 72);
  ctx.fillStyle = '#E5C158';
  ctx.font = `700 11px ${fontStack}`;
  ctx.fillText(
    `PHỤ LỤC HỒ SƠ PHÁP LÝ ĐÍNH KÈM DỰ ÁN · MÃ HỒ SƠ: ${meta.dossierCode}`,
    38,
    45
  );
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 18px ${fontStack}`;
  ctx.fillText(
    `BẢNG KÊ VĂN BẢN QUY PHẠM PHÁP LUẬT & YÊU CẦU TUÂN THỦ TRONG SƠ ĐỒ (${meta.clusterTitle.toUpperCase()})`,
    38,
    74
  );

  // Section 1: Danh mục Văn bản trong nhánh sơ đồ
  let curY = 122;
  ctx.fillStyle = '#152D42';
  ctx.font = `700 13px ${fontStack}`;
  ctx.fillText(
    `I. DANH MỤC VĂN BẢN PHÁP LUẬT PHÂN NHÁNH THEO HIỆU LỰC (${documents.length} VĂN BẢN)`,
    34,
    curY
  );

  curY += 12;
  // Table Header
  const colX = [34, 90, 270, 770, 945, 1110];
  ctx.fillStyle = '#E7E5E4';
  ctx.fillRect(34, curY, width - 68, 28);
  ctx.strokeStyle = '#A8A29E';
  ctx.strokeRect(34, curY, width - 68, 28);

  ctx.fillStyle = '#1C1917';
  ctx.font = `700 11px ${fontStack}`;
  ctx.fillText('STT', colX[0] + 8, curY + 18);
  ctx.fillText('SỐ HIỆU VĂN BẢN', colX[1] + 8, curY + 18);
  ctx.fillText('TRÍCH YẾU NỘI DUNG VĂN BẢN', colX[2] + 8, curY + 18);
  ctx.fillText('TRẠNG THÁI HIỆU LỰC', colX[3] + 8, curY + 18);
  ctx.fillText('NGÀY HIỆU LỰC', colX[4] + 8, curY + 18);
  ctx.fillText('VĂN BẢN THAY THẾ / LĨNH VỰC', colX[5] + 8, curY + 18);

  curY += 28;
  const maxDocs = Math.min(documents.length, 14);
  for (let i = 0; i < maxDocs; i++) {
    const doc = documents[i];
    const rowH = 26;
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F5F5F4';
    ctx.fillRect(34, curY, width - 68, rowH);
    ctx.strokeStyle = '#E7E5E4';
    ctx.strokeRect(34, curY, width - 68, rowH);

    ctx.fillStyle = '#1C1917';
    ctx.font = `600 10.5px ${fontStack}`;
    ctx.fillText(String(i + 1), colX[0] + 10, curY + 17);

    ctx.fillStyle = '#152D42';
    ctx.font = `700 10.5px ${fontStack}`;
    ctx.fillText(doc.doc_number.slice(0, 24), colX[1] + 8, curY + 17);

    ctx.fillStyle = '#292524';
    ctx.font = `500 10.5px ${fontStack}`;
    const titleShort =
      doc.title.length > 74 ? `${doc.title.slice(0, 72)}...` : doc.title;
    ctx.fillText(titleShort, colX[2] + 8, curY + 17);

    const isExpired = doc.status === 'HET_HIEU_LUC';
    ctx.fillStyle = isExpired ? '#78716C' : '#047857';
    ctx.font = `700 10px ${fontStack}`;
    ctx.fillText(
      isExpired ? 'ĐÃ HẾT HIỆU LỰC' : 'ĐANG CÓ HIỆU LỰC',
      colX[3] + 8,
      curY + 17
    );

    ctx.fillStyle = '#44403C';
    ctx.font = `500 10px ${fontStack}`;
    ctx.fillText(
      isExpired ? `Hết HL: ${doc.expiration_date || '-'}` : `HL: ${doc.effective_date}`,
      colX[4] + 8,
      curY + 17
    );

    ctx.fillText(
      (doc.replaced_by_label || doc.field).slice(0, 36),
      colX[5] + 8,
      curY + 17
    );

    curY += rowH;
  }

  // Section 2: Các yêu cầu tuân thủ trọng tâm (Rất cao & Cao)
  curY += 28;
  ctx.fillStyle = '#152D42';
  ctx.font = `700 13px ${fontStack}`;
  ctx.fillText(
    `II. TRÍCH YẾU YÊU CẦU TUÂN THỦ TRỌNG TÂM TRONG CÂY PHÁP LÝ (${requirements.length} YÊU CẦU)`,
    34,
    curY
  );

  curY += 12;
  const rColX = [34, 130, 240, 920];
  ctx.fillStyle = '#E7E5E4';
  ctx.fillRect(34, curY, width - 68, 28);
  ctx.strokeStyle = '#A8A29E';
  ctx.strokeRect(34, curY, width - 68, 28);

  ctx.fillStyle = '#1C1917';
  ctx.font = `700 11px ${fontStack}`;
  ctx.fillText('MÃ YÊU CẦU', rColX[0] + 8, curY + 18);
  ctx.fillText('MỨC ƯU TIÊN', rColX[1] + 8, curY + 18);
  ctx.fillText('NỘI DUNG YÊU CẦU TUÂN THỦ BẮT BUỘC', rColX[2] + 8, curY + 18);
  ctx.fillText('CĂN CỨ ĐIỀU KHOẢN & CHẾ TÀI SSoT', rColX[3] + 8, curY + 18);

  curY += 28;
  const maxReqs = Math.min(requirements.length, 12);
  for (let i = 0; i < maxReqs; i++) {
    const req = requirements[i];
    const rowH = 26;
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F5F5F4';
    ctx.fillRect(34, curY, width - 68, rowH);
    ctx.strokeStyle = '#E7E5E4';
    ctx.strokeRect(34, curY, width - 68, rowH);

    ctx.fillStyle = '#152D42';
    ctx.font = `700 10.5px ${fontStack}`;
    ctx.fillText(req.code, rColX[0] + 8, curY + 17);

    ctx.fillStyle =
      req.priority === 'Rất cao'
        ? '#DC2626'
        : req.priority === 'Cao'
        ? '#D97706'
        : '#2563EB';
    ctx.font = `700 10px ${fontStack}`;
    ctx.fillText(req.priority.toUpperCase(), rColX[1] + 8, curY + 17);

    ctx.fillStyle = '#1C1917';
    ctx.font = `500 10.5px ${fontStack}`;
    const reqTitleShort =
      req.title.length > 96 ? `${req.title.slice(0, 94)}...` : req.title;
    ctx.fillText(reqTitleShort, rColX[2] + 8, curY + 17);

    ctx.fillStyle = '#44403C';
    ctx.font = `500 10px ${fontStack}`;
    const citationText = `${req.citation}${
      req.penaltyNote ? ` (${req.penaltyNote})` : ''
    }`;
    ctx.fillText(citationText.slice(0, 68), rColX[3] + 8, curY + 17);

    curY += rowH;
  }

  // Footer note on Page 2
  ctx.fillStyle = '#57534E';
  ctx.font = `500 10.5px ${fontStack}`;
  ctx.fillText(
    `Phụ lục được trích xuất đồng bộ cùng Sơ đồ Cây Kiểm tra Pháp lý · Dự án: ${meta.projectName} · Trang 2/2`,
    34,
    height - 28
  );

  return canvas;
}

/**
 * Triggers a browser file download from a Blob or Data URL without window.open.
 */
function triggerDownloadUrl(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports the Compliance Tree as a High-Resolution PNG Image for Project Dossiers.
 */
export async function exportComplianceTreeToPNG(
  svgElement: SVGSVGElement,
  svgWidth: number,
  svgHeight: number,
  meta: ProjectDossierExportMetadata,
  stats: {
    activeCount: number;
    expiredCount: number;
    veryHighCount: number;
    highCount: number;
    mediumCount: number;
    totalReqsCount: number;
  },
  filenameSlug: string
): Promise<void> {
  const canvas = await renderComplianceDossierCanvas(
    svgElement,
    svgWidth,
    svgHeight,
    meta,
    stats
  );
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const datePart = new Date().toISOString().slice(0, 10);
  triggerDownloadUrl(
    dataUrl,
    `So_Do_Cay_Phap_Ly_DAI_SON_${filenameSlug}_${datePart}.png`
  );
}

/**
 * Exports the Compliance Tree as a Vector SVG file for CAD/BIM or scalable documentation.
 */
export function exportComplianceTreeToSVG(
  svgElement: SVGSVGElement,
  svgWidth: number,
  svgHeight: number,
  filenameSlug: string
): void {
  const svgString = serializeComplianceSvgElement(svgElement, svgWidth, svgHeight);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const datePart = new Date().toISOString().slice(0, 10);
  triggerDownloadUrl(
    url,
    `So_Do_Cay_Phap_Ly_Vector_${filenameSlug}_${datePart}.svg`
  );
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Exports the Compliance Tree + Institutional Title Block (+ Optional Appendix Table)
 * as a Landscape PDF Dossier ready for attaching to construction/enterprise project records.
 */
export async function exportComplianceTreeToPDF(
  svgElement: SVGSVGElement,
  svgWidth: number,
  svgHeight: number,
  meta: ProjectDossierExportMetadata,
  stats: {
    activeCount: number;
    expiredCount: number;
    veryHighCount: number;
    highCount: number;
    mediumCount: number;
    totalReqsCount: number;
  },
  documents: LegalDocument[],
  requirements: ComplianceRequirementNode[],
  filenameSlug: string
): Promise<void> {
  const diagramCanvas = await renderComplianceDossierCanvas(
    svgElement,
    svgWidth,
    svgHeight,
    meta,
    stats
  );
  const diagramImgData = diagramCanvas.toDataURL('image/png', 0.98);

  // Use Landscape A3 (420mm x 297mm) for crisp legibility of large compliance trees
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
    compress: true,
  });

  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const marginMm = 8;
  const availWidthMm = pageWidthMm - marginMm * 2;
  const availHeightMm = pageHeightMm - marginMm * 2;

  const canvasRatio = diagramCanvas.width / diagramCanvas.height;
  const pageRatio = availWidthMm / availHeightMm;

  let drawWidthMm = availWidthMm;
  let drawHeightMm = availHeightMm;
  if (canvasRatio > pageRatio) {
    drawHeightMm = availWidthMm / canvasRatio;
  } else {
    drawWidthMm = availHeightMm * canvasRatio;
  }

  const offsetXMm = marginMm + (availWidthMm - drawWidthMm) / 2;
  const offsetYMm = marginMm + (availHeightMm - drawHeightMm) / 2;

  pdf.addImage(
    diagramImgData,
    'PNG',
    offsetXMm,
    offsetYMm,
    drawWidthMm,
    drawHeightMm,
    undefined,
    'FAST'
  );

  // Page 2: Optional Structured Appendix Table of Documents & Compliance Requirements
  if (meta.includeAppendixTable) {
    pdf.addPage('a3', 'landscape');
    const appendixCanvas = renderAppendixTableCanvas(meta, documents, requirements);
    const appendixImgData = appendixCanvas.toDataURL('image/png', 0.98);

    const appRatio = appendixCanvas.width / appendixCanvas.height;
    let appW = availWidthMm;
    let appH = availHeightMm;
    if (appRatio > pageRatio) {
      appH = availWidthMm / appRatio;
    } else {
      appW = availHeightMm * appRatio;
    }
    const appX = marginMm + (availWidthMm - appW) / 2;
    const appY = marginMm + (availHeightMm - appH) / 2;

    pdf.addImage(
      appendixImgData,
      'PNG',
      appX,
      appY,
      appW,
      appH,
      undefined,
      'FAST'
    );
  }

  const datePart = new Date().toISOString().slice(0, 10);
  pdf.save(`Ho_So_Cay_Phap_Ly_DAI_SON_${filenameSlug}_${datePart}.pdf`);
}
