-- =================================================================
-- تحديث قاعدة البيانات - الإصدار الجديد
-- =================================================================
-- يُضيف حقولاً جديدة لإعدادات إغلاق التقييم وتوحيد تواريخ البدء
-- آمن: يستخدم IF NOT EXISTS فلا يحذف أي بيانات موجودة
-- =================================================================

-- إضافة حقول إعدادات الإغلاق إلى جدول settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS closing_mode TEXT DEFAULT 'always_open';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS closing_time TIME DEFAULT '19:00:00';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS unified_start_date_id TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS manually_closed_dates JSONB DEFAULT '[]'::jsonb;

-- closing_mode: 
--   'always_open'  = التقييم مفتوح دائماً (لا يغلق تلقائياً)
--   'end_of_day'   = يغلق نهاية اليوم (24:00)
--   'mid_day'      = يغلق منتصف اليوم (12:00)
--   'custom_time'  = يغلق في وقت محدد (closing_time)
--   'manual'       = إغلاق يدوي فقط (يتحكم به المدير)

-- closing_time: الوقت المحدد للإغلاق (مستخدم فقط مع custom_time)
-- unified_start_date_id: تاريخ بدء موحد لكل الفرق (NULL = لا يوجد، استخدم تواريخ الفرق الفردية)
-- manually_closed_dates: مصفوفة بمعرّفات الأيام المغلقة يدوياً (مثل ["1", "2"])

-- التأكد من أن العمود موجود ولكن لا توجد قيم فيه (للحماية)
UPDATE settings SET closing_mode = 'always_open' WHERE closing_mode IS NULL;
UPDATE settings SET closing_time = '19:00:00' WHERE closing_time IS NULL;
UPDATE settings SET manually_closed_dates = '[]'::jsonb WHERE manually_closed_dates IS NULL;

-- ✓ تم!
