-- =================================================================
-- منصة إثراء التجربة — وحدة المتعهدين (تبسيط جذري)
-- =================================================================
-- النموذج الجديد: نظام تقييم ومتابعة — وليس توثيق عقود
-- - حذف جداول contractors و contracts (غير ضرورية)
-- - التقييمات تربط بـ (company + domain) مباشرة
-- - أدوار المراقبين تحتاج company_id + domain
-- =================================================================
-- ⚠️ تنبيه: هذا الملف يحذف جداول contracts و contractors نهائياً
-- نفّذه بعد التأكد أنه لا توجد بيانات تقييم حقيقية فيها
-- =================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- القسم 1: حذف الجداول غير الضرورية وتعديل البنية
-- ═══════════════════════════════════════════════════════════════════════

-- 1) حذف الجداول التابعة أولاً (foreign keys)
DROP TABLE IF EXISTS contract_kpi_records CASCADE;
DROP TABLE IF EXISTS contract_protocols CASCADE;
DROP TABLE IF EXISTS contract_violations CASCADE;
DROP TABLE IF EXISTS contract_evaluations CASCADE;
DROP TABLE IF EXISTS contract_evaluation_sessions CASCADE;
DROP TABLE IF EXISTS contract_workforce CASCADE;
DROP TABLE IF EXISTS contract_vehicles CASCADE;

-- 2) حذف الـ Views المرتبطة بالعقود
DROP VIEW IF EXISTS v_contract_summary CASCADE;
DROP VIEW IF EXISTS v_daily_status CASCADE;

-- 3) تعديل contract_criteria - حذف عمود contract_id (لم نعد نحتاجه)
-- المعايير تكون قوالب موحدة أو خاصة بـ (company + domain)
ALTER TABLE contract_criteria DROP COLUMN IF EXISTS contract_id CASCADE;

-- إضافة company_id لتخصيص معيار لشركة محددة (اختياري)
ALTER TABLE contract_criteria ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
-- NULL = معيار قالب لكل الشركات
-- ملء = معيار خاص بشركة معينة

CREATE INDEX IF NOT EXISTS idx_criteria_company ON contract_criteria(company_id);

-- 4) حذف جداول العقود والمتعهدين الآن
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS contractors CASCADE;


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 2: إنشاء جداول جديدة مبسّطة للتقييمات
-- ═══════════════════════════════════════════════════════════════════════

-- جدول جلسات التقييم — كل تعبئة لقائمة في يوم معيّن
CREATE TABLE IF NOT EXISTS contract_evaluation_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  domain_id       TEXT NOT NULL REFERENCES contract_domains(id),
  checklist_id    UUID NOT NULL REFERENCES contract_checklists(id) ON DELETE RESTRICT,
  date_id         TEXT,                                -- يوم ذي الحجة (1-13) — قد يكون NULL للجاهزية
  session_label   TEXT,                                -- 'breakfast' / 'lunch' / 'dinner' / 'shift_1' …
  session_time    TIMESTAMP WITH TIME ZONE,
  monitor_id      UUID REFERENCES users(id),           -- المراقب الذي عبّأ
  location        TEXT,                                -- 'منى' / 'عرفة' / 'مكة'
  status          TEXT NOT NULL DEFAULT 'in_progress', -- in_progress / submitted / approved
  submitted_at    TIMESTAMP WITH TIME ZONE,
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP WITH TIME ZONE,
  total_items     INT NOT NULL DEFAULT 0,
  compliant_items INT NOT NULL DEFAULT 0,
  violation_items INT NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_company_domain ON contract_evaluation_sessions(company_id, domain_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON contract_evaluation_sessions(date_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON contract_evaluation_sessions(status);


-- جدول التقييمات الفعلية لكل بند في كل جلسة
CREATE TABLE IF NOT EXISTS contract_evaluations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES contract_evaluation_sessions(id) ON DELETE CASCADE,
  criterion_id    UUID NOT NULL REFERENCES contract_criteria(id),

  -- القيم المعبأة
  value_text      TEXT,
  value_number    NUMERIC(12,2),
  value_bool      BOOLEAN,
  actual_qty      NUMERIC(12,2),
  status          TEXT,                                -- 'compliant' / 'violation' / 'na'

  note            TEXT,
  photo_url       TEXT,                                -- شاهد (للمرحلة القادمة)
  filled_by       UUID REFERENCES users(id),
  filled_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE (session_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_evals_session ON contract_evaluations(session_id);


-- جدول المخالفات والشواهد (مبسط - بدون غرامات معقدة الآن)
CREATE TABLE IF NOT EXISTS contract_violations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  domain_id       TEXT NOT NULL REFERENCES contract_domains(id),
  session_id      UUID REFERENCES contract_evaluation_sessions(id) ON DELETE SET NULL,
  criterion_id    UUID REFERENCES contract_criteria(id),

  violation_date  DATE NOT NULL,
  date_id         TEXT,
  level_id        TEXT NOT NULL REFERENCES violation_levels(id),
  description     TEXT NOT NULL,
  evidence_url    TEXT,                                -- صورة/فيديو شاهد

  action_taken    TEXT,
  notified_party  BOOLEAN NOT NULL DEFAULT FALSE,      -- هل أُبلغ المتعهد؟
  notified_at     TIMESTAMP WITH TIME ZONE,

  reported_by     UUID REFERENCES users(id),
  escalated       BOOLEAN NOT NULL DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'open',
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_company ON contract_violations(company_id);
CREATE INDEX IF NOT EXISTS idx_violations_date ON contract_violations(violation_date);


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 3: تعديل جدول users - إضافة contractor_company_id
-- ═══════════════════════════════════════════════════════════════════════

-- نطاق المراقب الجديد: شركة + مجال
ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor_company_id UUID REFERENCES companies(id);
-- contractor_company_id: الشركة التي يراقبها (NULL للـ PMO الذي يرى الكل)

-- contractor_scope_domain موجود بالفعل من Migration السابق
-- contractor_scope_contracts لم نعد نحتاجه (لكن نتركه لو موجود - لا ضرر)


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 4: View جديد لملخص الأداء
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_company_domain_summary AS
SELECT
  c.id              AS company_id,
  c.name            AS company_name,
  cd.id             AS domain_id,
  cd.name_ar        AS domain_name,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'submitted') AS submitted_sessions,
  SUM(s.violation_items) AS total_violations
FROM companies c
CROSS JOIN contract_domains cd
LEFT JOIN contract_evaluation_sessions s ON s.company_id = c.id AND s.domain_id = cd.id
WHERE c.active = TRUE AND cd.active = TRUE
GROUP BY c.id, c.name, cd.id, cd.name_ar;


-- ═══════════════════════════════════════════════════════════════════════
-- ✓ تم تبسيط البنية بنجاح
-- =================================================================
-- التغييرات الرئيسية:
-- ✓ حذف جدولَي contractors و contracts
-- ✓ التقييمات الآن مرتبطة بـ (company + domain) مباشرة
-- ✓ المعايير قوالب موحدة (يمكن تخصيصها لشركة عبر company_id)
-- ✓ المراقبون لهم contractor_company_id + contractor_scope_domain
-- =================================================================
