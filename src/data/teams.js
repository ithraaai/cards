// =================================================================
// قائمة الفرق ومعاييرها
// =================================================================
// كل فريق له:
// - id: المعرّف الفريد
// - name: اسم الفريق
// - description: وصف الفريق
// - startDateId: معرّف اليوم الذي يبدأ فيه العمل (مثل '1' أو '7')
// - criteria: قائمة المعايير
//
// كل معيار له:
// - id: معرّف فريد
// - name: نص المعيار
// - type: 'yesno' | 'scale' | 'number' | 'text'
// - noteRequired: 'no' | 'low' | 'always' (مستوى إلزامية الملاحظة)
// - repeat: 'daily' | 'first_day_only' (نوع التكرار)
//   * daily: يتكرر كل يوم
//   * first_day_only: يظهر في أول يوم فقط من بدء الفريق
// =================================================================

export const INITIAL_TEAMS = [
  {
    id: 't1',
    name: 'فريق الاستقبال',
    description: 'استقبال ضيوف الرحمن وتنظيم المدخل',
    startDateId: '1',
    criteria: [
      { id: 't1c1', name: 'تواجد مدير الموقع في استقبال ضيوف الرحمن', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't1c2', name: 'تواجد فريق الاستقبال (تجربة الضيف)', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't1c3', name: 'تواجد الحراسات الأمنية وتوزيعهم بالشكل المناسب', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't1c4', name: 'خلو الساحات الخارجية من السيارات والعوائق', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't1c5', name: 'توفر المعقمات والكمامات وسلال النفايات عند المدخل', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't1c6', name: 'التزام المشرفين والعاملين بالزي المحدد', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't1c7', name: 'انسيابية الحركة في مدخل المخيم', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't1c8', name: 'الانسيابية في تسكين ضيوف الرحمن', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't1c9', name: 'سرعة معالجة المشكلات', type: 'scale', noteRequired: 'low', repeat: 'daily' },
    ],
  },
  {
    id: 't2',
    name: 'فريق الإعاشة',
    description: 'توزيع الوجبات والمشروبات وضمان سلامة الغذاء',
    startDateId: '7',
    criteria: [
      { id: 't2c1', name: 'وجود متعهد للإعاشة', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't2c2', name: 'تواجد المشرف على الإعاشة في مقر التوزيع', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't2c3', name: 'وجود آلية توزيع الوجبات', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't2c4', name: 'نظافة الأدوات المستخدمة في توزيع الوجبات', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't2c5', name: 'نظافة زي العاملين المشرفين على الإعاشة', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't2c6', name: 'توزيع الوجبات وفق الجدول المخصص', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't2c7', name: 'احتفاظ الوجبات بحرارتها والمشروبات ببرودتها', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't2c8', name: 'نظافة الثلاجات وجودة التبريد', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't2c9', name: 'نظافة سلات النفايات في مواقع التوزيع', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't2c10', name: 'رضا ضيوف الرحمن عن الوجبات المقدمة', type: 'scale', noteRequired: 'low', repeat: 'daily' },
    ],
  },
  {
    id: 't3',
    name: 'فريق التسكين',
    description: 'تجهيز ومتابعة الخيام',
    startDateId: '7',
    criteria: [
      { id: 't3c1', name: 'تعقيم الخيام قبل وصول ضيوف الرحمن', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't3c2', name: 'نظافة الخيام قبل الوصول', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't3c3', name: 'جودة التكييف', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't3c4', name: 'جودة الإضاءة', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't3c5', name: 'توفر حامل الأحذية عند المدخل', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't3c6', name: 'توفر المعقمات داخل الخيمة', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't3c7', name: 'توفر المرتبة والمخدة والبطانية لكل ضيف', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't3c8', name: 'سهولة وصول الضيف إلى موقعه', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't3c9', name: 'معالجة مشكلات التسكين', type: 'scale', noteRequired: 'low', repeat: 'daily' },
    ],
  },
  {
    id: 't4',
    name: 'فريق النقل والتفويج',
    description: 'نقل الحجاج بين المشاعر بسلامة وانسيابية',
    startDateId: '8',
    criteria: [
      { id: 't4c1', name: 'توفر خطة التفويج وإعلانها', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't4c2', name: 'تواجد مشرف النقل والتفويج', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't4c3', name: 'تواجد قائد التفويج في الحافلة', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't4c4', name: 'تعقيم الحافلات قبل صعود الضيوف', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't4c5', name: 'منع التكدس والتجمعات حين النقل', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't4c6', name: 'تنفيذ خطة النقل والتفويج وفق المحدد', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't4c7', name: 'متابعة وصول ضيوف الرحمن إلى المواقع', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't4c8', name: 'متابعة الضيوف التائهين والتأكد من وصولهم', type: 'scale', noteRequired: 'low', repeat: 'daily' },
    ],
  },
  {
    id: 't5',
    name: 'الفريق الثقافي',
    description: 'البرامج الدعوية والثقافية للحجاج',
    startDateId: '7',
    criteria: [
      { id: 't5c1', name: 'توفر برنامج ثقافي معلن للجميع', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't5c2', name: 'تواجد الداعية بالمقر المخصص', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't5c3', name: 'تنفيذ البرامج الثقافية في موعدها', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't5c4', name: 'جودة الصوتيات', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't5c5', name: 'جودة تجهيزات البرامج', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't5c6', name: 'تفاعل ضيوف الرحمن مع البرامج', type: 'scale', noteRequired: 'low', repeat: 'daily' },
    ],
  },
  {
    id: 't6',
    name: 'فريق الخدمات المساندة',
    description: 'الكهرباء والسباكة والتكييف والصيانة',
    startDateId: '1',
    criteria: [
      { id: 't6c1', name: 'سلامة التمديدات الكهربائية', type: 'yesno', noteRequired: 'always', repeat: 'daily' },
      { id: 't6c2', name: 'سلامة أعمال السباكة ودورات المياه', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't6c3', name: 'سلامة التكييف', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't6c4', name: 'توفر الخدمة الكهربائية على مدار الساعة', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't6c5', name: 'جاهزية مخارج الطوارئ', type: 'yesno', noteRequired: 'always', repeat: 'daily' },
      { id: 't6c6', name: 'تواجد فني السباكة والكهرباء والتكييف', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't6c7', name: 'نظافة الممرات على مدار الساعة', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't6c8', name: 'نظافة دورات المياه', type: 'scale', noteRequired: 'low', repeat: 'daily' },
    ],
  },
  {
    id: 't7',
    name: 'فريق نقاط التجمع',
    description: 'استقبال ومغادرة الحجاج من النقاط الخارجية',
    startDateId: '7',
    criteria: [
      { id: 't7c1', name: 'تحديد مسؤول لإدارة نقطة التجمع', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't7c2', name: 'توفر المعقمات والكمامات', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't7c3', name: 'توفر لوحات ترحيبية', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't7c4', name: 'توفر مكتب استقبال ضيوف الرحمن', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't7c5', name: 'نظافة نقطة التجمع', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't7c6', name: 'جاهزية الحافلات', type: 'scale', noteRequired: 'low', repeat: 'daily' },
    ],
  },
  {
    id: 't8',
    name: 'فريق النظافة',
    description: 'تنظيف الخيام والمرافق العامة',
    startDateId: '7',
    criteria: [
      { id: 't8c1', name: 'تنظيف أرضيات دورات المياه', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c2', name: 'تنظيف المغاسل', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c3', name: 'تنظيف كراسي الحمام', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c4', name: 'تنظيف الحوائط', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c5', name: 'تغيير سلال النفايات', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't8c6', name: 'توفير أدوات النظافة الشخصية', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't8c7', name: 'سلامة رشاش الماء', type: 'yesno', noteRequired: 'always', repeat: 'daily' },
      { id: 't8c8', name: 'تنظيف الغرفة العلاجية', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c9', name: 'مسح الأجهزة الطبية', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c10', name: 'تنظيف المكاتب الإدارية', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c11', name: 'تنظيف أرضيات الممرات الداخلية', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c12', name: 'رش المبيدات للقضاء على الحشرات', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't8c13', name: 'تنظيف أرضيات الممرات الخارجية', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c14', name: 'تنظيف فتحات تصريف المياه', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't8c15', name: 'تنظيف الحوائط الخارجية', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't8c16', name: 'تنظيف أغطية البالوعات الخارجية', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't8c17', name: 'تواجد المشرفة على العاملات في موقعها', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't8c18', name: 'التزام العاملات بالزي المحدد', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
    ],
  },
  {
    id: 't9',
    name: 'فريق إدارة النفايات',
    description: 'إدارة وتصريف النفايات الصلبة من المخيمات',
    startDateId: '1',
    criteria: [
      { id: 't9c1', name: 'وجود خطة تشغيلية معتمدة لإدارة النفايات', type: 'yesno', noteRequired: 'always', repeat: 'first_day_only' },
      { id: 't9c2', name: 'توفر الصندوق الضاغط', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't9c3', name: 'توفر المخزن الأرضي', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't9c4', name: 'جاهزية الصندوق الضاغط للعمل', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't9c5', name: 'توعية الحجاج بآلية الفرز', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't9c6', name: 'توفر حاويات الجمع بممرات المخيمات', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't9c7', name: 'توفر الملصقات للحاويات ووضوحها', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't9c8', name: 'توفر أكياس النفايات بنفس ألوان الحاويات', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't9c9', name: 'تخصيص مشرف للمتابعة', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't9c10', name: 'توفر عمال نظافة كافية ومدربة', type: 'yesno', noteRequired: 'no', repeat: 'first_day_only' },
      { id: 't9c11', name: 'تواجد مشرف إدارة النفايات في الموقع', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
      { id: 't9c12', name: 'إخراج النفايات وفق الجدول الزمني المحدد', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't9c13', name: 'عدد أكياس النفايات المخرجة لكل نوع', type: 'number', unit: 'كيس', noteRequired: 'no', repeat: 'daily' },
      { id: 't9c14', name: 'كمية النفايات الصلبة اليومية بالكيلوجرام (عدد الحجاج × 2)', type: 'number', unit: 'كجم', noteRequired: 'no', repeat: 'daily' },
      { id: 't9c15', name: 'وجود نفايات سائبة غير موجودة في أكياس', type: 'yesno', noteRequired: 'low', repeat: 'daily' },
      { id: 't9c16', name: 'النظافة العامة لمواقع جمع النفايات', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't9c17', name: 'فرز النفايات حسب النوع (عضوي / بلاستيك / ورق)', type: 'scale', noteRequired: 'low', repeat: 'daily' },
      { id: 't9c18', name: 'سرعة الاستجابة للبلاغات والشكاوى', type: 'scale', noteRequired: 'low', repeat: 'daily' },
    ],
  },
];

// =================================================================
// دالة مساعدة: هل يجب عرض المعيار في هذا اليوم؟
// =================================================================
export function shouldShowCriterion(criterion, team, currentDateId, userSection = null) {
  // إذا التكرار يومي → يظهر دائماً ابتداءً من تاريخ بدء الفريق
  // إذا التكرار أول يوم فقط → يظهر في يوم بدء الفريق فقط

  const teamStart = parseInt(team.startDateId || '1');
  const current = parseInt(currentDateId);

  // قبل تاريخ بدء الفريق: لا يظهر
  if (current < teamStart) return false;

  // فحص نطاق القسم
  if (userSection) {
    const scope = criterion.sectionScope || 'all';
    if (scope === 'men' && userSection !== 'رجال') return false;
    if (scope === 'women' && userSection !== 'نساء') return false;
  }

  if (criterion.repeat === 'first_day_only') {
    // يظهر فقط في تاريخ بدء الفريق
    return current === teamStart;
  }

  // التكرار اليومي: يظهر من تاريخ البدء فأكثر
  return true;
}

// هل الفريق نشط في هذا اليوم؟
export function isTeamActiveOnDate(team, currentDateId) {
  const teamStart = parseInt(team.startDateId || '1');
  const current = parseInt(currentDateId);
  return current >= teamStart;
}
