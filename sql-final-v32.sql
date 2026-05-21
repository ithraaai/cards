-- =================================================================
-- إصلاح نهائي شامل - الإصدار 3.2.0
-- =================================================================
-- آمن للتنفيذ عدة مرات
-- يحل: مشكلة ظهور مزدلفة في كل الأيام، قوائم بدون معايير، RLS
-- =================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- 1) تأكيد تعطيل RLS على كل الجداول التشغيلية
-- ═══════════════════════════════════════════════════════════════════════
DO $$
DECLARE t_name text;
BEGIN
  FOR t_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'users', 'companies', 'teams', 'criteria', 'evaluations', 'settings', 'audit_log',
        'contract_domains', 'contract_phases', 'violation_levels',
        'contract_checklists', 'contract_criteria', 'contract_kpi_definitions',
        'contract_evaluation_sessions', 'contract_evaluations', 'contract_violations'
      )
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t_name);
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 2) ضمان أن قوائم الأيام الخاصة في phase = 'daily' (لتفلترها الواجهة)
-- ═══════════════════════════════════════════════════════════════════════

UPDATE contract_checklists SET phase_id = 'daily'
WHERE code IN ('food_close_arafa', 'food_close_muzdalifa', 'food_close_eid');


-- ═══════════════════════════════════════════════════════════════════════
-- 3) حذف قوائم الذروة المكررة
-- ═══════════════════════════════════════════════════════════════════════

-- نحذف المعايير المرتبطة أولاً
DELETE FROM contract_criteria
WHERE checklist_id IN (
  SELECT id FROM contract_checklists WHERE code IN ('sec_peak', 'tr_peak', 'food_peak')
);

-- نحذف القوائم
DELETE FROM contract_checklists WHERE code IN ('sec_peak', 'tr_peak', 'food_peak');


-- ═══════════════════════════════════════════════════════════════════════
-- 4) التحقق من النتيجة
-- ═══════════════════════════════════════════════════════════════════════

-- تقرير القوائم بعد التعديل
SELECT
  cd.name_ar AS domain,
  cl.phase_id AS phase,
  cl.code,
  cl.name_ar AS checklist,
  COUNT(cr.id) AS criteria_count
FROM contract_checklists cl
JOIN contract_domains cd ON cd.id = cl.domain_id
LEFT JOIN contract_criteria cr ON cr.checklist_id = cl.id AND cr.company_id IS NULL AND cr.active = TRUE
WHERE cl.active = TRUE
GROUP BY cd.name_ar, cd.sort_order, cl.phase_id, cl.code, cl.name_ar, cl.sort_order
ORDER BY cd.sort_order, cl.phase_id, cl.sort_order;

-- ملخص الفلترة
SELECT
  '✅ يجب أن تظهر مزدلفة فقط في يوم 9' AS note,
  code,
  phase_id,
  name_ar
FROM contract_checklists
WHERE code LIKE 'food_close_%' OR code LIKE '%muzdalifa%' OR code LIKE '%arafa%' OR code LIKE '%eid%';
