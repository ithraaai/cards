-- =================================================================
-- المرحلة 2: تعطيل RLS للجداول التشغيلية
-- =================================================================
-- آمن للتنفيذ عدة مرات
-- =================================================================

-- تعطيل RLS على جداول المراقبة لضمان عمل INSERT/UPDATE
ALTER TABLE contract_evaluation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_violations DISABLE ROW LEVEL SECURITY;

-- تأكد من وجود الفهارس المهمة للأداء
CREATE INDEX IF NOT EXISTS idx_sessions_monitor ON contract_evaluation_sessions(monitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_checklist ON contract_evaluation_sessions(checklist_id);
CREATE INDEX IF NOT EXISTS idx_evals_filled_by ON contract_evaluations(filled_by);

-- التحقق
SELECT
  'contract_evaluation_sessions' AS table_name,
  (SELECT COUNT(*) FROM contract_evaluation_sessions) AS row_count
UNION ALL
SELECT 'contract_evaluations', (SELECT COUNT(*) FROM contract_evaluations)
UNION ALL
SELECT 'contract_criteria', (SELECT COUNT(*) FROM contract_criteria);
