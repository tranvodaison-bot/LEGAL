import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Copy, Check, X, Database, Download, Calendar, ShieldCheck, FileCheck2 } from 'lucide-react';
import {
  AttachedStepFile,
  AuditPhaseCode,
  ComplianceAuditTrailEntry,
  ComplianceGateCode,
  MasterComplianceStep,
  ProjectStepRecord,
  ProjectStepStatus,
  StandardizedRiskFlagCode,
} from '../types/compliance';
import { LegalDocument } from '../types/legal';
import {
  AUDIT_PHASES,
  COMPLIANCE_GATES,
  DOSSIER_GROUPS_32,
  INITIAL_PROJECT_STEP_RECORDS,
  MASTER_COMPLIANCE_STEPS,
  STAGE_GATE_POSTGRES_DDL_TEXT,
  STANDARDIZED_RISK_FLAGS,
  evaluateMultiAgentCompliance,
} from '../data/stageGateCorpus';
import { StageGateNavigator } from './StageGateNavigator';
import { ComplianceTable } from './ComplianceTable';
import { DualDrawerInspector } from './DualDrawerInspector';
import { GlobalAuditDashboard } from './GlobalAuditDashboard';
import { EvidenceBasedReportModal } from './EvidenceBasedReportModal';
import { resolveDocumentAtDate } from '../utils/pointInTimeResolver';
import { McpSessionAuditRecord } from '../types/legal';

interface StageGateAuditViewProps {
  documents: LegalDocument[];
  mcpAuditRecords?: McpSessionAuditRecord[];
  onOpenInThreeColumnLibrary: (docId: string, articleId?: string) => void;
  onOpenReaderModal: (docId: string, articleId?: string) => void;
  onAskAquaWithContext: (question: string, clauseContext: string) => void;
  onSyncAuditToGlobalSummary?: (
    step: MasterComplianceStep,
    summaryText: string
  ) => void;
}

const STORAGE_KEYS = {
  STEP_RECORDS: 'daison_stage_gate_records_v1',
  AUDIT_TRAILS: 'daison_stage_gate_trails_v1',
};

// Pre-built O(1) Master Step Lookup Map (replaces MASTER_COMPLIANCE_STEPS.find)
const MASTER_STEP_BY_CODE_MAP = new Map<string, MasterComplianceStep>(
  MASTER_COMPLIANCE_STEPS.map((s) => [s.step_code, s])
);

export const StageGateAuditView: React.FC<StageGateAuditViewProps> = ({
  documents,
  mcpAuditRecords = [],
  onOpenInThreeColumnLibrary,
  onOpenReaderModal,
  onAskAquaWithContext,
  onSyncAuditToGlobalSummary,
}) => {
  const [records, setRecords] = useState<Record<string, ProjectStepRecord>>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.STEP_RECORDS);
      return raw
        ? { ...INITIAL_PROJECT_STEP_RECORDS, ...(JSON.parse(raw) as Record<string, ProjectStepRecord>) }
        : INITIAL_PROJECT_STEP_RECORDS;
    } catch {
      return INITIAL_PROJECT_STEP_RECORDS;
    }
  });

  const [auditTrails, setAuditTrails] = useState<ComplianceAuditTrailEntry[]>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.AUDIT_TRAILS);
      if (raw) return JSON.parse(raw) as ComplianceAuditTrailEntry[];
    } catch {
      // ignore
    }
    return [
      {
        id: 1,
        project_id: 'proj-daison-2026-01',
        step_code: 'I.2.1',
        action: 'LEGAL_CROSSCHECK_FLAG_AUTHORITY',
        actor_id: 'LegalCrossCheckAgent',
        previous_state: { status: 'IN_REVIEW' },
        new_state: {
          status: 'FLAGGED',
          active_risk_flags: ['RISK_AUTHORITY_CAPITAL', 'RISK_CAPITAL_PLAN'],
        },
        created_at: '2026-10-25 10:40',
      },
      {
        id: 2,
        project_id: 'proj-daison-2026-01',
        step_code: 'I.5.1',
        action: 'GATEKEEPER_LOCK_PREREQUISITE_G2',
        actor_id: 'GatekeeperAgent',
        previous_state: { status: 'PENDING' },
        new_state: { status: 'BLOCKED' },
        created_at: '2026-11-01 08:00',
      },
      {
        id: 3,
        project_id: 'proj-daison-2026-01',
        step_code: 'II.11.1',
        action: 'AUDIT_DEDUCTION_OVERRUN_NO_ADDENDUM',
        actor_id: 'AuditDeductionAgent',
        previous_state: { status: 'IN_REVIEW' },
        new_state: {
          status: 'FLAGGED',
          active_risk_flags: ['RISK_CONTRACT_OVERRUN', 'RISK_NO_CONTRACT_ADDENDUM'],
        },
        created_at: '2026-11-06 17:00',
      },
    ];
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.STEP_RECORDS,
        JSON.stringify(records)
      );
    } catch {
      // ignore
    }
  }, [records]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.AUDIT_TRAILS,
        JSON.stringify(auditTrails)
      );
    } catch {
      // ignore
    }
  }, [auditTrails]);

  // Filter & Selection States
  const [selectedPhase, setSelectedPhase] = useState<AuditPhaseCode | 'ALL'>('ALL');
  const [selectedGate, setSelectedGate] = useState<ComplianceGateCode | 'ALL'>('ALL');
  const [selectedDossierGroup, setSelectedDossierGroup] = useState<string>('ALL');
  const [selectedGoverningBody, setSelectedGoverningBody] = useState<string>('ALL');
  const [selectedRiskFlag, setSelectedRiskFlag] = useState<
    StandardizedRiskFlagCode | 'ALL'
  >('ALL');
  const [mandatoryFilter, setMandatoryFilter] = useState<
    'ALL' | 'MANDATORY' | 'CONDITIONAL'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStepCode, setSelectedStepCode] = useState<string>('I.2.1');
  const [auditingStepCode, setAuditingStepCode] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [stepEventDate, setStepEventDate] = useState<string>('2026-06-15');
  const [projectInitiationDate, setProjectInitiationDate] = useState<string>('2025-11-15');
  const [showEvidenceReportModal, setShowEvidenceReportModal] = useState<boolean>(false);

  // Append an immutable entry to compliance_audit_trails
  const appendAuditTrail = (
    stepCode: string,
    action: string,
    actorId: string,
    prevState: Partial<ProjectStepRecord> | null,
    newState: Partial<ProjectStepRecord>
  ) => {
    setAuditTrails((prev) => [
      {
        id: Date.now(),
        project_id: 'proj-daison-2026-01',
        step_code: stepCode,
        action,
        actor_id: actorId,
        previous_state: prevState,
        new_state: newState,
        created_at: new Date().toLocaleString('vi-VN'),
      },
      ...prev,
    ]);
  };

  // Multi-Dimensional Filtered Steps
  const filteredSteps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MASTER_COMPLIANCE_STEPS.filter((step) => {
      if (selectedPhase !== 'ALL' && step.phase_code !== selectedPhase) return false;
      if (selectedGate !== 'ALL' && step.gate_code !== selectedGate) return false;
      if (
        selectedDossierGroup !== 'ALL' &&
        step.dossier_group !== selectedDossierGroup
      ) {
        return false;
      }
      if (
        selectedGoverningBody !== 'ALL' &&
        step.governing_body !== selectedGoverningBody &&
        step.inspection_body !== selectedGoverningBody
      ) {
        return false;
      }
      if (mandatoryFilter === 'MANDATORY' && !step.is_mandatory) return false;
      if (mandatoryFilter === 'CONDITIONAL' && step.is_mandatory) return false;

      if (selectedRiskFlag !== 'ALL') {
        const recFlags = records[step.step_code]?.active_risk_flags || [];
        if (
          !step.risk_flags.includes(selectedRiskFlag) &&
          !recFlags.includes(selectedRiskFlag)
        ) {
          return false;
        }
      }

      if (!q) return true;
      return (
        step.step_code.toLowerCase().includes(q) ||
        step.step_name.toLowerCase().includes(q) ||
        step.dossier_group.toLowerCase().includes(q) ||
        step.gate_code.toLowerCase().includes(q)
      );
    });
  }, [
    selectedPhase,
    selectedGate,
    selectedDossierGroup,
    selectedGoverningBody,
    selectedRiskFlag,
    mandatoryFilter,
    searchQuery,
    records,
  ]);

  const activeStep = useMemo(
    () =>
      MASTER_STEP_BY_CODE_MAP.get(selectedStepCode) ||
      filteredSteps[0] ||
      MASTER_COMPLIANCE_STEPS[0],
    [selectedStepCode, filteredSteps]
  );

  const activeRecord: ProjectStepRecord = useMemo(() => {
    return (
      records[activeStep.step_code] || {
        id: `psr-${activeStep.step_code}`,
        project_id: 'proj-daison-2026-01',
        step_code: activeStep.step_code,
        status: 'PENDING',
        attached_files: [],
        active_risk_flags: [],
        completed_deliverables: [],
        ai_audit_verdict: null,
        audited_by: 'Chưa thẩm định',
        notes: '',
        updated_at: new Date().toLocaleString('vi-VN'),
      }
    );
  }, [records, activeStep]);

  const activeVerdict = useMemo(
    () =>
      evaluateMultiAgentCompliance(
        activeStep,
        activeRecord,
        records,
        MASTER_COMPLIANCE_STEPS
      ),
    [activeStep, activeRecord, records]
  );

  // Handlers for DualDrawerInspector
  const handleToggleChecklistDeliverable = (
    stepCode: string,
    itemText: string
  ) => {
    setRecords((prev) => {
      const existing = prev[stepCode] || {
        ...activeRecord,
        step_code: stepCode,
      };
      const hasItem = existing.completed_deliverables.includes(itemText);
      const nextDeliverables = hasItem
        ? existing.completed_deliverables.filter((i) => i !== itemText)
        : [...existing.completed_deliverables, itemText];

      appendAuditTrail(
        stepCode,
        hasItem ? 'UNCHECK_DELIVERABLE' : 'CHECK_DELIVERABLE',
        'Ban QLDA ĐẠI SƠN',
        { completed_deliverables: existing.completed_deliverables },
        { completed_deliverables: nextDeliverables }
      );

      return {
        ...prev,
        [stepCode]: {
          ...existing,
          completed_deliverables: nextDeliverables,
          updated_at: new Date().toLocaleString('vi-VN'),
        },
      };
    });
  };

  const handleAttachFileWithOcr = useCallback(
    (stepCode: string, fileInfo: AttachedStepFile) => {
      const stepObj = MASTER_STEP_BY_CODE_MAP.get(stepCode);
      if (!stepObj) return;

    setRecords((prev) => {
      const existing = prev[stepCode] || {
        ...activeRecord,
        step_code: stepCode,
      };
      const updatedFiles = [fileInfo, ...existing.attached_files];
      const tempRecord: ProjectStepRecord = {
        ...existing,
        attached_files: updatedFiles,
      };

      const verdict = evaluateMultiAgentCompliance(
        stepObj,
        tempRecord,
        prev,
        MASTER_COMPLIANCE_STEPS
      );

      const triggeredFlags = Array.from(
        new Set([
          ...verdict.legalCrossCheck.triggeredFlags,
          ...verdict.auditDeduction.triggeredFlags,
        ])
      );

      const nextStatus: ProjectStepStatus =
        triggeredFlags.length > 0
          ? 'FLAGGED'
          : !verdict.gatekeeper.passed
          ? 'BLOCKED'
          : 'PASSED';

      appendAuditTrail(
        stepCode,
        triggeredFlags.length > 0
          ? `OCR_UPLOAD_FLAGGED_${triggeredFlags.join('_')}`
          : 'OCR_UPLOAD_VERIFIED_PASSED',
        'LegalCrossCheck & AuditDeduction Agent',
        { status: existing.status, active_risk_flags: existing.active_risk_flags },
        { status: nextStatus, active_risk_flags: triggeredFlags }
      );

      return {
        ...prev,
        [stepCode]: {
          ...tempRecord,
          status: nextStatus,
          active_risk_flags: triggeredFlags,
          ai_audit_verdict: verdict,
          audited_by: 'Multi-Agent OCR Engine',
          updated_at: new Date().toLocaleString('vi-VN'),
        },
      };
    });
  },
  [activeRecord]
);

  const handleUpdateStepStatus = useCallback(
    (stepCode: string, nextStatus: ProjectStepStatus) => {
      const stepObj = MASTER_STEP_BY_CODE_MAP.get(stepCode);
      if (!stepObj) return;

      setRecords((prev) => {
        const existing = prev[stepCode] || {
          ...activeRecord,
          step_code: stepCode,
        };

        const verdict = evaluateMultiAgentCompliance(
          stepObj,
          existing,
          prev,
          MASTER_COMPLIANCE_STEPS
        );

        // GatekeeperAgent strictly blocks PASSED if prerequisite gates are not PASSED
        if (nextStatus === 'PASSED' && !verdict.gatekeeper.passed) {
          appendAuditTrail(
            stepCode,
            `GATEKEEPER_BLOCKED_PASSED_BY_${verdict.gatekeeper.blockedByGates.join('_')}`,
            'GatekeeperAgent',
            { status: existing.status },
            { status: 'BLOCKED' }
          );
          return {
            ...prev,
            [stepCode]: {
              ...existing,
              status: 'BLOCKED',
              ai_audit_verdict: verdict,
              updated_at: new Date().toLocaleString('vi-VN'),
            },
          };
        }

        // BL-4.1 & TC-P1-06: Bắt buộc có hồ sơ chứng cứ đã xác thực SHA-256 (64 hex) trước khi cho phép mở khóa PASSED trên cổng bắt buộc
        const hasVerifiedSha256Evidence = existing.attached_files.some((f) => {
          const fileHash = f.sha256_hash || f.hash;
          return typeof fileHash === 'string' && /^[a-f0-9]{64}$/i.test(fileHash);
        });
        if (nextStatus === 'PASSED' && stepObj.is_mandatory && !hasVerifiedSha256Evidence) {
          appendAuditTrail(
            stepCode,
            'GATEKEEPER_LOCKED_MISSING_SHA256_EVIDENCE',
            'GatekeeperAgent',
            { status: existing.status },
            { status: 'BLOCKED' }
          );
          return {
            ...prev,
            [stepCode]: {
              ...existing,
              status: 'BLOCKED',
              notes:
                'LOCKED (BL-4.1): Cổng kiểm soát bắt buộc chưa có tệp hồ sơ chứng cứ đính kèm có mã băm SHA-256 xác thực.',
              ai_audit_verdict: verdict,
              updated_at: new Date().toLocaleString('vi-VN'),
            },
          };
        }

        const clearedFlags =
          nextStatus === 'PASSED' ? [] : existing.active_risk_flags;

        appendAuditTrail(
          stepCode,
          `STATUS_CHANGE_TO_${nextStatus}`,
          'Ban QLDA ĐẠI SƠN',
          { status: existing.status },
          { status: nextStatus }
        );

        return {
          ...prev,
          [stepCode]: {
            ...existing,
            status: nextStatus,
            active_risk_flags: clearedFlags,
            updated_at: new Date().toLocaleString('vi-VN'),
          },
        };
      });
    },
    [activeRecord]
  );

  const handleRunAiMultiAgentAudit = async (step: MasterComplianceStep) => {
    setAuditingStepCode(step.step_code);
    const currentRec = records[step.step_code] || activeRecord;
    const deterministicVerdict = evaluateMultiAgentCompliance(
      step,
      currentRec,
      records,
      MASTER_COMPLIANCE_STEPS
    );

    try {
      const latestFile = currentRec.attached_files[0];
      const response = await fetch('/api/stage-gate-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepCode: step.step_code,
          gateCode: step.gate_code,
          stepName: step.step_name,
          governingBody: step.governing_body,
          inspectionBody: step.inspection_body,
          attachedAuthority: latestFile?.extracted_authority,
          hasOverrun: deterministicVerdict.auditDeduction.overrunDetected,
          hasAddendum: deterministicVerdict.auditDeduction.addendumVerified,
          blockedByGates: deterministicVerdict.gatekeeper.blockedByGates,
          legalReferences: step.legal_references,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const isAiSuccess = Boolean(response.ok && data?.executiveSummary);
      const summaryText = isAiSuccess
        ? String(data.executiveSummary)
        : `[Đối soát Tất định Nội bộ — Offline/Không dùng AI]\n1. GatekeeperAgent: ${deterministicVerdict.gatekeeper.message}\n2. LegalCrossCheckAgent: ${deterministicVerdict.legalCrossCheck.message}\n3. AuditDeductionAgent: ${deterministicVerdict.auditDeduction.message}`;

      const fullVerdict = {
        ...deterministicVerdict,
        geminiExecutiveSummary: summaryText,
      };

      setRecords((prev) => ({
        ...prev,
        [step.step_code]: {
          ...currentRec,
          ai_audit_verdict: fullVerdict,
          audited_by: isAiSuccess
            ? 'Gemini 3.8 Multi-Agent MCP'
            : '[Đối soát Tất định Nội bộ — Offline/Không dùng AI]',
          updated_at: new Date().toLocaleString('vi-VN'),
        },
      }));

      appendAuditTrail(
        step.step_code,
        isAiSuccess ? 'AI_MULTI_AGENT_MCP_AUDIT' : 'DETERMINISTIC_OFFLINE_AUDIT',
        isAiSuccess ? 'Gemini 3.8 Multi-Agent' : 'DeterministicAuditEngine',
        { status: currentRec.status },
        { status: currentRec.status }
      );

      if (onSyncAuditToGlobalSummary) {
        onSyncAuditToGlobalSummary(step, summaryText);
      }
    } catch {
      const fallbackSummary = `[Đối soát Tất định Nội bộ — Offline/Không dùng AI]\n1. GatekeeperAgent: ${deterministicVerdict.gatekeeper.message}\n2. LegalCrossCheckAgent: ${deterministicVerdict.legalCrossCheck.message}\n3. AuditDeductionAgent: ${deterministicVerdict.auditDeduction.message}`;
      setRecords((prev) => ({
        ...prev,
        [step.step_code]: {
          ...currentRec,
          ai_audit_verdict: {
            ...deterministicVerdict,
            geminiExecutiveSummary: fallbackSummary,
          },
          audited_by: '[Đối soát Tất định Nội bộ — Offline/Không dùng AI]',
          updated_at: new Date().toLocaleString('vi-VN'),
        },
      }));
    } finally {
      setAuditingStepCode(null);
    }
  };

  const activeStepPitCheck = useMemo(() => {
    const primaryRef = activeStep.legal_references[0];
    if (!primaryRef || documents.length === 0) return null;
    try {
      return resolveDocumentAtDate(
        primaryRef.docId || primaryRef.docNumber,
        stepEventDate,
        documents,
        projectInitiationDate
      );
    } catch {
      return null;
    }
  }, [activeStep, stepEventDate, projectInitiationDate, documents]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FBF9F5] dark:bg-[#141413] text-[#1C1917] dark:text-[#F5F2EB] p-4 sm:p-6">
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* BL-4.1: CaseFactTimeline & Point-in-Time Legal Resolver Bar for Stage-Gate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1B18] border-2 border-[#C6A342]/70 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#152D42] text-[#E9C96D] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Case Fact Timeline · Kiểm Soát Hiệu Lực Point-in-Time & SHA-256 Gate</span>
              </span>
              {activeStepPitCheck && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 text-emerald-900 dark:text-emerald-200 font-mono-code text-[11px] font-bold">
                  Luật áp dụng tại {stepEventDate}: {activeStepPitCheck.applicable_law_doc_number} ({activeStepPitCheck.status_at_date})
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {activeStepPitCheck
                ? activeStepPitCheck.explanation
                : 'Chọn mốc ngày thực hiện thủ tục (event_date) để tự động đối chiếu quy phạm có hiệu lực và điều khoản chuyển tiếp.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <label className="flex items-center gap-1.5 font-semibold text-stone-700 dark:text-stone-300">
              <span>Mốc phê duyệt dự án:</span>
              <input
                type="date"
                value={projectInitiationDate}
                onChange={(e) => setProjectInitiationDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-900 font-mono-code text-xs"
              />
            </label>
            <label className="flex items-center gap-1.5 font-semibold text-stone-700 dark:text-stone-300">
              <span>Ngày thực hiện bước ({activeStep.step_code}):</span>
              <input
                type="date"
                value={stepEventDate}
                onChange={(e) => setStepEventDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-900 font-mono-code text-xs"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowEvidenceReportModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#152D42] hover:bg-[#1E3F5A] text-[#E9C96D] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Xuất Báo Cáo Có Dẫn Chứng (A4/JSON)</span>
            </button>
          </div>
        </div>
        {/* 0. GlobalAuditDashboard (Recharts Top 5 Legal Risks Bar Chart & Lifecycle Compliance Progression Line Chart) */}
        <GlobalAuditDashboard
          records={records}
          steps={MASTER_COMPLIANCE_STEPS}
          riskFlagsMeta={STANDARDIZED_RISK_FLAGS}
          mcpAuditRecords={mcpAuditRecords}
          selectedRiskFlag={selectedRiskFlag}
          onSelectRiskFlag={(flag) => setSelectedRiskFlag(flag)}
          onSelectPhase={(ph) => {
            setSelectedPhase(ph);
            setSelectedGate('ALL');
          }}
          onSelectGate={(gt) => setSelectedGate(gt)}
        />

        {/* 1. StageGateNavigator (17 Gates G0-G16 across 3 Phases) */}
        <StageGateNavigator
          phases={AUDIT_PHASES}
          gates={COMPLIANCE_GATES}
          steps={MASTER_COMPLIANCE_STEPS}
          records={records}
          selectedPhase={selectedPhase}
          selectedGate={selectedGate}
          onSelectPhase={(ph) => {
            setSelectedPhase(ph);
            setSelectedGate('ALL');
          }}
          onSelectGate={(gt) => setSelectedGate(gt)}
          onOpenSqlSchemaModal={() => setShowSqlModal(true)}
        />

        {/* 2. ComplianceTable (Standardized Master Steps + 5-Dimensional Filter + 18 Risk Flags) */}
        <ComplianceTable
          steps={filteredSteps}
          records={records}
          riskFlagsMeta={STANDARDIZED_RISK_FLAGS}
          dossierGroups={DOSSIER_GROUPS_32}
          selectedStepCode={activeStep.step_code}
          selectedPhase={selectedPhase}
          selectedGate={selectedGate}
          selectedDossierGroup={selectedDossierGroup}
          selectedGoverningBody={selectedGoverningBody}
          selectedRiskFlag={selectedRiskFlag}
          mandatoryFilter={mandatoryFilter}
          searchQuery={searchQuery}
          auditingStepCode={auditingStepCode}
          onSelectStep={(code) => setSelectedStepCode(code)}
          onChangeDossierGroup={setSelectedDossierGroup}
          onChangeGoverningBody={setSelectedGoverningBody}
          onChangeRiskFlag={setSelectedRiskFlag}
          onChangeMandatoryFilter={setMandatoryFilter}
          onChangeSearchQuery={setSearchQuery}
          onResetFilters={() => {
            setSelectedPhase('ALL');
            setSelectedGate('ALL');
            setSelectedDossierGroup('ALL');
            setSelectedGoverningBody('ALL');
            setSelectedRiskFlag('ALL');
            setMandatoryFilter('ALL');
            setSearchQuery('');
          }}
          onRunAiAuditForStep={handleRunAiMultiAgentAudit}
        />

        {/* 3. DualDrawerInspector (Left: Deliverables/OCR/3-Agents | Right: LexViet Legal Clause Cross-Check) */}
        <DualDrawerInspector
          step={activeStep}
          record={activeRecord}
          verdict={activeVerdict}
          riskFlagsMeta={STANDARDIZED_RISK_FLAGS}
          documents={documents}
          auditTrails={auditTrails}
          isAiAuditing={auditingStepCode === activeStep.step_code}
          onToggleChecklistDeliverable={handleToggleChecklistDeliverable}
          onAttachFileWithOcr={handleAttachFileWithOcr}
          onUpdateStepStatus={handleUpdateStepStatus}
          onRunAiMultiAgentAudit={handleRunAiMultiAgentAudit}
          onOpenInThreeColumnLibrary={onOpenInThreeColumnLibrary}
          onOpenReaderModal={onOpenReaderModal}
          onAskAquaWithContext={onAskAquaWithContext}
        />
      </div>

      {/* PostgreSQL DDL & RLS Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-[#C6A342] max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 bg-[#152D42] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#E9C96D]" />
                <strong className="text-sm">
                  PostgreSQL Schema DDL (RLS & Immutable Audit Trail) · stage_gate_compliance_schema.sql
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(STAGE_GATE_POSTGRES_DDL_TEXT);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-[#C6A342] text-[#152D42] text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã sao chép SQL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép DDL</span>
                    </>
                  )}
                </button>
                <a
                  href="/sql/stage_gate_compliance_schema.sql"
                  download="stage_gate_compliance_schema.sql"
                  className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file .SQL</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="p-1 hover:bg-white/10 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <pre className="p-5 text-xs font-mono-code overflow-y-auto bg-[#141413] text-emerald-300 leading-relaxed flex-1">
              {STAGE_GATE_POSTGRES_DDL_TEXT}
            </pre>
          </div>
        </div>
      )}
      <EvidenceBasedReportModal
        isOpen={showEvidenceReportModal}
        onClose={() => setShowEvidenceReportModal(false)}
        asOfDate={stepEventDate}
        documents={documents}
        auditRecords={mcpAuditRecords}
      />
    </div>
  );
};
