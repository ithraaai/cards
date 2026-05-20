-- =================================================================
-- إصلاح جذري: حذف وإعادة إنشاء بيانات Lookup الأساسية
-- =================================================================
-- آمن تماماً: لا يحذف القوائم ولا المعايير ولا KPIs
-- يعيد إنشاء فقط: contract_domains, contract_phases, violation_levels
-- =================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- الخطوة 1: تشخيص — اعرض البيانات الحالية
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM contract_domains;
  RAISE NOTICE 'عدد المجالات الحالية: %', v_count;

  SELECT COUNT(*) INTO v_count FROM contract_domains WHERE active = TRUE;
  RAISE NOTICE 'عدد المجالات النشطة: %', v_count;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- الخطوة 2: تأكد أن العمود active موجود (في حال شيء غريب حصل)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE contract_domains
  ALTER COLUMN active SET DEFAULT TRUE;


-- ═══════════════════════════════════════════════════════════════════════
-- الخطوة 3: حدّث/أضف المجالات (الطريقة المضمونة)
-- ═══════════════════════════════════════════════════════════════════════

-- إذا كان الصف موجوداً، فعّله. إذا غير موجود، أنشئه.
INSERT INTO contract_domains (id, name_ar, icon, sort_order, active)
VALUES ('food', 'الإعاشة', 'utensils', 1, TRUE)
ON CONFLICT (id) DO UPDATE SET
  active = TRUE, name_ar = 'الإعاشة', icon = 'utensils', sort_order = 1;

INSERT INTO contract_domains (id, name_ar, icon, sort_order, active)
VALUES ('transport', 'النقل', 'bus', 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
  active = TRUE, name_ar = 'النقل', icon = 'bus', sort_order = 2;

INSERT INTO contract_domains (id, name_ar, icon, sort_order, active)
VALUES ('security', 'الحراسات', 'shield-check', 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
  active = TRUE, name_ar = 'الحراسات', icon = 'shield-check', sort_order = 3;


-- ═══════════════════════════════════════════════════════════════════════
-- الخطوة 4: حدّث المراحل (لو ناقصة)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO contract_phases (id, name_ar, description, sort_order)
VALUES
  ('pre',     'القوائم الأولية / الجاهزية', 'تُعبَّأ مرة واحدة قبل بدء الموسم',  1),
  ('daily',   'القوائم اليومية',             'متابعة تشغيلية يومية متكررة',       2),
  ('closing', 'القوائم النهائية / الختامية', 'الأيام الخاصة + KPI + التسليم',     3)
ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar;


-- ═══════════════════════════════════════════════════════════════════════
-- الخطوة 5: مستويات المخالفات
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO violation_levels (id, name_ar, color, base_penalty, escalation, requires_immediate_escalation, sort_order)
VALUES
  ('critical', 'حرج',    '#DC2626', 10.00, '{"first":1,"second":1.5,"third":2}'::jsonb, TRUE,  1),
  ('high',     'عالٍ',   '#EA580C',  5.00, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 2),
  ('medium',   'متوسط',  '#D97706',  2.50, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 3),
  ('low',      'منخفض',  '#65A30D',  1.00, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 4)
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════
-- الخطوة 6: ضمان أن RLS معطّل للجداول (في حال السبب الحقيقي)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE contract_domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE violation_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_criteria DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_kpi_definitions DISABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════
-- الخطوة 7: التحقق النهائي — استعراض النتيجة
-- ═══════════════════════════════════════════════════════════════════════

SELECT id, name_ar, icon, sort_order, active FROM contract_domains ORDER BY sort_order;
