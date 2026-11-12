import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import {
  AuditPhase,
  AuditPhaseCode,
  ComplianceGate,
  ComplianceGateCode,
  MasterComplianceStep,
  ProjectStepRecord,
} from '../types/compliance';
import { STAGE_GATE_SCALE_STATS } from '../data/stageGateCorpus';

interface StageGateNavigatorProps {
  phases: AuditPhase[];
  gates: ComplianceGate[];
  steps: MasterComplianceStep[];
  records: Record<string, ProjectStepRecord>;
  selectedPhase: AuditPhaseCode | 'ALL';
  selectedGate: ComplianceGateCode | 'ALL';
  onSelectPhase: (phase: AuditPhaseCode | 'ALL') => void;
  onSelectGate: (gate: ComplianceGateCode | 'ALL') => void;
  onOpenSqlSchemaModal: () => void;
}

interface GateComputedMetrics {
  stepCount: number;
  masterScaleCount: number;
  passedCount: number;
  activeRedFlagsCount: number;
  isLockedByGatekeeper: boolean;
  unpaidPrereqs: ComplianceGateCode[];
}

interface PhaseComputedMetrics {
  firstGateCode?: ComplianceGateCode;
  lastGateCode?: ComplianceGateCode;
  totalSteps: number;
  passedSteps: number;
  redFlagsCount: number;
}

export const StageGateNavigator: React.FC<StageGateNavigatorProps> = React.memo(({
  phases,
  gates,
  steps,
  records,
  selectedPhase,
  selectedGate,
  onSelectPhase,
  onSelectGate,
  onOpenSqlSchemaModal,
}) => {
  // 1. O(1) Phase Metadata Lookup Map
  const phaseMetaByCode = useMemo(() => {
    const map = new Map<AuditPhaseCode, AuditPhase>();
    phases.forEach((p) => map.set(p.phase_code, p));
    return map;
  }, [phases]);

  // 2. O(1) Pre-grouped Steps & Gates by Gate/Phase Code (recomputed only when master steps/gates change)
  const { stepsByGateMap, stepsByPhaseMap, gatesByPhaseMap } = useMemo(() => {
    const byGate = new Map<ComplianceGateCode, MasterComplianceStep[]>();
    const byPhase = new Map<AuditPhaseCode, MasterComplianceStep[]>();
    const gByPhase = new Map<AuditPhaseCode, ComplianceGate[]>();

    steps.forEach((s) => {
      const gList = byGate.get(s.gate_code) || [];
      gList.push(s);
      byGate.set(s.gate_code, gList);

      const pList = byPhase.get(s.phase_code) || [];
      pList.push(s);
      byPhase.set(s.phase_code, pList);
    });

    gates.forEach((g) => {
      const list = gByPhase.get(g.phase_code) || [];
      list.push(g);
      gByPhase.set(g.phase_code, list);
    });

    return {
      stepsByGateMap: byGate,
      stepsByPhaseMap: byPhase,
      gatesByPhaseMap: gByPhase,
    };
  }, [steps, gates]);

  // 3. O(1) Gate & Phase Compliance Status Metrics Map (eliminates nested .filter() inside render)
  const { gateMetricsByCodeMap, phaseMetricsByCodeMap } = useMemo(() => {
    const gatePassStatusMap = new Map<ComplianceGateCode, boolean>();
    const rawGateStats = new Map<
      ComplianceGateCode,
      {
        stepCount: number;
        passedCount: number;
        activeRedFlagsCount: number;
        isBlocked: boolean;
      }
    >();

    gates.forEach((gate) => {
      const gateSteps = stepsByGateMap.get(gate.gate_code) || [];
      let passedCount = 0;
      let activeRedFlagsCount = 0;
      let isBlocked = false;

      for (let i = 0; i < gateSteps.length; i++) {
        const rec = records[gateSteps[i].step_code];
        if (rec?.status === 'PASSED') passedCount += 1;
        if (rec?.status === 'BLOCKED') isBlocked = true;
        activeRedFlagsCount += rec?.active_risk_flags?.length || 0;
      }

      const allPassed = gateSteps.length === 0 || passedCount === gateSteps.length;
      gatePassStatusMap.set(gate.gate_code, allPassed);
      rawGateStats.set(gate.gate_code, {
        stepCount: gateSteps.length,
        passedCount,
        activeRedFlagsCount,
        isBlocked,
      });
    });

    const gMetricsMap = new Map<ComplianceGateCode, GateComputedMetrics>();
    gates.forEach((gate) => {
      const raw = rawGateStats.get(gate.gate_code) || {
        stepCount: 0,
        passedCount: 0,
        activeRedFlagsCount: 0,
        isBlocked: false,
      };
      const unpaidPrereqs: ComplianceGateCode[] = [];
      for (let i = 0; i < gate.prerequisite_gates.length; i++) {
        const preGateCode = gate.prerequisite_gates[i];
        if (!gatePassStatusMap.get(preGateCode)) {
          unpaidPrereqs.push(preGateCode);
        }
      }

      gMetricsMap.set(gate.gate_code, {
        stepCount: raw.stepCount,
        masterScaleCount: gate.total_master_steps,
        passedCount: raw.passedCount,
        activeRedFlagsCount: raw.activeRedFlagsCount,
        isLockedByGatekeeper: unpaidPrereqs.length > 0 || raw.isBlocked,
        unpaidPrereqs,
      });
    });

    const pMetricsMap = new Map<AuditPhaseCode, PhaseComputedMetrics>();
    phases.forEach((phase) => {
      const gatesInPhase = gatesByPhaseMap.get(phase.phase_code) || [];
      const stepsInPhase = stepsByPhaseMap.get(phase.phase_code) || [];
      let passedSteps = 0;
      let redFlagsCount = 0;

      for (let i = 0; i < stepsInPhase.length; i++) {
        const rec = records[stepsInPhase[i].step_code];
        if (rec?.status === 'PASSED') passedSteps += 1;
        redFlagsCount += rec?.active_risk_flags?.length || 0;
      }

      pMetricsMap.set(phase.phase_code, {
        firstGateCode: gatesInPhase[0]?.gate_code,
        lastGateCode: gatesInPhase[gatesInPhase.length - 1]?.gate_code,
        totalSteps: stepsInPhase.length,
        passedSteps,
        redFlagsCount,
      });
    });

    return {
      gateMetricsByCodeMap: gMetricsMap,
      phaseMetricsByCodeMap: pMetricsMap,
    };
  }, [gates, phases, stepsByGateMap, stepsByPhaseMap, gatesByPhaseMap, records]);

  // 4. Memoized visible gates for selected phase
  const visibleGates = useMemo(() => {
    if (selectedPhase === 'ALL') return gates;
    return gatesByPhaseMap.get(selectedPhase) || [];
  }, [gates, gatesByPhaseMap, selectedPhase]);

  return (
    <div className="bg-white dark:bg-[#1A1917] rounded-2xl border border-stone-200 dark:border-[#2E2C28] p-4 shadow-xs space-y-4">
      {/* Top Scale & Architecture Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-[#2E2C28] pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#152D42] text-[#E9C96D] text-[10px] font-bold uppercase tracking-wider">
              AIPM OS × ĐẠI SƠN LEGAL
            </span>
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              {STAGE_GATE_SCALE_STATS.totalPhases} Giai đoạn ·{' '}
              {STAGE_GATE_SCALE_STATS.totalGates} Stage-Gates (G0–G16) ·{' '}
              {STAGE_GATE_SCALE_STATS.totalDossierGroups} Nhóm hồ sơ ·{' '}
              {STAGE_GATE_SCALE_STATS.totalMasterSteps} Bước thực hiện (
              {STAGE_GATE_SCALE_STATS.mandatoryDossiers} bắt buộc /{' '}
              {STAGE_GATE_SCALE_STATS.conditionalDossiers} có điều kiện) ·{' '}
              {STAGE_GATE_SCALE_STATS.totalRiskFlags} Risk Flags
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#152D42] dark:text-stone-100 mt-1">
            Thanh Điều Hướng 17 Stage-Gates & Kiểm Toán Tuân Thủ Động (G0 → G16)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {(selectedPhase !== 'ALL' || selectedGate !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                onSelectPhase('ALL');
                onSelectGate('ALL');
              }}
              className="px-2.5 py-1.5 rounded-xl border border-[#C6A342] bg-[#FBF5DF] text-[#152D42] text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hiện cả 17 Gates</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSqlSchemaModal}
            className="px-3 py-1.5 rounded-xl bg-[#152D42] hover:bg-[#1E3A54] text-[#E9C96D] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PostgreSQL DDL & RLS</span>
          </button>
        </div>
      </div>

      {/* 3 Phase Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {phases.map((phase) => {
          const isPhaseActive = selectedPhase === phase.phase_code;
          const pMetrics = phaseMetricsByCodeMap.get(phase.phase_code);

          return (
            <button
              key={phase.phase_code}
              type="button"
              onClick={() =>
                onSelectPhase(isPhaseActive ? 'ALL' : phase.phase_code)
              }
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                isPhaseActive
                  ? 'bg-[#FFFDF7] dark:bg-[#23211C] border-[#C6A342] ring-2 ring-[#C6A342]/40'
                  : `${phase.bgClass} ${phase.borderClass} hover:border-[#C6A342]`
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: phase.accentColor }}
                >
                  {phase.name}
                </span>
                <span className="text-[11px] font-mono-code font-bold px-2 py-0.5 rounded bg-white/80 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                  {pMetrics?.firstGateCode} → {pMetrics?.lastGateCode}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1 mt-1">
                {phase.summary}
              </p>
              <div className="flex items-center justify-between text-[11px] font-semibold mt-2 pt-1.5 border-t border-stone-200/70 dark:border-stone-800">
                <span className="text-emerald-700 dark:text-emerald-400">
                  Hoàn thành: {pMetrics?.passedSteps || 0}/
                  {pMetrics?.totalSteps || 0} cụm bước
                </span>
                {(pMetrics?.redFlagsCount || 0) > 0 ? (
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {pMetrics?.redFlagsCount} cờ đỏ
                  </span>
                ) : (
                  <span className="text-stone-500">0 cờ đỏ</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Horizontal Scrollable 17 Stage-Gate Cards (G0 -> G16) */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2 pt-0.5">
        {visibleGates.map((gate) => {
          const isSelected = selectedGate === gate.gate_code;
          const metrics = gateMetricsByCodeMap.get(gate.gate_code) || {
            stepCount: 0,
            masterScaleCount: gate.total_master_steps,
            passedCount: 0,
            activeRedFlagsCount: 0,
            isLockedByGatekeeper: false,
            unpaidPrereqs: [],
          };
          const phaseMeta = phaseMetaByCode.get(gate.phase_code);

          return (
            <button
              key={gate.gate_code}
              type="button"
              onClick={() =>
                onSelectGate(isSelected ? 'ALL' : gate.gate_code)
              }
              className={`min-w-[195px] max-w-[215px] p-3 rounded-xl border text-left flex flex-col justify-between transition shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#152D42] text-white border-[#C6A342] ring-2 ring-[#C6A342] shadow-md'
                  : 'bg-[#FBF9F5] dark:bg-[#141413] hover:bg-[#FFFDF7] dark:hover:bg-[#1F1E1B] border-stone-200 dark:border-[#2E2C28]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono-code font-bold ${
                      isSelected
                        ? 'bg-[#C6A342] text-[#152D42]'
                        : 'bg-[#152D42] text-[#E9C96D]'
                    }`}
                  >
                    {gate.gate_code}
                  </span>

                  <div className="flex items-center gap-1">
                    {metrics.isLockedByGatekeeper && (
                      <span
                        className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-0.5"
                        title={`Gatekeeper khóa: Chờ hoàn tất ${metrics.unpaidPrereqs.join(', ')}`}
                      >
                        <Lock className="w-2.5 h-2.5" />
                        Khóa
                      </span>
                    )}
                    {metrics.activeRedFlagsCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {metrics.activeRedFlagsCount} cờ
                      </span>
                    ) : metrics.passedCount === metrics.stepCount &&
                      metrics.stepCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Đạt
                      </span>
                    ) : null}
                  </div>
                </div>

                <div
                  className={`text-xs font-bold leading-snug line-clamp-2 ${
                    isSelected
                      ? 'text-white'
                      : 'text-stone-900 dark:text-stone-100'
                  }`}
                >
                  {gate.name.replace(/^G\d+\s*·\s*/, '')}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-[10px]">
                <span
                  className={
                    isSelected
                      ? 'text-[#E9C96D] font-semibold'
                      : 'text-stone-500 dark:text-stone-400'
                  }
                >
                  Tiến độ: {metrics.passedCount}/{metrics.stepCount} ({metrics.masterScaleCount} bước)
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: phaseMeta?.accentColor || '#152D42' }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

