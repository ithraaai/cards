-- =================================================================
-- إكمال المعايير للقوائم الفارغة + إزالة الازدواجية
-- =================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- 1) إزالة قوائم الذروة المكررة (نفس معايير اليومية)
-- ═══════════════════════════════════════════════════════════════════════

-- نحذف القوائم التي تكرر اليومية - "متابعة أيام الذروة" المنفصلة لم تعد ضرورية
-- لأن الواجهة ستفلتر القوائم اليومية تلقائياً حسب اليوم
DELETE FROM contract_checklists WHERE code IN ('sec_peak', 'tr_peak', 'food_peak');


-- ═══════════════════════════════════════════════════════════════════════
-- 2) معايير قائمة العمالة والوثائق (الإعاشة)
-- ═══════════════════════════════════════════════════════════════════════

DELETE FROM contract_criteria
WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_pre_workforce')
  AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_pre_workforce')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, required_qty, qty_unit, is_critical, note_required, sort_order)
SELECT id, 'workforce', name_ar, 'compliance', required_qty, qty_unit, is_critical, 'on_violation', sort_order
FROM checklist, (VALUES
  ('توفر مدير الموقع بدوام كامل', NULL::numeric, NULL, TRUE, 10),
  ('توفر مشرفين بالعدد المطلوب', NULL::numeric, NULL, TRUE, 20),
  ('توفر طهاة بالعدد المطلوب', NULL::numeric, NULL, TRUE, 30),
  ('توفر عمال نظافة بالعدد المطلوب', NULL::numeric, NULL, FALSE, 40),
  ('توفر عمال خدمة بالعدد المطلوب', NULL::numeric, NULL, FALSE, 50),
  ('صحة الوثائق والإقامات لجميع العمالة', NULL, NULL, TRUE, 60),
  ('شهادات صحية سارية لكل العمالة', NULL, NULL, TRUE, 70),
  ('زي موحد ونظيف لكل العمالة', NULL, NULL, FALSE, 80),
  ('تدريب العمالة على إجراءات السلامة', NULL, NULL, FALSE, 90),
  ('سجل حضور وانصراف يومي للعمالة', NULL, NULL, FALSE, 100)
) AS t(name_ar, required_qty, qty_unit, is_critical, sort_order);


-- ═══════════════════════════════════════════════════════════════════════
-- 3) معايير "بداية الوردية" (الإعاشة - يومية)
-- ═══════════════════════════════════════════════════════════════════════

DELETE FROM contract_criteria
WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_daily_0')
  AND company_id IS NULL;

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


-- ═══════════════════════════════════════════════════════════════════════
-- 4) معايير "سجل البلاغات" (الإعاشة - يومية)
-- ═══════════════════════════════════════════════════════════════════════

DELETE FROM contract_criteria
WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_daily_c')
  AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_daily_c')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'reports', name_ar, 'compliance', is_critical, 'always', sort_order
FROM checklist, (VALUES
  ('عدم وجود بلاغات أو شكاوى من الحجاج', FALSE, 10),
  ('عدم وجود حالات تسمم أو طارئة', TRUE, 20),
  ('عدم وجود مخالفات صحية', TRUE, 30),
  ('عدم وجود تأخر في الوجبات', FALSE, 40),
  ('عدم وجود نقص في الكميات', FALSE, 50),
  ('عدم وجود ملاحظات من الإدارة العليا', FALSE, 60)
) AS t(name_ar, is_critical, sort_order);


-- ═══════════════════════════════════════════════════════════════════════
-- 5) معايير "يوم عرفة" (الإعاشة - يحول لـ daily فقط لليوم 9)
-- ═══════════════════════════════════════════════════════════════════════

-- نحول القائمة من closing إلى daily لتظهر في يوم 9 فقط
UPDATE contract_checklists SET phase_id = 'daily' WHERE code = 'food_close_arafa';

DELETE FROM contract_criteria
WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_arafa')
  AND company_id IS NULL;

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


-- ═══════════════════════════════════════════════════════════════════════
-- 6) معايير "يوم العيد" (الإعاشة - daily لليوم 10)
-- ═══════════════════════════════════════════════════════════════════════

UPDATE contract_checklists SET phase_id = 'daily' WHERE code = 'food_close_eid';

DELETE FROM contract_criteria
WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_eid')
  AND company_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_close_eid')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, note_required, sort_order)
SELECT id, 'eid', name_ar, 'compliance', is_critical, 'on_violation', sort_order
FROM checklist, (VALUES
  ('تجهيز وجبة عيد خاصة (لحم الأضاحي)', TRUE, 10),
  ('تنوع وجودة طبق العيد', FALSE, 20),
  ('تقديم حلويات وضيافة العيد', FALSE, 30),
  ('تزيين البوفيهات بمناسبة العيد', FALSE, 40),
  ('سرعة تقديم الوجبات بعد رمي الجمرة', TRUE, 50),
  ('استقبال الحجاج بعد العودة من منى', FALSE, 60)
) AS t(name_ar, is_critical, sort_order);


-- ═══════════════════════════════════════════════════════════════════════
-- 7) معايير "مزدلفة" (الإعاشة - daily لليوم 9 فقط - ليلة 9/10)
-- ═══════════════════════════════════════════════════════════════════════

UPDATE contract_checklists SET phase_id = 'daily' WHERE code = 'food_close_muzdalifa';

DELETE FROM contract_criteria
WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_muzdalifa')
  AND company_id IS NULL;

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


-- ═══════════════════════════════════════════════════════════════════════
-- 8) القائمة الختامية: التسليم النهائي (تبقى closing لكن نضيف معايير)
-- ═══════════════════════════════════════════════════════════════════════

DELETE FROM contract_criteria
WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_handover')
  AND company_id IS NULL;

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


-- ═══════════════════════════════════════════════════════════════════════
-- 9) القائمة الختامية: KPI (تبقى closing - تُعبَّأ مرة)
-- ═══════════════════════════════════════════════════════════════════════

DELETE FROM contract_criteria
WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_close_kpi')
  AND company_id IS NULL;

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
-- 10) التحقق النهائي
-- ═══════════════════════════════════════════════════════════════════════

SELECT
  cl.code,
  cl.name_ar,
  cl.phase_id,
  COUNT(cr.id) AS criteria_count
FROM contract_checklists cl
LEFT JOIN contract_criteria cr ON cr.checklist_id = cl.id AND cr.company_id IS NULL
GROUP BY cl.id, cl.code, cl.name_ar, cl.phase_id, cl.sort_order
ORDER BY cl.domain_id, cl.phase_id, cl.sort_order;
