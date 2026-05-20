-- =================================================================
-- إصلاح فوري: ضمان وجود البيانات الأساسية + دعم PMO بمجالات متعددة
-- =================================================================
-- هذا الملف آمن للتنفيذ عدة مرات
-- =================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- القسم 1: ضمان وجود المجالات والمراحل ومستويات المخالفات
-- ═══════════════════════════════════════════════════════════════════════

-- في حال البيانات تم حذفها بالخطأ، نعيد إدراجها
INSERT INTO contract_domains (id, name_ar, icon, sort_order, active) VALUES
  ('food',      'الإعاشة',   'utensils',     1, TRUE),
  ('transport', 'النقل',     'bus',          2, TRUE),
  ('security',  'الحراسات',  'shield-check', 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
  active = TRUE,
  name_ar = EXCLUDED.name_ar;

INSERT INTO contract_phases (id, name_ar, description, sort_order) VALUES
  ('pre',     'القوائم الأولية / الجاهزية', 'تُعبَّأ مرة واحدة قبل بدء الموسم',  1),
  ('daily',   'القوائم اليومية',             'متابعة تشغيلية يومية متكررة',       2),
  ('closing', 'القوائم النهائية / الختامية', 'الأيام الخاصة + KPI + التسليم',     3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO violation_levels (id, name_ar, color, base_penalty, escalation, requires_immediate_escalation, sort_order) VALUES
  ('critical', 'حرج',    '#DC2626', 10.00, '{"first":1,"second":1.5,"third":2}'::jsonb, TRUE,  1),
  ('high',     'عالٍ',   '#EA580C',  5.00, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 2),
  ('medium',   'متوسط',  '#D97706',  2.50, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 3),
  ('low',      'منخفض',  '#65A30D',  1.00, '{"first":1,"second":1.5,"third":2}'::jsonb, FALSE, 4)
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════
-- القسم 2: دعم PMO بمجالات متعددة (1، 2، أو 3)
-- ═══════════════════════════════════════════════════════════════════════

-- إضافة حقل للمجالات المتعددة (array)
ALTER TABLE users ADD COLUMN IF NOT EXISTS pmo_domains TEXT[];
-- pmo_domains: مصفوفة المجالات التي يديرها PMO (مثلاً: ARRAY['food'] أو ARRAY['transport','security'])
-- NULL أو فارغ = يدير كل المجالات الثلاثة

COMMENT ON COLUMN users.pmo_domains IS 'المجالات التي يديرها PMO. NULL = كل المجالات';


-- ═══════════════════════════════════════════════════════════════════════
-- ✓ تم — يمكنك الآن إعادة تحميل الصفحة وستظهر المجالات
-- =================================================================
