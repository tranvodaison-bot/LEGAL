import React, { useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  FileUp,
  RotateCcw,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import {
  AuditPhaseCode,
  ComplianceGateCode,
  MasterComplianceStep,
  ProjectStepRecord,
  ProjectStepStatus,
  RiskFlagMetadata,
  StandardizedRiskFlagCode,
} from '../types/compliance';

interface ComplianceTableProps {
  steps: MasterComplianceStep[];
  records: Record<string, ProjectStepRecord>;
  riskFlagsMeta: Record<StandardizedRiskFlagCode, RiskFlagMetadata>;
  dossierGroups: string[];
  selectedStepCode: string;
  selectedPhase: AuditPhaseCode | 'ALL';
  selectedGate: ComplianceGateCode | 'ALL';
  selectedDossierGroup: string;
  selectedGoverningBody: string;
  selectedRiskFlag: StandardizedRiskFlagCode | 'ALL';
  mandatoryFilter: 'ALL' | 'MANDATORY' | 'CONDITIONAL';
  searchQuery: string;
  auditingStepCode: string | null;
  onSelectStep: (stepCode: string) => void;
  onChangeDossierGroup: (group: string) => void;
  onChangeGoverningBody: (body: string) => void;
  onChangeRiskFlag: (flag: StandardizedRiskFlagCode | 'ALL') => void;
  onChangeMandatoryFilter: (val: 'ALL' | 'MANDATORY' | 'CONDITIONAL') => void;
  onChangeSearchQuery: (q: string) => void;
  onResetFilters: () => void;
  onRunAiAuditForStep: (step: MasterComplianceStep) => void;
}

const STATUS_BADGE_CONFIG: Record<
  ProjectStepStatus,
  { label: string; className: string }
> = {
  PASSED: {
    label: 'PASSED (Đạt)',
    className:
      'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  FLAGGED: {
    label: 'FLAGGED (Treo cờ đỏ)',
    className:
      'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
  },
  BLOCKED: {
    label: 'BLOCKED (Khóa Gate)',
    className:
      'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-800',
  },
  IN_REVIEW: {
    label: 'IN_REVIEW (Đang thẩm định)',
    className:
      'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  },
  PENDING: {
    label: 'PENDING (Chờ hồ sơ)',
    className:
      'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700',
  },
  WAIVED: {
    label: 'WAIVED (Miễn áp dụng)',
    className:
      'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  },
};

export const ComplianceTable: React.FC<ComplianceTableProps> = React.memo(({
  steps,
  records,
  riskFlagsMeta,
  dossierGroups,
  selectedStepCode,
  selectedPhase,
  selectedGate,
  selectedDossierGroup,
  selectedGoverningBody,
  selectedRiskFlag,
  mandatoryFilter,
  searchQuery,
  auditingStepCode,
  onSelectStep,
  onChangeDossierGroup,
  onChangeGoverningBody,
  onChangeRiskFlag,
  onChangeMandatoryFilter,
  onChangeSearchQuery,
  onResetFilters,
  onRunAiAuditForStep,
}) => {
  // Unique governing/inspection bodies for filter dropdown
  const uniqueAgencies = useMemo(() => {
    const set = new Set<string>();
    steps.forEach((s) => {
      set.add(s.governing_body);
      set.add(s.inspection_body);
    });
    return Array.from(set);
  }, [steps]);

  const allRiskFlagsList = useMemo(
    () => Object.values(riskFlagsMeta).sort((a, b) => a.index - b.index),
    [riskFlagsMeta]
  );

  return (
    <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-4 shadow-xs space-y-4">
      {/* Multi-Dimensional Filter Bar */}
      <div className="space-y-3 border-b border-stone-200 dark:border-[#2E2C28] pb-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#C6A342]" />
            <h3 className="text-sm sm:text-base font-bold text-[#152D42] dark:text-stone-100">
              Bảng Danh Mục Bước Hồ Sơ Chuẩn Hóa ({steps.length} cụm bước hiển thị)
            </h3>
            {selectedGate !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-[#152D42] text-[#E9C96D] text-xs font-mono-code font-bold">
                Đang lọc Gate: {selectedGate}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa bộ lọc</span>
          </button>
        </div>

        {/* 5 Filter Controls: Search, Dossier Group (32), Agency, Risk Flag (18), Mandatory/Conditional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Tìm mã bước (I.1, II.11), tên hồ sơ..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] text-xs focus:outline-none focus:border-[#C6A342]"
            />
          </div>

          <select
            value={selectedDossierGroup}
            onChange={(e) => onChangeDossierGroup(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] text-xs focus:outline-none focus:border-[#C6A342]"
          >
            <option value="ALL">Tất cả 32 Nhóm hồ sơ</option>
            {dossierGroups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </select>

          <select
            value={selectedGoverningBody}
            onChange={(e) => onChangeGoverningBody(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] text-xs focus:outline-none focus:border-[#C6A342]"
          >
            <option value="ALL">Mọi Cơ quan lập / Thẩm định</option>
            {uniqueAgencies.map((ag) => (
              <option key={ag} value={ag}>
                {ag}
              </option>
            ))}
          </select>

          <select
            value={selectedRiskFlag}
            onChange={(e) =>
              onChangeRiskFlag(e.target.value as StandardizedRiskFlagCode | 'ALL')
            }
            className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] text-xs focus:outline-none focus:border-[#C6A342]"
          >
            <option value="ALL">Tất cả 18 Risk Flags chuẩn hóa</option>
            {allRiskFlagsList.map((rf) => (
              <option key={rf.code} value={rf.code}>
                #{rf.index} · {rf.code} ({rf.label})
              </option>
            ))}
          </select>

          <select
            value={mandatoryFilter}
            onChange={(e) =>
              onChangeMandatoryFilter(
                e.target.value as 'ALL' | 'MANDATORY' | 'CONDITIONAL'
              )
            }
            className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-[#141413] text-xs focus:outline-none focus:border-[#C6A342]"
          >
            <option value="ALL">Bắt buộc (282) & Có điều kiện (81)</option>
            <option value="MANDATORY">Chỉ hồ sơ Bắt buộc (282)</option>
            <option value="CONDITIONAL">Chỉ hồ sơ Có điều kiện (81)</option>
          </select>
        </div>
      </div>

      {/* Standardized Master Compliance Step Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 dark:border-[#2E2C28] text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-[#FBF9F5] dark:bg-[#141413]">
              <th className="py-2.5 px-3">Mã / Gate</th>
              <th className="py-2.5 px-3">Tên Bước Thực Hiện & Nhóm Hồ Sơ</th>
              <th className="py-2.5 px-3">Phân loại</th>
              <th className="py-2.5 px-3">Cơ Quan Trình / Thẩm Định</th>
              <th className="py-2.5 px-3">Cảnh Báo Rủi Ro (18 Risk Flags)</th>
              <th className="py-2.5 px-3">Trạng Thái</th>
              <th className="py-2.5 px-3 text-right">Thẩm Định AI / Hồ Sơ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/80 dark:divide-stone-800 text-xs">
            {steps.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-stone-500 dark:text-stone-400"
                >
                  Không có bước thực hiện nào khớp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              steps.map((step) => {
                const isSelected = selectedStepCode === step.step_code;
                const rec = records[step.step_code];
                const status: ProjectStepStatus = rec?.status || 'PENDING';
                const statusCfg = STATUS_BADGE_CONFIG[status];
                const activeFlags = rec?.active_risk_flags || [];

                // Combine potential master risk_flags with any active_risk_flags triggered by agents
                const allDisplayedFlags = Array.from(
                  new Set([...activeFlags, ...step.risk_flags])
                );

                return (
                  <tr
                    key={step.step_code}
                    onClick={() => onSelectStep(step.step_code)}
                    className={`transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFFDF4] dark:bg-[#25221B] ring-1 ring-inset ring-[#C6A342]'
                        : 'hover:bg-stone-50/90 dark:hover:bg-stone-900/50'
                    }`}
                  >
                    {/* STT Mã & Gate */}
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      <div className="font-mono-code font-bold text-[#152D42] dark:text-amber-300 text-xs">
                        {step.step_code}
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono-code text-[10px] font-bold">
                        {step.gate_code}
                      </span>
                    </td>

                    {/* Tên bước & Nhóm hồ sơ */}
                    <td className="py-3 px-3 align-top max-w-md">
                      <div className="text-[11px] font-semibold text-[#286181] dark:text-amber-400 mb-0.5">
                        {step.dossier_group}
                      </div>
                      <div className="font-bold text-stone-900 dark:text-stone-100 leading-snug">
                        {step.step_name}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {step.deliverables.map((deliv) => (
                          <span
                            key={deliv}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                          >
                            {deliv}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Bắt buộc / Có điều kiện */}
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      {step.is_mandatory ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold">
                          Bắt buộc
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-semibold">
                          Có điều kiện
                        </span>
                      )}
                    </td>

                    {/* Cơ quan chính */}
                    <td className="py-3 px-3 align-top max-w-[210px]">
                      <div className="text-[11px] text-stone-800 dark:text-stone-200 font-semibold">
                        Trình: {step.governing_body}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Duyệt: {step.inspection_body}
                      </div>
                    </td>

                    {/* Cảnh báo rủi ro (Risk Badges with Tooltip) */}
                    <td className="py-3 px-3 align-top max-w-[230px]">
                      <div className="flex flex-wrap gap-1">
                        {allDisplayedFlags.map((flagCode) => {
                          const meta = riskFlagsMeta[flagCode];
                          const isTriggeredActive = activeFlags.includes(flagCode);
                          return (
                            <span
                              key={flagCode}
                              title={`[${meta.code}] ${meta.label}\n• Mô tả: ${meta.description}\n• Hệ quả kiểm toán: ${meta.auditConsequence}\n• Căn cứ: ${meta.legalBasisSummary}`}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold cursor-help ${
                                isTriggeredActive
                                  ? 'bg-red-600 text-white border-red-700 shadow-2xs'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {isTriggeredActive ? (
                                <ShieldAlert className="w-3 h-3 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              )}
                              <span>{meta.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusCfg.className}`}
                      >
                        {status === 'PASSED' && <CheckCircle2 className="w-3 h-3" />}
                        {status === 'BLOCKED' && <Lock className="w-3 h-3" />}
                        {statusCfg.label}
                      </span>
                      {rec?.attached_files && rec.attached_files.length > 0 && (
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                          📎 {rec.attached_files.length} tệp đính kèm
                        </div>
                      )}
                    </td>

                    {/* Nút tải file / Thẩm định AI */}
                    <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStep(step.step_code);
                            onRunAiAuditForStep(step);
                          }}
                          disabled={auditingStepCode === step.step_code}
                          className="px-2.5 py-1.5 rounded-lg bg-[#152D42] hover:bg-[#1E3A54] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                          title="Chạy 3 Micro-Agents (Gatekeeper, LegalCrossCheck, AuditDeduction) thẩm định bước này"
                        >
                          {auditingStepCode === step.step_code ? (
                            <Loader2 className="w-3 h-3 animate-spin text-[#E9C96D]" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-[#E9C96D]" />
                          )}
                          <span>Thẩm định AI</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStep(step.step_code);
                          }}
                          className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:border-[#C6A342] text-stone-700 dark:text-stone-300 cursor-pointer"
                          title="Mở Dual-Drawer Inspector để tải hồ sơ & đối chiếu điều khoản ĐẠI SƠN LEGAL"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
