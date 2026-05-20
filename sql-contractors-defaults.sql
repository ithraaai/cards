-- =================================================================
-- Seed: المتعهدون والعقود الافتراضية
-- =================================================================
-- 3 متعهدين × 4 شركات = 12 عقد محتمل (1 إعاشة لكل شركة + النقل + الحراسات موحد)
-- ملاحظة: متعهد الإعاشة قد يكون مختلفاً لكل شركة (مرونة)
-- النقل والحراسات: متعهد واحد يخدم كل الشركات الأربع
-- =================================================================

-- 1) إنشاء المتعهدين الافتراضيين
-- (يمكن للمدير تعديل الأسماء والتفاصيل لاحقاً من الواجهة)

INSERT INTO contractors (id, name, short_name, notes, active)
VALUES
  -- متعهدو الإعاشة - 3 متعهدين منفصلين (واحد قد يخدم أكثر من شركة)
  ('11111111-1111-1111-1111-111111111111', 'متعهد الإعاشة - الإتقان', 'إعاشة الإتقان',
   'متعهد الإعاشة المخصص لشركة الإتقان (1818 حاج)', TRUE),

  ('22222222-2222-2222-2222-222222222222', 'متعهد الإعاشة - أضواء الإيمان', 'إعاشة أضواء',
   'متعهد الإعاشة المخصص لشركة أضواء الإيمان (1152 حاج)', TRUE),

  ('33333333-3333-3333-3333-333333333333', 'متعهد الإعاشة - الفرائض والناصرية', 'إعاشة الفرائض/الناصرية',
   'متعهد الإعاشة الموحد لشركتي الفرائض (800) والناصرية (1030) - بعض الجلسات مشتركة', TRUE),

  -- متعهد النقل - واحد لكل الشركات الأربع
  ('44444444-4444-4444-4444-444444444444', 'شركة الصفوة للنقل', 'الصفوة',
   'متعهد النقل الموحد لجميع الشركات الأربع (24+2 حافلة لكل شركة)', TRUE),

  -- متعهد الحراسات - واحد لكل الشركات الأربع
  ('55555555-5555-5555-5555-555555555555', 'شركة الإسناد للحراسات', 'الإسناد',
   'متعهد الحراسات الموحد لجميع الشركات الأربع (14+2 فرد لكل شركة)', TRUE)

ON CONFLICT (id) DO NOTHING;


-- 2) إنشاء العقود الـ 12 (4 شركات × 3 مجالات)
-- ملاحظة: نفترض أن companies موجودة بالفعل من نظام البطاقات
-- إذا لم تكن موجودة، سيُتجاهل الإدراج لاحقاً عبر ON CONFLICT

-- جلب معرّفات الشركات من جدول companies (نستخدم WITH للوضوح)
-- وإنشاء العقود بشكل ديناميكي

DO $$
DECLARE
  v_etqan_id      UUID;
  v_adwaa_id      UUID;
  v_faraidh_id    UUID;
  v_nasiriya_id   UUID;
  v_transport_id  UUID := '44444444-4444-4444-4444-444444444444';
  v_security_id   UUID := '55555555-5555-5555-5555-555555555555';
  v_food_etqan    UUID := '11111111-1111-1111-1111-111111111111';
  v_food_adwaa    UUID := '22222222-2222-2222-2222-222222222222';
  v_food_far_nas  UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- محاولة جلب معرّفات الشركات
  SELECT id INTO v_etqan_id FROM companies
    WHERE name LIKE '%الإتقان%' OR name LIKE '%الاتقان%' OR name LIKE '%إتقان%' LIMIT 1;
  SELECT id INTO v_adwaa_id FROM companies
    WHERE name LIKE '%أضواء%' OR name LIKE '%الإيمان%' LIMIT 1;
  SELECT id INTO v_faraidh_id FROM companies
    WHERE name LIKE '%الفرائض%' OR name LIKE '%فرائض%' LIMIT 1;
  SELECT id INTO v_nasiriya_id FROM companies
    WHERE name LIKE '%الناصرية%' OR name LIKE '%ناصرية%' LIMIT 1;

  -- ─── عقود الإعاشة ───
  IF v_etqan_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_food_etqan, v_etqan_id, 'food', 'FOOD-ETQ-1447', '1447', 1818, 30.00, 'عقد إعاشة الإتقان - 1818 حاج')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_adwaa_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_food_adwaa, v_adwaa_id, 'food', 'FOOD-ADW-1447', '1447', 1152, 30.00, 'عقد إعاشة أضواء الإيمان - 1152 حاج')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_faraidh_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_food_far_nas, v_faraidh_id, 'food', 'FOOD-FAR-1447', '1447', 800, 30.00, 'عقد إعاشة الفرائض - 800 حاج (بعض الجلسات مشتركة مع الناصرية)')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_nasiriya_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_food_far_nas, v_nasiriya_id, 'food', 'FOOD-NAS-1447', '1447', 1030, 30.00, 'عقد إعاشة الناصرية - 1030 حاج (بعض الجلسات مشتركة مع الفرائض)')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  -- ─── عقود النقل (متعهد واحد لكل الشركات) ───
  IF v_etqan_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_transport_id, v_etqan_id, 'transport', 'TR-ETQ-1447', '1447', 1818, 30.00, 'عقد النقل للإتقان - 24+2 حافلة')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_adwaa_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_transport_id, v_adwaa_id, 'transport', 'TR-ADW-1447', '1447', 1152, 30.00, 'عقد النقل لأضواء الإيمان')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_faraidh_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_transport_id, v_faraidh_id, 'transport', 'TR-FAR-1447', '1447', 800, 30.00, 'عقد النقل للفرائض')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_nasiriya_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_transport_id, v_nasiriya_id, 'transport', 'TR-NAS-1447', '1447', 1030, 30.00, 'عقد النقل للناصرية')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  -- ─── عقود الحراسات (متعهد واحد لكل الشركات) ───
  IF v_etqan_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_security_id, v_etqan_id, 'security', 'SEC-ETQ-1447', '1447', 1818, 30.00, 'عقد الحراسات للإتقان - 14+2 فرد')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_adwaa_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_security_id, v_adwaa_id, 'security', 'SEC-ADW-1447', '1447', 1152, 30.00, 'عقد الحراسات لأضواء الإيمان')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_faraidh_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_security_id, v_faraidh_id, 'security', 'SEC-FAR-1447', '1447', 800, 30.00, 'عقد الحراسات للفرائض')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  IF v_nasiriya_id IS NOT NULL THEN
    INSERT INTO contracts (contractor_id, company_id, domain_id, contract_number, hijri_year, pilgrims_count, max_penalty_pct, notes)
    VALUES (v_security_id, v_nasiriya_id, 'security', 'SEC-NAS-1447', '1447', 1030, 30.00, 'عقد الحراسات للناصرية')
    ON CONFLICT (company_id, domain_id, hijri_year) DO NOTHING;
  END IF;

  -- ─── إضافة الشركات إذا لم تكن موجودة (ضمان) ───
  -- لا حاجة، فالمستخدم لديه شركاته بالفعل من نظام البطاقات

END $$;


-- 3) ملاحظة ختامية
-- =================================================================
-- ✓ تم إنشاء 5 متعهدين افتراضيين
-- ✓ تم إنشاء حتى 12 عقد (حسب الشركات الموجودة)
-- ✓ المدير يمكنه تعديل الأسماء والتفاصيل من واجهة إدارة المتعهدين والعقود
-- =================================================================
