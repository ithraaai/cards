-- =================================================================
-- إصلاح جذري: قيد users_role_check يرفض أدوار المتعهدين
-- =================================================================
-- السبب: عمود role له CHECK constraint يقبل فقط:
--   admin, dashboard, data_entry, supervisor
-- نحتاج توسيعه ليشمل أدوار المتعهدين الأربعة
-- =================================================================

-- 1) حذف القيد القديم
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2) إضافة قيد جديد يشمل كل الأدوار
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN (
    'admin',
    'dashboard',
    'data_entry',
    'supervisor',
    'contractor_monitor_food',
    'contractor_monitor_transport',
    'contractor_monitor_security',
    'contractor_pmo'
  )
);

-- 3) التحقق
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_role_check';
