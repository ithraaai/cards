-- =================================================================
-- تحديث قاعدة البيانات الشامل - الإصدار 9
-- =================================================================
-- يحتوي على كل التحديثات السابقة + تخصيص أقسام التقارير
-- آمن تماماً: IF NOT EXISTS فلن يحذف بياناتك
-- =================================================================

-- ============== الإصدار 6: إعدادات الإغلاق وتوحيد التواريخ ==============
ALTER TABLE settings ADD COLUMN IF NOT EXISTS closing_mode TEXT DEFAULT 'always_open';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS closing_time TIME DEFAULT '19:00:00';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS unified_start_date_id TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS manually_closed_dates JSONB DEFAULT '[]'::jsonb;

-- ============== الإصدار 8: الجلستان والمعايير المخصصة ==============
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sessions_mode TEXT DEFAULT 'single';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS session1_close_time TIME DEFAULT '12:00:00';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS session2_close_time TIME DEFAULT '22:00:00';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sessions_scope_section TEXT DEFAULT 'all';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sessions_scope_teams JSONB DEFAULT '[]'::jsonb;

ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS session INT DEFAULT 1;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_company_id_section_date_id_criterion_id_key;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_unique_per_session;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_unique_per_session 
  UNIQUE(company_id, section, date_id, criterion_id, session);

ALTER TABLE criteria ADD COLUMN IF NOT EXISTS section_scope TEXT DEFAULT 'all';

-- ============== الإصدار 9: تخصيص أقسام التقارير ==============
-- إعدادات أقسام تقرير مدخل البيانات (يتحكم بها المدير)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS entry_report_sections JSONB DEFAULT '[]'::jsonb;
-- إعدادات أقسام تقرير مدير النظام (يتحكم بها المدير)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_report_sections JSONB DEFAULT '[]'::jsonb;

-- ============== القيم الافتراضية للبيانات الموجودة ==============
UPDATE settings SET closing_mode = 'always_open' WHERE closing_mode IS NULL;
UPDATE settings SET closing_time = '19:00:00' WHERE closing_time IS NULL;
UPDATE settings SET manually_closed_dates = '[]'::jsonb WHERE manually_closed_dates IS NULL;
UPDATE settings SET sessions_mode = 'single' WHERE sessions_mode IS NULL;
UPDATE settings SET session1_close_time = '12:00:00' WHERE session1_close_time IS NULL;
UPDATE settings SET session2_close_time = '22:00:00' WHERE session2_close_time IS NULL;
UPDATE settings SET sessions_scope_section = 'all' WHERE sessions_scope_section IS NULL;
UPDATE settings SET sessions_scope_teams = '[]'::jsonb WHERE sessions_scope_teams IS NULL;
UPDATE settings SET entry_report_sections = '[]'::jsonb WHERE entry_report_sections IS NULL;
UPDATE settings SET admin_report_sections = '[]'::jsonb WHERE admin_report_sections IS NULL;
UPDATE evaluations SET session = 1 WHERE session IS NULL;
UPDATE criteria SET section_scope = 'all' WHERE section_scope IS NULL;

-- ✓ تم!
