import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  FolderKanban,
  Layers,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import {
  AuditPhaseCode,
  ComplianceGateCode,
  MasterComplianceStep,
  ProjectStepRecord,
  RiskFlagMetadata,
  StandardizedRiskFlagCode,
} from '../types/compliance';
import { McpSessionAuditRecord } from '../types/legal';
import {
  COMPLIANCE_GATES,
  INITIAL_PROJECT_STEP_RECORDS,
  MASTER_COMPLIANCE_STEPS,
  STANDARDIZED_RISK_FLAGS,
} from '../data/stageGateCorpus';

export interface PortfolioProjectSummary {
  id: string;
  code: string;
  name: string;
  investor: string;
  capitalGroup: 'Nhóm A' | 'Nhóm B' | 'Trọng điểm';
  totalInvestmentBillionVnd: number;
  currentLifecycleStage: 'Quy hoạch' | 'Chuẩn bị đầu tư' | 'Thực thi' | 'Quyết toán';
  currentGate: ComplianceGateCode;
  stepRecords: Record<string, ProjectStepRecord>;
}

// Baseline multi-project portfolio datasets to aggregate alongside the live active project
const PORTFOLIO_BASELINE_PROJECTS: Omit<
  PortfolioProjectSummary,
  'stepRecords'
>[] = [
  {
    id: 'proj-daison-2026-01',
    code: 'DA-01',
    name: 'Khu Đô thị & Trung tâm Dữ liệu ĐẠI SƠN (Dự án Đang Thẩm tra)',
    investor: 'Ban QLDA Đầu tư Xây dựng ĐẠI SƠN',
    capitalGroup: 'Nhóm A',
    totalInvestmentBillionVnd: 2450,
    currentLifecycleStage: 'Thực thi',
    currentGate: 'G11',
  },
  {
    id: 'proj-daison-2026-02',
    code: 'DA-02',
    name: 'Tuyến Giao thông Kết nối Liên cảng & Hạ tầng Kỹ thuật',
    investor: 'Ban QLDA Giao thông Vùng Trọng điểm',
    capitalGroup: 'Nhóm A',
    totalInvestmentBillionVnd: 4820,
    currentLifecycleStage: 'Thực thi',
    currentGate: 'G12',
  },
  {
    id: 'proj-daison-2026-03',
    code: 'DA-03',
    name: 'Tổ hợp Bệnh viện Đa khoa & Trung tâm Y tế Kỹ thuật cao',
    investor: 'Ban QLDA Công trình Dân dụng & Công nghiệp',
    capitalGroup: 'Nhóm B',
    totalInvestmentBillionVnd: 1680,
    currentLifecycleStage: 'Chuẩn bị đầu tư',
    currentGate: 'G5',
  },
  {
    id: 'proj-daison-2026-04',
    code: 'DA-04',
    name: 'Trung tâm Điều hành Đô thị Thông minh (IOC) & Chính quyền số',
    investor: 'Sở Thông tin & Truyền thông / Ban QLDA Số',
    capitalGroup: 'Nhóm B',
    totalInvestmentBillionVnd: 890,
    currentLifecycleStage: 'Quyết toán',
    currentGate: 'G15',
  },
];

// Deterministic synthetic records for secondary portfolio projects (DA-02, DA-03, DA-04)
function buildPortfolioProjects(
  liveRecords: Record<string, ProjectStepRecord>
): PortfolioProjectSummary[] {
  const cloneWithOverrides = (
    projectId: string,
    overrides: Record<
      string,
      {
        status: ProjectStepRecord['status'];
        flags: StandardizedRiskFlagCode[];
      }
    >
  ): Record<string, ProjectStepRecord> => {
    const map: Record<string, ProjectStepRecord> = {};
    MASTER_COMPLIANCE_STEPS.forEach((step) => {
      const base = liveRecords[step.step_code] || INITIAL_PROJECT_STEP_RECORDS[step.step_code];
      const ov = overrides[step.step_code];
      map[step.step_code] = {
        id: `${projectId}-${step.step_code}`,
        project_id: projectId,
        step_code: step.step_code,
        status: ov ? ov.status : base?.status || 'PASSED',
        attached_files: base?.attached_files || [],
        active_risk_flags: ov ? ov.flags : base?.active_risk_flags || [],
        completed_deliverables: base?.completed_deliverables || [],
        ai_audit_verdict: null,
        audited_by: 'Hệ thống Multi-Agent MCP',
        notes: '',
        updated_at: '2026-11-08 09:00',
      };
    });
    return map;
  };

  const da02Records = cloneWithOverrides('proj-daison-2026-02', {
    'I.1': { status: 'PASSED', flags: [] },
    'I.2.1': { status: 'PASSED', flags: [] },
    'I.2.2': { status: 'PASSED', flags: [] },
    'I.3.1': { status: 'PASSED', flags: [] },
    'I.4.1': { status: 'PASSED', flags: [] },
    'I.5.1': { status: 'PASSED', flags: [] },
    'II.8.1': {
      status: 'FLAGGED',
      flags: ['RISK_SITE_HANDOVER_DELAY', 'RISK_PLANNING'],
    },
    'II.10.1': {
      status: 'FLAGGED',
      flags: ['RISK_BIDDING_PROCEDURE', 'RISK_AUTHORITY_CAPITAL'],
    },
    'II.11.1': {
      status: 'FLAGGED',
      flags: ['RISK_CONTRACT_OVERRUN', 'RISK_NO_CONTRACT_ADDENDUM'],
    },
    'II.12.1': {
      status: 'FLAGGED',
      flags: ['RISK_VOLUME_UNIT_PRICE', 'RISK_MATERIAL_CERT'],
    },
  });

  const da03Records = cloneWithOverrides('proj-daison-2026-03', {
    'I.1': { status: 'FLAGGED', flags: ['RISK_PLANNING'] },
    'I.2.1': {
      status: 'FLAGGED',
      flags: ['RISK_AUTHORITY_CAPITAL', 'RISK_CAPITAL_PLAN'],
    },
    'I.3.1': {
      status: 'FLAGGED',
      flags: ['RISK_FIRE_SAFETY', 'RISK_ENV_PROCEDURE'],
    },
    'I.4.1': {
      status: 'FLAGGED',
      flags: ['RISK_DESIGN_ESTIMATE_ADJUST', 'RISK_FIRE_SAFETY'],
    },
    'I.5.1': {
      status: 'BLOCKED',
      flags: ['RISK_AUTHORITY_CAPITAL', 'RISK_MISSING_DOCS_ORDER'],
    },
    'II.11.1': {
      status: 'PENDING',
      flags: ['RISK_NO_CONTRACT_ADDENDUM'],
    },
  });

  const da04Records = cloneWithOverrides('proj-daison-2026-04', {
    'I.1': { status: 'PASSED', flags: [] },
    'I.2.1': { status: 'PASSED', flags: [] },
    'I.2.2': { status: 'PASSED', flags: [] },
    'I.3.1': { status: 'PASSED', flags: [] },
    'I.4.1': { status: 'PASSED', flags: [] },
    'I.5.1': { status: 'PASSED', flags: [] },
    'II.6.1': { status: 'PASSED', flags: [] },
    'II.7.1': { status: 'PASSED', flags: [] },
    'II.8.1': { status: 'PASSED', flags: [] },
    'II.9.1': { status: 'PASSED', flags: [] },
    'II.10.1': { status: 'PASSED', flags: [] },
    'II.11.1': {
      status: 'FLAGGED',
      flags: ['RISK_CONTRACT_OVERRUN', 'RISK_NO_CONTRACT_ADDENDUM'],
    },
    'III.15.1': {
      status: 'FLAGGED',
      flags: ['RISK_SETTLEMENT_DOCS', 'RISK_PAYMENT_DOCS'],
    },
  });

  return [
    { ...PORTFOLIO_BASELINE_PROJECTS[0], stepRecords: liveRecords },
    { ...PORTFOLIO_BASELINE_PROJECTS[1], stepRecords: da02Records },
    { ...PORTFOLIO_BASELINE_PROJECTS[2], stepRecords: da03Records },
    { ...PORTFOLIO_BASELINE_PROJECTS[3], stepRecords: da04Records },
  ];
}

interface GlobalAuditDashboardProps {
  records?: Record<string, ProjectStepRecord>;
  steps?: MasterComplianceStep[];
  riskFlagsMeta?:
    | Record<StandardizedRiskFlagCode, RiskFlagMetadata>
    | RiskFlagMetadata[];
  mcpAuditRecords?: McpSessionAuditRecord[];
  selectedRiskFlag?: StandardizedRiskFlagCode | 'ALL';
  onSelectRiskFlag?: (flag: StandardizedRiskFlagCode | 'ALL') => void;
  onSelectPhase?: (phase: AuditPhaseCode | 'ALL') => void;
  onSelectGate?: (gate: ComplianceGateCode | 'ALL') => void;
  compactMode?: boolean;
}

export const GlobalAuditDashboard: React.FC<GlobalAuditDashboardProps> = React.memo(({
  records = INITIAL_PROJECT_STEP_RECORDS,
  steps = MASTER_COMPLIANCE_STEPS,
  riskFlagsMeta = STANDARDIZED_RISK_FLAGS,
  mcpAuditRecords = [],
  selectedRiskFlag = 'ALL',
  onSelectRiskFlag,
  onSelectPhase,
  onSelectGate,
  compactMode = false,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [progressionAxisMode, setProgressionAxisMode] = useState<
    'wbs_4_stages' | 'gates_17'
  >('wbs_4_stages');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const portfolioProjects = useMemo(
    () => buildPortfolioProjects(records),
    [records]
  );

  const activeProjects = useMemo(() => {
    if (selectedProjectId === 'ALL') return portfolioProjects;
    return portfolioProjects.filter((p) => p.id === selectedProjectId);
  }, [portfolioProjects, selectedProjectId]);

  const normalizedRiskMetaList = useMemo((): RiskFlagMetadata[] => {
    if (Array.isArray(riskFlagsMeta)) return riskFlagsMeta;
    return Object.values(riskFlagsMeta);
  }, [riskFlagsMeta]);

  const riskMetaMap = useMemo(() => {
    const map = new Map<StandardizedRiskFlagCode, RiskFlagMetadata>();
    normalizedRiskMetaList.forEach((m) => map.set(m.code, m));
    return map;
  }, [normalizedRiskMetaList]);

  // 1. Aggregate Top 5 Legal Risks across all active projects + MCP session audits
  const top5LegalRisksData = useMemo(() => {
    const counts = new Map<
      StandardizedRiskFlagCode,
      {
        count: number;
        projectsSet: Set<string>;
        stepsSet: Set<string>;
      }
    >();

    normalizedRiskMetaList.forEach((rf) => {
      counts.set(rf.code, {
        count: 0,
        projectsSet: new Set(),
        stepsSet: new Set(),
      });
    });

    activeProjects.forEach((proj) => {
      steps.forEach((step) => {
        const rec = proj.stepRecords[step.step_code];
        const status = rec?.status || 'PENDING';
        const activeFlags = rec?.active_risk_flags || [];

        // Count active risk flags on flagged/blocked steps + inherent high-risk exposure on pending steps
        if (activeFlags.length > 0) {
          activeFlags.forEach((flagCode) => {
            const entry = counts.get(flagCode);
            if (entry) {
              entry.count += status === 'FLAGGED' || status === 'BLOCKED' ? 2 : 1;
              entry.projectsSet.add(proj.code);
              entry.stepsSet.add(step.step_code);
            }
          });
        } else if (status === 'FLAGGED' || status === 'BLOCKED') {
          step.risk_flags.forEach((flagCode) => {
            const entry = counts.get(flagCode);
            if (entry) {
              entry.count += 1;
              entry.projectsSet.add(proj.code);
              entry.stepsSet.add(step.step_code);
            }
          });
        }
      });
    });

    // Also incorporate unresolved Rất cao/Cao risk items from session MCP audits
    mcpAuditRecords.forEach((mcpRec) => {
      const unresolvedCount = mcpRec.checklistItems.filter(
        (item) =>
          !item.checked &&
          (item.riskLevel === 'Rất cao' || item.riskLevel === 'Cao')
      ).length;
      if (unresolvedCount > 0) {
        if (mcpRec.projectStage === 'Quy hoạch') {
          const entry = counts.get('RISK_PLANNING');
          if (entry) entry.count += unresolvedCount;
        } else if (mcpRec.projectStage === 'Chuẩn bị đầu tư') {
          const entry = counts.get('RISK_AUTHORITY_CAPITAL');
          if (entry) entry.count += unresolvedCount;
        } else if (mcpRec.projectStage === 'Thực thi') {
          const entry = counts.get('RISK_NO_CONTRACT_ADDENDUM');
          if (entry) entry.count += unresolvedCount;
        } else if (mcpRec.projectStage === 'Quyết toán') {
          const entry = counts.get('RISK_SETTLEMENT_DOCS');
          if (entry) entry.count += unresolvedCount;
        }
      }
    });

    const ranked = Array.from(counts.entries())
      .map(([code, stat]) => {
        const meta = riskMetaMap.get(code)!;
        const fillHex =
          meta.severity === 'CRITICAL'
            ? '#DC2626'
            : meta.severity === 'HIGH'
            ? '#D97706'
            : '#2563EB';
        return {
          code,
          shortCode: code.replace('RISK_', ''),
          label: meta.label,
          displayLabel: `${meta.label}`,
          severity: meta.severity,
          count: stat.count,
          projectCount: stat.projectsSet.size,
          projectsList: Array.from(stat.projectsSet).join(', ') || 'DA-01',
          stepCount: stat.stepsSet.size,
          legalBasis: meta.legalBasisSummary,
          consequence: meta.auditConsequence,
          fillHex,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return ranked;
  }, [activeProjects, steps, normalizedRiskMetaList, riskMetaMap, mcpAuditRecords]);

  // Pre-group steps by gate_code in O(S) for O(1) lookup per gate
  const stepsByGateMap = useMemo(() => {
    const map = new Map<ComplianceGateCode, MasterComplianceStep[]>();
    steps.forEach((step) => {
      let bucket = map.get(step.gate_code);
      if (!bucket) {
        bucket = [];
        map.set(step.gate_code, bucket);
      }
      bucket.push(step);
    });
    return map;
  }, [steps]);

  // 2. Compute Compliance Progression over the Project Lifecycle Stages (WBS 4 Stages & 17 Stage-Gates)
  const lifecycleProgressionData = useMemo(() => {
    if (progressionAxisMode === 'wbs_4_stages') {
      const stagesConfig: Array<{
        stageName: string;
        shortStage: string;
        phaseCode: AuditPhaseCode;
        gates: ComplianceGateCode[];
        targetRate: number;
      }> = [
        {
          stageName: '1. Quy hoạch (G0–G1)',
          shortStage: 'Quy hoạch',
          phaseCode: 'PHASE_I',
          gates: ['G0', 'G1'],
          targetRate: 95,
        },
        {
          stageName: '2. Chuẩn bị đầu tư (G2–G5)',
          shortStage: 'Chuẩn bị ĐT',
          phaseCode: 'PHASE_I',
          gates: ['G2', 'G3', 'G4', 'G5'],
          targetRate: 90,
        },
        {
          stageName: '3. Thực thi & Thi công (G6–G13)',
          shortStage: 'Thực thi',
          phaseCode: 'PHASE_II',
          gates: ['G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12', 'G13'],
          targetRate: 85,
        },
        {
          stageName: '4. Kết thúc & Quyết toán (G14–G16)',
          shortStage: 'Quyết toán',
          phaseCode: 'PHASE_III',
          gates: ['G14', 'G15', 'G16'],
          targetRate: 88,
        },
      ];

      return stagesConfig.map((cfg) => {
        const stageSteps = cfg.gates.flatMap(
          (gCode) => stepsByGateMap.get(gCode) || []
        );
        const totalEvaluated = Math.max(1, stageSteps.length * activeProjects.length);
        let passedWeight = 0;
        let flaggedCount = 0;

        activeProjects.forEach((proj) => {
          stageSteps.forEach((st) => {
            const rec = proj.stepRecords[st.step_code];
            const status = rec?.status || 'PENDING';
            if (status === 'PASSED' || status === 'WAIVED') {
              passedWeight += 1;
            } else if (status === 'IN_REVIEW') {
              passedWeight += 0.6;
            } else if (status === 'FLAGGED' || status === 'BLOCKED') {
              flaggedCount += 1;
            }
          });
        });

        const complianceRate = Math.round((passedWeight / totalEvaluated) * 100);
        const riskExposureRate = Math.round((flaggedCount / totalEvaluated) * 100);

        return {
          name: cfg.shortStage,
          fullName: cfg.stageName,
          phaseCode: cfg.phaseCode,
          gateCode: cfg.gates[0],
          complianceRate,
          targetRate: cfg.targetRate,
          riskExposureRate,
          totalSteps: stageSteps.length,
          flaggedCount,
        };
      });
    }

    // 17 Stage-Gates mode (G0 -> G16) via O(1) stepsByGateMap lookup
    return COMPLIANCE_GATES.map((gate) => {
      const gateSteps = stepsByGateMap.get(gate.gate_code) || [];
      const totalEvaluated = Math.max(1, gateSteps.length * activeProjects.length);
      let passedWeight = 0;
      let flaggedCount = 0;

      activeProjects.forEach((proj) => {
        gateSteps.forEach((st) => {
          const rec = proj.stepRecords[st.step_code];
          const status = rec?.status || 'PENDING';
          if (status === 'PASSED' || status === 'WAIVED') {
            passedWeight += 1;
          } else if (status === 'IN_REVIEW') {
            passedWeight += 0.6;
          } else if (status === 'FLAGGED' || status === 'BLOCKED') {
            flaggedCount += 1;
          }
        });
      });

      const complianceRate = Math.round((passedWeight / totalEvaluated) * 100);
      const riskExposureRate = Math.round((flaggedCount / totalEvaluated) * 100);

      return {
        name: gate.gate_code,
        fullName: gate.name,
        phaseCode: gate.phase_code,
        gateCode: gate.gate_code,
        complianceRate,
        targetRate: gate.phase_code === 'PHASE_I' ? 92 : gate.phase_code === 'PHASE_II' ? 85 : 88,
        riskExposureRate,
        totalSteps: gateSteps.length,
        flaggedCount,
      };
    });
  }, [progressionAxisMode, stepsByGateMap, activeProjects]);

  // Portfolio KPI summary metrics
  const kpiMetrics = useMemo(() => {
    let totalStepsEvaluated = 0;
    let passedSteps = 0;
    let flaggedOrBlockedSteps = 0;
    let totalRiskFlagInstances = 0;

    activeProjects.forEach((proj) => {
      steps.forEach((st) => {
        totalStepsEvaluated += 1;
        const rec = proj.stepRecords[st.step_code];
        const status = rec?.status || 'PENDING';
        if (status === 'PASSED' || status === 'WAIVED') passedSteps += 1;
        if (status === 'FLAGGED' || status === 'BLOCKED') flaggedOrBlockedSteps += 1;
        totalRiskFlagInstances += (rec?.active_risk_flags || []).length;
      });
    });

    const avgCompliance =
      totalStepsEvaluated > 0
        ? Math.round((passedSteps / totalStepsEvaluated) * 100)
        : 0;
    const totalCapital = activeProjects.reduce(
      (sum, p) => sum + p.totalInvestmentBillionVnd,
      0
    );

    return {
      projectCount: activeProjects.length,
      totalCapital,
      avgCompliance,
      flaggedOrBlockedSteps,
      totalRiskFlagInstances,
    };
  }, [activeProjects, steps]);

  return (
    <section className="rounded-2xl border border-stone-200 dark:border-[#2E2C28] bg-white dark:bg-[#1E1D1B] shadow-xs overflow-hidden">
      {/* Top Header Banner */}
      <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#152D42] via-[#1B3A54] to-[#234B6B] text-white border-b-2 border-[#C6A342] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C6A342]/20 border border-[#C6A342] flex items-center justify-center text-[#E9C96D] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                GLOBAL AUDIT DASHBOARD · ĐỐI SOÁT RỦI RO & TIẾN ĐỘ TUÂN THỦ DỰ ÁN
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#C6A342] text-[#152D42] text-[10px] font-bold">
                {kpiMetrics.projectCount} DỰ ÁN ·{' '}
                {kpiMetrics.totalCapital.toLocaleString('vi-VN')} TỶ VNĐ
              </span>
            </div>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Tổng hợp thời gian thực 18 Cờ rủi ro (Risk Flags) và Tiến độ tuân thủ Stage-Gate (G0–G16) từ Hệ thống Kiểm toán Multi-Agent MCP
            </p>
          </div>
        </div>

        {/* Project Selector & Collapse Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1">
            <FolderKanban className="w-3.5 h-3.5 text-[#E9C96D]" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="text-stone-900">
                Toàn bộ Danh mục ({portfolioProjects.length} Dự án Đầu tư)
              </option>
              {portfolioProjects.map((proj) => (
                <option key={proj.id} value={proj.id} className="text-stone-900">
                  {proj.code} · {proj.name} ({proj.totalInvestmentBillionVnd.toLocaleString('vi-VN')} tỷ)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer transition"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#E9C96D]" />
                <span>Mở biểu đồ</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#E9C96D]" />
                <span>Thu gọn</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* 4 Quick KPI Strip Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-[#2E2C28] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  TỶ LỆ TUÂN THỦ TRUNG BÌNH
                </div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {kpiMetrics.avgCompliance}%
                </div>
                <div className="text-[11px] text-stone-500">
                  Chuẩn kiểm toán SSoT: ≥ 88%
                </div>
              </div>
              <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-[#2E2C28] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  CỜ ĐỎ RỦI RO ĐANG KÍCH HOẠT
                </div>
                <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">
                  {kpiMetrics.totalRiskFlagInstances} cờ
                </div>
                <div className="text-[11px] text-stone-500">
                  Trên {kpiMetrics.flaggedOrBlockedSteps} bước bị gắn cờ / khóa
                </div>
              </div>
              <span className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-300 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-[#2E2C28] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  RỦI RO PHÁP LÝ HÀNG ĐẦU
                </div>
                <div className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 mt-0.5 truncate max-w-[180px]">
                  {top5LegalRisksData[0]?.label || 'Không có rủi ro'}
                </div>
                <div className="text-[11px] font-mono-code text-stone-500">
                  {top5LegalRisksData[0]?.code || 'ALL_CLEAR'} (
                  {top5LegalRisksData[0]?.count || 0} phát hiện)
                </div>
              </div>
              <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FBF9F5] dark:bg-[#141413] border border-stone-200 dark:border-[#2E2C28] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  TỔNG MỨC ĐẦU TƯ GIÁM SÁT
                </div>
                <div className="text-xl font-bold text-[#152D42] dark:text-[#E9C96D] mt-0.5">
                  {kpiMetrics.totalCapital.toLocaleString('vi-VN')} tỷ
                </div>
                <div className="text-[11px] text-stone-500">
                  {kpiMetrics.projectCount} dự án · 17 Stage-Gates
                </div>
              </div>
              <span className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* 2-Column Recharts Visual Analytics Grid */}
          <div
            className={`grid grid-cols-1 ${
              compactMode ? 'xl:grid-cols-1' : ' lg:grid-cols-2'
            } gap-5`}
          >
            {/* CHART 1: BAR CHART OF TOP 5 LEGAL RISKS */}
            <div className="p-4 rounded-2xl border border-stone-200 dark:border-[#2E2C28] bg-[#FBF9F5]/60 dark:bg-[#141413]/70 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 text-[10px] font-bold uppercase">
                      TOP 5 LEGAL RISKS
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#152D42] dark:text-stone-100">
                      Top 5 Rủi ro Pháp lý & Xuất toán Trọng yếu
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Nhấn trực tiếp vào cột rủi ro để lọc hồ sơ vi phạm tương ứng bên dưới
                  </p>
                </div>

                {selectedRiskFlag !== 'ALL' && onSelectRiskFlag && (
                  <button
                    onClick={() => onSelectRiskFlag('ALL')}
                    className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-[11px] font-semibold text-red-700 dark:text-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Filter className="w-3 h-3" />
                    <span>Bỏ lọc: {selectedRiskFlag}</span>
                  </button>
                )}
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={top5LegalRisksData}
                    layout="vertical"
                    margin={{ top: 6, right: 24, left: 8, bottom: 6 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="#D6D3D1"
                      opacity={0.5}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#78716C' }}
                      axisLine={{ stroke: '#D6D3D1' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="displayLabel"
                      width={155}
                      tick={{ fontSize: 11, fill: '#44403C', fontWeight: 600 }}
                      axisLine={{ stroke: '#D6D3D1' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(198, 163, 66, 0.12)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload as (typeof top5LegalRisksData)[number];
                        return (
                          <div className="max-w-xs p-3 rounded-xl bg-[#152D42] text-white border border-[#C6A342] shadow-xl text-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono-code font-bold text-[#E9C96D]">
                                {d.code}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-400/40 text-[10px] font-bold text-red-200">
                                {d.severity} · {d.count} phát hiện
                              </span>
                            </div>
                            <div className="font-bold text-white">{d.label}</div>
                            <div className="text-[11px] text-stone-300">
                              <b className="text-[#E9C96D]">Dự án ảnh hưởng:</b>{' '}
                              {d.projectsList} ({d.stepCount} bước Stage-Gate)
                            </div>
                            <div className="text-[11px] text-amber-200">
                              <b>Hệ quả kiểm toán:</b> {d.consequence}
                            </div>
                            <div className="text-[10px] text-stone-300 pt-1 border-t border-white/15">
                              Căn cứ: {d.legalBasis}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Số phát hiện rủi ro"
                      radius={[0, 6, 6, 0]}
                      barSize={24}
                      onClick={(barData) => {
                        const clickedCode = (
                          barData as unknown as {
                            payload?: { code?: StandardizedRiskFlagCode };
                            code?: StandardizedRiskFlagCode;
                          }
                        )?.payload?.code ||
                          (
                            barData as unknown as {
                              code?: StandardizedRiskFlagCode;
                            }
                          )?.code;
                        if (onSelectRiskFlag && clickedCode) {
                          onSelectRiskFlag(
                            selectedRiskFlag === clickedCode ? 'ALL' : clickedCode
                          );
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {top5LegalRisksData.map((entry) => {
                        const isSelected = selectedRiskFlag === entry.code;
                        return (
                          <Cell
                            key={entry.code}
                            fill={entry.fillHex}
                            stroke={isSelected ? '#152D42' : 'none'}
                            strokeWidth={isSelected ? 2 : 0}
                            fillOpacity={
                              selectedRiskFlag === 'ALL' || isSelected ? 0.92 : 0.4
                            }
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend & Interactive Quick Risk Pills */}
              <div className="mt-2 pt-2.5 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626]" />
                    Nghiêm trọng (Critical)
                  </span>
                  <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]" />
                    Cao (High)
                  </span>
                  <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
                    Trung bình (Medium)
                  </span>
                </div>
                <span className="text-[10px] font-mono-code text-stone-400">
                  Nguồn: Gatekeeper · LegalCrossCheck · AuditDeduction
                </span>
              </div>
            </div>

            {/* CHART 2: LINE CHART OF COMPLIANCE PROGRESSION OVER PROJECT LIFECYCLE STAGES */}
            <div className="p-4 rounded-2xl border border-stone-200 dark:border-[#2E2C28] bg-[#FBF9F5]/60 dark:bg-[#141413]/70 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase">
                      COMPLIANCE PROGRESSION
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#152D42] dark:text-stone-100">
                      Tiến độ Tuân thủ qua các Giai đoạn Vòng đời Dự án
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Đối sánh tỷ lệ hoàn thành hồ sơ pháp lý thực tế với ngưỡng chuẩn SSoT và tỷ lệ vướng cờ rủi ro
                  </p>
                </div>

                {/* Axis Granularity Toggle: 4 WBS Lifecycle Stages vs 17 Stage-Gates */}
                <div className="inline-flex rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1D1B] p-0.5 text-[11px]">
                  <button
                    onClick={() => setProgressionAxisMode('wbs_4_stages')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      progressionAxisMode === 'wbs_4_stages'
                        ? 'bg-[#152D42] text-[#E9C96D]'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    4 Giai đoạn WBS
                  </button>
                  <button
                    onClick={() => setProgressionAxisMode('gates_17')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      progressionAxisMode === 'gates_17'
                        ? 'bg-[#152D42] text-[#E9C96D]'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    17 Stage-Gates (G0–G16)
                  </button>
                </div>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lifecycleProgressionData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 6 }}
                    onClick={(chartState) => {
                      const activePayload = (
                        chartState as {
                          activePayload?: Array<{
                            payload?: (typeof lifecycleProgressionData)[number];
                          }>;
                        }
                      )?.activePayload;
                      const point = activePayload?.[0]?.payload;
                      if (!point) return;
                      if (progressionAxisMode === 'gates_17' && onSelectGate) {
                        onSelectGate(point.gateCode);
                      } else if (onSelectPhase) {
                        onSelectPhase(point.phaseCode);
                      }
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#D6D3D1"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#44403C', fontWeight: 600 }}
                      axisLine={{ stroke: '#D6D3D1' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      tick={{ fontSize: 11, fill: '#78716C' }}
                      axisLine={{ stroke: '#D6D3D1' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload as (typeof lifecycleProgressionData)[number];
                        return (
                          <div className="max-w-xs p-3 rounded-xl bg-[#152D42] text-white border border-[#C6A342] shadow-xl text-xs space-y-1.5">
                            <div className="font-bold text-[#E9C96D]">
                              {d.fullName}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-emerald-300">
                                ● Tỷ lệ Tuân thủ Thực tế:
                              </span>
                              <span className="font-mono-code font-bold text-emerald-300">
                                {d.complianceRate}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-amber-300">
                                ◆ Ngưỡng Chuẩn SSoT:
                              </span>
                              <span className="font-mono-code font-bold text-amber-300">
                                {d.targetRate}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-red-300">
                                ▲ Tỷ lệ Bị gắn cờ / Khóa:
                              </span>
                              <span className="font-mono-code font-bold text-red-300">
                                {d.riskExposureRate}% ({d.flaggedCount} bước)
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                    />
                    <ReferenceLine
                      y={88}
                      stroke="#C6A342"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Chuẩn SSoT 88%',
                        position: 'insideTopRight',
                        fill: '#B45309',
                        fontSize: 10,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="complianceRate"
                      name="Tuân thủ Thực tế (%)"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="targetRate"
                      name="Ngưỡng Chuẩn SSoT (%)"
                      stroke="#C6A342"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#C6A342' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="riskExposureRate"
                      name="Tỷ lệ Vướng Cờ Rủi ro (%)"
                      stroke="#DC2626"
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#DC2626' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2.5 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#152D42] dark:text-[#E9C96D]" />
                  <span>
                    {progressionAxisMode === 'wbs_4_stages'
                      ? 'Trục vòng đời: Quy hoạch → Chuẩn bị đầu tư → Thực thi → Quyết toán'
                      : 'Trục chi tiết: 17 cổng kiểm soát từ G0 (Quy hoạch) đến G16 (Bảo trì)'}
                  </span>
                </span>
                <span className="text-[10px] font-mono-code text-stone-400">
                  Nhấn vào điểm trên đường biểu đồ để lọc theo Giai đoạn / Gate
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});
