-- =================================================================
-- تحديث قاعدة البيانات - الإصدار 8
-- =================================================================
-- يُضيف دعم الجلستين والقيود الجزئية والمعايير المخصصة للأقسام
-- آمن: يستخدم IF NOT EXISTS فلا يحذف أي بيانات
-- =================================================================

-- 1. إضافة إعدادات الجلسات في settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sessions_mode TEXT DEFAULT 'single';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS session1_close_time TIME DEFAULT '12:00:00';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS session2_close_time TIME DEFAULT '22:00:00';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sessions_scope_section TEXT DEFAULT 'all';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sessions_scope_teams JSONB DEFAULT '[]'::jsonb;

-- sessions_mode:
--   'single' = جلسة واحدة (افتراضي)
--   'double' = جلستان (صباحية ومسائية)

-- session1_close_time: وقت إغلاق الجلسة الأولى (الصباحية أو الوحيدة)
-- session2_close_time: وقت إغلاق الجلسة الثانية (المسائية)

-- sessions_scope_section:
--   'all' = ينطبق على كل الأقسام
--   'men' = رجال فقط
--   'women' = نساء فقط

-- sessions_scope_teams: مصفوفة معرّفات الفرق التي ينطبق عليها (فارغ = كل الفرق)

-- 2. إضافة حقل الجلسة في التقييمات
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS session INT DEFAULT 1;
-- session: 1 = الجلسة الأولى/الوحيدة, 2 = الجلسة الثانية (المسائية)

-- 3. تعديل الـ UNIQUE constraint ليشمل الجلسة
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_company_id_section_date_id_criterion_id_key;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_unique_per_session 
  UNIQUE(company_id, section, date_id, criterion_id, session);

-- 4. إضافة نطاق القسم في المعايير
ALTER TABLE criteria ADD COLUMN IF NOT EXISTS section_scope TEXT DEFAULT 'all';
-- section_scope:
--   'all' = متاح للجميع (افتراضي - السلوك الحالي)
--   'men' = رجال فقط
--   'women' = نساء فقط

-- 5. القيم الافتراضية للبيانات الموجودة
UPDATE settings SET sessions_mode = 'single' WHERE sessions_mode IS NULL;
UPDATE settings SET session1_close_time = '12:00:00' WHERE session1_close_time IS NULL;
UPDATE settings SET session2_close_time = '22:00:00' WHERE session2_close_time IS NULL;
UPDATE settings SET sessions_scope_section = 'all' WHERE sessions_scope_section IS NULL;
UPDATE settings SET sessions_scope_teams = '[]'::jsonb WHERE sessions_scope_teams IS NULL;
UPDATE evaluations SET session = 1 WHERE session IS NULL;
UPDATE criteria SET section_scope = 'all' WHERE section_scope IS NULL;

-- ✓ تم!
