import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  BookOpen,
  Database,
  DownloadCloud,
  FolderPlus,
  HardDrive,
  Network,
  StickyNote,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import {
  LegalCrossReference,
  LegalDocument,
  SavedDocumentItem,
  SavedClauseItem,
} from '../types/legal';

interface PersonalCabinetViewProps {
  documents: LegalDocument[];
  crossReferences: LegalCrossReference[];
  savedDocs: SavedDocumentItem[];
  savedClauses: SavedClauseItem[];
  offlineDocIds: string[];
  folders: string[];
  onAddFolder: (folderName: string) => void;
  onUpdateSavedDocFolder: (docId: string, folder: string, personalNote: string) => void;
  onRemoveSavedDoc: (docId: string) => void;
  onRemoveSavedClause: (docId: string, articleId: string) => void;
  onToggleOfflineDoc: (docId: string) => void;
  onCacheAllDocsOffline: () => void;
  onOpenReader: (docId: string, articleId?: string) => void;
  onOpenLegalMap: (docId: string) => void;
}

export const PersonalCabinetView: React.FC<PersonalCabinetViewProps> = React.memo(({
  documents,
  crossReferences,
  savedDocs,
  savedClauses,
  offlineDocIds,
  folders,
  onAddFolder,
  onUpdateSavedDocFolder,
  onRemoveSavedDoc,
  onRemoveSavedClause,
  onToggleOfflineDoc,
  onCacheAllDocsOffline,
  onOpenReader,
  onOpenLegalMap,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'docs' | 'clauses' | 'offline' | 'ssot'>('docs');
  const [newFolderInput, setNewFolderInput] = useState('');
  const [editingDocNoteId, setEditingDocNoteId] = useState<string | null>(null);
  const [docNoteDraft, setDocNoteDraft] = useState('');

  // Pre-compute O(1) Document & Article Lookup Maps
  const { docMap, articleByDocAndIdMap } = useMemo(() => {
    const m = new Map<string, LegalDocument>();
    const aMap = new Map<string, LegalDocument['articles'][number]>();
    documents.forEach((d) => {
      m.set(d.id, d);
      d.articles.forEach((a) => aMap.set(`${d.id}:${a.id}`, a));
    });
    return { docMap: m, articleByDocAndIdMap: aMap };
  }, [documents]);

  // Pre-compute O(1) Offline Document ID Set
  const offlineDocIdSet = useMemo(() => new Set(offlineDocIds), [offlineDocIds]);

  // Pre-compute O(1) Folder Item Counter Map (eliminates nested savedDocs.filter + savedClauses.filter inside folders.map)
  const folderCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    savedDocs.forEach((d) => {
      map.set(d.folder, (map.get(d.folder) || 0) + 1);
    });
    savedClauses.forEach((c) => {
      map.set(c.folder, (map.get(c.folder) || 0) + 1);
    });
    return map;
  }, [savedDocs, savedClauses]);

  const filteredSavedDocs = useMemo(() => {
    return savedDocs.filter(
      (item) => selectedFolder === 'all' || item.folder === selectedFolder
    );
  }, [savedDocs, selectedFolder]);

  const filteredSavedClauses = useMemo(() => {
    return savedClauses.filter(
      (item) => selectedFolder === 'all' || item.folder === selectedFolder
    );
  }, [savedClauses, selectedFolder]);

  const offlineDocs = useMemo(() => {
    return documents.filter((d) => offlineDocIdSet.has(d.id));
  }, [documents, offlineDocIdSet]);

  const allArticlesCount = useMemo(
    () => documents.reduce((acc, d) => acc + d.articles.length, 0),
    [documents]
  );

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderInput.trim();
    if (!trimmed) return;
    onAddFolder(trimmed);
    setSelectedFolder(trimmed);
    setNewFolderInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E5DEC9] dark:border-[#2E2C28]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB] balance-text">
            Tủ Sách Cá Nhân, Ngoại Tuyến & Cấu Trúc Dữ Liệu SSoT
          </h1>
          <p className="mt-1 text-sm text-[#655E54] dark:text-[#A8A29E]">
            Quản lý hồ sơ pháp lý dự án của Ban QLDA / HĐQT, điều khoản đã ghim và bộ nhớ đệm ngoại tuyến (Offline-First PWA).
          </p>
        </div>

        {/* Sub-view Switcher */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F3EFE6] dark:bg-[#1E1D1B] border border-[#E5DEC9] dark:border-[#2E2C28] self-start">
          <button
            onClick={() => setActiveTab('docs')}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white'
                : 'text-[#44403C] dark:text-[#D6D3CD]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Văn bản đã lưu ({savedDocs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('clauses')}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'clauses'
                ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white'
                : 'text-[#44403C] dark:text-[#D6D3CD]'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Điều khoản & Ghi chú ({savedClauses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'offline'
                ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white'
                : 'text-[#44403C] dark:text-[#D6D3CD]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Bộ nhớ ngoại tuyến ({offlineDocs.length}/{documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ssot')}
            className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ssot'
                ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white'
                : 'text-[#44403C] dark:text-[#D6D3CD]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Bảng Dữ liệu SSoT (3 Bảng)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 3 Columns: Personal Folders & Offline Storage Summary */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/60 dark:bg-[#1E1D1B] space-y-3">
            <h3 className="text-xs font-semibold text-[#655E54] dark:text-[#A8A29E]">
              Thư mục hồ sơ dự án & QLDA
            </h3>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder('all')}
                className={`w-full min-h-[38px] px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  selectedFolder === 'all'
                    ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white'
                    : 'hover:bg-[#E5DEC9]/60 dark:hover:bg-[#282623] text-[#1C1917] dark:text-[#F5F2EB]'
                }`}
              >
                <span>Tất cả hồ sơ đã lưu</span>
                <span className="font-mono-code">
                  {savedDocs.length + savedClauses.length}
                </span>
              </button>

              {folders.map((folder) => {
                const count = folderCountsMap.get(folder) || 0;
                return (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full min-h-[38px] px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      selectedFolder === folder
                        ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white'
                        : 'hover:bg-[#E5DEC9]/60 dark:hover:bg-[#282623] text-[#44403C] dark:text-[#D6D3CD]'
                    }`}
                  >
                    <span className="truncate">{folder}</span>
                    <span className="font-mono-code">{count}</span>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={handleCreateFolder}
              className="pt-2 border-t border-[#E5DEC9] dark:border-[#2E2C28] flex gap-1.5"
            >
              <input
                type="text"
                value={newFolderInput}
                onChange={(e) => setNewFolderInput(e.target.value)}
                placeholder="Tạo thư mục hồ sơ..."
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
              />
              <button
                type="submit"
                className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                title="Thêm thư mục"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </form>
          </div>

          {/* Offline Readiness Box */}
          <div className="p-4 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                Bộ nhớ đệm ngoại tuyến
              </span>
              <span className="font-mono-code text-emerald-700 dark:text-emerald-400 font-semibold">
                {offlineDocs.length}/{documents.length} văn bản
              </span>
            </div>
            <p className="text-xs text-[#655E54] dark:text-[#A8A29E] leading-relaxed">
              Toàn bộ bảng <span className="font-mono-code">documents</span>, <span className="font-mono-code">document_articles</span> và <span className="font-mono-code">cross_references</span> được lưu cục bộ để tra cứu tại công trường hoặc phòng họp không cần Internet.
            </p>
            <button
              onClick={onCacheAllDocsOffline}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-[#F3EFE6] dark:bg-[#141413] border border-[#E5DEC9] dark:border-[#2E2C28] hover:border-[#1E3A8A] text-xs font-semibold text-[#1E3A8A] dark:text-[#60A5FA] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Đồng bộ toàn bộ kho ngoại tuyến</span>
            </button>
          </div>
        </aside>

        {/* Right 9 Columns: Active Content List */}
        <div className="lg:col-span-9 space-y-4">
          {activeTab === 'docs' && (
            <>
              {filteredSavedDocs.length === 0 ? (
                <div className="p-10 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] text-center space-y-3">
                  <Bookmark className="w-8 h-8 text-[#655E54] mx-auto" />
                  <h3 className="text-base font-display font-semibold">
                    Chưa có văn bản nào trong thư mục này
                  </h3>
                  <p className="text-xs text-[#655E54] dark:text-[#A8A29E] max-w-md mx-auto">
                    Nhấn "Lưu vào tủ sách" trên bất kỳ văn bản nào trong Thư viện để phân loại theo gói thầu hoặc giai đoạn dự án.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSavedDocs.map((savedItem) => {
                    const doc = docMap.get(savedItem.docId);
                    if (!doc) return null;
                    const isOffline = offlineDocIdSet.has(doc.id);
                    const isEditingNote = editingDocNoteId === doc.id;

                    return (
                      <div
                        key={doc.id}
                        className="p-5 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#655E54] dark:text-[#A8A29E]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-code font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                              {doc.doc_number}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{doc.field}</span>
                            <span aria-hidden="true">·</span>
                            <span>WBS: {doc.project_stage}</span>
                            <span aria-hidden="true">·</span>
                            <span>Hồ sơ: {savedItem.folder}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={savedItem.folder}
                              onChange={(e) =>
                                onUpdateSavedDocFolder(
                                  doc.id,
                                  e.target.value,
                                  savedItem.personalNote
                                )
                              }
                              className="px-2 py-1 text-xs rounded-md border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6] dark:bg-[#141413]"
                            >
                              {folders.map((f) => (
                                <option key={f} value={f}>
                                  Chuyển tới: {f}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => onRemoveSavedDoc(doc.id)}
                              className="min-h-[34px] px-2.5 py-1 rounded-md text-xs text-red-700 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Bỏ lưu</span>
                            </button>
                          </div>
                        </div>

                        <h3 className="text-lg font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                          {doc.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#44403C] dark:text-[#D6D3CD] leading-relaxed">
                          {doc.summary}
                        </p>

                        {isEditingNote ? (
                          <div className="p-3 rounded-xl bg-[#F3EFE6] dark:bg-[#141413] border border-[#E5DEC9] dark:border-[#2E2C28] space-y-2">
                            <textarea
                              rows={2}
                              value={docNoteDraft}
                              onChange={(e) => setDocNoteDraft(e.target.value)}
                              placeholder="Ghi chú chỉ đạo của HĐQT / Ban QLDA cho văn bản này..."
                              className="w-full p-2 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B]"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingDocNoteId(null)}
                                className="px-3 py-1 text-xs rounded-md border border-[#E5DEC9] dark:border-[#2E2C28]"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => {
                                  onUpdateSavedDocFolder(
                                    doc.id,
                                    savedItem.folder,
                                    docNoteDraft
                                  );
                                  setEditingDocNoteId(null);
                                }}
                                className="px-3 py-1 text-xs rounded-md bg-[#1E3A8A] text-white"
                              >
                                Lưu ghi chú
                              </button>
                            </div>
                          </div>
                        ) : (
                          savedItem.personalNote && (
                            <div className="p-3 rounded-xl bg-[#F3EFE6]/80 dark:bg-[#141413] text-xs text-[#44403C] dark:text-[#D6D3CD]">
                              <strong className="text-[#1C1917] dark:text-[#F5F2EB]">
                                Ghi chú thẩm định dự án:{' '}
                              </strong>
                              {savedItem.personalNote}
                            </div>
                          )
                        )}

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5DEC9]/70 dark:border-[#2E2C28]">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => onOpenReader(doc.id)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] dark:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Đọc toàn văn</span>
                            </button>
                            <button
                              onClick={() => onOpenLegalMap(doc.id)}
                              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                            >
                              <Network className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-[#60A5FA]" />
                              <span>Xem bản đồ liên kết</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingDocNoteId(doc.id);
                                setDocNoteDraft(savedItem.personalNote || '');
                              }}
                              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] text-xs font-medium cursor-pointer"
                            >
                              {savedItem.personalNote ? 'Sửa ghi chú' : '+ Thêm ghi chú'}
                            </button>
                          </div>

                          <button
                            onClick={() => onToggleOfflineDoc(doc.id)}
                            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                              isOffline
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-[#655E54] dark:text-[#A8A29E] hover:underline'
                            }`}
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>{isOffline ? 'Sẵn sàng ngoại tuyến' : 'Tải đọc ngoại tuyến'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'clauses' && (
            <>
              {filteredSavedClauses.length === 0 ? (
                <div className="p-10 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] text-center space-y-3">
                  <StickyNote className="w-8 h-8 text-[#655E54] mx-auto" />
                  <h3 className="text-base font-display font-semibold">
                    Chưa có điều khoản nào được ghim
                  </h3>
                  <p className="text-xs text-[#655E54] dark:text-[#A8A29E] max-w-md mx-auto">
                    Khi đọc văn bản pháp luật, nhấn "Ghim & Ghi chú" ở bất kỳ Điều khoản nào để lưu trích dẫn quan trọng vào đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSavedClauses.map((clause) => {
                    const doc = docMap.get(clause.docId);
                    const art = articleByDocAndIdMap.get(
                      `${clause.docId}:${clause.articleId}`
                    );
                    if (!doc || !art) return null;

                    return (
                      <div
                        key={clause.id}
                        className="p-5 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#655E54] dark:text-[#A8A29E]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-code font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                              {doc.doc_number} · {art.article_no}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Hồ sơ: {clause.folder}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-code">{clause.savedAt}</span>
                          </div>
                          <button
                            onClick={() => onRemoveSavedClause(doc.id, art.id)}
                            className="text-xs text-red-700 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa ghim</span>
                          </button>
                        </div>

                        <h4 className="text-base font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                          {art.article_no}. {art.article_title} —{' '}
                          <span className="font-normal text-sm">{doc.short_title}</span>
                        </h4>

                        <div className="p-3.5 rounded-xl bg-[#F3EFE6] dark:bg-[#141413] border border-[#E5DEC9] dark:border-[#2E2C28] text-xs sm:text-sm text-[#1C1917] dark:text-[#F5F2EB]">
                          <strong className="font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                            Ghi chú Ban QLDA / Pháp chế:{' '}
                          </strong>
                          {clause.note}
                        </div>

                        <p className="text-xs text-[#44403C] dark:text-[#D6D3CD] line-clamp-3 leading-relaxed">
                          {art.content}
                        </p>

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => onOpenReader(doc.id, art.id)}
                            className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Mở đúng {art.article_no} trong trình đọc</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'offline' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/60 dark:bg-[#1E1D1B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Trạng thái bộ nhớ đệm ngoại tuyến (Service Worker + LocalStorage SSoT)</span>
                  </div>
                  <p className="text-xs text-[#655E54] dark:text-[#A8A29E]">
                    Đã lưu trữ {offlineDocs.length}/{documents.length} văn bản ({allArticlesCount} điều khoản) và {crossReferences.length} bản ghi đối soát chéo.
                  </p>
                </div>

                <button
                  onClick={onCacheAllDocsOffline}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#172E6E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Tải tất cả ({documents.length} văn bản)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((doc) => {
                  const isCached = offlineDocIdSet.has(doc.id);
                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-[#655E54] dark:text-[#A8A29E] flex items-center gap-1.5">
                          <span className="font-mono-code font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                            {doc.doc_number}
                          </span>
                          <span>·</span>
                          <span>{doc.field}</span>
                          <span>·</span>
                          <span className="font-mono-code">{doc.articles.length} điều</span>
                        </div>
                        <h4 className="text-sm font-semibold truncate mt-0.5">
                          {doc.short_title}
                        </h4>
                      </div>

                      <button
                        onClick={() => onToggleOfflineDoc(doc.id)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                          isCached
                            ? 'bg-emerald-950/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-700/30'
                            : 'border border-[#E5DEC9] dark:border-[#2E2C28] hover:border-[#1E3A8A]'
                        }`}
                      >
                        {isCached ? 'Đã tải ngoại tuyến' : 'Tải xuống'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SSoT Relational Database Tables Inspector */}
          {activeTab === 'ssot' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] space-y-3">
                <h3 className="text-base font-display font-semibold">
                  1. Bảng Quản lý Văn bản (documents — {documents.length} bản ghi)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5DEC9] dark:border-[#2E2C28] text-[#655E54] dark:text-[#A8A29E]">
                        <th className="py-2 pr-3 font-mono-code">doc_number</th>
                        <th className="py-2 pr-3">doc_type</th>
                        <th className="py-2 pr-3">field</th>
                        <th className="py-2 pr-3">project_stage</th>
                        <th className="py-2 pr-3 font-mono-code">effective_date</th>
                        <th className="py-2 font-mono-code">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DEC9]/60 dark:divide-[#2E2C28]">
                      {documents.map((d) => (
                        <tr key={d.id} className="hover:bg-[#F3EFE6]/50 dark:hover:bg-[#282623]">
                          <td className="py-2 pr-3 font-mono-code font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                            {d.doc_number}
                          </td>
                          <td className="py-2 pr-3">{d.doc_type}</td>
                          <td className="py-2 pr-3">{d.field}</td>
                          <td className="py-2 pr-3">{d.project_stage}</td>
                          <td className="py-2 pr-3 font-mono-code">{d.effective_date}</td>
                          <td className="py-2 font-mono-code">{d.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] space-y-3">
                <h3 className="text-base font-display font-semibold">
                  2. Bảng Đối soát Chéo & Dẫn chiếu (cross_references — {crossReferences.length} bản ghi)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5DEC9] dark:border-[#2E2C28] text-[#655E54] dark:text-[#A8A29E]">
                        <th className="py-2 pr-3 font-mono-code">source_article_id</th>
                        <th className="py-2 pr-3 font-mono-code">target_article_id</th>
                        <th className="py-2 pr-3 font-mono-code">relation_type</th>
                        <th className="py-2">description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DEC9]/60 dark:divide-[#2E2C28]">
                      {crossReferences.map((x) => (
                        <tr key={x.id} className="hover:bg-[#F3EFE6]/50 dark:hover:bg-[#282623]">
                          <td className="py-2 pr-3 font-mono-code">{x.source_article_id}</td>
                          <td className="py-2 pr-3 font-mono-code">{x.target_article_id}</td>
                          <td className="py-2 pr-3 font-mono-code font-semibold text-[#9A3412] dark:text-amber-400">
                            {x.relation_type}
                          </td>
                          <td className="py-2 text-[#44403C] dark:text-[#D6D3CD] max-w-md truncate">
                            {x.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
