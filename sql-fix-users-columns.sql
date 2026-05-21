-- =================================================================
-- إصلاح فوري: ضمان وجود الأعمدة المطلوبة في جدول users
-- =================================================================
-- آمن تماماً للتنفيذ عدة مرات (يستخدم IF NOT EXISTS)
-- =================================================================

-- 1) إضافة عمود الشركة المُراقَبة (للمراقبين)
ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor_company_id UUID REFERENCES companies(id);

-- 2) إضافة عمود مجال المراقب (food / transport / security)
ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor_scope_domain TEXT;

-- 3) إضافة عمود المجالات المُدارة للـ PMO (مصفوفة)
ALTER TABLE users ADD COLUMN IF NOT EXISTS pmo_domains TEXT[];

-- 4) فهرس على contractor_company_id لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_users_contractor_company ON users(contractor_company_id);

-- 5) تعطيل RLS على users (في حال كان مفعّلاً)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════
-- 6) التحقق: عرض الأعمدة الجديدة المُضافة
-- ═══════════════════════════════════════════════════════════════════════

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('contractor_company_id', 'contractor_scope_domain', 'pmo_domains')
ORDER BY column_name;
