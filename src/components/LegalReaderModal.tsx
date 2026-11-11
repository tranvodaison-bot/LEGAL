import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  DownloadCloud,
  GitCompare,
  Network,
  Search,
  StickyNote,
  Type,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  LegalDocument,
  LegalCrossReference,
  SavedClauseItem,
  ReaderSettings,
} from '../types/legal';
import { RELATION_META, STATUS_META } from '../data/legalCorpus';

interface LegalReaderModalProps {
  document: LegalDocument;
  allDocuments: LegalDocument[];
  crossReferences: LegalCrossReference[];
  initialArticleId?: string;
  isSavedDoc: boolean;
  isOfflineCached: boolean;
  savedClauses: SavedClauseItem[];
  readerSettings: ReaderSettings;
  onUpdateReaderSettings: (settings: Partial<ReaderSettings>) => void;
  onToggleSaveDoc: (docId: string, folder?: string) => void;
  onToggleOfflineDoc: (docId: string) => void;
  onSaveClauseNote: (docId: string, articleId: string, note: string, folder: string) => void;
  onRemoveClauseNote: (docId: string, articleId: string) => void;
  onOpenCrossCheck: (xref: LegalCrossReference) => void;
  onOpenLegalMap: (docId: string) => void;
  onSelectDocument: (docId: string, articleId?: string) => void;
  onClose: () => void;
}

export const LegalReaderModal: React.FC<LegalReaderModalProps> = ({
  document,
  allDocuments,
  crossReferences,
  initialArticleId,
  isSavedDoc,
  isOfflineCached,
  savedClauses,
  readerSettings,
  onUpdateReaderSettings,
  onToggleSaveDoc,
  onToggleOfflineDoc,
  onSaveClauseNote,
  onRemoveClauseNote,
  onOpenCrossCheck,
  onOpenLegalMap,
  onSelectDocument,
  onClose,
}) => {
  const [activeArticleId, setActiveArticleId] = useState<string>(
    initialArticleId || document.articles[0]?.id || ''
  );
  const [inDocQuery, setInDocQuery] = useState('');
  const [editingNoteArticleId, setEditingNoteArticleId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteFolder, setNoteFolder] = useState('Hồ sơ Pháp lý Dự án & QLDA');
  const [previewXrefId, setPreviewXrefId] = useState<string | null>(null);

  const { docMap, globalArticleByDocAndIdMap } = useMemo(() => {
    const dMap = new Map<string, LegalDocument>();
    const aMap = new Map<string, LegalDocument['articles'][number]>();
    allDocuments.forEach((d) => {
      dMap.set(d.id, d);
      d.articles.forEach((a) => aMap.set(`${d.id}:${a.id}`, a));
    });
    return { docMap: dMap, globalArticleByDocAndIdMap: aMap };
  }, [allDocuments]);

  // O(1) Cross-Reference Lookup Map by Article ID for the current document
  const articleCrossRefsMap = useMemo(() => {
    const map = new Map<string, LegalCrossReference[]>();
    crossReferences.forEach((x) => {
      if (x.source_doc_id === document.id && x.source_article_id) {
        const list = map.get(x.source_article_id) || [];
        list.push(x);
        map.set(x.source_article_id, list);
      }
      if (
        x.target_doc_id === document.id &&
        x.target_article_id &&
        !(
          x.source_doc_id === document.id &&
          x.source_article_id === x.target_article_id
        )
      ) {
        const list = map.get(x.target_article_id) || [];
        list.push(x);
        map.set(x.target_article_id, list);
      }
    });
    return map;
  }, [crossReferences, document.id]);

  // O(1) Saved Clause Lookup Map by Article ID for the current document
  const savedClauseByArticleIdMap = useMemo(() => {
    const map = new Map<string, SavedClauseItem>();
    savedClauses.forEach((c) => {
      if (c.docId === document.id) {
        map.set(c.articleId, c);
      }
    });
    return map;
  }, [savedClauses, document.id]);

  const filteredArticles = useMemo(() => {
    const q = inDocQuery.trim().toLowerCase();
    if (!q) return document.articles;
    return document.articles.filter(
      (a) =>
        a.article_no.toLowerCase().includes(q) ||
        a.article_title.toLowerCase().includes(q) ||
        a.chapter_no.toLowerCase().includes(q) ||
        a.chapter_title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [document.articles, inDocQuery]);

  const fontSizeClass = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base leading-[1.8]',
    lg: 'text-lg leading-[1.85]',
    xl: 'text-xl leading-[1.9]',
  }[readerSettings.fontSize];

  const fontClass =
    readerSettings.fontFamily === 'serif' ? 'font-serif-prose' : 'font-sans-ui';

  const scrollToArticle = (articleId: string) => {
    setActiveArticleId(articleId);
    const el = window.document.getElementById(`reader-article-${articleId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenNoteEditor = (articleId: string) => {
    const existing = savedClauseByArticleIdMap.get(articleId);
    setEditingNoteArticleId(articleId);
    setNoteDraft(existing?.note || '');
    setNoteFolder(existing?.folder || 'Hồ sơ Pháp lý Dự án & QLDA');
  };

  const highlightText = (text: string, query: string) => {
    const q = query.trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, idx) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark
          key={idx}
          className="bg-amber-200/80 dark:bg-amber-500/30 text-[#1C1917] dark:text-[#F5F2EB] px-0.5 rounded-xs"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const statusMeta = STATUS_META[document.status];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FBF9F5] dark:bg-[#141413] text-[#1C1917] dark:text-[#F5F2EB]">
      {/* Reader Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 lg:px-8 py-3 border-b border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/90 dark:bg-[#1E1D1B]/90 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] text-xs font-medium hover:bg-[#EBE5D8] dark:hover:bg-[#282623] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Đóng trình đọc</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#655E54] dark:text-[#A8A29E] truncate">
              <span className="font-mono-code font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                {document.doc_number}
              </span>
              <span aria-hidden="true">·</span>
              <span>{document.field}</span>
              <span aria-hidden="true">·</span>
              <span>Giai đoạn WBS: {document.project_stage}</span>
              <span aria-hidden="true">·</span>
              <span className={statusMeta.colorClass}>{statusMeta.label}</span>
            </div>
            <h2 className="text-sm lg:text-base font-display font-semibold truncate">
              {document.title}
            </h2>
          </div>
        </div>

        {/* Reader Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-0.5 rounded-lg bg-[#E5DEC9]/60 dark:bg-[#2E2C28] border border-[#E5DEC9] dark:border-[#3E3C38]">
            <button
              onClick={() => onUpdateReaderSettings({ fontFamily: 'serif' })}
              className={`min-h-[34px] px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                readerSettings.fontFamily === 'serif'
                  ? 'bg-[#FBF9F5] dark:bg-[#141413] text-[#1C1917] dark:text-[#F5F2EB] shadow-2xs'
                  : 'text-[#655E54] dark:text-[#A8A29E]'
              }`}
            >
              Chữ Serif
            </button>
            <button
              onClick={() => onUpdateReaderSettings({ fontFamily: 'sans' })}
              className={`min-h-[34px] px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                readerSettings.fontFamily === 'sans'
                  ? 'bg-[#FBF9F5] dark:bg-[#141413] text-[#1C1917] dark:text-[#F5F2EB] shadow-2xs'
                  : 'text-[#655E54] dark:text-[#A8A29E]'
              }`}
            >
              Chữ Sans
            </button>
          </div>

          <div className="flex items-center p-0.5 rounded-lg bg-[#E5DEC9]/60 dark:bg-[#2E2C28] border border-[#E5DEC9] dark:border-[#3E3C38]">
            <Type className="w-3.5 h-3.5 mx-1.5 text-[#655E54] dark:text-[#A8A29E]" />
            {(['sm', 'md', 'lg', 'xl'] as const).map((sz, i) => (
              <button
                key={sz}
                onClick={() => onUpdateReaderSettings({ fontSize: sz })}
                className={`min-h-[34px] px-2 py-1 text-xs font-mono-code rounded-md transition-colors cursor-pointer ${
                  readerSettings.fontSize === sz
                    ? 'bg-[#FBF9F5] dark:bg-[#141413] text-[#1C1917] dark:text-[#F5F2EB] font-semibold'
                    : 'text-[#655E54] dark:text-[#A8A29E]'
                }`}
              >
                A{i > 0 ? `+${i}` : ''}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenLegalMap(document.id)}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] text-xs font-medium hover:border-[#1E3A8A] dark:hover:border-[#60A5FA] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Network className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-[#60A5FA]" />
            <span>Bản đồ dẫn chiếu</span>
          </button>

          <button
            onClick={() => onToggleOfflineDoc(document.id)}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              isOfflineCached
                ? 'border-emerald-700/30 bg-emerald-950/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                : 'border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>{isOfflineCached ? 'Đã lưu ngoại tuyến' : 'Tải ngoại tuyến'}</span>
          </button>

          <button
            onClick={() => onToggleSaveDoc(document.id)}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              isSavedDoc
                ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white'
                : 'border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]'
            }`}
          >
            {isSavedDoc ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{isSavedDoc ? 'Đã lưu tủ sách' : 'Lưu vào tủ sách'}</span>
          </button>
        </div>
      </div>

      {/* Main Reader Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left TOC Sidebar (document_articles hierarchy) */}
        <aside className="hidden md:flex md:w-72 lg:w-80 flex-col border-r border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/50 dark:bg-[#1A1917]">
          <div className="p-4 border-b border-[#E5DEC9] dark:border-[#2E2C28]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#655E54] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inDocQuery}
                onChange={(e) => setInDocQuery(e.target.value)}
                placeholder="Lọc Chương, Điều, từ khóa..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] focus:outline-none focus:border-[#1E3A8A] dark:focus:border-[#60A5FA]"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#655E54] dark:text-[#A8A29E]">
              <span>Phân rã điều khoản (SSoT)</span>
              <span className="font-mono-code">{filteredArticles.length} điều</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredArticles.map((art) => {
              const xrefs = articleCrossRefsMap.get(art.id) || [];
              const isClauseSaved = savedClauseByArticleIdMap.has(art.id);
              return (
                <button
                  key={art.id}
                  onClick={() => scrollToArticle(art.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer ${
                    activeArticleId === art.id
                      ? 'bg-[#1E3A8A]/10 dark:bg-[#60A5FA]/15 text-[#1E3A8A] dark:text-[#60A5FA] font-medium'
                      : 'hover:bg-[#E5DEC9]/40 dark:hover:bg-[#282623] text-[#44403C] dark:text-[#D6D3CD]'
                  }`}
                >
                  <div className="text-[11px] text-[#655E54] dark:text-[#A8A29E] truncate">
                    {art.chapter_no}: {art.chapter_title}
                  </div>
                  <div className="flex items-center justify-between text-xs mt-0.5">
                    <span className="font-mono-code font-semibold">{art.article_no}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#655E54] dark:text-[#A8A29E]">
                      {!art.is_active && (
                        <span className="text-red-700 dark:text-red-400">Hết hiệu lực</span>
                      )}
                      {isClauseSaved && <span>Đã ghim</span>}
                      {xrefs.length > 0 && (
                        <span className="font-mono-code text-[#9A3412] dark:text-amber-400">
                          {xrefs.length} dẫn chiếu
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-2">{art.article_title}</p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center Archival Reading Column */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-14 py-8">
          <div className="max-w-3xl mx-auto">
            {/* SSoT Document Metadata Header */}
            <div className="pb-8 mb-8 border-b border-[#E5DEC9] dark:border-[#2E2C28]">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#655E54] dark:text-[#A8A29E] mb-3">
                <span>{document.issuing_body}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-code">Số hiệu: {document.doc_number}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-code">Ban hành: {document.issue_date}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-code">Hiệu lực: {document.effective_date}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-code">
                  Hết hiệu lực: {document.expiration_date || 'Đang áp dụng'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-code">{document.status}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB] balance-text leading-tight">
                {document.title}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-[#44403C] dark:text-[#D6D3CD] leading-relaxed">
                {document.summary}
              </p>

              {((document.amended_count ?? 0) > 0 ||
                (document.amendment_history &&
                  document.amendment_history.length > 0)) && (
                <div className="mt-5 p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-2.5 font-sans-ui">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#152D42] text-[#E9C96D] text-xs font-bold font-mono-code">
                      🧬 Đã qua{' '}
                      {document.amended_count ??
                        document.amendment_history?.length ??
                        0}{' '}
                      lần sửa đổi
                    </span>
                    <span className="text-xs font-semibold text-amber-950 dark:text-amber-200">
                      Lịch sử phả hệ sửa đổi, bổ sung văn bản
                    </span>
                  </div>
                  {document.amendment_history && (
                    <div className="space-y-1.5 text-xs">
                      {[...document.amendment_history]
                        .sort((a, b) =>
                          a.promulgation_date.localeCompare(b.promulgation_date)
                        )
                        .map((item, idx) => (
                          <div
                            key={`${item.amending_doc_id}-${idx}`}
                            className="p-2.5 rounded-lg bg-white/80 dark:bg-[#181715]/80 border border-amber-200 dark:border-amber-800/70 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-mono-code font-bold text-amber-900 dark:text-amber-300 mr-1.5">
                                Lần {idx + 1} ({item.promulgation_date}):
                              </span>
                              <span className="font-semibold">
                                {item.amending_doc_title}
                              </span>
                              {item.scopes.length > 0 && (
                                <span className="ml-2 font-mono-code text-[11px] text-amber-800 dark:text-amber-300">
                                  [Phạm vi: {item.scopes.join(', ')}]
                                </span>
                              )}
                            </div>
                            {docMap.has(item.amending_doc_id) && (
                              <button
                                onClick={() =>
                                  onSelectDocument(item.amending_doc_id)
                                }
                                className="px-2 py-1 rounded bg-[#152D42] text-[#E9C96D] text-[11px] font-semibold cursor-pointer"
                              >
                                Mở {item.amending_doc_number || 'VB sửa đổi'} ↗
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile In-Document Search */}
              <div className="mt-4 md:hidden">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#655E54] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inDocQuery}
                    onChange={(e) => setInDocQuery(e.target.value)}
                    placeholder="Lọc nhanh điều khoản trong văn bản..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6] dark:bg-[#1E1D1B]"
                  />
                </div>
              </div>
            </div>

            {/* Articles Stream */}
            <div className={`space-y-10 ${fontClass}`}>
              {filteredArticles.map((article) => {
                const articleXrefs = articleCrossRefsMap.get(article.id) || [];
                const savedClause = savedClauseByArticleIdMap.get(article.id);

                return (
                  <article
                    key={article.id}
                    id={`reader-article-${article.id}`}
                    className="pb-10 border-b border-[#E5DEC9]/80 dark:border-[#2E2C28] scroll-mt-6"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#655E54] dark:text-[#A8A29E] mb-1.5 font-sans-ui">
                      <span className="font-mono-code font-semibold">
                        {article.chapter_no}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{article.chapter_title}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-code">ID: {article.id}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          article.is_active
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-red-700 dark:text-red-400 font-medium'
                        }
                      >
                        {article.is_active ? 'is_active: true (Còn hiệu lực)' : 'is_active: false (Đã bãi bỏ)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                          <span className="font-mono-code text-[#1E3A8A] dark:text-[#60A5FA] mr-2">
                            {article.article_no}.
                          </span>
                          {highlightText(article.article_title, inDocQuery)}
                        </h3>
                        {article.is_amended && (
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-sans-ui font-bold">
                            ⚠ Đã sửa đổi bởi{' '}
                            {article.amendment_info?.amending_doc_number ||
                              'VB sửa đổi'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-sans-ui">
                        <button
                          onClick={() => handleOpenNoteEditor(article.id)}
                          className="min-h-[36px] px-2.5 py-1 rounded-md border border-[#E5DEC9] dark:border-[#2E2C28] text-xs text-[#44403C] dark:text-[#D6D3CD] hover:border-[#1E3A8A] dark:hover:border-[#60A5FA] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <StickyNote className="w-3.5 h-3.5" />
                          <span>{savedClause ? 'Sửa ghi chú QLDA' : 'Ghim & Ghi chú'}</span>
                        </button>
                      </div>
                    </div>

                    {article.amendment_info?.summary && (
                      <div className="mb-3 p-3.5 rounded-xl bg-amber-100/60 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs font-sans-ui text-amber-950 dark:text-amber-200 leading-relaxed">
                        <strong className="font-semibold">
                          🧬 Phả hệ sửa đổi ({article.amendment_info.amending_doc_number}):{' '}
                        </strong>
                        {article.amendment_info.summary}
                      </div>
                    )}

                    {article.amendment_note && (
                      <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-600/25 text-xs font-sans-ui text-amber-950 dark:text-amber-200 leading-relaxed">
                        <strong className="font-semibold">Lưu ý sửa đổi, bổ sung: </strong>
                        {article.amendment_note}
                      </div>
                    )}

                    <div className={`${fontSizeClass} text-[#1C1917] dark:text-[#F5F2EB] space-y-3 whitespace-pre-line`}>
                      {highlightText(article.content, inDocQuery)}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-sans-ui text-[#655E54] dark:text-[#A8A29E]">
                      <span>Từ khóa nghiệp vụ:</span>
                      {article.keywords.map((kw, idx) => (
                        <React.Fragment key={kw}>
                          {idx > 0 && <span aria-hidden="true">·</span>}
                          <span className="text-[#44403C] dark:text-[#D6D3CD]">{kw}</span>
                        </React.Fragment>
                      ))}
                    </div>

                    {savedClause && editingNoteArticleId !== article.id && (
                      <div className="mt-4 p-4 rounded-xl bg-[#F3EFE6] dark:bg-[#1E1D1B] border border-[#E5DEC9] dark:border-[#2E2C28] font-sans-ui">
                        <div className="flex items-center justify-between text-xs text-[#655E54] dark:text-[#A8A29E] mb-1">
                          <span>
                            Ghi chú cá nhân · Hồ sơ: <strong>{savedClause.folder}</strong>
                          </span>
                          <button
                            onClick={() => onRemoveClauseNote(document.id, article.id)}
                            className="text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                          >
                            Xóa ghim
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-[#1C1917] dark:text-[#F5F2EB]">
                          {savedClause.note}
                        </p>
                      </div>
                    )}

                    {editingNoteArticleId === article.id && (
                      <div className="mt-4 p-4 rounded-xl bg-[#F3EFE6] dark:bg-[#1E1D1B] border border-[#1E3A8A]/40 font-sans-ui space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold">
                            Ghim điều khoản & Lưu ghi chú Ban QLDA ({article.article_no})
                          </span>
                          <select
                            value={noteFolder}
                            onChange={(e) => setNoteFolder(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-md border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
                          >
                            <option value="Hồ sơ Pháp lý Dự án & QLDA">Hồ sơ Pháp lý Dự án & QLDA</option>
                            <option value="Đấu thầu & Hợp đồng EPC">Đấu thầu & Hợp đồng EPC</option>
                            <option value="Thẩm duyệt PCCC & Cấp phép XD">Thẩm duyệt PCCC & Cấp phép XD</option>
                            <option value="Thanh quyết toán & Kiểm toán">Thanh quyết toán & Kiểm toán</option>
                          </select>
                        </div>
                        <textarea
                          rows={3}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Nhập nhận định pháp lý, lưu ý kiểm soát rủi ro cho Ban QLDA / HĐQT..."
                          className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] focus:outline-none focus:border-[#1E3A8A]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingNoteArticleId(null)}
                            className="min-h-[36px] px-3 py-1 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28]"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => {
                              onSaveClauseNote(
                                document.id,
                                article.id,
                                noteDraft.trim() || `Đã đánh dấu ${article.article_no} - ${document.short_title}`,
                                noteFolder
                              );
                              setEditingNoteArticleId(null);
                            }}
                            className="min-h-[36px] px-3.5 py-1 text-xs font-medium rounded-lg bg-[#1E3A8A] text-white"
                          >
                            Lưu vào tủ sách
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Clause Cross-References (cross_references table) */}
                    {articleXrefs.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-[#E5DEC9]/70 dark:border-[#2E2C28] font-sans-ui space-y-2.5">
                        <div className="text-xs font-semibold text-[#1E3A8A] dark:text-[#60A5FA] flex items-center gap-1.5">
                          <GitCompare className="w-3.5 h-3.5" />
                          <span>
                            Đối soát chéo & Văn bản liên kết trực tiếp với {article.article_no} ({articleXrefs.length})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {articleXrefs.map((xref) => {
                            const isSource = xref.source_doc_id === document.id;
                            const counterpartDocId = isSource ? xref.target_doc_id : xref.source_doc_id;
                            const counterpartArtId = isSource
                              ? xref.target_article_id
                              : xref.source_article_id;
                            const counterpartDoc = docMap.get(counterpartDocId);
                            const counterpartArt = counterpartArtId
                              ? globalArticleByDocAndIdMap.get(
                                  `${counterpartDocId}:${counterpartArtId}`
                                )
                              : undefined;
                            const isPreviewOpen = previewXrefId === xref.id;
                            const relMeta = RELATION_META[xref.relation_type];

                            return (
                              <div
                                key={xref.id}
                                className="p-3.5 rounded-xl bg-[#F3EFE6]/80 dark:bg-[#1E1D1B] border border-[#E5DEC9] dark:border-[#2E2C28]"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#655E54] dark:text-[#A8A29E]">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold ${relMeta.textClass}`}>
                                      {relMeta.label} ({relMeta.code})
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono-code font-medium text-[#1C1917] dark:text-[#F5F2EB]">
                                      {counterpartDoc?.doc_number} ({counterpartArt?.article_no})
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        setPreviewXrefId(isPreviewOpen ? null : xref.id)
                                      }
                                      className="text-xs font-medium text-[#1E3A8A] dark:text-[#60A5FA] hover:underline cursor-pointer"
                                    >
                                      {isPreviewOpen ? 'Ẩn trích lục' : 'Xem nhanh trích lục'}
                                    </button>
                                    <span aria-hidden="true">·</span>
                                    <button
                                      onClick={() => onOpenCrossCheck(xref)}
                                      className="text-xs font-semibold text-[#1E3A8A] dark:text-[#60A5FA] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>Đối soát 2 màn hình</span>
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#1C1917] dark:text-[#F5F2EB]">
                                  {xref.title}
                                </p>
                                <p className="mt-1 text-xs text-[#44403C] dark:text-[#D6D3CD] leading-relaxed">
                                  {xref.description}
                                </p>

                                {isPreviewOpen && counterpartDoc && counterpartArt && (
                                  <div className="mt-3 pt-3 border-t border-[#E5DEC9] dark:border-[#2E2C28] space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                                        Nội dung {counterpartArt.article_no} — {counterpartDoc.short_title}:
                                      </span>
                                      <button
                                        onClick={() =>
                                          onSelectDocument(counterpartDoc.id, counterpartArt.id)
                                        }
                                        className="text-[#1E3A8A] dark:text-[#60A5FA] hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>Mở toàn văn {counterpartDoc.doc_number}</span>
                                      </button>
                                    </div>
                                    <p className="p-2.5 rounded-lg bg-[#FBF9F5] dark:bg-[#141413] text-[#44403C] dark:text-[#D6D3CD] whitespace-pre-line leading-relaxed">
                                      {counterpartArt.content}
                                    </p>
                                    <p className="text-[#9A3412] dark:text-amber-300">
                                      <strong>Tác động pháp lý đối với Dự án / HĐQT: </strong>
                                      {xref.comparison_highlight.legal_impact}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
