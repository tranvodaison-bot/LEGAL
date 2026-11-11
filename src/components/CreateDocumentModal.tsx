import React, { useState, useMemo } from 'react';
import {
  FilePlus2,
  Sparkles,
  X,
  CheckCircle2,
  Upload,
  Loader2,
  FileScan,
} from 'lucide-react';
import {
  CrossRefRelationType,
  LegalArticle,
  LegalCrossReference,
  LegalDocType,
  LegalDocument,
  LegalDocumentStatus,
  LegalField,
  ProjectLifecycleStage,
} from '../types/legal';
import {
  LEGAL_FIELDS,
  PROJECT_LIFECYCLE_STAGES,
  RELATION_META,
  STATUS_META,
} from '../data/legalCorpus';
import { extractDocumentViaGeminiMultimodal } from '../utils/ocrClient';

interface CreateDocumentModalProps {
  existingDocuments: LegalDocument[];
  onSaveNewDocument: (
    newDoc: LegalDocument,
    newCrossRef?: LegalCrossReference
  ) => void;
  onClose: () => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  existingDocuments,
  onSaveNewDocument,
  onClose,
}) => {
  const [docNumber, setDocNumber] = useState('');
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<LegalDocType>('Thông tư');
  const [field, setField] = useState<LegalField>('Xây dựng');
  const [projectStage, setProjectStage] = useState<ProjectLifecycleStage>('Thực thi');
  const [status, setStatus] = useState<LegalDocumentStatus>('CON_HIEU_LUC');
  const [issuingBody, setIssuingBody] = useState('Bộ Xây dựng');
  const [signer, setSigner] = useState('Bộ trưởng Bộ Xây dựng');
  const [issueDate, setIssueDate] = useState('2026-11-08');
  const [effectiveDate, setEffectiveDate] = useState('2026-12-15');
  const [expirationDate, setExpirationDate] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [rawArticlesText, setRawArticlesText] = useState(
    `Chương I: QUY ĐỊNH CHUNG VỀ ĐỊNH MỨC VÀ QUẢN LÝ CHI PHÍ DỰ ÁN\nĐiều 1. Phạm vi điều chỉnh và đối tượng áp dụng\n1. Thông tư này hướng dẫn việc xác định và quản lý chi phí đầu tư xây dựng gồm tổng mức đầu tư, dự toán xây dựng, giá gói thầu xây dựng.\n2. Áp dụng đối với Chủ đầu tư, Ban Quản lý dự án đầu tư xây dựng và các nhà thầu thi công.\n\nChương II: PHƯƠNG PHÁP LẬP DỰ TOÁN VÀ ĐIỀU CHỈNH GIÁ HỢP ĐỒNG\nĐiều 2. Quản lý định mức dự toán và điều chỉnh đơn giá xây dựng\n1. Chủ đầu tư căn cứ phương pháp xác định dự toán để thẩm định khối lượng phát sinh ngoài thiết kế bản vẽ thi công.\n2. Trường hợp biến động giá vật liệu vượt ngưỡng quy định tại Nghị định 217/2026/NĐ-CP thì thực hiện bù giá theo chỉ số giá xây dựng.`
  );

  const [enableCrossRef, setEnableCrossRef] = useState(true);
  const [targetDocId, setTargetDocId] = useState(existingDocuments[0]?.id || '');
  const [targetArticleId, setTargetArticleId] = useState(
    existingDocuments[0]?.articles[0]?.id || ''
  );
  const [relationType, setRelationType] =
    useState<CrossRefRelationType>('HUONG_DAN_THI_HANH');
  const [xrefDescription, setXrefDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isOcrExtracting, setIsOcrExtracting] = useState(false);
  const [ocrSuccessBanner, setOcrSuccessBanner] = useState<string | null>(null);
  const [extractedSha256, setExtractedSha256] = useState<string | undefined>(undefined);
  const [isFromOcr, setIsFromOcr] = useState(false);

  // Multimodal File Upload Handler (.pdf, .docx, .png, .jpg, .webp, .txt, .md, .html)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Tệp vượt giới hạn 15 MB.');
      return;
    }

    const isMultimodalOrDocx = /\.(pdf|docx|png|jpe?g|webp)$/i.test(file.name);
    if (isMultimodalOrDocx) {
      setIsOcrExtracting(true);
      setErrorMsg('');
      setOcrSuccessBanner(
        `Đang chạy Gemini Multimodal OCR để bóc tách siêu dữ liệu & điều khoản từ "${file.name}"...`
      );
      try {
        const { ocrResult, sha256Hash } = await extractDocumentViaGeminiMultimodal({
          file,
          mode: 'vbpl_document',
        });

        setExtractedSha256(sha256Hash);
        setIsFromOcr(true);
        setStatus('DANG_DU_THAO');

        if (ocrResult.extracted_doc_no) setDocNumber(ocrResult.extracted_doc_no);
        if (ocrResult.extracted_doc_title) setTitle(ocrResult.extracted_doc_title);
        if (
          ocrResult.extracted_doc_type &&
          [
            'Luật',
            'Nghị định',
            'Thông tư',
            'Quyết định',
            'Quy chuẩn QCVN',
            'Bộ luật',
            'Tài liệu',
          ].includes(ocrResult.extracted_doc_type)
        ) {
          setDocType(ocrResult.extracted_doc_type as LegalDocType);
        }
        if (
          ocrResult.extracted_field &&
          LEGAL_FIELDS.includes(ocrResult.extracted_field as LegalField)
        ) {
          setField(ocrResult.extracted_field as LegalField);
        }
        if (ocrResult.extracted_authority)
          setIssuingBody(ocrResult.extracted_authority);
        if (ocrResult.extracted_signer) setSigner(ocrResult.extracted_signer);
        if (/^\d{4}-\d{2}-\d{2}$/.test(ocrResult.extracted_issue_date)) {
          setIssueDate(ocrResult.extracted_issue_date);
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(ocrResult.extracted_effective_date)) {
          setEffectiveDate(ocrResult.extracted_effective_date);
        }
        if (ocrResult.ocr_full_text) {
          setRawArticlesText(ocrResult.ocr_full_text.trim());
        }
        if (ocrResult.ocr_confidence_note) {
          setSummary(ocrResult.ocr_confidence_note);
        }

        setOcrSuccessBanner(
          `Đã bóc tách OCR "${file.name}" (SHA-256: ${sha256Hash.slice(0, 12)}...) — Đưa vào trạng thái QUARANTINE_REVIEW (Dự thảo chờ kiểm duyệt) trước khi xác nhận SSoT.`
        );
      } catch (err: unknown) {
        setOcrSuccessBanner(null);
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Không thể bóc tách OCR từ tệp PDF/DOCX.'
        );
      } finally {
        setIsOcrExtracting(false);
      }
      return;
    }

    try {
      let text = await file.text();
      if (/\.html?$/i.test(file.name)) {
        const parsed = new DOMParser().parseFromString(text, 'text/html');
        parsed
          .querySelectorAll('script,style,iframe,object,svg')
          .forEach((n) => n.remove());
        parsed.querySelectorAll('br').forEach((n) => n.replaceWith('\n'));
        parsed
          .querySelectorAll('p,div,h1,h2,h3,h4,li,tr,section')
          .forEach((n) => n.append('\n'));
        text = parsed.body.textContent || '';
      }
      setRawArticlesText(text.trim());
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, ''));
      }
      setErrorMsg('');
      setOcrSuccessBanner(`Đã nạp nội dung văn bản từ tệp "${file.name}".`);
    } catch {
      setErrorMsg('Không đọc được tệp. Hãy sử dụng tệp PDF, DOCX hoặc văn bản chuẩn UTF-8.');
    }
  };

  // Auto-Parsing Assistant Engine: Automatically extracts Chapters, Articles, and Clauses
  const parsedArticlesPreview = useMemo((): LegalArticle[] => {
    const lines = rawArticlesText.split('\n');
    let currentChapterNo = 'Chương I';
    let currentChapterTitle = 'Quy định chung';

    const articles: LegalArticle[] = [];
    let currentArtNo = '';
    let currentArtTitle = '';
    let currentContentLines: string[] = [];

    const flushArticle = () => {
      if (!currentArtNo) return;
      const idx = articles.length + 1;
      const body = currentContentLines.join('\n').trim() || currentArtTitle;
      articles.push({
        id: `art-preview-${idx}`,
        document_id: 'doc-preview',
        chapter_no: currentChapterNo,
        chapter_title: currentChapterTitle,
        article_no: currentArtNo,
        article_title: currentArtTitle || 'Nội dung quy định',
        content: body,
        is_active: status !== 'HET_HIEU_LUC',
        keywords: [
          currentArtNo.toLowerCase(),
          field.toLowerCase(),
          projectStage.toLowerCase(),
        ],
      });
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const chapterMatch = line.match(
        /^(Phần\s+\S+|Chương\s+[IVXLCDM0-9]+|Mục\s+\d+)[.: -]*\s*(.*)$/i
      );
      if (chapterMatch) {
        currentChapterNo = chapterMatch[1].trim();
        currentChapterTitle = chapterMatch[2].trim() || 'Quy định chuyên môn';
        continue;
      }

      const articleMatch = line.match(/^(Điều\s+\d+)[.: -]*\s*(.*)$/i);
      if (articleMatch) {
        flushArticle();
        currentArtNo = articleMatch[1].trim();
        currentArtTitle = articleMatch[2].trim() || 'Quy định chi tiết';
        currentContentLines = [];
      } else {
        currentContentLines.push(line);
      }
    }

    flushArticle();

    if (articles.length === 0 && rawArticlesText.trim()) {
      return [
        {
          id: 'art-preview-1',
          document_id: 'doc-preview',
          chapter_no: 'Chương I',
          chapter_title: 'Quy định chung',
          article_no: 'Điều 1',
          article_title: 'Nội dung quy định',
          content: rawArticlesText.trim(),
          is_active: status !== 'HET_HIEU_LUC',
          keywords: [field.toLowerCase(), projectStage.toLowerCase()],
        },
      ];
    }

    return articles;
  }, [rawArticlesText, field, projectStage, status]);

  const selectedTargetDoc = existingDocuments.find((d) => d.id === targetDocId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawArticlesText.trim()) {
      setErrorMsg(
        'Vui lòng nhập Tên / Trích yếu văn bản và Nội dung điều khoản.'
      );
      return;
    }

    const finalDocNumber = docNumber.trim() || `VB-${Date.now().toString().slice(-4)}`;
    const docId = `doc-${Date.now()}`;
    const finalizedArticles: LegalArticle[] = parsedArticlesPreview.map(
      (art, idx) => ({
        ...art,
        id: `${docId}-art-${idx + 1}`,
        document_id: docId,
      })
    );

    const shortTitle =
      title.trim().length > 34
        ? `${docType} ${finalDocNumber}`
        : title.trim();

    const newDoc: LegalDocument = {
      id: docId,
      doc_type: docType,
      issuing_body: issuingBody.trim() || 'Cơ quan ban hành',
      doc_number: finalDocNumber,
      title: title.trim(),
      short_title: shortTitle,
      issue_date: issueDate,
      effective_date: effectiveDate,
      expiration_date: expirationDate.trim() ? expirationDate.trim() : null,
      status,
      field,
      project_stage: projectStage,
      signer: signer.trim() || 'Người ký',
      source_url: sourceUrl.trim() || undefined,
      summary:
        summary.trim() ||
        `Văn bản ${docType} số ${finalDocNumber} thuộc lĩnh vực ${field} (Giai đoạn WBS: ${projectStage}).`,
      is_new_daily_update: true,
      daily_update_note: isFromOcr
        ? 'Văn bản bóc tách từ OCR đang ở vùng cách ly kiểm duyệt (QUARANTINE_REVIEW).'
        : 'Văn bản mới được biên tập và nạp vào kho ĐẠI SƠN.',
      authenticity_tier: isFromOcr ? 'QUARANTINE_REVIEW' : 'VERIFIED_EXCERPT',
      sha256_hash: extractedSha256,
      total_articles_count: finalizedArticles.length,
      articles: finalizedArticles,
    };

    let newCrossRef: LegalCrossReference | undefined;
    const targetArt =
      selectedTargetDoc?.articles.find((a) => a.id === targetArticleId) ||
      selectedTargetDoc?.articles[0];

    if (enableCrossRef && selectedTargetDoc && targetArt && finalizedArticles[0]) {
      newCrossRef = {
        id: `xref-${Date.now()}`,
        source_doc_id: newDoc.id,
        source_article_id: finalizedArticles[0].id,
        target_doc_id: selectedTargetDoc.id,
        target_article_id: targetArt.id,
        relation_type: relationType,
        title: `${newDoc.short_title} (${RELATION_META[relationType].label}) ${selectedTargetDoc.short_title}`,
        description:
          xrefDescription.trim() ||
          `Liên kết đối soát chéo giữa ${newDoc.doc_number} (${finalizedArticles[0].article_no}) và ${selectedTargetDoc.doc_number} (${targetArt.article_no}).`,
        comparison_highlight: {
          source_excerpt: finalizedArticles[0].content.slice(0, 180),
          target_excerpt: targetArt.content.slice(0, 180),
          legal_impact:
            'Cập nhật đồng bộ vào Đồ thị Tri thức Pháp lý ĐẠI SƠN phục vụ Ban QLDA và HĐQT.',
        },
      };
    }

    onSaveNewDocument(newDoc, newCrossRef);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-[#FBF9F5] dark:bg-[#1E1D1B] border border-[#E5DEC9] dark:border-[#2E2C28] p-6 shadow-xl my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5DEC9] dark:border-[#2E2C28]">
          <div className="flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-[#152D42] dark:text-[#E9C96D]" />
            <div>
              <h3 className="text-lg font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                Nạp Văn Bản Pháp Luật Mới (OCR PDF / DOCX / Scan & Auto-Parsing SSoT)
              </h3>
              <p className="text-xs text-[#655E54] dark:text-[#A8A29E]">
                Hỗ trợ tải tệp .pdf (kể cả bản scan có dấu đỏ), .docx, ảnh chụp hoặc .txt/.md/.html để tự động bóc tách siêu dữ liệu & Chương, Điều, Khoản
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#655E54] hover:text-[#1C1917] dark:hover:text-[#F5F2EB] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 font-medium">
              {errorMsg}
            </div>
          )}

          {ocrSuccessBanner && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
              {isOcrExtracting ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <FileScan className="w-4 h-4 shrink-0" />
              )}
              <span>{ocrSuccessBanner}</span>
            </div>
          )}

          {/* File Upload Strip (.pdf, .docx, .png, .jpg, .txt, .md, .html) */}
          <div className="p-3 rounded-xl bg-[#FBF5DF]/80 dark:bg-stone-800/80 border border-[#C6A342]/50 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-stone-700 dark:text-stone-200">
              Bóc tách OCR tự động bằng Gemini Multimodal (<strong>.pdf, .docx, .png, .jpg, .txt, .md, .html</strong> — tối đa 15 MB):
            </span>
            <label
              className={`px-3.5 py-1.5 rounded-lg bg-[#152D42] text-white font-semibold hover:bg-[#213E57] flex items-center gap-1.5 cursor-pointer ${
                isOcrExtracting ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {isOcrExtracting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E9C96D]" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-[#E9C96D]" />
              )}
              <span>
                {isOcrExtracting
                  ? 'Đang OCR PDF/DOCX...'
                  : 'Chọn tệp PDF / DOCX / Scan / TXT'}
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,.md,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,text/plain,text/html"
                onChange={handleFileUpload}
                disabled={isOcrExtracting}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium mb-1">Số hiệu / Mã tài liệu</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="VD: 12/2026/TT-BXD"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-mono-code"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Loại văn bản</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as LegalDocType)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
              >
                <option value="Luật">Luật</option>
                <option value="Nghị định">Nghị định</option>
                <option value="Thông tư">Thông tư</option>
                <option value="Quyết định">Quyết định</option>
                <option value="Quy chuẩn QCVN">Quy chuẩn QCVN</option>
                <option value="Bộ luật">Bộ luật</option>
                <option value="Tài liệu">Tài liệu</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Lĩnh vực chuyên ngành</label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value as LegalField)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
              >
                {LEGAL_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Giai đoạn WBS</label>
              <select
                value={projectStage}
                onChange={(e) =>
                  setProjectStage(e.target.value as ProjectLifecycleStage)
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
              >
                {PROJECT_LIFECYCLE_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">Tên văn bản / Trích yếu nội dung *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Thông tư hướng dẫn xác định và quản lý chi phí đầu tư xây dựng"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Tình trạng hiệu lực</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LegalDocumentStatus)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-mono-code"
              >
                {Object.keys(STATUS_META).map((k) => {
                  const key = k as LegalDocumentStatus;
                  return (
                    <option key={key} value={key}>
                      {key} ({STATUS_META[key].label})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium mb-1">Cơ quan ban hành</label>
              <input
                type="text"
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Ngày ban hành</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-mono-code"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Ngày hiệu lực</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-mono-code"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Liên kết bản gốc (URL)</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
              />
            </div>
          </div>

          {/* Auto-Parsing Assistant Input & Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold flex items-center gap-1.5 text-[#152D42] dark:text-[#60A5FA]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Nội dung văn bản * (Tự động nhận diện Phần, Chương, Mục, Điều)
                </span>
              </label>
              <span className="font-mono-code text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                {parsedArticlesPreview.length} đề mục / điều khoản được nhận diện
              </span>
            </div>
            <textarea
              rows={5}
              value={rawArticlesText}
              onChange={(e) => setRawArticlesText(e.target.value)}
              className="w-full p-3 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-serif-prose leading-relaxed"
            />

            {/* Parsed Articles Structured Preview */}
            {parsedArticlesPreview.length > 0 && (
              <div className="p-3 rounded-xl bg-[#F3EFE6]/70 dark:bg-[#141413] border border-[#E5DEC9] dark:border-[#2E2C28] space-y-2">
                <div className="text-[11px] font-semibold text-[#655E54] dark:text-[#A8A29E] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Xem trước mục lục & điều khoản tự động phân rã:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {parsedArticlesPreview.map((art) => (
                    <div
                      key={art.id}
                      className="p-2 rounded-lg bg-[#FBF9F5] dark:bg-[#1E1D1B] border border-[#E5DEC9] dark:border-[#2E2C28]"
                    >
                      <div className="text-[10px] text-[#655E54] dark:text-[#A8A29E] truncate">
                        {art.chapter_no} — {art.chapter_title}
                      </div>
                      <div className="text-xs font-semibold text-[#1C1917] dark:text-[#F5F2EB] truncate">
                        <span className="font-mono-code text-[#1E3A8A] dark:text-[#60A5FA] mr-1">
                          {art.article_no}:
                        </span>
                        {art.article_title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cross-reference Link Builder */}
          <div className="p-3.5 rounded-xl bg-[#F3EFE6] dark:bg-[#141413] border border-[#E5DEC9] dark:border-[#2E2C28] space-y-3">
            <label className="flex items-center gap-2 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={enableCrossRef}
                onChange={(e) => setEnableCrossRef(e.target.checked)}
              />
              <span>
                Tạo bản ghi Đối soát chéo (cross_references) vào Đồ thị Tri thức Pháp lý
              </span>
            </label>

            {enableCrossRef && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#655E54] mb-1">
                    Loại quan hệ (relation_type)
                  </label>
                  <select
                    value={relationType}
                    onChange={(e) =>
                      setRelationType(e.target.value as CrossRefRelationType)
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] font-mono-code"
                  >
                    <option value="HUONG_DAN_THI_HANH">HUONG_DAN_THI_HANH</option>
                    <option value="SUA_DOI_BO_SUNG">SUA_DOI_BO_SUNG</option>
                    <option value="DAN_CHIEU">DAN_CHIEU</option>
                    <option value="THAY_THE">THAY_THE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#655E54] mb-1">
                    Văn bản đích
                  </label>
                  <select
                    value={targetDocId}
                    onChange={(e) => {
                      const nextDoc = existingDocuments.find(
                        (d) => d.id === e.target.value
                      );
                      setTargetDocId(e.target.value);
                      if (nextDoc?.articles[0]) {
                        setTargetArticleId(nextDoc.articles[0].id);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B]"
                  >
                    {existingDocuments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.doc_number} — {d.short_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#655E54] mb-1">
                    Điều khoản đích (target_article_id)
                  </label>
                  <select
                    value={targetArticleId}
                    onChange={(e) => setTargetArticleId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B]"
                  >
                    {selectedTargetDoc?.articles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.article_no}: {a.article_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={xrefDescription}
                    onChange={(e) => setXrefDescription(e.target.value)}
                    placeholder="Diễn giải chi tiết nội dung tác động chéo giữa 2 điều khoản (description)..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-5 py-2 rounded-lg bg-[#152D42] dark:bg-[#D0AF54] text-white dark:text-[#152D42] font-semibold hover:opacity-95 transition-colors cursor-pointer"
            >
              Lưu vào Thư viện ĐẠI SƠN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
