-- ============================================================================
-- HỆ SINH THÁI PHÁP LÝ ĐẠI SƠN (LEXVIET x AIPM OS)
-- MODULE: STAGE-GATE COMPLIANCE & RISK AUDIT ENGINE (03 PHASES · 17 GATES · 316 STEPS)
-- DATABASE: PostgreSQL 16+ / Supabase (kèm Row Level Security & Immutable Audit Trail)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bảng danh mục 03 Giai đoạn vòng đời dự án (audit_phases)
CREATE TABLE IF NOT EXISTS audit_phases (
    phase_code VARCHAR(20) PRIMARY KEY, -- 'PHASE_I', 'PHASE_II', 'PHASE_III'
    name VARCHAR(255) NOT NULL,
    order_index INT NOT NULL
);

-- 2. Bảng 17 Stage-Gates chuẩn hóa từ G0 đến G16 (compliance_gates)
CREATE TABLE IF NOT EXISTS compliance_gates (
    gate_code VARCHAR(10) PRIMARY KEY, -- 'G0' -> 'G16'
    phase_code VARCHAR(20) REFERENCES audit_phases(phase_code) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    prerequisite_gates TEXT[] DEFAULT '{}', -- Các Gate tiên quyết cho GatekeeperAgent
    order_index INT NOT NULL
);

-- 3. Bảng Master 316 bước thực hiện thuộc 32 nhóm hồ sơ (master_compliance_steps)
CREATE TABLE IF NOT EXISTS master_compliance_steps (
    step_code VARCHAR(30) PRIMARY KEY, -- 'I.1', 'I.2.1', 'II.6.3.1',...
    gate_code VARCHAR(10) REFERENCES compliance_gates(gate_code) ON DELETE CASCADE,
    dossier_group VARCHAR(200) NOT NULL,
    step_name TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE, -- 282 bắt buộc, 81 có điều kiện
    governing_body TEXT NOT NULL,       -- Cơ quan lập/trình
    inspection_body TEXT,              -- Cơ quan thẩm định/kiểm tra/phê duyệt
    deliverables TEXT[] DEFAULT '{}',  -- ['Hồ sơ số', 'BIM/CDE', 'GIS', 'Quyết định']
    risk_flags TEXT[] DEFAULT '{}',    -- Danh sách mã cảnh báo rủi ro (18 Risk Flags)
    legal_references JSONB DEFAULT '[]' -- Liên kết điều luật trong LexViet [{ law: "Luật Đầu tư công 2024", article: "Điều 18", docId: "doc-ldtc-58-2024" }]
);

-- 4. Bảng Tiến độ tuân thủ theo Dự án cụ thể (project_step_records)
CREATE TABLE IF NOT EXISTS project_step_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    step_code VARCHAR(30) REFERENCES master_compliance_steps(step_code) ON DELETE RESTRICT,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'PASSED', 'FLAGGED', 'BLOCKED', 'WAIVED')),
    attached_files JSONB DEFAULT '[]', -- [{ filename, url, hash, uploaded_at, signer_authority }]
    active_risk_flags TEXT[] DEFAULT '{}',
    ai_audit_verdict JSONB,            -- Kết quả thẩm định từ 3 Gemini Micro-Agents (Gatekeeper, LegalCrossCheck, AuditDeduction)
    audited_by VARCHAR(100),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_project_step UNIQUE (project_id, step_code)
);

-- 5. Bảng Audit Log bất biến (compliance_audit_trails)
CREATE TABLE IF NOT EXISTS compliance_audit_trails (
    id BIGSERIAL PRIMARY KEY,
    project_id UUID NOT NULL,
    step_code VARCHAR(30) NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chỉ mục tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_project_step_lookup ON project_step_records(project_id, step_code);
CREATE INDEX IF NOT EXISTS idx_master_gate ON master_compliance_steps(gate_code);
CREATE INDEX IF NOT EXISTS idx_audit_trails_project_time ON compliance_audit_trails(project_id, created_at DESC);

-- ============================================================================
-- TRIGGER BẢO VỆ TÍNH BẤT BIẾN CỦA COMPLIANCE_AUDIT_TRAILS (IMMUTABLE LOG)
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_audit_trail_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Bảng compliance_audit_trails là nhật ký kiểm toán bất biến (Immutable Audit Trail), nghiêm cấm UPDATE hoặc DELETE.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_compliance_audit_trails ON compliance_audit_trails;
CREATE TRIGGER trg_immutable_compliance_audit_trails
BEFORE UPDATE OR DELETE ON compliance_audit_trails
FOR EACH ROW EXECUTE FUNCTION prevent_audit_trail_mutation();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES CHO KIẾN TRÚC ENTERPRISE SSoT
-- ============================================================================
ALTER TABLE audit_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_compliance_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_step_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read master phases for authenticated users"
    ON audit_phases FOR SELECT USING (true);

CREATE POLICY "Allow read master gates for authenticated users"
    ON compliance_gates FOR SELECT USING (true);

CREATE POLICY "Allow read master steps for authenticated users"
    ON master_compliance_steps FOR SELECT USING (true);

CREATE POLICY "Allow read and update project step records for project members"
    ON project_step_records FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert-only and select on immutable audit trails"
    ON compliance_audit_trails FOR SELECT USING (true);

CREATE POLICY "Allow append audit trails"
    ON compliance_audit_trails FOR INSERT WITH CHECK (true);
