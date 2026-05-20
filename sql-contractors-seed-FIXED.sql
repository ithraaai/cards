-- ═══════════════════════════════════════════════════════════════════════
-- منصة إثراء التجربة — وحدة المتعهدين
-- Seed Data: القوائم والمعايير الأولية
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1) القوائم (Checklists)
-- ═══════════════════════════════════════════════════════════════════════

-- ─── الإعاشة ───────────────────────────────────────────────────────────

-- الجاهزية
INSERT INTO contract_checklists (domain_id, phase_id, code, name_ar, description, frequency, sort_order) VALUES
('food', 'pre',     'food_pre_kitchen',   'القسم الأول: فحص معدات المطبخ الرئيسي', 'يُعبَّأ مرة قبل بدء الموسم',           'once',     10),
('food', 'pre',     'food_pre_buffet',    'القسم الأول (تابع): فحص معدات البوفيهات',   'يُعبَّأ مرة قبل بدء الموسم',       'once',     20),
('food', 'pre',     'food_pre_workforce', 'القسم الثاني: فحص العمالة والوثائق',          'الحد الأدنى من العمالة + توثيق',  'once',     30),
('food', 'pre',     'food_pre_readiness', 'القسم الثالث: محضر الجاهزية التشغيلية (15 بند)', 'يُعتمد قبل 48 ساعة من بدء العمل', 'once',     40),

-- اليومية
('food', 'daily',   'food_daily_0',       'القائمة 0: بداية الوردية — تسليم وحضور وتنبيهات',  'تُعبَّأ في بداية كل وردية',       'per_shift', 10),
('food', 'daily',   'food_daily_a',       'القائمة أ: الوجبات وسلامة الغذاء',                  'تُعبَّأ 3 مرات يومياً',          'per_meal',  20),
('food', 'daily',   'food_daily_b',       'القائمة ب: الأركان والخدمات',                        'تُعبَّأ كل 4 ساعات',             'per_4h',    30),
('food', 'daily',   'food_daily_c',       'القائمة ج: سجل البلاغات والمخالفات',                'عند الحدوث فقط',                  'on_event',  40),
('food', 'daily',   'food_daily_d',       'القائمة د: ملخص اليوم',                              'مرة واحدة قبل 11 مساءً',           'daily',     50),

-- النهائية
('food', 'closing', 'food_close_arafa',   'القائمة 1: يوم عرفة (9 ذي الحجة)',                  NULL, 'on_event', 10),
('food', 'closing', 'food_close_muzdalifa','القائمة 2: فحص علب مزدلفة (ليلة 9/10)',           NULL, 'on_event', 20),
('food', 'closing', 'food_close_eid',     'القائمة 3: احتفال العيد (10 ذي الحجة مساءً)',     NULL, 'on_event', 30),
('food', 'closing', 'food_close_kpi',     'القائمة 4: بطاقة KPI الأسبوعية',                     NULL, 'weekly',   40),
('food', 'closing', 'food_close_handover','القائمة 5: التسليم النهائي (14 ذي الحجة)',          'خلال 48 ساعة من نهاية الموسم', 'once', 50)
ON CONFLICT (domain_id, phase_id, code) DO NOTHING;



-- ─── النقل ─────────────────────────────────────────────────────────────

INSERT INTO contract_checklists (domain_id, phase_id, code, name_ar, description, frequency, sort_order) VALUES
('transport', 'pre',   'tr_pre_timeline', 'أولاً: المراحل الزمنية الإلزامية قبل التشغيل',  'يبدأ من 10 ذو القعدة',  'once',  10),
('transport', 'pre',   'tr_pre_readiness','ثانياً: محضر الجاهزية التشغيلية (15 بند)',       'يُعتمد قبل 5 ذي الحجة',  'once',  20),
('transport', 'daily', 'tr_daily',        'المتابعة اليومية لأداء متعهّد النقل',           'تُعبَّأ كل يوم تشغيل (7-13)', 'daily', 10)
ON CONFLICT (domain_id, phase_id, code) DO NOTHING;



-- ─── الحراسات ──────────────────────────────────────────────────────────

INSERT INTO contract_checklists (domain_id, phase_id, code, name_ar, description, frequency, sort_order) VALUES
('security', 'pre',   'sec_pre_timeline', 'أولاً: المراحل الزمنية الإلزامية قبل التشغيل',  'يبدأ من 20 شوال',        'once',  10),
('security', 'pre',   'sec_pre_readiness','ثانياً: محضر الجاهزية التشغيلية (17 بند)',       'يُعتمد قبل 10 ذو القعدة', 'once',  20),
('security', 'daily', 'sec_daily',        'المتابعة اليومية لأداء متعهّد الحراسات',         'تُعبَّأ كل يوم تشغيل',     'daily', 10),
('security', 'daily', 'sec_daily_peak',   'متابعة أيام الذروة (8-13 ذي الحجة)',             'متابعة مكثفة لأيام الذروة','daily', 20)
ON CONFLICT (domain_id, phase_id, code) DO NOTHING;



-- ═══════════════════════════════════════════════════════════════════════
-- 2) معايير الإعاشة (Food Criteria)
-- ═══════════════════════════════════════════════════════════════════════
-- ملاحظة: المعايير هنا قوالب (contract_id = NULL) تطبق على كل العقود
-- الكميات المطلوبة (required_qty) ستُعدَّل لاحقاً لكل عقد بحسب عدد الحجاج

-- ─── معدات المطبخ الرئيسي (28 بند) ────────────────────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_pre_kitchen') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_pre_kitchen')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, qty_unit, sort_order) VALUES
((SELECT id FROM checklist), 'kitchen', 'فرن كونفكشن 20 صينية',         'compliance', 'وحدة',   10),
((SELECT id FROM checklist), 'kitchen', 'فرن كونفكشن 40 صينية',         'compliance', 'وحدة',   20),
((SELECT id FROM checklist), 'kitchen', 'قلاية زيت',                     'compliance', 'وحدة',   30),
((SELECT id FROM checklist), 'kitchen', 'هوت كيبن ≥65°م',                'compliance', 'وحدة',   40),
((SELECT id FROM checklist), 'kitchen', 'هاند مكسر',                     'compliance', 'وحدة',   50),
((SELECT id FROM checklist), 'kitchen', 'خلاط',                          'compliance', 'وحدة',   60),
((SELECT id FROM checklist), 'kitchen', 'مفرمة لحم',                     'compliance', 'وحدة',   70),
((SELECT id FROM checklist), 'kitchen', 'قطاعة خضار',                    'compliance', 'وحدة',   80),
((SELECT id FROM checklist), 'kitchen', 'قطاعة لحوم باردة',              'compliance', 'وحدة',   90),
((SELECT id FROM checklist), 'kitchen', 'قدور طبخ مقاس 120',             'compliance', 'وحدة',  100),
((SELECT id FROM checklist), 'kitchen', 'مصافي الأرز',                   'compliance', 'وحدة',  110),
((SELECT id FROM checklist), 'kitchen', 'مصافي الشبك',                   'compliance', 'وحدة',  120),
((SELECT id FROM checklist), 'kitchen', 'ديب فريزر مقاس 160',            'compliance', 'وحدة',  130),
((SELECT id FROM checklist), 'kitchen', 'ترولي خدمة',                    'compliance', 'وحدة',  140),
((SELECT id FROM checklist), 'kitchen', 'ترولي سفندشات',                 'compliance', 'وحدة',  150),
((SELECT id FROM checklist), 'kitchen', 'صاعق حشرات كهربائي',            'compliance', 'وحدة',  160),
((SELECT id FROM checklist), 'kitchen', 'آيس مكسر 80 لتر',                'compliance', 'وحدة',  170),
((SELECT id FROM checklist), 'kitchen', 'بولات سلطات ستانلس',            'compliance', 'وحدة',  180),
((SELECT id FROM checklist), 'kitchen', 'أطباق سلطات',                   'compliance', 'وحدة',  190),
((SELECT id FROM checklist), 'kitchen', 'مرايات سلطات',                  'compliance', 'وحدة',  200),
((SELECT id FROM checklist), 'kitchen', 'مرايات حلويات',                 'compliance', 'وحدة',  210),
((SELECT id FROM checklist), 'kitchen', 'حافظات استيل عادية',            'compliance', 'وحدة',  220),
((SELECT id FROM checklist), 'kitchen', 'حافظات استيل ذات رف',           'compliance', 'وحدة',  230),
((SELECT id FROM checklist), 'kitchen', 'شاشة عرض منيو + كاميرات',       'compliance', 'مجموعة', 240),
((SELECT id FROM checklist), 'kitchen', 'مولد كهرباء احتياطي',           'compliance', 'وحدة',  250),
((SELECT id FROM checklist), 'kitchen', 'صندوق إسعافات أولية',           'compliance', 'وحدة',  260),
((SELECT id FROM checklist), 'kitchen', 'فلتر مياه',                     'compliance', 'وحدة',  270),
((SELECT id FROM checklist), 'kitchen', 'ثلاجة باب تبريد للصوصات',       'compliance', 'وحدة',  280);


-- ─── معدات البوفيهات (14 بند) ─────────────────────────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_pre_buffet') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_pre_buffet')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, qty_unit, sort_order) VALUES
((SELECT id FROM checklist), 'buffet', 'سفديشات مستطيل',                       'compliance', 'وحدة', 10),
((SELECT id FROM checklist), 'buffet', 'استاندات رفع للسلطة',                  'compliance', 'وحدة', 20),
((SELECT id FROM checklist), 'buffet', 'سلت خبز',                              'compliance', 'وحدة', 30),
((SELECT id FROM checklist), 'buffet', 'استاندات حلى',                         'compliance', 'وحدة', 40),
((SELECT id FROM checklist), 'buffet', 'سخانات شاي',                           'compliance', 'وحدة', 50),
((SELECT id FROM checklist), 'buffet', 'علب بغطاء (شاي/نسكافيه/حليب/سكر)',     'compliance', 'وحدة', 60),
((SELECT id FROM checklist), 'buffet', 'سلات المعالق',                         'compliance', 'وحدة', 70),
((SELECT id FROM checklist), 'buffet', 'ماكينة كورن فليكس 2 فاتحة',            'compliance', 'وحدة', 80),
((SELECT id FROM checklist), 'buffet', 'سلات سناكات',                          'compliance', 'وحدة', 90),
((SELECT id FROM checklist), 'buffet', 'معالق غرف',                            'compliance', 'وحدة', 100),
((SELECT id FROM checklist), 'buffet', 'ماسك أكل',                             'compliance', 'وحدة', 110),
((SELECT id FROM checklist), 'buffet', 'ثلاجة شوكولاتة لكل بوفيه',             'compliance', 'وحدة', 120),
((SELECT id FROM checklist), 'buffet', 'ثلاجات عرض في منى',                   'compliance', 'وحدة', 130),
((SELECT id FROM checklist), 'buffet', 'مركبة نقل مجهزة حرارياً + تصريح',     'compliance', 'وحدة', 140);


-- ─── محضر الجاهزية للإعاشة (15 بند) ────────────────────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_pre_readiness') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_pre_readiness')
INSERT INTO contract_criteria (checklist_id, section, name_ar, description, answer_type, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'readiness', 'القوائم الغذائية',           'مقدمة ومعتمدة خطياً',                'checkbox', FALSE, 10),
((SELECT id FROM checklist), 'readiness', 'المعدات والتجهيزات',          'مركّبة ومفحوصة وفق القوائم',        'checkbox', TRUE,  20),
((SELECT id FROM checklist), 'readiness', 'التصاريح الحكومية',           'جميعها سارية',                       'checkbox', TRUE,  30),
((SELECT id FROM checklist), 'readiness', 'الشهادات الصحية للعمالة',     '100% من العمالة',                    'checkbox', TRUE,  40),
((SELECT id FROM checklist), 'readiness', 'تدريب HACCP للجميع',           'منفذ وموثق',                         'checkbox', TRUE,  50),
((SELECT id FROM checklist), 'readiness', 'تمرين المحاكاة (Drill)',      'منفذ وموثق بالصور',                  'checkbox', FALSE, 60),
((SELECT id FROM checklist), 'readiness', 'خطة الطوارئ المكتوبة',         'مقدمة ومعتمدة',                      'checkbox', FALSE, 70),
((SELECT id FROM checklist), 'readiness', 'مسؤول الجودة + 2 مراقبين',     'معينون ومتاحون',                     'checkbox', FALSE, 80),
((SELECT id FROM checklist), 'readiness', 'المستودعات والتبريد',         'جاهزة بالحرارة المطلوبة',           'checkbox', TRUE,  90),
((SELECT id FROM checklist), 'readiness', 'المركبات وتصاريحها',           'مفحوصة وسارية',                      'checkbox', FALSE, 100),
((SELECT id FROM checklist), 'readiness', 'الأركان الستة مجهزة',          'جميع الأصناف متوفرة',                'checkbox', FALSE, 110),
((SELECT id FROM checklist), 'readiness', 'ضمان حسن التنفيذ',             'مقدم للطرف الثاني',                  'checkbox', TRUE,  120),
((SELECT id FROM checklist), 'readiness', 'التأمين التجاري',              'وثيقة سارية',                        'checkbox', TRUE,  130),
((SELECT id FROM checklist), 'readiness', 'معدات وقاية العمالة',          '100% موزعة',                          'checkbox', FALSE, 140),
((SELECT id FROM checklist), 'readiness', 'العينات المرجعية',              'حاويات + تسميات + مبردات',           'checkbox', FALSE, 150);


-- ─── القائمة أ اليومية للإعاشة (الوجبات وسلامة الغذاء) ─────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_daily_a') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_daily_a')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, min_value, max_value, qty_unit, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'meals', 'مطابقة القائمة الغذائية',                    'compliance',  NULL,  NULL, NULL,    TRUE,  10),
((SELECT id FROM checklist), 'meals', 'حرارة الوجبات الساخنة',                       'temperature', 65,    NULL, '°م',    TRUE,  20),
((SELECT id FROM checklist), 'meals', 'حرارة ثلاجة التبريد',                          'temperature', NULL,  5,    '°م',    TRUE,  30),
((SELECT id FROM checklist), 'meals', 'حرارة الفريزر',                                 'temperature', NULL,  -18,  '°م',    TRUE,  40),
((SELECT id FROM checklist), 'meals', 'مدة عرض البوفيه',                              'number',      NULL,  60,   'دقيقة', FALSE, 50),
((SELECT id FROM checklist), 'meals', 'العينات المرجعية محفوظة',                       'yesno',       NULL,  NULL, NULL,    FALSE, 60),
((SELECT id FROM checklist), 'meals', 'تطبيق FIFO',                                    'yesno',       NULL,  NULL, NULL,    FALSE, 70),
((SELECT id FROM checklist), 'meals', 'لا يوجد عامل مريض',                            'yesno',       NULL,  NULL, NULL,    TRUE,  80),
((SELECT id FROM checklist), 'meals', 'النظافة الشخصية للعمالة',                      'compliance',  NULL,  NULL, NULL,    TRUE,  90),
((SELECT id FROM checklist), 'meals', 'فصل مناطق التحضير',                            'compliance',  NULL,  NULL, NULL,    TRUE,  100),
((SELECT id FROM checklist), 'meals', 'تعقيم الأسطح',                                  'yesno',       NULL,  NULL, NULL,    FALSE, 110),
((SELECT id FROM checklist), 'meals', 'التخلص من المخلفات',                            'yesno',       NULL,  NULL, NULL,    FALSE, 120),
((SELECT id FROM checklist), 'meals', 'عدد التيبسي المقدم',                            'number',      NULL,  NULL, 'تيبسي', FALSE, 130);


-- ─── القائمة ب اليومية للإعاشة (الأركان والخدمات — 7 أركان) ────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_daily_b') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_daily_b')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, sort_order) VALUES
((SELECT id FROM checklist), 'stations', 'ركن القهوة السعودية',                'yesno', 10),
((SELECT id FROM checklist), 'stations', 'ركن المشروبات بارد/ساخن',            'yesno', 20),
((SELECT id FROM checklist), 'stations', 'ركن السناكات (14 صنف)',              'yesno', 30),
((SELECT id FROM checklist), 'stations', 'ركن الفاكهة والعصير (15 صنف)',       'yesno', 40),
((SELECT id FROM checklist), 'stations', 'ركن الآيس كريم والشوكولاتة',         'yesno', 50),
((SELECT id FROM checklist), 'stations', 'ركن كوفي/بارستا/موهيتو',             'yesno', 60),
((SELECT id FROM checklist), 'stations', 'ركن الشواية (أيام 8/10/11 فقط)',     'yesno', 70),
((SELECT id FROM checklist), 'stations', 'عصير الفاكهة لايف يعمل',              'yesno', 80);


-- ─── القائمة د اليومية للإعاشة (ملخص اليوم) ────────────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'food_daily_d') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'food_daily_d')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, sort_order) VALUES
((SELECT id FROM checklist), 'summary', 'عدد الحجاج المخدومين اليوم',                'number',     10),
((SELECT id FROM checklist), 'summary', 'الوجبات الثلاث اكتملت',                      'yesno',      20),
((SELECT id FROM checklist), 'summary', 'جميع الأركان عملت 24 ساعة',                  'yesno',      30),
((SELECT id FROM checklist), 'summary', 'عدد الشكاوى المسجلة',                        'number',     40),
((SELECT id FROM checklist), 'summary', 'عدد الحضور الفعلي',                          'number',     50),
((SELECT id FROM checklist), 'summary', 'حالة المخزون',                                'compliance', 60),
((SELECT id FROM checklist), 'summary', 'مخالفات صحية جسيمة',                          'yesno',      70),
((SELECT id FROM checklist), 'summary', 'CAPA منفذة',                                  'yesno',      80);


-- ═══════════════════════════════════════════════════════════════════════
-- 3) معايير النقل (Transport Criteria)
-- ═══════════════════════════════════════════════════════════════════════

-- ─── المراحل الزمنية الإلزامية (5 بنود) ────────────────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'tr_pre_timeline') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'tr_pre_timeline')
INSERT INTO contract_criteria (checklist_id, section, name_ar, description, answer_type, sort_order) VALUES
((SELECT id FROM checklist), 'timeline', 'تقديم قائمة الأسطول كاملة (24+2) واعتماد نظام GPS', 'الموعد: 10 ذو القعدة', 'compliance', 10),
((SELECT id FROM checklist), 'timeline', 'بدء توظيف وتأهيل السائقين والتأكد من الرخص والتصاريح', 'الموعد: 15 ذو القعدة', 'compliance', 20),
((SELECT id FROM checklist), 'timeline', 'إنجاز جميع التصاريح الحكومية وتسليم نسخ معتمدة',     'الموعد: 25 ذو القعدة', 'compliance', 30),
((SELECT id FROM checklist), 'timeline', 'زيارة ميدانية مشتركة لنقاط التجمّع بجدة والمخيم',   'الموعد: 3 ذي الحجة',  'compliance', 40),
((SELECT id FROM checklist), 'timeline', 'اعتماد محضر الجاهزية التشغيلية الكامل من الطرفين',  'الموعد: 5 ذي الحجة',  'compliance', 50);


-- ─── محضر الجاهزية للنقل (15 بند) ──────────────────────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'tr_pre_readiness') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'tr_pre_readiness')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'fleet',  'قائمة الأسطول الكاملة (24+2) معتمدة كتابياً',         'compliance', TRUE,  10),
((SELECT id FROM checklist), 'fleet',  'أرقام GPS لكل حافلة مفعّلة ومُختبرة',                  'compliance', TRUE,  20),
((SELECT id FROM checklist), 'fleet',  'كاميرات داخلية وخارجية مفعّلة - اختبار 100%',          'compliance', TRUE,  30),
((SELECT id FROM checklist), 'permits','التصاريح الحكومية (هيئة النقل ووزارة الحج)',           'compliance', TRUE,  40),
((SELECT id FROM checklist), 'permits','تصاريح المشاعر - 100% من 24 حافلة و30 سائقاً',         'compliance', TRUE,  50),
((SELECT id FROM checklist), 'permits','وثيقة التأمين الشامل سارية',                            'compliance', TRUE,  60),
((SELECT id FROM checklist), 'drivers','رخص القيادة العمومية للسائقين 100% فئة (2)',           'compliance', TRUE,  70),
((SELECT id FROM checklist), 'drivers','اللياقة الطبية للسائقين 100% خلال 6 أشهر',             'compliance', TRUE,  80),
((SELECT id FROM checklist), 'ops',    'خطة الطوارئ المكتوبة - مقدّمة ومعتمدة',                'compliance', FALSE, 90),
((SELECT id FROM checklist), 'ops',    'مدير العملية الميداني - معيَّن مع مساعدَين',           'compliance', FALSE, 100),
((SELECT id FROM checklist), 'ops',    'غرفة العمليات وشاشات GPS - جاهزة ومختبرة',             'compliance', FALSE, 110),
((SELECT id FROM checklist), 'ops',    'فنّي الصيانة وسيارة العدّة - متمركز قرب المخيم',       'compliance', FALSE, 120),
((SELECT id FROM checklist), 'ops',    'زي السائقين وبطاقات التعريف - 100% موزّع',             'compliance', FALSE, 130),
((SELECT id FROM checklist), 'ops',    'خطة استمرارية الخدمة - موثّقة ومدرَّب عليها',         'compliance', FALSE, 140),
((SELECT id FROM checklist), 'ops',    'محضر معاينة المسارات والمواقف - موقّع من الطرفين',     'compliance', FALSE, 150);


-- ─── المتابعة اليومية للنقل (12 بند) ──────────────────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'tr_daily') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'tr_daily')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, required_qty, qty_unit, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'fleet',  'الحافلات الرئيسية المتاحة',                  'ratio',      24, 'حافلة', FALSE, 10),
((SELECT id FROM checklist), 'fleet',  'الأسطول الاحتياطي متاح',                     'ratio',      2,  'حافلة', FALSE, 20),
((SELECT id FROM checklist), 'drivers','السائقون والكادر حاضرون',                    'ratio',      36, 'فرد',   FALSE, 30),
((SELECT id FROM checklist), 'tech',   'GPS فعّال على كل الحافلات',                 'number',     100,'%',     FALSE, 40),
((SELECT id FROM checklist), 'tech',   'الكاميرات تعمل وتسجّل',                     'ratio',      24, 'حافلة', FALSE, 50),
((SELECT id FROM checklist), 'tech',   'الفحص اليومي للحافلات موثّق',               'ratio',      24, 'حافلة', FALSE, 60),
((SELECT id FROM checklist), 'ops',    'الالتزام بمواعيد التحرّك',                  'compliance', NULL, NULL,  FALSE, 70),
((SELECT id FROM checklist), 'ops',    'الالتزام بحدود السرعة',                     'compliance', NULL, NULL,  FALSE, 80),
((SELECT id FROM checklist), 'ops',    'نظافة الحافلات ومياه الشرب',                'compliance', NULL, NULL,  FALSE, 90),
((SELECT id FROM checklist), 'ops',    'التقرير اليومي مُرسَل قبل 11 مساءً',         'compliance', NULL, NULL,  FALSE, 100),
((SELECT id FROM checklist), 'safety', 'صحة الوثائق والتصاريح 100%',                'compliance', NULL, NULL,  TRUE,  110),
((SELECT id FROM checklist), 'safety', 'صفر حادث وصفر مخالفة سلامة جسيمة',          'compliance', NULL, NULL,  TRUE,  120);


-- ═══════════════════════════════════════════════════════════════════════
-- 4) معايير الحراسات (Security Criteria)
-- ═══════════════════════════════════════════════════════════════════════

-- ─── المراحل الزمنية الإلزامية للحراسات (7 بنود) ──────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'sec_pre_timeline') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'sec_pre_timeline')
INSERT INTO contract_criteria (checklist_id, section, name_ar, description, answer_type, sort_order) VALUES
((SELECT id FROM checklist), 'timeline', 'تقديم قائمة الكادر الكاملة (14+2) بالأسماء والهويات والتراخيص', 'الموعد: 20 شوال',          'compliance', 10),
((SELECT id FROM checklist), 'timeline', 'تقديم نسخ معتمدة من رخص العمل الأمني وشهادات اللياقة',           'الموعد: 25 شوال',          'compliance', 20),
((SELECT id FROM checklist), 'timeline', 'إنجاز جميع تصاريح المشاعر للكادر وتسليم نسخ معتمدة',           'الموعد: 1 ذو القعدة',     'compliance', 30),
((SELECT id FROM checklist), 'timeline', 'تسليم بيانات الزي الموحّد وبطاقات التعريف والمعدات الأمنية',     'الموعد: 5 ذو القعدة',     'compliance', 40),
((SELECT id FROM checklist), 'timeline', 'اعتماد محضر الجاهزية التشغيلية الكامل من الطرفين',               'الموعد: 10 ذو القعدة',     'compliance', 50),
((SELECT id FROM checklist), 'timeline', 'زيارة ميدانية مشتركة لمخيمات الطرف الثاني للتنسيق',              'الموعد: 12 ذو القعدة',     'compliance', 60),
((SELECT id FROM checklist), 'timeline', 'بدء التشغيل الفعلي - وصول الكادر واستلام نقاط الحراسة',          'الموعد: 15 ذو القعدة',     'compliance', 70);


-- ─── محضر الجاهزية للحراسات (17 بند) ──────────────────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'sec_pre_readiness') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'sec_pre_readiness')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'workforce','قائمة الكادر الكاملة (14+2) بأسمائهم وهوياتهم معتمدة كتابياً','compliance', TRUE,  10),
((SELECT id FROM checklist), 'permits',  'تراخيص العمل الأمني من وزارة الداخلية 100%',                  'compliance', TRUE,  20),
((SELECT id FROM checklist), 'permits',  'تصاريح المشاعر للكادر 100% من 16 فرداً',                      'compliance', TRUE,  30),
((SELECT id FROM checklist), 'workforce','اللياقة الطبية لكل فرد 100% خلال 6 أشهر',                     'compliance', TRUE,  40),
((SELECT id FROM checklist), 'workforce','تقارير الفحص الأمني والسلوك 100% خالية من السوابق',           'compliance', TRUE,  50),
((SELECT id FROM checklist), 'permits',  'وثيقة التأمين التجاري سارية',                                  'compliance', TRUE,  60),
((SELECT id FROM checklist), 'training', 'التدريب الأمني المعتمد قبل الموسم بـ 10 أيام 100% اجتاز',     'compliance', TRUE,  70),
((SELECT id FROM checklist), 'equipment','الزي الموحّد وبطاقات التعريف 100% موزّع وجاهز',               'compliance', FALSE, 80),
((SELECT id FROM checklist), 'equipment','أجهزة الاتصال اللاسلكي - تكفي 16 جهازاً + احتياط',            'compliance', FALSE, 90),
((SELECT id FROM checklist), 'ops',      'خطة الطوارئ المكتوبة والمعتمدة مقدّمة',                       'compliance', FALSE, 100),
((SELECT id FROM checklist), 'ops',      'المشرف الميداني معيَّن ومتاح',                                'compliance', FALSE, 110),
((SELECT id FROM checklist), 'ops',      'أرقام التواصل مع الجهات الأمنية محفوظة في كل نقطة',           'compliance', FALSE, 120),
((SELECT id FROM checklist), 'equipment','علب الإسعافات الأولية كاملة في كل نقطة',                       'compliance', FALSE, 130),
((SELECT id FROM checklist), 'ops',      'زيارة معاينة المواقع منفذة وموثّقة بمحضر',                    'compliance', FALSE, 140),
((SELECT id FROM checklist), 'ops',      'خطة الورديات الأسبوعية معتمدة من المشرف',                     'compliance', FALSE, 150),
((SELECT id FROM checklist), 'workforce','تعهّد السرية الموقّع من كل فرد 100% موقّع',                  'compliance', FALSE, 160),
((SELECT id FROM checklist), 'equipment','نظام تسجيل الدوريات (إلكتروني أو يدوي) جاهز ومُختبَر',         'compliance', FALSE, 170);


-- ─── المتابعة اليومية للحراسات (13 بند) ───────────────────────────────
DELETE FROM contract_criteria WHERE checklist_id IN (SELECT id FROM contract_checklists WHERE code = 'sec_daily') AND contract_id IS NULL;

WITH checklist AS (SELECT id FROM contract_checklists WHERE code = 'sec_daily')
INSERT INTO contract_criteria (checklist_id, section, name_ar, answer_type, required_qty, qty_unit, is_critical, sort_order) VALUES
((SELECT id FROM checklist), 'workforce','حضور الكادر كامل في كل وردية',                  'ratio',      14, 'فرد', FALSE, 10),
((SELECT id FROM checklist), 'workforce','الكادر الاحتياطي متاح (رجل + امرأة)',           'ratio',      2,  'فرد', FALSE, 20),
((SELECT id FROM checklist), 'equipment','اكتمال الزي الموحّد وبطاقات التعريف',           'compliance', NULL, NULL,  FALSE, 30),
((SELECT id FROM checklist), 'equipment','أجهزة الاتصال اللاسلكي تعمل',                   'compliance', NULL, NULL,  FALSE, 40),
((SELECT id FROM checklist), 'equipment','كاميرات المراقبة فعّالة وتسجّل',                'compliance', NULL, NULL,  FALSE, 50),
((SELECT id FROM checklist), 'patrol',  'الدوريات الموثّقة كل ساعة',                      'ratio',      24, 'دورية',FALSE, 60),
((SELECT id FROM checklist), 'equipment','علب الإسعافات كاملة في كل نقطة',                'compliance', NULL, NULL,  FALSE, 70),
((SELECT id FROM checklist), 'reporting','التقرير اليومي مُرسَل قبل 10 مساءً',             'compliance', NULL, NULL,  FALSE, 80),
((SELECT id FROM checklist), 'workforce','كشف الحضور والانصراف موثّق',                    'compliance', NULL, NULL,  FALSE, 90),
((SELECT id FROM checklist), 'safety',  'صحة الوثائق والتصاريح 100%',                     'compliance', NULL, NULL,  TRUE,  100),
((SELECT id FROM checklist), 'safety',  'صفر حالة نوم أثناء الخدمة',                      'compliance', NULL, NULL,  TRUE,  110),
((SELECT id FROM checklist), 'safety',  'صفر تحرّش أو إساءة لأي حاج',                    'compliance', NULL, NULL,  TRUE,  120),
((SELECT id FROM checklist), 'safety',  'صفر اقتحام أو مخالفة سلامة جسيمة',               'compliance', NULL, NULL,  TRUE,  130);


-- ═══════════════════════════════════════════════════════════════════════
-- 5) تعريفات KPI الأسبوعية للإعاشة (12 مؤشر)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO contract_kpi_definitions (domain_id, code, name_ar, target_operator, target_value, target_unit, is_zero_tolerance, sort_order) VALUES
('food', 'on_time_meal',    'الالتزام بوقت تسليم الوجبة',  '>=',  95,    '%',      FALSE, 10),
('food', 'hot_temp',        'حرارة الوجبات الساخنة',         '>=',  65,    '°م',     FALSE, 20),
('food', 'qty_accuracy',    'دقة الكميات المقدمة',           '>=',  98,    '%',      FALSE, 30),
('food', 'menu_match',      'مطابقة القوائم الغذائية',       '=',   100,   '%',      FALSE, 40),
('food', 'stations_24',     'توفر الأركان 24 ساعة',           '=',   100,   '%',      FALSE, 50),
('food', 'buffet_duration', 'متوسط مدة عرض البوفيه',         '<=',  60,    'دقيقة',  FALSE, 60),
('food', 'critical_resp',   'استجابة البلاغ الحرج',          '<=',  5,     'دقيقة',  FALSE, 70),
('food', 'workforce_attend','حضور العمالة',                   '>=',  98,    '%',      FALSE, 80),
('food', 'satisfaction',    'رضا الحجاج',                     '>=',  95,    '%',      FALSE, 90),
('food', 'food_waste',      'نسبة الهدر الغذائي',             '<=',  5,     '%',      FALSE, 100),
('food', 'major_violations','مخالفات صحية جسيمة',             '=',   0,     'حالة',   TRUE,  110),
('food', 'penalty_total',   'الغرامات التراكمية',             '<=',  30,    '%',      FALSE, 120)
ON CONFLICT (domain_id, code) DO NOTHING;



-- ═══════════════════════════════════════════════════════════════════════
-- 6) الأدوار الإضافية في النظام
-- ═══════════════════════════════════════════════════════════════════════
-- تذكير: نضيف هذه الأدوار في تطبيق React وفي قائمة الأدوار
-- بدون الحاجة لتعديل بنية users:
--
-- 'contractor_monitor_food'      → مراقب الإعاشة
-- 'contractor_monitor_transport' → مراقب النقل
-- 'contractor_monitor_security'  → مراقب الحراسات
-- 'contractor_pmo'               → مدير المشروع (PMO)

-- ═══════════════════════════════════════════════════════════════════════
-- نهاية Seed Data
-- ═══════════════════════════════════════════════════════════════════════
