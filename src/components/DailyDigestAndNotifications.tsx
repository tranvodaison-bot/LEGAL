import React, { useState, useMemo } from 'react';
import {
  Bell,
  BellRing,
  BookOpen,
  CheckCheck,
  Clock,
  GitCompare,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  DailyLegalUpdateAlert,
  LegalField,
  LegalDocument,
  NotificationPreferences,
  ProjectLifecycleStage,
} from '../types/legal';
import { LEGAL_FIELDS, PROJECT_LIFECYCLE_STAGES } from '../data/legalCorpus';

interface DailyDigestAndNotificationsProps {
  alerts: DailyLegalUpdateAlert[];
  documents: LegalDocument[];
  preferences: NotificationPreferences;
  onUpdatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  onMarkAlertRead: (alertId: string) => void;
  onMarkAllAlertsRead: () => void;
  onTriggerTestPush: () => void;
  onOpenReader: (docId: string) => void;
  onOpenLegalMap: (docId: string) => void;
}

export const DailyDigestAndNotifications: React.FC<DailyDigestAndNotificationsProps> = React.memo(({
  alerts,
  documents,
  preferences,
  onUpdatePreferences,
  onMarkAlertRead,
  onMarkAllAlertsRead,
  onTriggerTestPush,
  onOpenReader,
  onOpenLegalMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LegalField | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<ProjectLifecycleStage | 'all'>('all');

  // Pre-compute O(1) Document Lookup Map (eliminates documents.filter inside filteredAlerts.map)
  const docMap = useMemo(() => {
    const map = new Map<string, LegalDocument>();
    documents.forEach((d) => map.set(d.id, d));
    return map;
  }, [documents]);

  const subscribedCategoriesSet = useMemo(
    () => new Set(preferences.subscribedCategories),
    [preferences.subscribedCategories]
  );

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((a) => {
        if (selectedCategory !== 'all' && a.category !== selectedCategory)
          return false;
        if (selectedStage !== 'all' && a.projectStage !== selectedStage)
          return false;
        return true;
      }),
    [alerts, selectedCategory, selectedStage]
  );

  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.isRead).length,
    [alerts]
  );

  const handleToggleCategorySubscription = (cat: LegalField) => {
    const exists = preferences.subscribedCategories.includes(cat);
    const updated = exists
      ? preferences.subscribedCategories.filter((c) => c !== cat)
      : [...preferences.subscribedCategories, cat];
    onUpdatePreferences({ subscribedCategories: updated });
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      onUpdatePreferences({ enabled: true, browserPermission: 'unsupported' });
      return;
    }
    try {
      const result = await Notification.requestPermission();
      onUpdatePreferences({
        enabled: true,
        browserPermission: result,
      });
    } catch {
      onUpdatePreferences({ enabled: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E5DEC9] dark:border-[#2E2C28]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB] balance-text">
            Bản Tin Pháp Lý Đầu Tư Xây Dựng Hàng Ngày & Cảnh Báo Tự Động
          </h1>
          <p className="mt-1 text-sm text-[#655E54] dark:text-[#A8A29E]">
            Hệ thống đẩy thông tin định kỳ tới Ban QLDA, Phòng Đấu thầu – Hợp đồng và Hội đồng quản trị khi có văn bản mới hoặc điều khoản sửa đổi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={onTriggerTestPush}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#1E3A8A] dark:bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#172E6E] transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Đẩy bản tin cập nhật hôm nay</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAlertsRead}
              className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#1E1D1B] text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Đánh dấu đã đọc ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Daily Legal Digest Feed */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category & WBS Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white'
                    : 'bg-[#F3EFE6] dark:bg-[#1E1D1B] text-[#44403C] dark:text-[#D6D3CD]'
                }`}
              >
                Tất cả lĩnh vực ({alerts.length})
              </button>
              {LEGAL_FIELDS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#1E3A8A] dark:bg-[#2563EB] text-white'
                      : 'bg-[#F3EFE6] dark:bg-[#1E1D1B] text-[#44403C] dark:text-[#D6D3CD]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <select
              value={selectedStage}
              onChange={(e) =>
                setSelectedStage(e.target.value as ProjectLifecycleStage | 'all')
              }
              className="min-h-[36px] px-3 py-1.5 text-xs rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] font-medium"
            >
              <option value="all">Mọi giai đoạn WBS</option>
              {PROJECT_LIFECYCLE_STAGES.map((st) => (
                <option key={st} value={st}>
                  Giai đoạn: {st}
                </option>
              ))}
            </select>
          </div>

          {/* Alerts Stream */}
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const impactedDocs = alert.impactedDocIds
                .map((id) => docMap.get(id))
                .filter((d): d is LegalDocument => Boolean(d));

              return (
                <article
                  key={alert.id}
                  onClick={() => onMarkAlertRead(alert.id)}
                  className={`p-5 rounded-2xl border transition-colors ${
                    !alert.isRead
                      ? 'border-[#1E3A8A]/50 dark:border-[#60A5FA]/50 bg-[#FBF9F5] dark:bg-[#1E1D1B]'
                      : 'border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/40 dark:bg-[#1A1917]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#655E54] dark:text-[#A8A29E]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#9A3412] dark:text-amber-400">
                        {alert.changeType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-code font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                        {alert.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{alert.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>WBS: {alert.projectStage}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-code">Ngày: {alert.date}</span>
                    </div>

                    {!alert.isRead && (
                      <span className="text-xs font-semibold text-[#1E3A8A] dark:text-[#60A5FA]">
                        Bản tin mới
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-base sm:text-lg font-display font-semibold text-[#1C1917] dark:text-[#F5F2EB]">
                    {alert.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-[#44403C] dark:text-[#D6D3CD] leading-relaxed">
                    {alert.summary}
                  </p>

                  {impactedDocs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E5DEC9]/70 dark:border-[#2E2C28] flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-[#655E54] dark:text-[#A8A29E] flex flex-wrap items-center gap-1.5">
                        <span>Văn bản liên đới cần đối soát:</span>
                        {impactedDocs.map((d, idx) => (
                          <React.Fragment key={d.id}>
                            {idx > 0 && <span aria-hidden="true">·</span>}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenReader(d.id);
                              }}
                              className="font-mono-code font-medium text-[#1E3A8A] dark:text-[#60A5FA] hover:underline cursor-pointer"
                            >
                              {d.doc_number} ({d.short_title})
                            </button>
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReader(alert.docId);
                          }}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-[#1E3A8A] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Đọc văn bản</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLegalMap(alert.docId);
                          }}
                          className="min-h-[36px] px-3 py-1 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <GitCompare className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-[#60A5FA]" />
                          <span>Đối soát chéo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Periodic Push Notification Settings */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#F3EFE6]/70 dark:bg-[#1E1D1B] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#1E3A8A] dark:text-[#60A5FA]" />
                <h3 className="text-sm font-display font-semibold">
                  Cấu hình đẩy thông tin định kỳ
                </h3>
              </div>
              <button
                onClick={() =>
                  onUpdatePreferences({ enabled: !preferences.enabled })
                }
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  preferences.enabled
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#E5DEC9] dark:bg-[#2E2C28] text-[#44403C] dark:text-[#D6D3CD]'
                }`}
              >
                {preferences.enabled ? 'Đang bật' : 'Đang tắt'}
              </button>
            </div>

            <p className="text-xs text-[#44403C] dark:text-[#D6D3CD] leading-relaxed">
              Hệ thống tự động rà soát các văn bản quy phạm pháp luật mới ban hành hoặc điều chỉnh liên quan đến vòng đời dự án đầu tư xây dựng để gửi cảnh báo định kỳ.
            </p>

            {/* Schedule Time Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#1C1917] dark:text-[#F5F2EB] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#655E54]" />
                <span>Khung giờ nhận bản tin mỗi ngày:</span>
              </label>
              <select
                value={preferences.dailyTime}
                onChange={(e) =>
                  onUpdatePreferences({ dailyTime: e.target.value })
                }
                className="w-full min-h-[38px] px-3 py-1.5 text-xs font-mono-code rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413]"
              >
                <option value="07:30">07:30 sáng — Giao ban công trường & QLDA</option>
                <option value="08:30">08:30 sáng — Bản tin Pháp chế & HĐQT</option>
                <option value="12:00">12:00 trưa — Điểm tin giữa ngày</option>
                <option value="17:30">17:30 chiều — Tổng hợp cuối ngày</option>
              </select>
            </div>

            {/* Subscribed Categories */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-[#1C1917] dark:text-[#F5F2EB]">
                Lĩnh vực nhận cảnh báo tự động:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {LEGAL_FIELDS.map((cat) => {
                  const checked = subscribedCategoriesSet.has(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleToggleCategorySubscription(cat)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium text-left transition-colors cursor-pointer ${
                        checked
                          ? 'border-[#1E3A8A] dark:border-[#60A5FA] bg-[#1E3A8A]/10 dark:bg-[#60A5FA]/15 text-[#1E3A8A] dark:text-[#60A5FA]'
                          : 'border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] text-[#655E54]'
                      }`}
                    >
                      {checked ? '✓ ' : '+ '}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alert on Saved Docs Amended */}
            <label className="flex items-start gap-2.5 pt-2 border-t border-[#E5DEC9] dark:border-[#2E2C28] text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyOnSavedDocAmended}
                onChange={(e) =>
                  onUpdatePreferences({
                    notifyOnSavedDocAmended: e.target.checked,
                  })
                }
                className="mt-0.5 rounded-sm"
              />
              <span className="text-[#44403C] dark:text-[#D6D3CD] leading-relaxed">
                Đẩy cảnh báo tức thì khi văn bản trong <strong>Tủ sách dự án</strong> chuyển trạng thái sang <span className="font-mono-code">SUA_DOI_BO_SUNG</span> hoặc <span className="font-mono-code">HET_HIEU_LUC</span>.
              </span>
            </label>

            {/* Browser Notification API Authorization */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleRequestBrowserPermission}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-[#E5DEC9] dark:border-[#2E2C28] bg-[#FBF9F5] dark:bg-[#141413] hover:border-[#1E3A8A] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-[#1E3A8A] dark:text-[#60A5FA]" />
                <span>
                  {preferences.browserPermission === 'granted'
                    ? 'Đã cấp quyền thông báo trình duyệt'
                    : 'Cấp quyền thông báo đẩy trên thiết bị'}
                </span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-[#655E54] dark:text-[#A8A29E]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                <span>
                  Lần đồng bộ bản tin gần nhất: {preferences.lastDigestDate}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
});
