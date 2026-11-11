import React, { useMemo } from 'react';
import {
  X,
  Download,
  Upload,
  FileCode2,
  BarChart3,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import {
  LegalDocument,
  LegalCrossReference,
  SavedDocumentItem,
  SavedClauseItem,
  AuditLogEntry,
} from '../types/legal';

interface BackupAndStatsModalProps {
  mode: 'export' | 'stats' | 'help' | null;
  onClose: () => void;
  documents: LegalDocument[];
  crossReferences: LegalCrossReference[];
  savedDocs: SavedDocumentItem[];
  savedClauses: SavedClauseItem[];
  logs: AuditLogEntry[];
  onImportBackupData: (incomingDocs: LegalDocument[], incomingBookmarks: string[], incomingNotes: Record<string, string>) => void;
  onOpenGuideDoc: () => void;
  onLogAction: (action: string, detail?: string) => void;
}

export const BackupAndStatsModal: React.FC<BackupAndStatsModalProps> = ({
  mode,
  onClose,
  documents,
  crossReferences,
  savedDocs,
  savedClauses,
  logs,
  onImportBackupData,
  onOpenGuideDoc,
  onLogAction,
}) => {
  if (!mode) return null;

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    documents.forEach((d) => {
      map.set(d.field, (map.get(d.field) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [documents]);

  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleExportJson = () => {
    onLogAction('XUẤT_SAO_LƯU_JSON');
    const payload = {
      version: 2,
      brand: 'ĐẠI SƠN',
      exportedAt: new Date().toISOString(),
      documents,
      crossReferences,
      savedDocs,
      savedClauses,
      logs,
      // Also include VBPL v1 compatible fields for cross-compatibility
      docs: documents.map((d) => ({
        id: d.id,
        code: d.doc_number,
        type: d.doc_type,
        title: d.title,
        category: d.field,
        sample: !!d.is_sample_ref,
        source: d.source_url || '',
        text: d.articles
          .map(
            (a) =>
              `${a.chapter_no}. ${a.chapter_title}\n${a.article_no}. ${a.article_title}\n${a.content}`
          )
          .join('\n\n'),
      })),
      bookmarks: savedDocs.map((s) => s.docId),
      notes: Object.fromEntries(
        savedDocs.map((s) => [s.docId, s.personalNote || ''])
      ),
    };
    triggerDownload(
      'Dai_Son_VBPL_Sao_Luu.json',
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleExportStandaloneHtml = () => {
    onLogAction('XUẤT_HTML_ĐỘC_LẬP');
    const seedState = {
      version: 1,
      docs: documents.map((d) => ({
        id: d.id,
        code: d.doc_number,
        type: d.doc_type,
        title: d.title,
        category: d.field,
        sample: false,
        source: d.source_url || '',
        text: d.articles
          .map(
            (a) =>
              `${a.chapter_no}. ${a.chapter_title}\n${a.article_no}. ${a.article_title}\n${a.content}`
          )
          .join('\n\n'),
      })),
      bookmarks: savedDocs.map((s) => s.docId),
      notes: Object.fromEntries(
        savedDocs.map((s) => [s.docId, s.personalNote || ''])
      ),
      recent: documents.slice(0, 10).map((d) => d.id),
      logs,
      theme: 'light',
      fontSize: 16,
      serif: true,
    };

    const safeSeedJson = JSON.stringify(seedState).replace(/</g, '\\u003c');
    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ĐẠI SƠN — Thư viện VBPL & Tra cứu Độc lập</title>
<style>
body{margin:0;font:14px/1.6 system-ui,-apple-system,sans-serif;background:#fbf9f5;color:#1c1917}
header{background:#152d42;color:#fff;padding:14px 22px;border-bottom:3px solid #c6a342;display:flex;justify-content:space-between;align-items:center}
.wrap{display:grid;grid-template-columns:320px 1fr;height:calc(100vh - 58px)}
aside{background:#f1efe9;border-right:1px solid #d4d9db;overflow:auto;padding:12px}
main{overflow:auto;padding:28px 40px;max-width:920px}
.card{display:block;width:100%;text-align:left;background:#fff;border:1px solid #deded8;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer}
.card.active{border-left:4px solid #c6a342;background:#fbf5df}
pre{white-space:pre-wrap;font:inherit;line-height:1.8}
</style>
</head>
<body>
<header><strong>⚖ HỆ SINH THÁI PHÁP LÝ ĐẠI SƠN — BẢN HTML ĐỘC LẬP (${documents.length} VĂN BẢN)</strong><span>Không cần kết nối Internet</span></header>
<div class="wrap"><aside id="list"></aside><main id="viewer"></main></div>
<script id="seed" type="application/json">${safeSeedJson}</script>
<script>
const data = JSON.parse(document.getElementById('seed').textContent);
const listEl = document.getElementById('list');
const viewerEl = document.getElementById('viewer');
function esc(v){
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function openDoc(id){
  const d = data.docs.find(x => x.id === id) || data.docs[0];
  if(!d) return;
  [...listEl.querySelectorAll('.card')].forEach(b => b.classList.toggle('active', b.dataset.id === d.id));
  viewerEl.innerHTML = '<h1>' + esc(d.title) + '</h1><p><b>Số hiệu:</b> ' + esc(d.code) + ' · <b>Lĩnh vực:</b> ' + esc(d.category) + '</p><hr><pre>' + esc(d.text) + '</pre>';
}
listEl.innerHTML = data.docs.map(d => '<button class="card" data-id="'+esc(d.id)+'"><b>'+esc(d.code)+'</b><br><small>'+esc(d.title)+'</small></button>').join('');
[...listEl.querySelectorAll('.card')].forEach(b => b.onclick = () => openDoc(b.dataset.id));
if(data.docs[0]) openDoc(data.docs[0].id);
</script>
</body>
</html>`;

    triggerDownload(
      'Dai_Son_VBPL_Offline.html',
      htmlContent,
      'text/html;charset=utf-8'
    );
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);

      // Support both ĐẠI SƠN v2 format (`documents`) and VBPL v1 format (`docs`)
      const convertedDocs: LegalDocument[] = [];
      if (Array.isArray(parsed.documents)) {
        convertedDocs.push(...parsed.documents);
      } else if (Array.isArray(parsed.docs)) {
        parsed.docs.forEach(
          (d: {
            id?: string;
            code?: string;
            type?: string;
            title?: string;
            category?: string;
            text?: string;
            source?: string;
            issue_date?: string;
            effective_date?: string;
          }) => {
            if (d && typeof d.id === 'string' && typeof d.title === 'string') {
              const hasVerifiedDates = Boolean(d.issue_date && d.effective_date);
              convertedDocs.push({
                id: d.id,
                doc_type: (d.type as LegalDocument['doc_type']) || 'Tài liệu',
                issuing_body: 'Nguồn nạp sao lưu JSON (Cần hậu kiểm ngày hiệu lực)',
                doc_number: d.code || 'CHƯA RÕ',
                title: d.title,
                short_title: `${d.code || 'VB'} · ${d.title.slice(0, 32)}`,
                issue_date: d.issue_date || '1970-01-01',
                effective_date: d.effective_date || '1970-01-01',
                expiration_date: null,
                status: hasVerifiedDates ? 'CON_HIEU_LUC' : 'DANG_DU_THAO',
                authenticity_tier: hasVerifiedDates ? 'VERIFIED_EXCERPT' : 'QUARANTINE_REVIEW',
                field: (d.category as LegalDocument['field']) || 'Xây dựng',
                project_stage: 'Thực thi',
                signer: 'Chưa xác định',
                source_url: d.source || '',
                summary: d.text ? d.text.slice(0, 180) : d.title,
                articles: [
                  {
                    id: `art-${d.id}-1`,
                    document_id: d.id,
                    chapter_no: 'Chương I',
                    chapter_title: 'Nội dung văn bản sao lưu',
                    article_no: 'Điều 1',
                    article_title: d.title,
                    content:
                      d.text ||
                      'Danh mục tham chiếu từ bản sao lưu. Vui lòng hậu kiểm ngày ban hành và ngày hiệu lực.',
                    is_active: true,
                    keywords: [d.code || '', d.category || ''],
                  },
                ],
              });
            }
          }
        );
      }

      const incomingBookmarks: string[] = Array.isArray(parsed.bookmarks)
        ? parsed.bookmarks
        : [];
      const incomingNotes: Record<string, string> =
        parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {};

      onImportBackupData(convertedDocs, incomingBookmarks, incomingNotes);
      onClose();
    } catch {
      // ignore invalid json
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#102639]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A1917] text-[#1C1917] dark:text-[#F5F2EB] w-full max-w-xl rounded-2xl border border-stone-200 dark:border-[#2E2C28] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-[#2E2C28] flex items-center justify-between bg-[#FBF9F5] dark:bg-[#141413]">
          <div className="flex items-center gap-2.5">
            {mode === 'export' && <Download className="w-5 h-5 text-[#C6A342]" />}
            {mode === 'stats' && <BarChart3 className="w-5 h-5 text-[#C6A342]" />}
            {mode === 'help' && <HelpCircle className="w-5 h-5 text-[#C6A342]" />}
            <h2 className="text-base sm:text-lg font-bold text-[#152D42] dark:text-stone-100">
              {mode === 'export' && 'Xuất & Khôi phục Dữ liệu ĐẠI SƠN'}
              {mode === 'stats' && 'Thống kê Thư viện & Nhật ký Kiểm toán'}
              {mode === 'help' && 'Hướng dẫn Sử dụng & Phím tắt Hệ thống'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200/70 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-xs sm:text-sm">
          {mode === 'export' && (
            <>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                Bản sao lưu chứa toàn bộ văn bản SSoT, điều khoản, liên kết đối soát chéo, ghi chú, đánh dấu và lịch sử thao tác của trình duyệt hiện tại. Tệp HTML có thể mở độc lập trên mọi máy tính mà không cần kết nối internet.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportJson}
                  className="px-4 py-2.5 rounded-xl bg-[#152D42] text-white font-semibold hover:bg-[#213E57] flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#E9C96D]" />
                  <span>↓ Sao lưu JSON đầy đủ</span>
                </button>
                <button
                  onClick={handleExportStandaloneHtml}
                  className="px-4 py-2.5 rounded-xl border border-[#C6A342] bg-[#FBF5DF] dark:bg-stone-800 text-[#152D42] dark:text-amber-300 font-semibold hover:bg-[#f5ebc8] flex items-center gap-2 cursor-pointer"
                >
                  <FileCode2 className="w-4 h-4" />
                  <span>↓ Tải bản HTML độc lập có dữ liệu</span>
                </button>
              </div>

              <hr className="border-stone-200 dark:border-[#2E2C28]" />

              <div className="space-y-2">
                <label className="block font-bold text-[#152D42] dark:text-stone-100">
                  Nhập bản sao lưu JSON (Chống trùng lặp tự động)
                </label>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Hệ thống tự động bổ sung các văn bản chưa có ID hoặc số hiệu, giữ nguyên nội dung và ghi chú hiện có khi trùng lặp. Tối đa 10 MB.
                </p>
                <label className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-stone-400 dark:border-stone-600 hover:border-[#C6A342] cursor-pointer font-medium">
                  <Upload className="w-4 h-4 text-[#286181]" />
                  <span>Chọn tệp sao lưu .JSON từ máy tính</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          )}

          {mode === 'stats' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#F7F9FA] dark:bg-[#141413] border border-stone-200 dark:border-[#2E2C28]">
                  <b className="block text-2xl text-[#286181] dark:text-amber-400">
                    {documents.length}
                  </b>
                  <span className="text-xs text-stone-500">Văn bản SSoT</span>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F9FA] dark:bg-[#141413] border border-stone-200 dark:border-[#2E2C28]">
                  <b className="block text-2xl text-[#286181] dark:text-amber-400">
                    {documents.reduce((acc, d) => acc + d.articles.length, 0)}
                  </b>
                  <span className="text-xs text-stone-500">Điều khoản phân rã</span>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F9FA] dark:bg-[#141413] border border-stone-200 dark:border-[#2E2C28]">
                  <b className="block text-2xl text-[#286181] dark:text-amber-400">
                    {savedDocs.length}
                  </b>
                  <span className="text-xs text-stone-500">Đánh dấu ⚑</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Phân bổ theo Lĩnh vực chuyên ngành
                </h3>
                {categoryCounts.map(([cat, count]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800"
                  >
                    <span>{cat}</span>
                    <b className="font-mono-code text-[#152D42] dark:text-amber-300">
                      {count} văn bản
                    </b>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Nhật ký thao tác cục bộ ({logs.length} bản ghi gần nhất)
                </h3>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-[#FBF9F5] dark:bg-[#141413] p-3 rounded-xl border border-stone-200 dark:border-[#2E2C28] text-xs font-mono-code">
                  {logs.slice(-15).reverse().map((l) => (
                    <div key={l.id} className="flex justify-between gap-2">
                      <span className="text-stone-700 dark:text-stone-300">
                        [{l.action}] {l.detail || l.documentId || ''}
                      </span>
                      <span className="text-stone-400">
                        {l.at.slice(11, 19)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'help' && (
            <>
              <p className="font-semibold text-[#152D42] dark:text-amber-300">
                Tra cứu theo 3 bước chuẩn: Chọn lĩnh vực / WBS → Chọn văn bản → Xem Mục lục, Đối soát chéo & Ghi chú.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-stone-700 dark:text-stone-300">
                <li>
                  <b>Ctrl + K:</b> Đặt con trỏ ngay vào ô Tìm kiếm toàn thư viện.
                </li>
                <li>
                  <b>Phím M:</b> Cuộn nhanh về <b>☷ Mục lục</b> của văn bản đang mở.
                </li>
                <li>
                  <b>Phím D:</b> Bật / tắt đánh dấu (⚑) văn bản đang đọc vào tủ sách cá nhân.
                </li>
                <li>
                  <b>A− / A+ & Aa:</b> Tăng giảm cỡ chữ nội dung đọc (13px–24px) và chuyển đổi phông chữ có chân (Serif) / không chân (Sans).
                </li>
                <li>
                  <b>Khớp dấu tiếng Việt:</b> Mặc định hỗ trợ tìm kiếm không dấu tiện lợi; bật ô kiểm để lọc chính xác theo dấu tiếng Việt.
                </li>
                <li>
                  <b>Nạp văn bản & Sao lưu:</b> Hỗ trợ nạp tệp <code>.txt</code>, <code>.md</code>, <code>.html</code> và xuất sao lưu <code>.json</code> hoặc bản HTML độc lập.
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenGuideDoc();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#152D42] text-white font-semibold hover:bg-[#213E57] flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#E9C96D]" />
                  <span>Mở toàn văn Tài liệu Hướng dẫn trong Trình đọc</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
