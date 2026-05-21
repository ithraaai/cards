-- =================================================================
-- تشخيص جذري: ما هي القيود الموجودة على جدول users؟
-- =================================================================
-- نفّذ هذا الملف وسيكشف بدقة ما يفشل
-- =================================================================

-- 1) كل الأعمدة بتفاصيلها الكاملة
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2) كل القيود (UNIQUE, CHECK, FOREIGN KEY, NOT NULL)
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
ORDER BY contype, conname;

-- 3) محاولة إنشاء مستخدم اختباري يدوياً لرؤية الخطأ الحقيقي
-- (نستخدم BEGIN/ROLLBACK حتى لا يُحفظ فعلياً)

DO $$
DECLARE
  v_etqan_id UUID;
  v_test_user_id UUID;
BEGIN
  -- جلب معرّف شركة الإتقان
  SELECT id INTO v_etqan_id FROM companies WHERE name LIKE '%الإتقان%' OR name LIKE '%إتقان%' LIMIT 1;

  IF v_etqan_id IS NULL THEN
    RAISE NOTICE '⚠️ لم يتم العثور على شركة الإتقان';
    RETURN;
  END IF;

  RAISE NOTICE '🔍 معرّف الإتقان: %', v_etqan_id;

  -- محاولة الإنشاء
  BEGIN
    INSERT INTO users (
      name, username, role,
      company_id, section, phone,
      contractor_company_id, contractor_scope_domain,
      pmo_domains, active
    ) VALUES (
      'مراقب اختبار', 'test_monitor_999', 'contractor_monitor_food',
      NULL, NULL, NULL,
      v_etqan_id, 'food',
      NULL, TRUE
    ) RETURNING id INTO v_test_user_id;

    RAISE NOTICE '✅ نجح الإنشاء! ID: %', v_test_user_id;

    -- حذف المستخدم الاختباري
    DELETE FROM users WHERE id = v_test_user_id;
    RAISE NOTICE '🗑️ تم حذف المستخدم الاختباري';

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ فشل الإنشاء!';
    RAISE NOTICE '   نوع الخطأ: %', SQLSTATE;
    RAISE NOTICE '   الرسالة: %', SQLERRM;
  END;
END $$;
