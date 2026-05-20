-- =================================================================
-- منصة إثراء التجربة — وحدة المتعهدين
-- ملف SQL الموحّد (Migration + Seed + الإعدادات الافتراضية)
-- =================================================================
-- نفّذ هذا الملف مرة واحدة على Supabase
-- آمن تماماً: يستخدم IF NOT EXISTS و ON CONFLICT
-- =================================================================

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

-- ═══════════════════════════════════════════════════════════════════════
-- الجزء الثاني: تحميل المعايير القوالب (Seed Data)
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- منصة إثراء التجربة — وحدة المتعهدين
-- Seed Data: القوائم والمعايير الأولية
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1) القوائم (Checklists)
-- ═══════════════════════════════════════════════════════════════════════

-- ─── الإعاشة ───────────────────────────────────────────────────────────

-- الجاهزية
INSERT INTO contract_checklists (domain_id, phase_id, code, name_ar, description, frequency, sort_order) VALUES
('food', 'pre',     'food_pre_kitchen',   'القسم الأول: فحص معدات المطبخ الرئيسي', 'يُعبَّأ مرة قبل بدء الموسم',           'once',     10),
('food', 'pre',     'food_pre_buffet',    'القسم الأول (تابع): فحص معدات البوفيهات',   'يُعبَّأ مرة قبل بدء الموسم',       'once',     20),
('food', 'pre',     'food_pre_workforce', 'القسم الثاني: فحص العمالة والوثائق',          'الحد الأدنى من العمالة + توثيق',  'once',     30),
('food', 'pre',     'food_pre_readiness', 'القسم الثالث: محضر الجاهزية التشغيلية (15 بند)', 'يُعتمد قبل 48 ساعة من بدء العمل', 'once',     40),

-- اليومية
('food', 'daily',   'food_daily_0',       'القائمة 0: بداية الوردية — تسليم وحضور وتنبيهات',  'تُعبَّأ في بداية كل وردية',       'per_shift', 10),
('food', 'daily',   'food_daily_a',       'القائمة أ: الوجبات وسلامة الغذاء',                  'تُعبَّأ 3 مرات يومياً',          'per_meal',  20),
('food', 'daily',   'food_daily_b',       'القائمة ب: الأركان والخدمات',                        'تُعبَّأ كل 4 ساعات',             'per_4h',    30),
('food', 'daily',   'food_daily_c',       'القائمة ج: سجل البلاغات والمخالفات',                'عند الحدوث فقط',                  'on_event',  40),
('food', 'daily',   'food_daily_d',       'القائمة د: ملخص اليوم',                              'مرة واحدة قبل 11 مساءً',           'daily',     50),

-- النهائية
('food', 'closing', 'food_close_arafa',   'القائمة 1: يوم عرفة (9 ذي الحجة)',                  NULL, 'on_event', 10),
('food', 'closing', 'food_close_muzdalifa','القائمة 2: فحص علب مزدلفة (ليلة 9/10)',           NULL, 'on_event', 20),
('food', 'closing', 'food_close_eid',     'القائمة 3: احتفال العيد (10 ذي الحجة مساءً)',     NULL, 'on_event', 30),
('food', 'closing', 'food_close_kpi',     'القائمة 4: بطاقة KPI الأسبوعية',                     NULL, 'weekly',   40),
('food', 'closing', 'food_close_handover','القائمة 5: التسليم النهائي (14 ذي الحجة)',          'خلال 48 ساعة من نهاية الموسم', 'once', 50);


-- ─── النقل ─────────────────────────────────────────────────────────────

INSERT INTO contract_checklists (domain_id, phase_id, code, name_ar, description, frequency, sort_order) VALUES
('transport', 'pre',   'tr_pre_timeline', 'أولاً: المراحل الزمنية الإلزامية قبل التشغيل',  'يبدأ من 10 ذو القعدة',  'once',  10),
('transport', 'pre',   'tr_pre_readiness','ثانياً: محضر الجاهزية التشغيلية (15 بند)',       'يُعتمد قبل 5 ذي الحجة',  'once',  20),
('transport', 'daily', 'tr_daily',        'المتابعة اليومية لأداء متعهّد النقل',           'تُعبَّأ كل يوم تشغيل (7-13)', 'daily', 10);


-- ─── الحراسات ──────────────────────────────────────────────────────────

INSERT INTO contract_checklists (domain_id, phase_id, code, name_ar, description, frequency, sort_order) VALUES
('security', 'pre',   'sec_pre_timeline', 'أولاً: المراحل الزمنية الإلزامية قبل التشغيل',  'يبدأ من 20 شوال',        'once',  10),
('security', 'pre',   'sec_pre_readiness','ثانياً: محضر الجاهزية التشغيلية (17 بند)',       'يُعتمد قبل 10 ذو القعدة', 'once',  20),
('security', 'daily', 'sec_daily',        'المتابعة اليومية لأداء متعهّد الحراسات',         'تُعبَّأ كل يوم تشغيل',     'daily', 10),
('security', 'daily', 'sec_daily_peak',   'متابعة أيام الذروة (8-13 ذي الحجة)',             'متابعة مكثفة لأيام الذروة','daily', 20);


-- ═══════════════════════════════════════════════════════════════════════
-- 2) معايير الإعاشة (Food Criteria)
-- ═══════════════════════════════════════════════════════════════════════
-- ملاحظة: المعايير هنا قوالب (contract_id = NULL) تطبق على كل العقود
-- الكميات المطلوبة (required_qty) ستُعدَّل لاحقاً لكل عقد بحسب عدد الحجاج

-- ─── معدات المطبخ الرئيسي (28 بند) ────────────────────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_pre_kitchen')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, qty_unit, sort_order) VALUES
((SELECT id FROM checklist), 'kitchen', 'فرن كونفكشن 20 صينية',         'compliance', 'وحدة',   10),
((SELECT id FROM checklist), 'kitchen', 'فرن كونفكشن 40 صينية',         'compliance', 'وحدة',   20),
((SELECT id FROM checklist), 'kitchen', 'قلاية زيت',                     'compliance', 'وحدة',   30),
((SELECT id FROM checklist), 'kitchen', 'هوت كيبن ≥65°م',                'compliance', 'وحدة',   40),
((SELECT id FROM checklist), 'kitchen', 'هاند مكسر',                     'compliance', 'وحدة',   50),
((SELECT id FROM checklist), 'kitchen', 'خلاط',                          'compliance', 'وحدة',   60),
((SELECT id FROM checklist), 'kitchen', 'مفرمة لحم',                     'compliance', 'وحدة',   70),
((SELECT id FROM checklist), 'kitchen', 'قطاعة خضار',                    'compliance', 'وحدة',   80),
((SELECT id FROM checklist), 'kitchen', 'قطاعة لحوم باردة',              'compliance', 'وحدة',   90),
((SELECT id FROM checklist), 'kitchen', 'قدور طبخ مقاس 120',             'compliance', 'وحدة',  100),
((SELECT id FROM checklist), 'kitchen', 'مصافي الأرز',                   'compliance', 'وحدة',  110),
((SELECT id FROM checklist), 'kitchen', 'مصافي الشبك',                   'compliance', 'وحدة',  120),
((SELECT id FROM checklist), 'kitchen', 'ديب فريزر مقاس 160',            'compliance', 'وحدة',  130),
((SELECT id FROM checklist), 'kitchen', 'ترولي خدمة',                    'compliance', 'وحدة',  140),
((SELECT id FROM checklist), 'kitchen', 'ترولي سفندشات',                 'compliance', 'وحدة',  150),
((SELECT id FROM checklist), 'kitchen', 'صاعق حشرات كهربائي',            'compliance', 'وحدة',  160),
((SELECT id FROM checklist), 'kitchen', 'آيس مكسر 80 لتر',                'compliance', 'وحدة',  170),
((SELECT id FROM checklist), 'kitchen', 'بولات سلطات ستانلس',            'compliance', 'وحدة',  180),
((SELECT id FROM checklist), 'kitchen', 'أطباق سلطات',                   'compliance', 'وحدة',  190),
((SELECT id FROM checklist), 'kitchen', 'مرايات سلطات',                  'compliance', 'وحدة',  200),
((SELECT id FROM checklist), 'kitchen', 'مرايات حلويات',                 'compliance', 'وحدة',  210),
((SELECT id FROM checklist), 'kitchen', 'حافظات استيل عادية',            'compliance', 'وحدة',  220),
((SELECT id FROM checklist), 'kitchen', 'حافظات استيل ذات رف',           'compliance', 'وحدة',  230),
((SELECT id FROM checklist), 'kitchen', 'شاشة عرض منيو + كاميرات',       'compliance', 'مجموعة', 240),
((SELECT id FROM checklist), 'kitchen', 'مولد كهرباء احتياطي',           'compliance', 'وحدة',  250),
((SELECT id FROM checklist), 'kitchen', 'صندوق إسعافات أولية',           'compliance', 'وحدة',  260),
((SELECT id FROM checklist), 'kitchen', 'فلتر مياه',                     'compliance', 'وحدة',  270),
((SELECT id FROM checklist), 'kitchen', 'ثلاجة باب تبريد للصوصات',       'compliance', 'وحدة',  280);


-- ─── معدات البوفيهات (14 بند) ─────────────────────────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_pre_buffet')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, qty_unit, sort_order) VALUES
((SELECT id FROM checklist), 'buffet', 'سفديشات مستطيل',                       'compliance', 'وحدة', 10),
((SELECT id FROM checklist), 'buffet', 'استاندات رفع للسلطة',                  'compliance', 'وحدة', 20),
((SELECT id FROM checklist), 'buffet', 'سلت خبز',                              'compliance', 'وحدة', 30),
((SELECT id FROM checklist), 'buffet', 'استاندات حلى',                         'compliance', 'وحدة', 40),
((SELECT id FROM checklist), 'buffet', 'سخانات شاي',                           'compliance', 'وحدة', 50),
((SELECT id FROM checklist), 'buffet', 'علب بغطاء (شاي/نسكافيه/حليب/سكر)',     'compliance', 'وحدة', 60),
((SELECT id FROM checklist), 'buffet', 'سلات المعالق',                         'compliance', 'وحدة', 70),
((SELECT id FROM checklist), 'buffet', 'ماكينة كورن فليكس 2 فاتحة',            'compliance', 'وحدة', 80),
((SELECT id FROM checklist), 'buffet', 'سلات سناكات',                          'compliance', 'وحدة', 90),
((SELECT id FROM checklist), 'buffet', 'معالق غرف',                            'compliance', 'وحدة', 100),
((SELECT id FROM checklist), 'buffet', 'ماسك أكل',                             'compliance', 'وحدة', 110),
((SELECT id FROM checklist), 'buffet', 'ثلاجة شوكولاتة لكل بوفيه',             'compliance', 'وحدة', 120),
((SELECT id FROM checklist), 'buffet', 'ثلاجات عرض في منى',                   'compliance', 'وحدة', 130),
((SELECT id FROM checklist), 'buffet', 'مركبة نقل مجهزة حرارياً + تصريح',     'compliance', 'وحدة', 140);


-- ─── محضر الجاهزية للإعاشة (15 بند) ────────────────────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_pre_readiness')
INSERT INTO contract_criteria (checklist_id, section, name_ar, description, answer_type, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'readiness', 'القوائم الغذائية',           'مقدمة ومعتمدة خطياً',                'checkbox', FALSE, 10),
((SELECT id FROM checklist), 'readiness', 'المعدات والتجهيزات',          'مركّبة ومفحوصة وفق القوائم',        'checkbox', TRUE,  20),
((SELECT id FROM checklist), 'readiness', 'التصاريح الحكومية',           'جميعها سارية',                       'checkbox', TRUE,  30),
((SELECT id FROM checklist), 'readiness', 'الشهادات الصحية للعمالة',     '100% من العمالة',                    'checkbox', TRUE,  40),
((SELECT id FROM checklist), 'readiness', 'تدريب HACCP للجميع',           'منفذ وموثق',                         'checkbox', TRUE,  50),
((SELECT id FROM checklist), 'readiness', 'تمرين المحاكاة (Drill)',      'منفذ وموثق بالصور',                  'checkbox', FALSE, 60),
((SELECT id FROM checklist), 'readiness', 'خطة الطوارئ المكتوبة',         'مقدمة ومعتمدة',                      'checkbox', FALSE, 70),
((SELECT id FROM checklist), 'readiness', 'مسؤول الجودة + 2 مراقبين',     'معينون ومتاحون',                     'checkbox', FALSE, 80),
((SELECT id FROM checklist), 'readiness', 'المستودعات والتبريد',         'جاهزة بالحرارة المطلوبة',           'checkbox', TRUE,  90),
((SELECT id FROM checklist), 'readiness', 'المركبات وتصاريحها',           'مفحوصة وسارية',                      'checkbox', FALSE, 100),
((SELECT id FROM checklist), 'readiness', 'الأركان الستة مجهزة',          'جميع الأصناف متوفرة',                'checkbox', FALSE, 110),
((SELECT id FROM checklist), 'readiness', 'ضمان حسن التنفيذ',             'مقدم للطرف الثاني',                  'checkbox', TRUE,  120),
((SELECT id FROM checklist), 'readiness', 'التأمين التجاري',              'وثيقة سارية',                        'checkbox', TRUE,  130),
((SELECT id FROM checklist), 'readiness', 'معدات وقاية العمالة',          '100% موزعة',                          'checkbox', FALSE, 140),
((SELECT id FROM checklist), 'readiness', 'العينات المرجعية',              'حاويات + تسميات + مبردات',           'checkbox', FALSE, 150);


-- ─── القائمة أ اليومية للإعاشة (الوجبات وسلامة الغذاء) ─────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_daily_a')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, min_value, max_value, qty_unit, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'meals', 'مطابقة القائمة الغذائية',                    'compliance',  NULL,  NULL, NULL,    TRUE,  10),
((SELECT id FROM checklist), 'meals', 'حرارة الوجبات الساخنة',                       'temperature', 65,    NULL, '°م',    TRUE,  20),
((SELECT id FROM checklist), 'meals', 'حرارة ثلاجة التبريد',                          'temperature', NULL,  5,    '°م',    TRUE,  30),
((SELECT id FROM checklist), 'meals', 'حرارة الفريزر',                                 'temperature', NULL,  -18,  '°م',    TRUE,  40),
((SELECT id FROM checklist), 'meals', 'مدة عرض البوفيه',                              'number',      NULL,  60,   'دقيقة', FALSE, 50),
((SELECT id FROM checklist), 'meals', 'العينات المرجعية محفوظة',                       'yesno',       NULL,  NULL, NULL,    FALSE, 60),
((SELECT id FROM checklist), 'meals', 'تطبيق FIFO',                                    'yesno',       NULL,  NULL, NULL,    FALSE, 70),
((SELECT id FROM checklist), 'meals', 'لا يوجد عامل مريض',                            'yesno',       NULL,  NULL, NULL,    TRUE,  80),
((SELECT id FROM checklist), 'meals', 'النظافة الشخصية للعمالة',                      'compliance',  NULL,  NULL, NULL,    TRUE,  90),
((SELECT id FROM checklist), 'meals', 'فصل مناطق التحضير',                            'compliance',  NULL,  NULL, NULL,    TRUE,  100),
((SELECT id FROM checklist), 'meals', 'تعقيم الأسطح',                                  'yesno',       NULL,  NULL, NULL,    FALSE, 110),
((SELECT id FROM checklist), 'meals', 'التخلص من المخلفات',                            'yesno',       NULL,  NULL, NULL,    FALSE, 120),
((SELECT id FROM checklist), 'meals', 'عدد التيبسي المقدم',                            'number',      NULL,  NULL, 'تيبسي', FALSE, 130);


-- ─── القائمة ب اليومية للإعاشة (الأركان والخدمات — 7 أركان) ────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_daily_b')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, sort_order) VALUES
((SELECT id FROM checklist), 'stations', 'ركن القهوة السعودية',                'yesno', 10),
((SELECT id FROM checklist), 'stations', 'ركن المشروبات بارد/ساخن',            'yesno', 20),
((SELECT id FROM checklist), 'stations', 'ركن السناكات (14 صنف)',              'yesno', 30),
((SELECT id FROM checklist), 'stations', 'ركن الفاكهة والعصير (15 صنف)',       'yesno', 40),
((SELECT id FROM checklist), 'stations', 'ركن الآيس كريم والشوكولاتة',         'yesno', 50),
((SELECT id FROM checklist), 'stations', 'ركن كوفي/بارستا/موهيتو',             'yesno', 60),
((SELECT id FROM checklist), 'stations', 'ركن الشواية (أيام 8/10/11 فقط)',     'yesno', 70),
((SELECT id FROM checklist), 'stations', 'عصير الفاكهة لايف يعمل',              'yesno', 80);


-- ─── القائمة د اليومية للإعاشة (ملخص اليوم) ────────────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_daily_d')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, sort_order) VALUES
((SELECT id FROM checklist), 'summary', 'عدد الحجاج المخدومين اليوم',                'number',     10),
((SELECT id FROM checklist), 'summary', 'الوجبات الثلاث اكتملت',                      'yesno',      20),
((SELECT id FROM checklist), 'summary', 'جميع الأركان عملت 24 ساعة',                  'yesno',      30),
((SELECT id FROM checklist), 'summary', 'عدد الشكاوى المسجلة',                        'number',     40),
((SELECT id FROM checklist), 'summary', 'عدد الحضور الفعلي',                          'number',     50),
((SELECT id FROM checklist), 'summary', 'حالة المخزون',                                'compliance', 60),
((SELECT id FROM checklist), 'summary', 'مخالفات صحية جسيمة',                          'yesno',      70),
((SELECT id FROM checklist), 'summary', 'CAPA منفذة',                                  'yesno',      80);


-- ═══════════════════════════════════════════════════════════════════════
-- 3) معايير النقل (Transport Criteria)
-- ═══════════════════════════════════════════════════════════════════════

-- ─── المراحل الزمنية الإلزامية (5 بنود) ────────────────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'tr_pre_timeline')
INSERT INTO contract_criteria (checklist_id, section, name_ar, description, answer_type, sort_order) VALUES
((SELECT id FROM checklist), 'timeline', 'تقديم قائمة الأسطول كاملة (24+2) واعتماد نظام GPS', 'الموعد: 10 ذو القعدة', 'compliance', 10),
((SELECT id FROM checklist), 'timeline', 'بدء توظيف وتأهيل السائقين والتأكد من الرخص والتصاريح', 'الموعد: 15 ذو القعدة', 'compliance', 20),
((SELECT id FROM checklist), 'timeline', 'إنجاز جميع التصاريح الحكومية وتسليم نسخ معتمدة',     'الموعد: 25 ذو القعدة', 'compliance', 30),
((SELECT id FROM checklist), 'timeline', 'زيارة ميدانية مشتركة لنقاط التجمّع بجدة والمخيم',   'الموعد: 3 ذي الحجة',  'compliance', 40),
((SELECT id FROM checklist), 'timeline', 'اعتماد محضر الجاهزية التشغيلية الكامل من الطرفين',  'الموعد: 5 ذي الحجة',  'compliance', 50);


-- ─── محضر الجاهزية للنقل (15 بند) ──────────────────────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'tr_pre_readiness')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'fleet',  'قائمة الأسطول الكاملة (24+2) معتمدة كتابياً',         'compliance', TRUE,  10),
((SELECT id FROM checklist), 'fleet',  'أرقام GPS لكل حافلة مفعّلة ومُختبرة',                  'compliance', TRUE,  20),
((SELECT id FROM checklist), 'fleet',  'كاميرات داخلية وخارجية مفعّلة - اختبار 100%',          'compliance', TRUE,  30),
((SELECT id FROM checklist), 'permits','التصاريح الحكومية (هيئة النقل ووزارة الحج)',           'compliance', TRUE,  40),
((SELECT id FROM checklist), 'permits','تصاريح المشاعر - 100% من 24 حافلة و30 سائقاً',         'compliance', TRUE,  50),
((SELECT id FROM checklist), 'permits','وثيقة التأمين الشامل سارية',                            'compliance', TRUE,  60),
((SELECT id FROM checklist), 'drivers','رخص القيادة العمومية للسائقين 100% فئة (2)',           'compliance', TRUE,  70),
((SELECT id FROM checklist), 'drivers','اللياقة الطبية للسائقين 100% خلال 6 أشهر',             'compliance', TRUE,  80),
((SELECT id FROM checklist), 'ops',    'خطة الطوارئ المكتوبة - مقدّمة ومعتمدة',                'compliance', FALSE, 90),
((SELECT id FROM checklist), 'ops',    'مدير العملية الميداني - معيَّن مع مساعدَين',           'compliance', FALSE, 100),
((SELECT id FROM checklist), 'ops',    'غرفة العمليات وشاشات GPS - جاهزة ومختبرة',             'compliance', FALSE, 110),
((SELECT id FROM checklist), 'ops',    'فنّي الصيانة وسيارة العدّة - متمركز قرب المخيم',       'compliance', FALSE, 120),
((SELECT id FROM checklist), 'ops',    'زي السائقين وبطاقات التعريف - 100% موزّع',             'compliance', FALSE, 130),
((SELECT id FROM checklist), 'ops',    'خطة استمرارية الخدمة - موثّقة ومدرَّب عليها',         'compliance', FALSE, 140),
((SELECT id FROM checklist), 'ops',    'محضر معاينة المسارات والمواقف - موقّع من الطرفين',     'compliance', FALSE, 150);


-- ─── المتابعة اليومية للنقل (12 بند) ──────────────────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'tr_daily')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, required_qty, qty_unit, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'fleet',  'الحافلات الرئيسية المتاحة',                  'ratio',      24, 'حافلة', FALSE, 10),
((SELECT id FROM checklist), 'fleet',  'الأسطول الاحتياطي متاح',                     'ratio',      2,  'حافلة', FALSE, 20),
((SELECT id FROM checklist), 'drivers','السائقون والكادر حاضرون',                    'ratio',      36, 'فرد',   FALSE, 30),
((SELECT id FROM checklist), 'tech',   'GPS فعّال على كل الحافلات',                 'number',     100,'%',     FALSE, 40),
((SELECT id FROM checklist), 'tech',   'الكاميرات تعمل وتسجّل',                     'ratio',      24, 'حافلة', FALSE, 50),
((SELECT id FROM checklist), 'tech',   'الفحص اليومي للحافلات موثّق',               'ratio',      24, 'حافلة', FALSE, 60),
((SELECT id FROM checklist), 'ops',    'الالتزام بمواعيد التحرّك',                  'compliance', NULL, NULL,  FALSE, 70),
((SELECT id FROM checklist), 'ops',    'الالتزام بحدود السرعة',                     'compliance', NULL, NULL,  FALSE, 80),
((SELECT id FROM checklist), 'ops',    'نظافة الحافلات ومياه الشرب',                'compliance', NULL, NULL,  FALSE, 90),
((SELECT id FROM checklist), 'ops',    'التقرير اليومي مُرسَل قبل 11 مساءً',         'compliance', NULL, NULL,  FALSE, 100),
((SELECT id FROM checklist), 'safety', 'صحة الوثائق والتصاريح 100%',                'compliance', NULL, NULL,  TRUE,  110),
((SELECT id FROM checklist), 'safety', 'صفر حادث وصفر مخالفة سلامة جسيمة',          'compliance', NULL, NULL,  TRUE,  120);


-- ═══════════════════════════════════════════════════════════════════════
-- 4) معايير الحراسات (Security Criteria)
-- ═══════════════════════════════════════════════════════════════════════

-- ─── المراحل الزمنية الإلزامية للحراسات (7 بنود) ──────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'sec_pre_timeline')
INSERT INTO contract_criteria (checklist_id, section, name_ar, description, answer_type, sort_order) VALUES
((SELECT id FROM checklist), 'timeline', 'تقديم قائمة الكادر الكاملة (14+2) بالأسماء والهويات والتراخيص', 'الموعد: 20 شوال',          'compliance', 10),
((SELECT id FROM checklist), 'timeline', 'تقديم نسخ معتمدة من رخص العمل الأمني وشهادات اللياقة',           'الموعد: 25 شوال',          'compliance', 20),
((SELECT id FROM checklist), 'timeline', 'إنجاز جميع تصاريح المشاعر للكادر وتسليم نسخ معتمدة',           'الموعد: 1 ذو القعدة',     'compliance', 30),
((SELECT id FROM checklist), 'timeline', 'تسليم بيانات الزي الموحّد وبطاقات التعريف والمعدات الأمنية',     'الموعد: 5 ذو القعدة',     'compliance', 40),
((SELECT id FROM checklist), 'timeline', 'اعتماد محضر الجاهزية التشغيلية الكامل من الطرفين',               'الموعد: 10 ذو القعدة',     'compliance', 50),
((SELECT id FROM checklist), 'timeline', 'زيارة ميدانية مشتركة لمخيمات الطرف الثاني للتنسيق',              'الموعد: 12 ذو القعدة',     'compliance', 60),
((SELECT id FROM checklist), 'timeline', 'بدء التشغيل الفعلي - وصول الكادر واستلام نقاط الحراسة',          'الموعد: 15 ذو القعدة',     'compliance', 70);


-- ─── محضر الجاهزية للحراسات (17 بند) ──────────────────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'sec_pre_readiness')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'workforce','قائمة الكادر الكاملة (14+2) بأسمائهم وهوياتهم معتمدة كتابياً','compliance', TRUE,  10),
((SELECT id FROM checklist), 'permits',  'تراخيص العمل الأمني من وزارة الداخلية 100%',                  'compliance', TRUE,  20),
((SELECT id FROM checklist), 'permits',  'تصاريح المشاعر للكادر 100% من 16 فرداً',                      'compliance', TRUE,  30),
((SELECT id FROM checklist), 'workforce','اللياقة الطبية لكل فرد 100% خلال 6 أشهر',                     'compliance', TRUE,  40),
((SELECT id FROM checklist), 'workforce','تقارير الفحص الأمني والسلوك 100% خالية من السوابق',           'compliance', TRUE,  50),
((SELECT id FROM checklist), 'permits',  'وثيقة التأمين التجاري سارية',                                  'compliance', TRUE,  60),
((SELECT id FROM checklist), 'training', 'التدريب الأمني المعتمد قبل الموسم بـ 10 أيام 100% اجتاز',     'compliance', TRUE,  70),
((SELECT id FROM checklist), 'equipment','الزي الموحّد وبطاقات التعريف 100% موزّع وجاهز',               'compliance', FALSE, 80),
((SELECT id FROM checklist), 'equipment','أجهزة الاتصال اللاسلكي - تكفي 16 جهازاً + احتياط',            'compliance', FALSE, 90),
((SELECT id FROM checklist), 'ops',      'خطة الطوارئ المكتوبة والمعتمدة مقدّمة',                       'compliance', FALSE, 100),
((SELECT id FROM checklist), 'ops',      'المشرف الميداني معيَّن ومتاح',                                'compliance', FALSE, 110),
((SELECT id FROM checklist), 'ops',      'أرقام التواصل مع الجهات الأمنية محفوظة في كل نقطة',           'compliance', FALSE, 120),
((SELECT id FROM checklist), 'equipment','علب الإسعافات الأولية كاملة في كل نقطة',                       'compliance', FALSE, 130),
((SELECT id FROM checklist), 'ops',      'زيارة معاينة المواقع منفذة وموثّقة بمحضر',                    'compliance', FALSE, 140),
((SELECT id FROM checklist), 'ops',      'خطة الورديات الأسبوعية معتمدة من المشرف',                     'compliance', FALSE, 150),
((SELECT id FROM checklist), 'workforce','تعهّد السرية الموقّع من كل فرد 100% موقّع',                  'compliance', FALSE, 160),
((SELECT id FROM checklist), 'equipment','نظام تسجيل الدوريات (إلكتروني أو يدوي) جاهز ومُختبَر',         'compliance', FALSE, 170);


-- ─── المتابعة اليومية للحراسات (13 بند) ───────────────────────────────
WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'sec_daily')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, required_qty, qty_unit, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'workforce','حضور الكادر كامل في كل وردية',                  'ratio',      14, 'فرد', FALSE, 10),
((SELECT id FROM checklist), 'workforce','الكادر الاحتياطي متاح (رجل + امرأة)',           'ratio',      2,  'فرد', FALSE, 20),
((SELECT id FROM checklist), 'equipment','اكتمال الزي الموحّد وبطاقات التعريف',           'compliance', NULL, NULL,  FALSE, 30),
((SELECT id FROM checklist), 'equipment','أجهزة الاتصال اللاسلكي تعمل',                   'compliance', NULL, NULL,  FALSE, 40),
((SELECT id FROM checklist), 'equipment','كاميرات المراقبة فعّالة وتسجّل',                'compliance', NULL, NULL,  FALSE, 50),
((SELECT id FROM checklist), 'patrol',  'الدوريات الموثّقة كل ساعة',                      'ratio',      24, 'دورية',FALSE, 60),
((SELECT id FROM checklist), 'equipment','علب الإسعافات كاملة في كل نقطة',                'compliance', NULL, NULL,  FALSE, 70),
((SELECT id FROM checklist), 'reporting','التقرير اليومي مُرسَل قبل 10 مساءً',             'compliance', NULL, NULL,  FALSE, 80),
((SELECT id FROM checklist), 'workforce','كشف الحضور والانصراف موثّق',                    'compliance', NULL, NULL,  FALSE, 90),
((SELECT id FROM checklist), 'safety',  'صحة الوثائق والتصاريح 100%',                     'compliance', NULL, NULL,  TRUE,  100),
((SELECT id FROM checklist), 'safety',  'صفر حالة نوم أثناء الخدمة',                      'compliance', NULL, NULL,  TRUE,  110),
((SELECT id FROM checklist), 'safety',  'صفر تحرّش أو إساءة لأي حاج',                    'compliance', NULL, NULL,  TRUE,  120),
((SELECT id FROM checklist), 'safety',  'صفر اقتحام أو مخالفة سلامة جسيمة',               'compliance', NULL, NULL,  TRUE,  130);


-- ═══════════════════════════════════════════════════════════════════════
-- 5) تعريفات KPI الأسبوعية للإعاشة (12 مؤشر)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO contract_kpi_definitions (domain_id, code, name_ar, target_operator, target_value, target_unit, is_zero_tolerance, sort_order) VALUES
('food', 'on_time_meal',    'الالتزام بوقت تسليم الوجبة',  '>=',  95,    '%',      FALSE, 10),
('food', 'hot_temp',        'حرارة الوجبات الساخنة',         '>=',  65,    '°م',     FALSE, 20),
('food', 'qty_accuracy',    'دقة الكميات المقدمة',           '>=',  98,    '%',      FALSE, 30),
('food', 'menu_match',      'مطابقة القوائم الغذائية',       '=',   100,   '%',      FALSE, 40),
('food', 'stations_24',     'توفر الأركان 24 ساعة',           '=',   100,   '%',      FALSE, 50),
('food', 'buffet_duration', 'متوسط مدة عرض البوفيه',         '<=',  60,    'دقيقة',  FALSE, 60),
('food', 'critical_resp',   'استجابة البلاغ الحرج',          '<=',  5,     'دقيقة',  FALSE, 70),
('food', 'workforce_attend','حضور العمالة',                   '>=',  98,    '%',      FALSE, 80),
('food', 'satisfaction',    'رضا الحجاج',                     '>=',  95,    '%',      FALSE, 90),
('food', 'food_waste',      'نسبة الهدر الغذائي',             '<=',  5,     '%',      FALSE, 100),
('food', 'major_violations','مخالفات صحية جسيمة',             '=',   0,     'حالة',   TRUE,  110),
('food', 'penalty_total',   'الغرامات التراكمية',             '<=',  30,    '%',      FALSE, 120);


-- ═══════════════════════════════════════════════════════════════════════
-- 6) الأدوار الإضافية في النظام
-- ═══════════════════════════════════════════════════════════════════════
-- تذكير: نضيف هذه الأدوار في تطبيق React وفي قائمة الأدوار
-- بدون الحاجة لتعديل بنية users:
--
-- 'contractor_monitor_food'      → مراقب الإعاشة
-- 'contractor_monitor_transport' → مراقب النقل
-- 'contractor_monitor_security'  → مراقب الحراسات
-- 'contractor_pmo'               → مدير المشروع (PMO)

-- ═══════════════════════════════════════════════════════════════════════
-- نهاية Seed Data
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- الجزء الثالث: المتعهدون والعقود الافتراضية
-- ═══════════════════════════════════════════════════════════════════════

-- =================================================================
-- Seed: المتعهدون والعقود الافتراضية
-- =================================================================
-- 3 متعهدين × 4 شركات = 12 عقد محتمل (1 إعاشة لكل شركة + النقل + الحراسات موحد)
-- ملاحظة: متعهد الإعاشة قد يكون مختلفاً لكل شركة (مرونة)
-- النقل والحراسات: متعهد واحد يخدم كل الشركات الأربع
-- =================================================================

-- 1) إنشاء المتعهدين الافتراضيين
-- (يمكن للمدير تعديل الأسماء والتفاصيل لاحقاً من الواجهة)

INSERT INTO contractors (id, name, short_name, notes, active)
VALUES
  -- متعهدو الإعاشة - 3 متعهدين منفصلين (واحد قد يخدم أكثر من شركة)
  ('11111111-1111-1111-1111-111111111111', 'متعهد الإعاشة - الإتقان', 'إعاشة الإتقان',
   'متعهد الإعاشة المخصص لشركة الإتقان (1818 حاج)', TRUE),

  ('22222222-2222-2222-2222-222222222222', 'متعهد الإعاشة - أضواء الإيمان', 'إعاشة أضواء',
   'متعهد الإعاشة المخصص لشركة أضواء الإيمان (1152 حاج)', TRUE),

  ('33333333-3333-3333-3333-333333333333', 'متعهد الإعاشة - الفرائض والناصرية', 'إعاشة الفرائض/الناصرية',
   'متعهد الإعاشة الموحد لشركتي الفرائض (800) والناصرية (1030) - بعض الجلسات مشتركة', TRUE),

  -- متعهد النقل - واحد لكل الشركات الأربع
  ('44444444-4444-4444-4444-444444444444', 'شركة الصفوة للنقل', 'الصفوة',
   'متعهد النقل الموحد لجميع الشركات الأربع (24+2 حافلة لكل شركة)', TRUE),

  -- متعهد الحراسات - واحد لكل الشركات الأربع
  ('55555555-5555-5555-5555-555555555555', 'شركة الإسناد للحراسات', 'الإسناد',
   'متعهد الحراسات الموحد لجميع الشركات الأربع (14+2 فرد لكل شركة)', TRUE)

ON CONFLICT (id) DO NOTHING;


-- 2) إنشاء العقود الـ 12 (4 شركات × 3 مجالات)
-- ملاحظة: نفترض أن companies موجودة بالفعل من نظام البطاقات
-- إذا لم تكن موجودة، سيُتجاهل الإدراج لاحقاً عبر ON CONFLICT

-- جلب معرّفات الشركات من جدول companies (نستخدم WITH للوضوح)
-- وإنشاء العقود بشكل ديناميكي

DO $$
DECLARE
  v_etqan_id      UUID;
  v_adwaa_id      UUID;
  v_faraidh_id    UUID;
  v_nasiriya_id   UUID;
  v_transport_id  UUID := '44444444-4444-4444-4444-444444444444';
  v_security_id   UUID := '55555555-5555-5555-5555-555555555555';
  v_food_etqan    UUID := '11111111-1111-1111-1111-111111111111';
  v_food_adwaa    UUID := '22222222-2222-2222-2222-222222222222';
  v_food_far_nas  UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- محاولة جلب معرّفات الشركات
  SELECT id INTO v_etqan_id FROM companies
    WHERE name LIKE '%الإتقان%' OR name LIKE '%الاتقان%' OR name LIKE '%إتقان%' LIMIT 1;
  SELECT id INTO v_adwaa_id FROM companies
    WHERE name LIKE '%أضواء%' OR name LIKE '%الإيمان%' LIMIT 1;
  SELECT id INTO v_faraidh_id FROM companies
    WHERE name LIKE '%الفرائض%' OR name LIKE '%فرائض%' LIMIT 1;
  SELECT id INTO v_nasiriya_id FROM companies
    WHERE name LIKE '%الناصرية%' OR name LIKE '%ناصرية%' LIMIT 1;

  -- ─── عقود الإعاشة ───
  IF v_etqan_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_food_etqan, v_etqan_id, 'food', 'FOOD-ETQ-1447', '1447', 1818, 30.00, 'عقد إعاشة الإتقان - 1818 حاج')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_adwaa_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_food_adwaa, v_adwaa_id, 'food', 'FOOD-ADW-1447', '1447', 1152, 30.00, 'عقد إعاشة أضواء الإيمان - 1152 حاج')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_faraidh_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_food_far_nas, v_faraidh_id, 'food', 'FOOD-FAR-1447', '1447', 800, 30.00, 'عقد إعاشة الفرائض - 800 حاج (بعض الجلسات مشتركة مع الناصرية)')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_nasiriya_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_food_far_nas, v_nasiriya_id, 'food', 'FOOD-NAS-1447', '1447', 1030, 30.00, 'عقد إعاشة الناصرية - 1030 حاج (بعض الجلسات مشتركة مع الفرائض)')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  -- ─── عقود النقل (متعهد واحد لكل الشركات) ───
  IF v_etqan_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_transport_id, v_etqan_id, 'transport', 'TR-ETQ-1447', '1447', 1818, 30.00, 'عقد النقل للإتقان - 24+2 حافلة')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_adwaa_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_transport_id, v_adwaa_id, 'transport', 'TR-ADW-1447', '1447', 1152, 30.00, 'عقد النقل لأضواء الإيمان')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_faraidh_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_transport_id, v_faraidh_id, 'transport', 'TR-FAR-1447', '1447', 800, 30.00, 'عقد النقل للفرائض')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_nasiriya_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_transport_id, v_nasiriya_id, 'transport', 'TR-NAS-1447', '1447', 1030, 30.00, 'عقد النقل للناصرية')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  -- ─── عقود الحراسات (متعهد واحد لكل الشركات) ───
  IF v_etqan_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_security_id, v_etqan_id, 'security', 'SEC-ETQ-1447', '1447', 1818, 30.00, 'عقد الحراسات للإتقان - 14+2 فرد')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_adwaa_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_security_id, v_adwaa_id, 'security', 'SEC-ADW-1447', '1447', 1152, 30.00, 'عقد الحراسات لأضواء الإيمان')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_faraidh_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_security_id, v_faraidh_id, 'security', 'SEC-FAR-1447', '1447', 800, 30.00, 'عقد الحراسات للفرائض')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_nasiriya_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_security_id, v_nasiriya_id, 'security', 'SEC-NAS-1447', '1447', 1030, 30.00, 'عقد الحراسات للناصرية')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  -- ─── إضافة الشركات إذا لم تكن موجودة (ضمان) ───
  -- لا حاجة، فالمستخدم لديه شركاته بالفعل من نظام البطاقات

END $$;


-- 3) ملاحظة ختامية
-- =================================================================
-- ✓ تم إنشاء 5 متعهدين افتراضيين
-- ✓ تم إنشاء حتى 12 عقد (حسب الشركات الموجودة)
-- ✓ المدير يمكنه تعديل الأسماء والتفاصيل من واجهة إدارة المتعهدين والعقود
-- =================================================================
