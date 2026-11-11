import React, { useMemo, useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  FileCheck2,
  BookOpen,
  ListTree,
  ArrowUpRight,
  GitBranch,
  Search,
  Eye,
  FileText,
} from 'lucide-react';
import {
  AmendmentHistoryItem,
  ClauseItem,
  LegalArticle,
  LegalDocument,
} from '../types/legal';

export interface ConsolidationFootnote {
  index: number;
  articleId: string;
  articleNo: string;
  clauseNo?: string;
  amendingDocId: string;
  amendingDocNumber: string;
  amendingDocTitle: string;
  promulgationDate: string;
  effectiveDate: string;
  actionLabel: string;
  noteText: string;
  originalText?: string;
  replacedText?: string;
}

export interface ConsolidatedClauseEntry {
  clauseId: string;
  clauseNo: string;
  effectiveText: string;
  originalText?: string;
  isAmended: boolean;
  footnoteIndex?: number;
  amendingDocNumber?: string;
  effectiveDate?: string;
}

export interface ConsolidatedArticleEntry {
  article: LegalArticle;
  isAmended: boolean;
  isAnnulled: boolean;
  clauses: ConsolidatedClauseEntry[];
  articleLevelFootnoteIndex?: number;
  amendingDocNumber?: string;
  effectiveDate?: string;
  summaryNote?: string;
}

interface ConsolidatedDocumentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: LegalDocument | null;
  allDocuments: LegalDocument[];
  onSelectDocument: (doc: LegalDocument, articleId?: string) => void;
  onNavigateToArticleInReader: (articleId: string) => void;
  onOpenGenealogyTree?: (doc: LegalDocument) => void;
}

/**
 * Parse raw article content into structured clauses if `art.clauses` is not explicitly provided
 */
function parseClausesFallback(article: LegalArticle): ClauseItem[] {
  if (article.clauses && article.clauses.length > 0) {
    return article.clauses;
  }

  const lines = article.content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: ClauseItem[] = [];
  let currentClause: ClauseItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\d+)\.\s+(.*)$/);
    if (match) {
      if (currentClause) {
        parsed.push(currentClause);
      }
      currentClause = {
        id: `${article.id}-cl-${match[1]}`,
        clause_no: `Khoản ${match[1]}`,
        text: line,
        is_amended: false,
      };
    } else if (currentClause) {
      currentClause.text += `\n${line}`;
    } else {
      currentClause = {
        id: `${article.id}-cl-1`,
        clause_no: 'Khoản 1',
        text: line,
        is_amended: Boolean(article.is_amended),
      };
    }
  }

  if (currentClause) {
    parsed.push(currentClause);
  }

  return parsed;
}

export const ConsolidatedDocumentDrawer: React.FC<
  ConsolidatedDocumentDrawerProps
> = ({
  isOpen,
  onClose,
  document: selectedDoc,
  allDocuments,
  onSelectDocument,
  onNavigateToArticleInReader,
  onOpenGenealogyTree,
}) => {
  const [viewMode, setViewMode] = useState<'clean' | 'annotated'>('annotated');
  const [filterMode, setFilterMode] = useState<'all' | 'amended_only'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedFootnoteIdx, setHighlightedFootnoteIdx] = useState<
    number | null
  >(null);
  const [copiedState, setCopiedState] = useState<boolean>(false);

  const printIframeRef = useRef<HTMLIFrameElement | null>(null);
  const drawerScrollRef = useRef<HTMLDivElement | null>(null);

  const docMap = useMemo(() => {
    const map = new Map<string, LegalDocument>();
    for (const d of allDocuments) {
      map.set(d.id, d);
    }
    return map;
  }, [allDocuments]);

  // If the user opened the drawer while viewing an amending document (SĐ), resolve its root original document
  const rootDoc = useMemo<LegalDocument | null>(() => {
    if (!selectedDoc) return null;
    if (
      selectedDoc.is_amending_document &&
      selectedDoc.amends_doc_ids &&
      selectedDoc.amends_doc_ids.length > 0
    ) {
      const targetRoot = docMap.get(selectedDoc.amends_doc_ids[0]);
      if (targetRoot) return targetRoot;
    }
    return selectedDoc;
  }, [selectedDoc, docMap]);

  // Build deterministic Consolidated Document Model (VBHN)
  const consolidatedData = useMemo(() => {
    if (!rootDoc) return null;

    const sortedHistory: AmendmentHistoryItem[] = [
      ...(rootDoc.amendment_history || []),
    ].sort((a, b) => a.promulgation_date.localeCompare(b.promulgation_date));

    const footnotes: ConsolidationFootnote[] = [];
    const articles: ConsolidatedArticleEntry[] = [];
    let nextFootnoteIndex = 1;

    for (const art of rootDoc.articles) {
      const rawClauses = parseClausesFallback(art);
      const consolidatedClauses: ConsolidatedClauseEntry[] = [];
      let hasClauseLevelFootnote = false;

      // Find matching amendment history item if article is amended
      const matchingHistory = sortedHistory.find(
        (h) =>
          h.amending_doc_id === art.amendment_info?.amending_doc_id ||
          h.amending_doc_number === art.amendment_info?.amending_doc_number ||
          h.scopes.some((s) =>
            s.toLowerCase().includes(art.article_no.toLowerCase())
          )
      );

      for (const cl of rawClauses) {
        if (cl.is_amended && cl.diff_data) {
          const fnIdx = nextFootnoteIndex++;
          hasClauseLevelFootnote = true;
          const amendingDocObj = docMap.get(cl.diff_data.amending_doc_id);
          const amendingNumber =
            cl.diff_data.amending_doc_number ||
            amendingDocObj?.doc_number ||
            art.amendment_info?.amending_doc_number ||
            matchingHistory?.amending_doc_number ||
            'VB sửa đổi';
          const amendingTitle =
            amendingDocObj?.title ||
            art.amendment_info?.amending_doc_title ||
            matchingHistory?.amending_doc_title ||
            `Văn bản sửa đổi, bổ sung (${amendingNumber})`;
          const promulgationDate =
            matchingHistory?.promulgation_date ||
            amendingDocObj?.issue_date ||
            cl.diff_data.effective_date;

          footnotes.push({
            index: fnIdx,
            articleId: art.id,
            articleNo: art.article_no,
            clauseNo: cl.clause_no,
            amendingDocId: cl.diff_data.amending_doc_id,
            amendingDocNumber: amendingNumber,
            amendingDocTitle: amendingTitle,
            promulgationDate,
            effectiveDate: cl.diff_data.effective_date,
            actionLabel: 'Sửa đổi, bổ sung',
            noteText:
              cl.diff_data.change_summary ||
              `${cl.clause_no} ${art.article_no} được sửa đổi, bổ sung theo quy định tại ${amendingNumber}, có hiệu lực kể từ ngày ${cl.diff_data.effective_date}.`,
            originalText: cl.diff_data.original_text,
            replacedText: cl.diff_data.replaced_text,
          });

          consolidatedClauses.push({
            clauseId: cl.id,
            clauseNo: cl.clause_no,
            effectiveText: cl.diff_data.replaced_text,
            originalText: cl.diff_data.original_text,
            isAmended: true,
            footnoteIndex: fnIdx,
            amendingDocNumber: amendingNumber,
            effectiveDate: cl.diff_data.effective_date,
          });
        } else {
          consolidatedClauses.push({
            clauseId: cl.id,
            clauseNo: cl.clause_no,
            effectiveText: cl.text,
            isAmended: Boolean(cl.is_amended),
          });
        }
      }

      let articleLevelFootnoteIndex: number | undefined;
      if (art.is_amended && !hasClauseLevelFootnote) {
        const fnIdx = nextFootnoteIndex++;
        articleLevelFootnoteIndex = fnIdx;
        const amendingNumber =
          art.amendment_info?.amending_doc_number ||
          matchingHistory?.amending_doc_number ||
          'VB sửa đổi';
        const amendingTitle =
          art.amendment_info?.amending_doc_title ||
          matchingHistory?.amending_doc_title ||
          `Văn bản sửa đổi, bổ sung (${amendingNumber})`;
        const effectiveDate =
          art.amendment_info?.effective_date ||
          matchingHistory?.effective_date ||
          rootDoc.effective_date;
        const promulgationDate =
          matchingHistory?.promulgation_date || effectiveDate;

        footnotes.push({
          index: fnIdx,
          articleId: art.id,
          articleNo: art.article_no,
          amendingDocId:
            art.amendment_info?.amending_doc_id ||
            matchingHistory?.amending_doc_id ||
            '',
          amendingDocNumber: amendingNumber,
          amendingDocTitle: amendingTitle,
          promulgationDate,
          effectiveDate,
          actionLabel:
            art.amendment_info?.action_type === 'BAI_BO_MOT_PHAN'
              ? 'Bãi bỏ một phần'
              : 'Sửa đổi, bổ sung',
          noteText:
            art.amendment_info?.summary ||
            art.amendment_note ||
            `${art.article_no} được sửa đổi, bổ sung theo quy định tại ${amendingNumber}, có hiệu lực kể từ ngày ${effectiveDate}.`,
        });
      }

      articles.push({
        article: art,
        isAmended: Boolean(art.is_amended || hasClauseLevelFootnote),
        isAnnulled: Boolean(art.is_annulled),
        clauses: consolidatedClauses,
        articleLevelFootnoteIndex,
        amendingDocNumber:
          art.amendment_info?.amending_doc_number ||
          matchingHistory?.amending_doc_number,
        effectiveDate:
          art.amendment_info?.effective_date ||
          matchingHistory?.effective_date,
        summaryNote: art.amendment_info?.summary || art.amendment_note,
      });
    }

    const isOfficialVbhn =
      rootDoc.authenticity_tier === 'OFFICIAL_VBHN' ||
      (Boolean(rootDoc.is_consolidated) &&
        Boolean(rootDoc.consolidated_doc_number) &&
        !rootDoc.consolidated_doc_number?.startsWith('THNB-'));

    const vbhnDocNumber = isOfficialVbhn
      ? rootDoc.consolidated_doc_number || rootDoc.doc_number
      : rootDoc.consolidated_doc_number?.startsWith('THNB-')
        ? rootDoc.consolidated_doc_number
        : `THNB-${rootDoc.doc_number.replace(/\//g, '-')}`;

    const latestAmendmentDate =
      sortedHistory.length > 0
        ? sortedHistory[sortedHistory.length - 1].effective_date ||
          sortedHistory[sortedHistory.length - 1].promulgation_date
        : rootDoc.effective_date;

    return {
      rootDoc,
      isOfficialVbhn,
      vbhnDocNumber,
      latestAmendmentDate,
      sortedHistory,
      articles,
      footnotes,
      amendedArticlesCount: articles.filter((a) => a.isAmended).length,
    };
  }, [rootDoc, docMap]);

  const filteredArticles = useMemo(() => {
    if (!consolidatedData) return [];
    const q = searchQuery.trim().toLowerCase();
    return consolidatedData.articles.filter((entry) => {
      if (filterMode === 'amended_only' && !entry.isAmended) return false;
      if (!q) return true;
      const inHeader =
        entry.article.article_no.toLowerCase().includes(q) ||
        entry.article.article_title.toLowerCase().includes(q) ||
        entry.article.chapter_no.toLowerCase().includes(q) ||
        entry.article.chapter_title.toLowerCase().includes(q);
      if (inHeader) return true;
      return entry.clauses.some((c) =>
        c.effectiveText.toLowerCase().includes(q)
      );
    });
  }, [consolidatedData, filterMode, searchQuery]);

  if (!isOpen || !consolidatedData) return null;

  const scrollToElementInDrawer = (elementId: string) => {
    const el = window.document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /**
   * Build self-contained Decree 30/2020/ND-CP A4 HTML document with Genealogy TOC & VBHN Footnotes
   */
  const buildStandaloneA4Html = (): string => {
    const {
      rootDoc: d,
      vbhnDocNumber,
      latestAmendmentDate,
      sortedHistory,
      articles,
      footnotes,
    } = consolidatedData;

    const historyRowsHtml =
      sortedHistory.length > 0
        ? sortedHistory
            .map(
              (h, idx) => `
          <tr>
            <td style="text-align:center; font-family: monospace;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: bold;">${h.amending_doc_number || h.amending_doc_id}</td>
            <td>${h.amending_doc_title}</td>
            <td style="text-align:center; font-family: monospace;">${h.promulgation_date}</td>
            <td style="text-align:center; font-family: monospace;">${h.effective_date || h.promulgation_date}</td>
            <td>${(h.scopes || []).join(', ')}</td>
          </tr>`
            )
            .join('')
        : `<tr><td colspan="6" style="text-align:center; font-style:italic;">Văn bản giữ nguyên hiệu lực gốc (${d.doc_number})</td></tr>`;

    const tocRowsHtml = articles
      .map(
        (entry) => `
        <tr>
          <td style="font-family: monospace; font-weight: bold; white-space: nowrap;">${entry.article.article_no}</td>
          <td>${entry.article.article_title}</td>
          <td style="font-family: monospace; text-align: center;">${entry.clauses.length} khoản</td>
          <td>${
            entry.isAmended
              ? `<strong style="color:#92400e;">Đã hợp nhất sửa đổi (${entry.amendingDocNumber || 'VB SĐ'})</strong>`
              : 'Giữ nguyên bản gốc'
          }</td>
        </tr>`
      )
      .join('');

    let prevChap = '';
    const articlesHtml = articles
      .map((entry) => {
        const showChapter = entry.article.chapter_no !== prevChap;
        prevChap = entry.article.chapter_no;

        const chapterHtml = showChapter
          ? `<div class="chapter-heading">
              <div class="chap-no">${entry.article.chapter_no}</div>
              <div class="chap-title">${entry.article.chapter_title}</div>
            </div>`
          : '';

        const clausesHtml = entry.clauses
          .map((cl) => {
            const fnSup = cl.footnoteIndex
              ? `<sup class="fn-ref">[${cl.footnoteIndex}]</sup>`
              : '';
            const highlightStyle =
              viewMode === 'annotated' && cl.isAmended
                ? 'background:#fef3c7; border-bottom:1px dashed #b45309; padding:1px 3px;'
                : '';
            return `<p class="clause-p"><span style="${highlightStyle}">${cl.effectiveText.replace(
              /\n/g,
              '<br/>'
            )}</span>${fnSup}</p>`;
          })
          .join('');

        const artFnSup = entry.articleLevelFootnoteIndex
          ? `<sup class="fn-ref">[${entry.articleLevelFootnoteIndex}]</sup>`
          : '';

        return `
          ${chapterHtml}
          <div class="article-block">
            <div class="article-title">
              <strong>${entry.article.article_no}. ${entry.article.article_title}</strong>${artFnSup}
              ${
                entry.isAmended
                  ? `<span class="amended-tag">[Đã hợp nhất: ${entry.amendingDocNumber || 'VB SĐ'}]</span>`
                  : ''
              }
            </div>
            ${clausesHtml}
          </div>
        `;
      })
      .join('');

    const footnotesHtml =
      footnotes.length > 0
        ? `
        <div class="footnotes-section">
          <h3>CHÚ THÍCH PHẢ HỆ & CĂN CỨ HỢP NHẤT VĂN BẢN</h3>
          ${footnotes
            .map(
              (fn) => `
            <div class="fn-item">
              <strong>[${fn.index}] ${fn.articleNo}${fn.clauseNo ? ` (${fn.clauseNo})` : ''}:</strong>
              ${fn.noteText}
              ${
                fn.originalText
                  ? `<div class="fn-orig"><em>Lời văn bản gốc trước khi sửa đổi:</em> <del>${fn.originalText}</del></div>`
                  : ''
              }
            </div>`
            )
            .join('')}
        </div>`
        : '';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Văn bản hợp nhất ${vbhnDocNumber} - ${d.title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 30mm;
    }
    body {
      font-family: "Times New Roman", "Source Serif 4", Georgia, serif;
      font-size: 13pt;
      line-height: 1.55;
      color: #111827;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .page-container {
      max-width: 175mm;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18pt;
    }
    .header-table td {
      vertical-align: top;
      text-align: center;
      padding: 0 4pt;
    }
    .org-name {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .doc-no {
      font-size: 11pt;
      margin-top: 4pt;
    }
    .quoc-hieu {
      font-size: 11.5pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .tieu-ngu {
      font-size: 12pt;
      font-weight: bold;
    }
    .header-line {
      width: 110px;
      border-bottom: 1px solid #111827;
      margin: 4pt auto;
    }
    .place-date {
      font-size: 11pt;
      font-style: italic;
      margin-top: 4pt;
    }
    .doc-heading {
      text-align: center;
      margin: 18pt 0 14pt;
    }
    .doc-type-label {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .doc-title-main {
      font-size: 13.5pt;
      font-weight: bold;
      margin-top: 4pt;
    }
    .preamble-box {
      border: 1px solid #d1d5db;
      background: #f9fafb;
      padding: 10pt 12pt;
      margin-bottom: 16pt;
      font-size: 11pt;
    }
    .genealogy-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0 18pt;
      font-size: 10.5pt;
    }
    .genealogy-table th, .genealogy-table td {
      border: 1px solid #9ca3af;
      padding: 5pt 6pt;
      text-align: left;
    }
    .genealogy-table th {
      background: #f3f4f6;
      font-weight: bold;
      text-align: center;
    }
    .chapter-heading {
      text-align: center;
      margin: 18pt 0 10pt;
      page-break-after: avoid;
    }
    .chap-no {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 12.5pt;
    }
    .chap-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 13pt;
    }
    .article-block {
      margin-bottom: 12pt;
    }
    .article-title {
      font-size: 13pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
    }
    .amended-tag {
      font-size: 9.5pt;
      font-family: sans-serif;
      color: #92400e;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: 6pt;
    }
    .clause-p {
      margin: 4pt 0;
      text-align: justify;
      text-indent: 10mm;
    }
    .fn-ref {
      color: #b45309;
      font-weight: bold;
      font-size: 9pt;
      margin-left: 2px;
    }
    .footnotes-section {
      margin-top: 22pt;
      padding-top: 12pt;
      border-top: 1.5px solid #111827;
      font-size: 10.5pt;
    }
    .footnotes-section h3 {
      font-size: 11.5pt;
      text-transform: uppercase;
      margin-bottom: 8pt;
    }
    .fn-item {
      margin-bottom: 6pt;
      text-align: justify;
    }
    .fn-orig {
      margin-top: 2pt;
      color: #6b7280;
      font-size: 10pt;
    }
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24pt;
      page-break-inside: avoid;
    }
    .footer-table td {
      vertical-align: top;
    }
    .noi-nhan {
      font-size: 10pt;
      line-height: 1.4;
    }
    .sig-box {
      text-align: center;
      font-size: 11.5pt;
    }
    .stamp-badge {
      display: inline-block;
      margin: 16pt 0;
      padding: 5pt 10pt;
      border: 2px solid #dc2626;
      color: #dc2626;
      font-weight: bold;
      font-size: 10pt;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <table class="header-table">
      <tr>
        <td style="width: 44%;">
          <div class="org-name">${d.issuing_body}</div>
          <div class="header-line"></div>
          <div class="doc-no">Số: <strong>${vbhnDocNumber}</strong><br/><span style="font-size:9.5pt;">(Hợp nhất từ ${d.doc_number})</span></div>
        </td>
        <td style="width: 56%;">
          <div class="quoc-hieu">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div class="tieu-ngu">Độc lập - Tự do - Hạnh phúc</div>
          <div class="header-line" style="width: 150px;"></div>
          <div class="place-date">Hà Nội, ngày hợp nhất hiệu lực ${latestAmendmentDate}</div>
        </td>
      </tr>
    </table>

    <div class="doc-heading">
      <div class="doc-type-label">VĂN BẢN HỢP NHẤT · ${d.doc_type}</div>
      <div class="doc-title-main">${d.title}</div>
    </div>

    <div class="preamble-box">
      <strong>LỜI NÓI ĐẦU & CĂN CỨ HỢP NHẤT:</strong><br/>
      Văn bản gốc <strong>${d.doc_type} số ${d.doc_number}</strong> (${d.title}) ngày ${d.issue_date} của ${d.issuing_body}, có hiệu lực kể từ ngày ${d.effective_date}, được sửa đổi, bổ sung bởi <strong>${sortedHistory.length}</strong> văn bản quy phạm pháp luật sau đây:
      <table class="genealogy-table">
        <thead>
          <tr>
            <th>Lần</th>
            <th>Số hiệu VB sửa đổi</th>
            <th>Tên văn bản sửa đổi, bổ sung</th>
            <th>Ngày ban hành</th>
            <th>Ngày hiệu lực</th>
            <th>Phạm vi Điều/Khoản tác động</th>
          </tr>
        </thead>
        <tbody>
          ${historyRowsHtml}
        </tbody>
      </table>
      <strong>MỤC LỤC PHẢ HỆ ĐIỀU KHOẢN HỢP NHẤT (${articles.length} Điều · ${consolidatedData.amendedArticlesCount} Điều có nội dung sửa đổi):</strong>
      <table class="genealogy-table">
        <thead>
          <tr>
            <th>Điều</th>
            <th>Tên Điều khoản</th>
            <th>Cấu trúc</th>
            <th>Trạng thái Phả hệ trong Bản Hợp nhất</th>
          </tr>
        </thead>
        <tbody>
          ${tocRowsHtml}
        </tbody>
      </table>
    </div>

    ${articlesHtml}

    ${footnotesHtml}

    <table class="footer-table">
      <tr>
        <td style="width: 50%;" class="noi-nhan">
          <strong><em>Nơi nhận:</em></strong><br/>
          - Như Điều khoản thi hành;<br/>
          - Công báo; Cổng TTĐT Chính phủ;<br/>
          - Phòng Pháp chế, Kiểm toán nội bộ & QLDA;<br/>
          - Lưu: VT, Hồ sơ Pháp điển hóa SSoT ĐẠI SƠN.
        </td>
        <td style="width: 50%;" class="sig-box">
          <strong>${consolidatedData.isOfficialVbhn ? 'XÁC THỰC VĂN BẢN HỢP NHẤT CHÍNH THỨC' : 'BẢN TỔNG HỢP NỘI BỘ PHỤC VỤ TRA CỨU (INTERNAL WORKING SYNTHESIS)'}</strong><br/>
          <strong>${consolidatedData.isOfficialVbhn ? `TM. ${d.issuing_body.toUpperCase()}` : `NGUỒN GỐC: ${d.issuing_body.toUpperCase()}`}</strong><br/>
          <div class="stamp-badge">${consolidatedData.isOfficialVbhn ? `[VBHN Chính thức · ${vbhnDocNumber}]` : `[Bản tổng hợp nội bộ tự động · ${vbhnDocNumber} — Không thay thế VBHN Công báo]`}</div><br/>
          <strong>${d.signer}</strong>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  };

  const handlePrintA4 = () => {
    const htmlContent = buildStandaloneA4Html();
    const iframe = printIframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 180);
  };

  const handleDownloadA4Html = () => {
    const htmlContent = buildStandaloneA4Html();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `VBHN_${consolidatedData.rootDoc.doc_number.replace(
      /\//g,
      '_'
    )}_Chuan_ND30_2020.html`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyConsolidatedText = () => {
    const lines: string[] = [
      `VĂN BẢN HỢP NHẤT: ${consolidatedData.vbhnDocNumber}`,
      `${consolidatedData.rootDoc.doc_type.toUpperCase()} - ${consolidatedData.rootDoc.title}`,
      `(Hợp nhất từ văn bản gốc ${consolidatedData.rootDoc.doc_number} qua ${consolidatedData.sortedHistory.length} lần sửa đổi, bổ sung)`,
      '------------------------------------------------------------',
    ];

    for (const entry of consolidatedData.articles) {
      lines.push(
        `\n${entry.article.article_no}. ${entry.article.article_title}${
          entry.isAmended
            ? ` [Đã hợp nhất theo ${entry.amendingDocNumber || 'VB SĐ'}]`
            : ''
        }`
      );
      for (const cl of entry.clauses) {
        lines.push(
          `${cl.effectiveText}${cl.footnoteIndex ? ` [${cl.footnoteIndex}]` : ''}`
        );
      }
    }

    if (consolidatedData.footnotes.length > 0) {
      lines.push(
        '\n------------------------------------------------------------'
      );
      lines.push('CHÚ THÍCH PHẢ HỆ HỢP NHẤT:');
      for (const fn of consolidatedData.footnotes) {
        lines.push(`[${fn.index}] ${fn.noteText}`);
      }
    }

    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedState(true);
    window.setTimeout(() => setCopiedState(false), 2200);
  };

  const {
    rootDoc: doc,
    vbhnDocNumber,
    latestAmendmentDate,
    sortedHistory,
    footnotes,
    amendedArticlesCount,
  } = consolidatedData;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs animate-fadeIn">
      {/* Hidden iframe dedicated to clean A4 printing without window.open */}
      <iframe
        ref={printIframeRef}
        title="A4 VBHN Print Frame"
        className="hidden w-0 h-0 border-0"
      />

      <div className="w-full max-w-5xl bg-[#FBF9F5] dark:bg-[#141413] text-stone-900 dark:text-stone-100 h-full flex flex-col shadow-2xl border-l border-[#C6A342]/60 overflow-hidden">
        {/* DRAWER HEADER */}
        <div className="px-5 py-4 bg-[#152D42] text-[#FBF9F5] border-b border-[#C6A342]/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#E9C96D] font-semibold">
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span>BẢN VĂN BẢN HỢP NHẤT TỰ ĐỘNG (VBHN ENGINE)</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-code">{vbhnDocNumber}</span>
              <span aria-hidden="true">·</span>
              <span>
                Hợp nhất {sortedHistory.length} lần sửa đổi ({amendedArticlesCount}/
                {doc.articles.length} Điều được cập nhật)
              </span>
            </div>
            <h2 className="font-display text-base sm:text-lg font-bold text-white truncate">
              {doc.doc_number} — {doc.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrintA4}
              className="px-3.5 py-2 rounded-lg bg-[#C6A342] hover:bg-[#d8b54f] text-[#152D42] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition shadow-xs whitespace-nowrap shrink-0"
              title="In Bản A4 chuẩn Nghị định 30/2020/NĐ-CP kèm Mục lục Phả hệ sửa đổi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Bản A4 (NĐ 30/2020)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadA4Html}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#E9C96D] border border-[#C6A342]/50 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shrink-0"
              title="Tải xuống tệp A4 chuẩn Nghị định 30/2020/NĐ-CP (.HTML) kèm Mục lục Phả hệ"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất A4 (.HTML)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 cursor-pointer transition"
              title="Đóng Drawer Văn bản Hợp nhất"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DRAWER CONTROL BAR (View Mode: Clean vs Annotated | Filter: All vs Amended Only | Search) */}
        <div className="px-5 py-2.5 bg-white dark:bg-[#1C1B19] border-b border-stone-200 dark:border-[#2E2C28] flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
          {/* Segmented Mode Control */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setViewMode('annotated')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'annotated'
                    ? 'bg-[#152D42] text-[#E9C96D] shadow-2xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                Đánh dấu vết hợp nhất
              </button>
              <button
                type="button"
                onClick={() => setViewMode('clean')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'clean'
                    ? 'bg-[#152D42] text-[#E9C96D] shadow-2xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                Bản hợp nhất sạch (Chuẩn in)
              </button>
            </div>

            <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Toàn văn ({doc.articles.length} Điều)
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('amended_only')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  filterMode === 'amended_only'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Chỉ Điều có hợp nhất ({amendedArticlesCount})
              </button>
            </div>
          </div>

          {/* Search & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trong Bản Hợp nhất..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#141413] text-xs w-48 focus:outline-none focus:border-[#C6A342]"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyConsolidatedText}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-[#C6A342] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shrink-0"
            >
              {copiedState ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Đã sao chép VBHN
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép toàn văn</span>
                </>
              )}
            </button>

            {onOpenGenealogyTree && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGenealogyTree(doc);
                }}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-[#C6A342] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shrink-0"
              >
                <GitBranch className="w-3.5 h-3.5 text-[#152D42] dark:text-amber-300" />
                <span>Cây Phả hệ D3</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN A4 CONSOLIDATED DOCUMENT BODY */}
        <div
          ref={drawerScrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center scroll-smooth"
        >
          <div className="w-full max-w-[210mm] bg-[#FFFDF9] dark:bg-[#181715] border border-[#DED7C4] dark:border-[#2E2C28] rounded-sm shadow-sm px-6 py-8 sm:px-14 sm:py-12 font-serif-prose space-y-8 self-start">
            {/* 1. QUỐC HIỆU & TIÊU NGỮ CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP */}
            <header className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-center pb-6 border-b border-stone-300 dark:border-stone-800">
              <div className="sm:col-span-5 space-y-1 flex flex-col items-center">
                <div className="text-xs sm:text-[13px] font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100">
                  {doc.issuing_body.toUpperCase()}
                </div>
                <div className="w-24 border-b border-stone-800 dark:border-stone-300 my-1" />
                <div className="text-xs font-mono-code text-stone-700 dark:text-stone-300">
                  Số: <b>{vbhnDocNumber}</b>
                </div>
                <div className="text-[11px] font-sans text-stone-500">
                  (Hợp nhất từ văn bản gốc {doc.doc_number})
                </div>
              </div>

              <div className="sm:col-span-7 space-y-1 flex flex-col items-center">
                <div className="text-xs sm:text-[13px] font-bold uppercase tracking-wide text-stone-900 dark:text-stone-100">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-xs sm:text-[13px] font-bold text-stone-900 dark:text-stone-100">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="w-40 border-b border-stone-800 dark:border-stone-300 my-1" />
                <div className="text-xs italic text-stone-600 dark:text-stone-400 pt-1">
                  Hà Nội, hợp nhất hiệu lực đến ngày {latestAmendmentDate}
                </div>
              </div>
            </header>

            {/* 2. TÊN LOẠI VĂN BẢN HỢP NHẤT & LỜI NÓI ĐẦU PHÁP ĐIỂN HÓA */}
            <section className="text-center space-y-2">
              <div className="text-sm font-sans font-bold uppercase tracking-widest text-[#152D42] dark:text-amber-300">
                VĂN BẢN HỢP NHẤT · {doc.doc_type.toUpperCase()}
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 max-w-2xl mx-auto leading-snug">
                {doc.title}
              </h1>
              <div className="w-28 border-b border-stone-400 dark:border-stone-600 mx-auto my-2" />
            </section>

            {/* 3. BẢNG MỤC LỤC PHẢ HỆ SỬA ĐỔI & ĐIỀU KHOẢN HỢP NHẤT */}
            <section className="p-4 sm:p-5 rounded-xl bg-[#FBF7EC] dark:bg-[#1F1D18] border border-[#D8C99E] dark:border-stone-800 font-sans space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300 flex items-center gap-1.5">
                  <ListTree className="w-4 h-4 text-[#C6A342]" />
                  <span>
                    01. Lời nói đầu & Danh mục Văn bản được hợp nhất (
                    {sortedHistory.length} lần sửa đổi, bổ sung)
                  </span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  <b>{doc.doc_type} số {doc.doc_number}</b> ngày {doc.issue_date}{' '}
                  của {doc.issuing_body} ({doc.title}), có hiệu lực kể từ ngày{' '}
                  {doc.effective_date}, được sửa đổi, bổ sung bởi:
                </p>
              </div>

              {sortedHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400">
                        <th className="py-2 pr-3 font-semibold">Lần</th>
                        <th className="py-2 px-3 font-semibold">Số hiệu</th>
                        <th className="py-2 px-3 font-semibold">
                          Tên văn bản sửa đổi, bổ sung
                        </th>
                        <th className="py-2 px-3 font-semibold text-right">
                          Ban hành
                        </th>
                        <th className="py-2 pl-3 font-semibold">
                          Phạm vi hợp nhất
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/80 dark:divide-stone-800">
                      {sortedHistory.map((item, idx) => {
                        const targetAmendingDoc = docMap.get(
                          item.amending_doc_id
                        );
                        return (
                          <tr
                            key={`${item.amending_doc_id}-${idx}`}
                            className="hover:bg-white/60 dark:hover:bg-stone-800/50"
                          >
                            <td className="py-2 pr-3 font-mono-code tabular-nums font-bold text-[#152D42] dark:text-amber-300">
                              0{idx + 1}
                            </td>
                            <td className="py-2 px-3 font-mono-code tabular-nums font-bold whitespace-nowrap">
                              {targetAmendingDoc ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onSelectDocument(targetAmendingDoc);
                                  }}
                                  className="text-[#286181] dark:text-amber-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>
                                    {item.amending_doc_number ||
                                      targetAmendingDoc.doc_number}
                                  </span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                              ) : (
                                item.amending_doc_number || item.amending_doc_id
                              )}
                            </td>
                            <td className="py-2 px-3 text-stone-800 dark:text-stone-200">
                              {item.amending_doc_title}
                            </td>
                            <td className="py-2 px-3 font-mono-code tabular-nums text-right whitespace-nowrap text-stone-600 dark:text-stone-400">
                              {item.promulgation_date}
                            </td>
                            <td className="py-2 pl-3 font-mono-code text-[11px] text-amber-900 dark:text-amber-300">
                              {(item.scopes || []).join(' · ') || 'Toàn văn'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-stone-500 italic">
                  Văn bản hiện đang giữ nguyên toàn bộ lời văn gốc từ ngày ban
                  hành ({doc.issue_date}).
                </div>
              )}

              {/* Mục lục điều khoản hợp nhất tương tác */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                    02. Mục lục Phả hệ Điều khoản ({consolidatedData.articles.length}{' '}
                    Điều · {amendedArticlesCount} Điều đã ghép sửa đổi)
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Nhấp để cuộn đến Điều khoản trong Bản Hợp nhất
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {consolidatedData.articles.map((entry) => (
                    <button
                      key={entry.article.id}
                      type="button"
                      onClick={() =>
                        scrollToElementInDrawer(
                          `vbhn-art-${entry.article.id}`
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-[#171614] hover:border-[#C6A342] text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition"
                    >
                      <span className="truncate text-stone-800 dark:text-stone-200">
                        <b className="font-mono-code text-[#152D42] dark:text-amber-300">
                          {entry.article.article_no}.
                        </b>{' '}
                        {entry.article.article_title}
                      </span>
                      <span className="font-mono-code tabular-nums text-[10px] shrink-0 text-stone-500 dark:text-stone-400">
                        {entry.isAmended
                          ? `Đã hợp nhất · ${entry.clauses.length}k`
                          : `Bản gốc · ${entry.clauses.length}k`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. TOÀN VĂN CÁC CHƯƠNG & ĐIỀU ĐÃ GHÉP HỢP NHẤT (VBHN STREAM) */}
            <div className="space-y-7">
              {filteredArticles.map((entry, idx) => {
                const prevChap =
                  idx > 0 ? filteredArticles[idx - 1].article.chapter_no : null;
                const showChapBanner = entry.article.chapter_no !== prevChap;

                return (
                  <div key={entry.article.id} className="space-y-4">
                    {showChapBanner && (
                      <div className="text-center pt-5 pb-2 border-t border-stone-200 dark:border-stone-800 space-y-0.5">
                        <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#152D42] dark:text-amber-300">
                          {entry.article.chapter_no}
                        </div>
                        <div className="text-sm sm:text-base font-bold uppercase text-stone-900 dark:text-stone-100">
                          {entry.article.chapter_title}
                        </div>
                      </div>
                    )}

                    <section
                      id={`vbhn-art-${entry.article.id}`}
                      className={`p-4 sm:p-5 rounded-xl border transition ${
                        viewMode === 'annotated' && entry.isAmended
                          ? 'bg-emerald-50/35 dark:bg-emerald-950/15 border-emerald-300/70 dark:border-emerald-800/60'
                          : 'bg-transparent border-stone-200/60 dark:border-stone-800/60'
                      }`}
                    >
                      {/* Tiêu đề Điều khoản Hợp nhất */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-stone-200/70 dark:border-stone-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-[#152D42] dark:text-amber-300">
                            {entry.article.article_no}.{' '}
                            {entry.article.article_title}
                            {entry.articleLevelFootnoteIndex && (
                              <button
                                type="button"
                                onClick={() => {
                                  setHighlightedFootnoteIdx(
                                    entry.articleLevelFootnoteIndex!
                                  );
                                  scrollToElementInDrawer(
                                    `vbhn-fn-${entry.articleLevelFootnoteIndex}`
                                  );
                                }}
                                className="ml-1 font-mono-code text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer align-super"
                                title="Xem chú thích căn cứ hợp nhất của Điều này"
                              >
                                [{entry.articleLevelFootnoteIndex}]
                              </button>
                            )}
                          </h3>

                          {viewMode === 'annotated' && entry.isAmended && (
                            <span className="font-sans text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                              · Đã hợp nhất theo{' '}
                              <b className="font-mono-code">
                                {entry.amendingDocNumber || 'VB SĐ'}
                              </b>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToArticleInReader(entry.article.id);
                          }}
                          className="font-sans text-[11px] font-semibold text-[#286181] dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Xem tại Cột 3</span>
                        </button>
                      </div>

                      {/* Danh sách các Khoản sau khi đã tự động thay thế bằng replaced_text */}
                      <div className="space-y-3 text-sm sm:text-[15px] leading-relaxed text-justify">
                        {entry.clauses.map((cl) => (
                          <div key={cl.clauseId} className="space-y-1.5">
                            <p className="text-stone-900 dark:text-stone-100 whitespace-pre-line">
                              <span
                                className={
                                  viewMode === 'annotated' && cl.isAmended
                                    ? 'bg-emerald-100/70 dark:bg-emerald-950/60 px-1 py-0.5 rounded border-b border-emerald-500/60'
                                    : ''
                                }
                              >
                                {cl.effectiveText}
                              </span>
                              {cl.footnoteIndex && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHighlightedFootnoteIdx(cl.footnoteIndex!);
                                    scrollToElementInDrawer(
                                      `vbhn-fn-${cl.footnoteIndex}`
                                    );
                                  }}
                                  className="ml-1 font-mono-code text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer align-super"
                                  title={`Xem chú thích hợp nhất [${cl.footnoteIndex}] (${cl.amendingDocNumber})`}
                                >
                                  [{cl.footnoteIndex}]
                                </button>
                              )}
                            </p>

                            {/* Trong chế độ Annotated, hiển thị chú thích nhỏ gọn về văn bản gốc đã được thay thế */}
                            {viewMode === 'annotated' &&
                              cl.isAmended &&
                              cl.originalText && (
                                <div className="font-sans text-xs p-2.5 rounded-lg bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 space-y-1">
                                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                                    <span>
                                      Chú thích hợp nhất [{cl.footnoteIndex}] · Thay
                                      thế bởi {cl.amendingDocNumber} (Hiệu lực:{' '}
                                      {cl.effectiveDate})
                                    </span>
                                  </div>
                                  <div className="line-through text-red-700/80 dark:text-red-400/80">
                                    Bản gốc cũ: {cl.originalText}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                );
              })}
            </div>

            {/* 5. DANH MỤC CHÚ THÍCH HỢP NHẤT CUỐI VĂN BẢN ([1], [2]...) */}
            {footnotes.length > 0 && (
              <section className="pt-6 border-t-2 border-stone-300 dark:border-stone-800 font-sans space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#152D42] dark:text-amber-300">
                  CHÚ THÍCH CĂN CỨ HỢP NHẤT VĂN BẢN ({footnotes.length} chú thích)
                </h3>
                <div className="space-y-2">
                  {footnotes.map((fn) => {
                    const isHighlighted = highlightedFootnoteIdx === fn.index;
                    const targetAmendingDoc = docMap.get(fn.amendingDocId);
                    return (
                      <div
                        key={fn.index}
                        id={`vbhn-fn-${fn.index}`}
                        className={`p-3 rounded-xl border text-xs transition ${
                          isHighlighted
                            ? 'bg-[#FBF5DF] dark:bg-amber-950/50 border-[#C6A342]'
                            : 'bg-stone-50 dark:bg-[#1E1D1B] border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-bold text-[#152D42] dark:text-amber-300">
                            <span className="font-mono-code">[{fn.index}]</span>{' '}
                            {fn.articleNo}
                            {fn.clauseNo ? ` · ${fn.clauseNo}` : ''} —{' '}
                            {fn.actionLabel} bởi{' '}
                            <span className="font-mono-code">
                              {fn.amendingDocNumber}
                            </span>{' '}
                            (Hiệu lực: {fn.effectiveDate})
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                scrollToElementInDrawer(
                                  `vbhn-art-${fn.articleId}`
                                )
                              }
                              className="text-[11px] font-semibold text-[#286181] dark:text-amber-400 hover:underline cursor-pointer"
                            >
                              ↑ Lên {fn.articleNo}
                            </button>
                            {targetAmendingDoc && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onSelectDocument(targetAmendingDoc);
                                }}
                                className="text-[11px] font-semibold text-[#152D42] dark:text-amber-300 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Mở {fn.amendingDocNumber}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="mt-1 text-stone-700 dark:text-stone-300 leading-relaxed">
                          {fn.noteText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 6. KHỐI XÁC THỰC VĂN BẢN HỢP NHẤT & NƠI NHẬN CHUẨN NĐ 30/2020/NĐ-CP */}
            <footer className="pt-6 border-t border-stone-300 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-12 gap-6 text-xs">
              <div className="sm:col-span-6 space-y-1 text-stone-600 dark:text-stone-400">
                <div className="font-bold italic underline underline-offset-2 text-stone-900 dark:text-stone-100">
                  Nơi nhận:
                </div>
                <ul className="space-y-0.5 text-[11px] leading-relaxed">
                  <li>- Như Điều khoản thi hành;</li>
                  <li>- Công báo; Cổng Thông tin điện tử Chính phủ;</li>
                  <li>- Ban Pháp chế, Kiểm toán nội bộ & QLDA;</li>
                  <li>- Lưu: VT, Hồ sơ Văn bản Hợp nhất SSoT ĐẠI SƠN.</li>
                </ul>
              </div>

              <div className="sm:col-span-6 text-center space-y-4 flex flex-col items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold uppercase text-stone-900 dark:text-stone-100">
                    {consolidatedData.isOfficialVbhn
                      ? 'XÁC THỰC VĂN BẢN HỢP NHẤT CHÍNH THỨC'
                      : 'BẢN TỔNG HỢP NỘI BỘ PHỤC VỤ TRA CỨU'}
                  </div>
                  <div className="font-bold uppercase text-stone-800 dark:text-stone-200">
                    {consolidatedData.isOfficialVbhn
                      ? `TM. ${doc.issuing_body.toUpperCase()}`
                      : `CƠ QUAN BAN HÀNH VĂN BẢN GỐC: ${doc.issuing_body.toUpperCase()}`}
                  </div>
                </div>

                {consolidatedData.isOfficialVbhn ? (
                  <div className="px-4 py-1.5 rounded border-2 border-emerald-600/75 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-sans font-bold text-[11px] uppercase tracking-wider">
                    [VBHN Chính thức Công báo · {vbhnDocNumber}]
                  </div>
                ) : (
                  <div className="px-4 py-1.5 rounded border-2 border-amber-600/75 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-sans font-bold text-[11px] uppercase tracking-wider">
                    [Bản tổng hợp nội bộ · Mã {vbhnDocNumber} · Không thay thế VBHN Công báo]
                  </div>
                )}

                <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {doc.signer}
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
