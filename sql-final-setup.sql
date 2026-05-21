-- =================================================================
-- منصة إثراء التجربة - SQL النهائي الشامل (الإصدار 3.0)
-- =================================================================
-- يضمن وجود كل ما يحتاجه النظام للعمل بشكل صحيح
-- آمن تماماً للتنفيذ عدة مرات
-- =================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- القسم 1: ضمان وجود الأعمدة في users
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor_company_id UUID REFERENCES companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor_scope_domain TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pmo_domains TEXT[];

-- ═══════════════════════════════════════════════════════════════════════
-- القسم 2: ضمان قيد role يقبل كل الأدوار
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN (
    'admin', 'dashboard', 'data_entry', 'supervisor',
    'contractor_monitor_food', 'contractor_monitor_transport',
    'contractor_monitor_security', 'contractor_pmo'
  )
);

-- ═══════════════════════════════════════════════════════════════════════
-- القسم 3: تعطيل RLS على جميع الجداول التشغيلية
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE violation_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_criteria DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_kpi_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_evaluation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_violations DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- القسم 4: ضمان بيانات Lookup الأساسية
-- ═══════════════════════════════════════════════════════════════════════

-- المجالات
INSERT INTO contract_domains (id, name_ar, icon, sort_order, active) VALUES
  ('food',      'الإعاشة',   'utensils',     1, TRUE),
  ('transport', 'النقل',     'bus',          2, TRUE),
  ('security',  'الحراسات',  'shield-check', 3, TRUE)
ON CONFLICT (id) DO UPDATE SET active = TRUE, name_ar = EXCLUDED.name_ar;

-- المراحل
INSERT INTO contract_phases (id, name_ar, description, sort_order) VALUES
  ('pre',     'القوائم الأولية / الجاهزية', 'تُعبَّأ مرة واحدة قبل بدء الموسم',  1),
  ('daily',   'القوائم اليومية',             'متابعة تشغيلية يومية متكررة',       2),
  ('closing', 'القوائم النهائية / الختامية', 'الأيام الخاصة + KPI + التسليم',     3)
ON CONFLICT (id) DO NOTHING;

-- مستويات المخالفات
INSERT INTO violation_levels (id, name_ar, color, base_penalty, escalation, requires_immediate_escalation, sort_order) VALUES
  ('critical', 'حرج',    '#DC2626', 10.00, '{"first":1,"second":1.5,"third":2}'::jsonb, TRUE,  1),
  ('high',     'عالٍ',   '#EA580C',  5.00, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 2),
  ('medium',   'متوسط',  '#D97706',  2.50, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 3),
  ('low',      'منخفض',  '#65A30D',  1.00, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 4)
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 5: حذف قوائم الذروة المكررة
-- ═══════════════════════════════════════════════════════════════════════

DELETE FROM contract_checklists WHERE code IN ('sec_peak', 'tr_peak', 'food_peak');


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 6: تحويل قوائم الأيام الخاصة إلى daily (لتفلترها الواجهة)
-- ═══════════════════════════════════════════════════════════════════════

UPDATE contract_checklists SET phase_id = 'daily' WHERE code IN (
  'food_close_arafa', 'food_close_muzdalifa', 'food_close_eid'
);


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 7: إكمال المعايير للقوائم الفارغة
-- ═══════════════════════════════════════════════════════════════════════

-- (أ) معايير العمالة والوثائق (الإعاشة)
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_pre_workforce') AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_pre_workforce')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'workforce', name_ar, 'compliance', is_critical, 'on_violation', sort_order
FROM checklist, (VALUES
  ('توفر مدير الموقع بدوام كامل', TRUE, 10),
  ('توفر مشرفين بالعدد المطلوب', TRUE, 20),
  ('توفر طهاة بالعدد المطلوب', TRUE, 30),
  ('توفر عمال نظافة بالعدد المطلوب', FALSE, 40),
  ('توفر عمال خدمة بالعدد المطلوب', FALSE, 50),
  ('صحة الوثائق والإقامات لجميع العمالة', TRUE, 60),
  ('شهادات صحية سارية لكل العمالة', TRUE, 70),
  ('زي موحد ونظيف لكل العمالة', FALSE, 80),
  ('تدريب العمالة على إجراءات السلامة', FALSE, 90),
  ('سجل حضور وانصراف يومي للعمالة', FALSE, 100)
) AS t(name_ar, is_critical, sort_order);

-- (ب) بداية الوردية (الإعاشة)
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_daily_0') AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_daily_0')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'shift_start', name_ar, 'compliance', is_critical, 'on_violation', sort_order
FROM checklist, (VALUES
  ('تسليم الوردية من المشرف السابق', TRUE, 10),
  ('حضور كل أفراد الوردية', TRUE, 20),
  ('فحص نظافة عام للموقع', FALSE, 30),
  ('فحص توفر المواد الأساسية', TRUE, 40),
  ('فحص حالة المعدات والأجهزة', FALSE, 50),
  ('مراجعة جدول الوجبات اليومي', FALSE, 60),
  ('تنبيهات الإدارة لليوم', FALSE, 70),
  ('حالة المخزون من المياه', TRUE, 80)
) AS t(name_ar, is_critical, sort_order);

-- (ج) سجل البلاغات (الإعاشة)
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_daily_c') AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_daily_c')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'reports', name_ar, 'compliance', is_critical, 'always', sort_order
FROM checklist, (VALUES
  ('عدم وجود بلاغات أو شكاوى من الحجاج', FALSE, 10),
  ('عدم وجود حالات تسمم أو طارئة', TRUE, 20),
  ('عدم وجود مخالفات صحية', TRUE, 30),
  ('عدم وجود تأخر في الوجبات', FALSE, 40),
  ('عدم وجود نقص في الكميات', FALSE, 50)
) AS t(name_ar, is_critical, sort_order);

-- (د) يوم عرفة (الإعاشة)
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_arafa') AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_close_arafa')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'arafah', name_ar, 'compliance', is_critical, 'on_violation', sort_order
FROM checklist, (VALUES
  ('جاهزية وجبة الإفطار قبل التوجه لعرفة', TRUE, 10),
  ('تجهيز وجبات سفرية محمولة لكل حاج', TRUE, 20),
  ('توفير مياه باردة بكمية مضاعفة', TRUE, 30),
  ('توفر فرق إعاشة في خيام عرفة', TRUE, 40),
  ('جاهزية وجبة الغداء في عرفة قبل الزوال', TRUE, 50),
  ('متابعة استلام الوجبات من كل خيمة', FALSE, 60),
  ('سرعة الاستجابة لطلبات الإغاثة الطارئة', TRUE, 70),
  ('جاهزية وجبة عشاء مزدلفة', TRUE, 80)
) AS t(name_ar, is_critical, sort_order);

-- (هـ) مزدلفة (الإعاشة)
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_muzdalifa') AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_close_muzdalifa')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'muzdalifa', name_ar, 'compliance', is_critical, 'on_violation', sort_order
FROM checklist, (VALUES
  ('جاهزية علب طعام مزدلفة بالعدد المطلوب', TRUE, 10),
  ('فحص سلامة تغليف العلب', TRUE, 20),
  ('فحص حرارة وصلاحية الطعام', TRUE, 30),
  ('فحص توفر مياه شرب مع كل علبة', TRUE, 40),
  ('تنظيم توزيع العلب على الحافلات', FALSE, 50)
) AS t(name_ar, is_critical, sort_order);

-- (و) العيد (الإعاشة)
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_eid') AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_close_eid')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'eid', name_ar, 'compliance', is_critical, 'on_violation', sort_order
FROM checklist, (VALUES
  ('تجهيز وجبة عيد خاصة (لحم الأضاحي)', TRUE, 10),
  ('تنوع وجودة طبق العيد', FALSE, 20),
  ('تقديم حلويات وضيافة العيد', FALSE, 30),
  ('تزيين البوفيهات بمناسبة العيد', FALSE, 40),
  ('سرعة تقديم الوجبات بعد رمي الجمرة', TRUE, 50)
) AS t(name_ar, is_critical, sort_order);

-- (ز) التسليم النهائي (الإعاشة)
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_handover') AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_close_handover')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'handover', name_ar, 'compliance', is_critical, 'on_violation', sort_order
FROM checklist, (VALUES
  ('تسليم الموقع بحالة نظيفة وكاملة', TRUE, 10),
  ('جرد كامل للمعدات والأجهزة', TRUE, 20),
  ('إعادة المواد والمخزون المتبقي', FALSE, 30),
  ('تسليم سجلات العمل والتقارير', TRUE, 40),
  ('توقيع محضر التسليم النهائي', TRUE, 50)
) AS t(name_ar, is_critical, sort_order);

-- (ح) KPI الإعاشة
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_kpi') AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_close_kpi')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'kpi', name_ar, 'compliance', is_critical, 'on_violation', sort_order
FROM checklist, (VALUES
  ('تحقيق نسبة 95% في الالتزام بأوقات الوجبات', TRUE, 10),
  ('تحقيق نسبة 100% في مطابقة القوائم الغذائية', TRUE, 20),
  ('عدم تجاوز 30% غرامات تراكمية', TRUE, 30),
  ('صفر حالات تسمم أو طوارئ صحية', TRUE, 40)
) AS t(name_ar, is_critical, sort_order);


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 8: التحقق النهائي - تقرير شامل
-- ═══════════════════════════════════════════════════════════════════════

SELECT
  '✅ الجداول التشغيلية' AS report,
  (SELECT COUNT(*) FROM contract_domains WHERE active = TRUE) AS domains,
  (SELECT COUNT(*) FROM contract_phases) AS phases,
  (SELECT COUNT(*) FROM violation_levels) AS levels,
  (SELECT COUNT(*) FROM contract_checklists WHERE active = TRUE) AS checklists,
  (SELECT COUNT(*) FROM contract_criteria WHERE active = TRUE AND company_id IS NULL) AS template_criteria,
  (SELECT COUNT(*) FROM contract_kpi_definitions) AS kpis;

-- تقرير المعايير لكل قائمة
SELECT
  cd.name_ar AS domain,
  cp.name_ar AS phase,
  cl.code,
  cl.name_ar AS checklist,
  COUNT(cr.id) AS criteria_count
FROM contract_checklists cl
JOIN contract_domains cd ON cd.id = cl.domain_id
JOIN contract_phases cp ON cp.id = cl.phase_id
LEFT JOIN contract_criteria cr ON cr.checklist_id = cl.id AND cr.company_id IS NULL AND cr.active = TRUE
WHERE cl.active = TRUE
GROUP BY cd.name_ar, cd.sort_order, cp.name_ar, cp.sort_order, cl.code, cl.name_ar, cl.sort_order
ORDER BY cd.sort_order, cp.sort_order, cl.sort_order;
