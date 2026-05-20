-- ═══════════════════════════════════════════════════════════════════════
-- منصة إثراء التجربة — وحدة متابعة المتعهدين
-- Migration: 001_contractors_module
-- التاريخ: مايو 2026 — موسم حج 1447هـ
-- الوصف: جداول وحدة متابعة عقود المتعهدين (الإعاشة + النقل + الحراسات)
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- القسم 1: الجداول المرجعية (Lookup Tables)
-- ═══════════════════════════════════════════════════════════════════════

-- جدول مجالات العقود (الإعاشة، النقل، الحراسات)
CREATE TABLE IF NOT EXISTS contract_domains (
  id          TEXT PRIMARY KEY,           -- 'food' / 'transport' / 'security'
  name_ar     TEXT NOT NULL,              -- 'الإعاشة' / 'النقل' / 'الحراسات'
  icon        TEXT,                       -- اسم الأيقونة من Lucide
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO contract_domains (id, name_ar, icon, sort_order) VALUES
  ('food',      'الإعاشة',   'utensils',     1),
  ('transport', 'النقل',     'bus',          2),
  ('security',  'الحراسات',  'shield-check', 3)
ON CONFLICT (id) DO NOTHING;


-- جدول مراحل المتابعة (الجاهزية / اليومية / الختامية)
CREATE TABLE IF NOT EXISTS contract_phases (
  id          TEXT PRIMARY KEY,           -- 'pre' / 'daily' / 'closing'
  name_ar     TEXT NOT NULL,              -- 'الجاهزية' / 'اليومية' / 'الختامية'
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

INSERT INTO contract_phases (id, name_ar, description, sort_order) VALUES
  ('pre',     'القوائم الأولية / الجاهزية', 'تُعبَّأ مرة واحدة قبل بدء الموسم',  1),
  ('daily',   'القوائم اليومية',             'متابعة تشغيلية يومية متكررة',       2),
  ('closing', 'القوائم النهائية / الختامية', 'الأيام الخاصة + KPI + التسليم',     3)
ON CONFLICT (id) DO NOTHING;


-- جدول مستويات المخالفات
CREATE TABLE IF NOT EXISTS violation_levels (
  id            TEXT PRIMARY KEY,         -- 'critical' / 'high' / 'medium' / 'low'
  name_ar       TEXT NOT NULL,
  color         TEXT NOT NULL,            -- لون العرض
  base_penalty  NUMERIC(5,2) NOT NULL,    -- نسبة الغرامة الأساسية %
  escalation    JSONB,                    -- التصعيد عند التكرار {first:1, second:1.5, third:2}
  requires_immediate_escalation BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INT NOT NULL DEFAULT 0
);

INSERT INTO violation_levels (id, name_ar, color, base_penalty, escalation, requires_immediate_escalation, sort_order) VALUES
  ('critical', 'حرج',    '#DC2626', 10.00, '{"first":1,"second":1.5,"third":2}'::jsonb, TRUE,  1),
  ('high',     'عالٍ',   '#EA580C',  5.00, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 2),
  ('medium',   'متوسط',  '#D97706',  2.50, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 3),
  ('low',      'منخفض',  '#65A30D',  1.00, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 4)
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 2: الكيانات الأساسية (المتعهدون والعقود)
-- ═══════════════════════════════════════════════════════════════════════

-- جدول المتعهدين (الموردين الخارجيين)
CREATE TABLE IF NOT EXISTS contractors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                       -- اسم المتعهد التجاري
  short_name      TEXT,                                -- اسم مختصر للعرض
  commercial_reg  TEXT,                                -- السجل التجاري
  representative  TEXT,                                -- اسم الممثل القانوني
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  notes           TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractors_active ON contractors(active);


-- جدول العقود — يربط متعهداً بشركة (عميل) في مجال محدد
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id   UUID NOT NULL REFERENCES contractors(id) ON DELETE RESTRICT,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  domain_id       TEXT NOT NULL REFERENCES contract_domains(id),
  contract_number TEXT,                                -- رقم العقد الرسمي
  hijri_year      TEXT NOT NULL DEFAULT '1447',
  pilgrims_count  INT,                                 -- عدد الحجاج المخدومين
  start_date      DATE,                                -- بداية تنفيذ العقد
  end_date        DATE,                                -- نهاية تنفيذ العقد
  total_value     NUMERIC(14,2),                       -- قيمة العقد الإجمالية
  performance_bond NUMERIC(14,2),                      -- ضمان حسن التنفيذ
  max_penalty_pct NUMERIC(5,2) NOT NULL DEFAULT 30.00, -- السقف التراكمي للغرامات %
  notes           TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE (company_id, domain_id, hijri_year)           -- شركة واحدة + مجال واحد + سنة = عقد واحد
);

CREATE INDEX IF NOT EXISTS idx_contracts_contractor ON contracts(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_company    ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_domain     ON contracts(domain_id);
CREATE INDEX IF NOT EXISTS idx_contracts_active     ON contracts(active);


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 3: بنية المعايير (Checklist & Criteria)
-- ═══════════════════════════════════════════════════════════════════════

-- جدول القوائم الفرعية داخل كل مرحلة
-- مثال: داخل مرحلة "اليومية" للإعاشة: قائمة 0، قائمة أ، قائمة ب، قائمة ج، قائمة د
-- مثال: داخل مرحلة "اليومية" للنقل: نموذج موحد لكل يوم 7-13
CREATE TABLE IF NOT EXISTS contract_checklists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id       TEXT NOT NULL REFERENCES contract_domains(id),
  phase_id        TEXT NOT NULL REFERENCES contract_phases(id),
  code            TEXT NOT NULL,                       -- 'list_0' / 'list_a' / 'day_7' / 'arafa' …
  name_ar         TEXT NOT NULL,                       -- 'القائمة 0: بداية الوردية'
  description     TEXT,
  frequency       TEXT NOT NULL DEFAULT 'once',        -- once / daily / per_shift / per_meal / per_4h / weekly / on_event
  expected_count  INT DEFAULT 1,                       -- كم مرة يتعبأ يومياً
  applies_on_days TEXT[],                              -- يوم محدد فقط (مثل ['9'] لعرفة)
  sort_order      INT NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT TRUE,

  UNIQUE (domain_id, phase_id, code)
);

CREATE INDEX IF NOT EXISTS idx_checklists_domain_phase ON contract_checklists(domain_id, phase_id);


-- جدول المعايير (البنود الفعلية التي تُعبَّأ)
CREATE TABLE IF NOT EXISTS contract_criteria (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id       UUID NOT NULL REFERENCES contract_checklists(id) ON DELETE CASCADE,
  contract_id        UUID REFERENCES contracts(id) ON DELETE CASCADE,
  -- NULL في contract_id = معيار قالب يطبق على كل العقود في نفس المجال
  -- ملء contract_id = معيار مخصص لعقد معين (لكميات محددة بحسب الشركة)
  section            TEXT,                             -- 'kitchen' / 'buffet' / 'workforce' / 'fleet' / 'guards'
  code               TEXT,                             -- كود مرجعي للبند
  name_ar            TEXT NOT NULL,                    -- نص المعيار
  description        TEXT,                             -- شرح تفصيلي للمعيار

  -- نوع الإجابة المطلوبة
  answer_type        TEXT NOT NULL DEFAULT 'compliance',
  -- 'compliance'    : مطابق / مخالف (الافتراضي للنقل والحراسات)
  -- 'yesno'         : نعم / لا
  -- 'checkbox'      : ☐ تم / لم يتم
  -- 'number'        : رقم
  -- 'ratio'         : نسبة (مع المطلوب والفعلي)
  -- 'temperature'   : درجة حرارة (مع الحد الأدنى/الأعلى)
  -- 'time'          : وقت
  -- 'kpi_target'    : هدف KPI مع قيمة فعلية

  -- الكميات (للجاهزية وعلب مزدلفة وغيرها)
  required_qty       NUMERIC(12,2),                    -- الكمية المطلوبة
  qty_unit           TEXT,                             -- وحدة القياس (قارورة، علبة، حافلة، عامل…)

  -- القيم الحدية (للأنواع الرقمية وحرارة)
  min_value          NUMERIC(12,2),
  max_value          NUMERIC(12,2),
  target_value       NUMERIC(12,2),

  -- خصائص المعيار
  is_critical        BOOLEAN NOT NULL DEFAULT FALSE,   -- بند حرج (تصعيد فوري)
  default_violation_level TEXT REFERENCES violation_levels(id), -- المستوى الافتراضي للمخالفة
  note_required      TEXT NOT NULL DEFAULT 'on_violation',
  -- 'no' / 'on_violation' / 'always'

  sort_order         INT NOT NULL DEFAULT 0,
  active             BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_criteria_checklist ON contract_criteria(checklist_id);
CREATE INDEX IF NOT EXISTS idx_criteria_contract  ON contract_criteria(contract_id);
CREATE INDEX IF NOT EXISTS idx_criteria_critical  ON contract_criteria(is_critical) WHERE is_critical = TRUE;


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 4: التعبئات (التقييمات اليومية والفترية)
-- ═══════════════════════════════════════════════════════════════════════

-- جدول جلسات التعبئة (كل تعبئة لقائمة في يوم محدد)
-- مثال: تعبئة قائمة (أ) للإعاشة - وجبة الإفطار - يوم 7
-- مثال: تعبئة المتابعة اليومية للنقل - يوم 9
CREATE TABLE IF NOT EXISTS contract_evaluation_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  checklist_id    UUID NOT NULL REFERENCES contract_checklists(id) ON DELETE RESTRICT,
  date_id         TEXT,                                -- يوم ذي الحجة (1-13) — قد يكون NULL للجاهزية
  session_label   TEXT,                                -- 'breakfast' / 'lunch' / 'dinner' / 'shift_1' …
  session_time    TIMESTAMP WITH TIME ZONE,
  monitor_id      UUID REFERENCES users(id),           -- المراقب الذي عبّأ
  location        TEXT,                                -- 'منى' / 'عرفة' / 'مكة'
  status          TEXT NOT NULL DEFAULT 'in_progress', -- in_progress / submitted / approved / rejected
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

CREATE INDEX IF NOT EXISTS idx_sessions_contract_date ON contract_evaluation_sessions(contract_id, date_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status       ON contract_evaluation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_monitor      ON contract_evaluation_sessions(monitor_id);


-- جدول التعبئات الفعلية لكل بند في كل جلسة
CREATE TABLE IF NOT EXISTS contract_evaluations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES contract_evaluation_sessions(id) ON DELETE CASCADE,
  criterion_id    UUID NOT NULL REFERENCES contract_criteria(id),

  -- القيم المعبأة (يستخدم منها ما يناسب نوع المعيار)
  value_text      TEXT,                                -- للنصوص والاختيارات
  value_number    NUMERIC(12,2),                       -- للأرقام والكميات
  value_bool      BOOLEAN,                             -- لنعم/لا والمطابقة
  actual_qty      NUMERIC(12,2),                       -- الكمية الفعلية
  status          TEXT,                                -- 'compliant' / 'violation' / 'na'

  note            TEXT,
  photo_url       TEXT,                                -- صورة دليل (اختياري)
  filled_by       UUID REFERENCES users(id),
  filled_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE (session_id, criterion_id)                    -- بند واحد = تعبئة واحدة لكل جلسة
);

CREATE INDEX IF NOT EXISTS idx_evals_session   ON contract_evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_evals_criterion ON contract_evaluations(criterion_id);
CREATE INDEX IF NOT EXISTS idx_evals_status    ON contract_evaluations(status);


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 5: المخالفات والغرامات
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contract_violations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  session_id      UUID REFERENCES contract_evaluation_sessions(id) ON DELETE SET NULL,
  criterion_id    UUID REFERENCES contract_criteria(id),

  violation_date  DATE NOT NULL,
  violation_time  TIME,
  date_id         TEXT,                                -- يوم ذي الحجة

  level_id        TEXT NOT NULL REFERENCES violation_levels(id),
  occurrence_no   INT NOT NULL DEFAULT 1,              -- التكرار: 1=أول، 2=ثاني، 3+=ثالث فأكثر
  violation_type  TEXT NOT NULL,                       -- وصف نوع المخالفة
  description     TEXT NOT NULL,
  evidence_url    TEXT,                                -- صورة/فيديو دليل

  penalty_pct     NUMERIC(5,2) NOT NULL,               -- نسبة الغرامة الفعلية (محسوبة)
  penalty_amount  NUMERIC(14,2),                       -- قيمة الغرامة بالريال (محسوبة)

  action_taken    TEXT,                                -- الإجراء التصحيحي المتخذ
  capa_executed   BOOLEAN NOT NULL DEFAULT FALSE,      -- هل نُفذ CAPA؟
  capa_executed_at TIMESTAMP WITH TIME ZONE,

  reported_by     UUID REFERENCES users(id),
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP WITH TIME ZONE,
  escalated       BOOLEAN NOT NULL DEFAULT FALSE,      -- هل صُعِّد للقيادة؟
  escalated_at    TIMESTAMP WITH TIME ZONE,

  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'open',        -- open / acknowledged / resolved / disputed
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_contract  ON contract_violations(contract_id);
CREATE INDEX IF NOT EXISTS idx_violations_date      ON contract_violations(violation_date);
CREATE INDEX IF NOT EXISTS idx_violations_level     ON contract_violations(level_id);
CREATE INDEX IF NOT EXISTS idx_violations_status    ON contract_violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_escalated ON contract_violations(escalated) WHERE escalated = TRUE;


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 6: مؤشرات الأداء (KPI) الأسبوعية
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contract_kpi_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id       TEXT NOT NULL REFERENCES contract_domains(id),
  code            TEXT NOT NULL,                       -- 'on_time_meal' / 'food_temp' …
  name_ar         TEXT NOT NULL,
  description     TEXT,
  target_operator TEXT NOT NULL,                       -- '>=' / '<=' / '=' / '<' / '>'
  target_value    NUMERIC(10,2) NOT NULL,
  target_unit     TEXT,                                -- '%' / '°م' / 'دقيقة' / 'حالة'
  is_zero_tolerance BOOLEAN NOT NULL DEFAULT FALSE,    -- صفر تسامح (مثل صفر مخالفات)
  sort_order      INT NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT TRUE,

  UNIQUE (domain_id, code)
);


CREATE TABLE IF NOT EXISTS contract_kpi_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  kpi_id          UUID NOT NULL REFERENCES contract_kpi_definitions(id),
  week_number     INT NOT NULL,                        -- 1 / 2 / 3 من الموسم
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  actual_value    NUMERIC(10,2),
  gap_value       NUMERIC(10,2),                       -- الفجوة محسوبة
  status          TEXT,                                -- 'green' / 'amber' / 'red'
  corrective_action TEXT,
  recorded_by     UUID REFERENCES users(id),
  recorded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE (contract_id, kpi_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_kpi_contract ON contract_kpi_records(contract_id);


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 7: المحاضر الرسمية (الجاهزية والتسليم النهائي)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contract_protocols (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  protocol_type   TEXT NOT NULL,                       -- 'readiness' / 'handover'
  protocol_date   DATE NOT NULL,

  -- الطرف الأول (المتعهد)
  party1_name     TEXT NOT NULL,
  party1_role     TEXT,                                -- 'مدير المشروع' / 'مدير الموقع'
  party1_signed_at TIMESTAMP WITH TIME ZONE,
  party1_signature_url TEXT,

  -- الطرف الثاني (إثراء)
  party2_name     TEXT NOT NULL,
  party2_role     TEXT,
  party2_signed_at TIMESTAMP WITH TIME ZONE,
  party2_signature_url TEXT,

  -- النتيجة
  total_items     INT NOT NULL,
  completed_items INT NOT NULL,
  is_approved     BOOLEAN NOT NULL DEFAULT FALSE,      -- هل اعتُمد؟
  decision        TEXT,                                -- 'ready' / 'not_ready' / 'conditional'

  notes           TEXT,
  attachment_url  TEXT,                                -- ملف PDF موقع (اختياري)
  status          TEXT NOT NULL DEFAULT 'draft',       -- draft / pending_party1 / pending_party2 / signed

  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protocols_contract ON contract_protocols(contract_id);
CREATE INDEX IF NOT EXISTS idx_protocols_type     ON contract_protocols(protocol_type);


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 8: العمالة والمركبات (تفاصيل تشغيلية)
-- ═══════════════════════════════════════════════════════════════════════

-- العمالة المسجلة لكل عقد (للإعاشة والحراسات)
CREATE TABLE IF NOT EXISTS contract_workforce (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  worker_name     TEXT NOT NULL,
  national_id     TEXT,                                -- رقم الهوية/الإقامة
  job_section     TEXT,                                -- 'kitchen' / 'buffet' / 'guards' …
  role_title      TEXT,                                -- مسمى وظيفي
  -- التصاريح والوثائق
  iqama_valid     BOOLEAN,
  iqama_expiry    DATE,
  health_cert     BOOLEAN,
  health_cert_expiry DATE,
  haccp_trained   BOOLEAN,                             -- للإعاشة فقط
  hajj_permit     BOOLEAN,
  hajj_permit_expiry DATE,
  -- إضافات للحراسات
  security_license BOOLEAN,
  security_clearance BOOLEAN,
  -- إضافات للنقل
  driving_license_class TEXT,                          -- '2' / '3' / إلخ
  medical_fitness_date DATE,
  -- متابعة الحضور
  phone           TEXT,
  notes           TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workforce_contract ON contract_workforce(contract_id);


-- المركبات (للنقل)
CREATE TABLE IF NOT EXISTS contract_vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  vehicle_type    TEXT NOT NULL,                       -- 'main' / 'reserve'
  plate_number    TEXT NOT NULL,
  model           TEXT,
  year            INT,
  capacity        INT,                                 -- عدد المقاعد
  gps_id          TEXT,
  gps_active      BOOLEAN,
  has_camera      BOOLEAN,
  insurance_valid BOOLEAN,
  insurance_expiry DATE,
  permit_valid    BOOLEAN,
  permit_expiry   DATE,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_contract ON contract_vehicles(contract_id);


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 9: توسيع جدول المستخدمين
-- ═══════════════════════════════════════════════════════════════════════

-- إضافة حقول للمستخدمين الجدد (أدوار المراقبين)
-- نتجنب تعديل بنية users الموجودة، فقط نضيف أعمدة

ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor_scope_domain TEXT REFERENCES contract_domains(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor_scope_contracts UUID[];
-- contractor_scope_contracts: قائمة العقود التي يستطيع المستخدم الوصول إليها
-- إذا كانت NULL: يصل لكل العقود في مجاله

-- توسيع قيم role لتشمل الأدوار الجديدة
-- (إذا كان role من نوع CHECK مع قيم محددة، نضيف القيم الجديدة)
-- ملاحظة: إذا كان role مجرد TEXT بدون قيد، فلا حاجة لتغيير

-- الأدوار الجديدة المُضافة:
-- 'contractor_monitor_food'      → مراقب الإعاشة
-- 'contractor_monitor_transport' → مراقب النقل
-- 'contractor_monitor_security'  → مراقب الحراسات
-- 'contractor_pmo'               → مدير المشروع (PMO) — يعتمد المحاضر ويرى الكل


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 10: العروض المُجمَّعة (Views) للوحة القيادة
-- ═══════════════════════════════════════════════════════════════════════

-- ملخص العقود مع الغرامات التراكمية
CREATE OR REPLACE VIEW v_contract_summary AS
SELECT
  c.id                              AS contract_id,
  c.contract_number,
  c.hijri_year,
  ct.name                           AS contractor_name,
  co.name                           AS company_name,
  cd.name_ar                        AS domain_name,
  c.domain_id,
  c.pilgrims_count,
  c.max_penalty_pct,
  COALESCE(SUM(v.penalty_pct), 0)   AS total_penalty_pct,
  COUNT(v.id)                       AS total_violations,
  COUNT(v.id) FILTER (WHERE v.level_id = 'critical') AS critical_violations,
  COUNT(v.id) FILTER (WHERE v.escalated = TRUE)      AS escalated_violations,
  CASE
    WHEN COALESCE(SUM(v.penalty_pct), 0) >= c.max_penalty_pct THEN 'breach'
    WHEN COALESCE(SUM(v.penalty_pct), 0) >= c.max_penalty_pct * 0.7 THEN 'warning'
    WHEN COALESCE(SUM(v.penalty_pct), 0) >= c.max_penalty_pct * 0.4 THEN 'attention'
    ELSE 'healthy'
  END                               AS health_status,
  c.active
FROM contracts c
JOIN contractors ct ON ct.id = c.contractor_id
JOIN companies co   ON co.id = c.company_id
JOIN contract_domains cd ON cd.id = c.domain_id
LEFT JOIN contract_violations v ON v.contract_id = c.id
GROUP BY c.id, ct.name, co.name, cd.name_ar;


-- ملخص يومي للمتابعة
CREATE OR REPLACE VIEW v_daily_status AS
SELECT
  s.contract_id,
  s.date_id,
  cl.domain_id,
  cl.phase_id,
  cl.name_ar AS checklist_name,
  COUNT(s.id)                                                    AS sessions_count,
  COUNT(s.id) FILTER (WHERE s.status = 'submitted')              AS submitted_count,
  COUNT(s.id) FILTER (WHERE s.status = 'approved')               AS approved_count,
  SUM(s.violation_items)                                         AS total_violation_items,
  SUM(s.compliant_items)                                         AS total_compliant_items
FROM contract_evaluation_sessions s
JOIN contract_checklists cl ON cl.id = s.checklist_id
GROUP BY s.contract_id, s.date_id, cl.domain_id, cl.phase_id, cl.name_ar;


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 11: المحفزات (Triggers) لتحديث updated_at
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- نطبق المحفز على الجداول التي فيها updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'contractors',
      'contracts',
      'contract_evaluation_sessions',
      'contract_violations',
      'contract_protocols'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    ', t, t);
  END LOOP;
END$$;


-- ═══════════════════════════════════════════════════════════════════════
-- نهاية Migration 001
-- ═══════════════════════════════════════════════════════════════════════
