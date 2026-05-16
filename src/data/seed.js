// =================================================================
// البيانات الأولية للنظام
// =================================================================

export const DATES = [
  { id: '1', label: '1 ذي الحجة', day: 'الأحد' },
  { id: '2', label: '2 ذي الحجة', day: 'الاثنين' },
  { id: '3', label: '3 ذي الحجة', day: 'الثلاثاء' },
  { id: '4', label: '4 ذي الحجة', day: 'الأربعاء' },
  { id: '5', label: '5 ذي الحجة', day: 'الخميس' },
  { id: '6', label: '6 ذي الحجة', day: 'الجمعة' },
  { id: '7', label: '7 ذي الحجة', day: 'السبت' },
  { id: '8', label: '8 ذي الحجة', day: 'الأحد', special: 'يوم التروية' },
  { id: '9', label: '9 ذي الحجة', day: 'الاثنين', special: 'يوم عرفة' },
  { id: '10', label: '10 ذي الحجة', day: 'الثلاثاء', special: 'يوم النحر' },
  { id: '11', label: '11 ذي الحجة', day: 'الأربعاء', special: 'التشريق' },
  { id: '12', label: '12 ذي الحجة', day: 'الخميس', special: 'التشريق' },
  { id: '13', label: '13 ذي الحجة', day: 'الجمعة', special: 'التشريق' },
];

// إعدادات افتراضية يستطيع الأدمن تعديلها
export const DEFAULT_SETTINGS = {
  seasonStartDate: null, // ISO date: YYYY-MM-DD
};

// =================================================================
// الشركات الافتراضية - الأدمن يستطيع الإضافة والتعديل والحذف
// =================================================================
export const INITIAL_COMPANIES = [
  { id: 'c1', name: 'شركة الإتقان', code: 'ITQ', contract: 'MOH-1447-001', active: true },
  { id: 'c2', name: 'شركة أضواء الإيمان', code: 'ADW', contract: 'MOH-1447-002', active: true },
  { id: 'c3', name: 'شركة الضيافة المتميزة', code: 'DYF', contract: 'MOH-1447-003', active: true },
];

// المستخدم الافتراضي الوحيد (مدير النظام)
export const INITIAL_USERS = [
  { id: 'u1', name: 'مدير النظام', username: 's123', role: 'admin', companyId: null, section: null, phone: '', active: true },
];

// =================================================================
// الصلاحيات الأربعة
// =================================================================
export const ROLES_CONFIG = {
  admin: {
    label: 'مدير النظام',
    color: '#6B3AA0',
    description: 'صلاحية كاملة على كل النظام',
  },
  dashboard: {
    label: 'عرض لوحة المتابعة',
    color: '#2C5282',
    description: 'الإدارة العليا لاستعراض التقارير لكل الشركات',
  },
  data_entry: {
    label: 'مدخل بيانات',
    color: '#2D6A4F',
    description: 'إدخال التقييمات لشركة وقسم محددَين',
  },
  supervisor: {
    label: 'مشرف المتابعة',
    color: '#B86E1C',
    description: 'متابعة مدخلي البيانات في قسم محدد وإصدار تقارير يومية',
  },
};

// مسميات التقييم - مع نصوص بدل النجوم
export const SCALE_LABELS = {
  1: { text: 'ضعيف جداً', color: '#A83232', bg: '#F5D5D5' },
  2: { text: 'ضعيف', color: '#B86E1C', bg: '#FBE9D0' },
  3: { text: 'جيد', color: '#B89968', bg: '#F3EADA' },
  4: { text: 'جيد جداً', color: '#4A7C59', bg: '#DFEBD4' },
  5: { text: 'ممتاز', color: '#2D6A4F', bg: '#D4E9DD' },
};

// =================================================================
// دوال مساعدة للتواريخ
// =================================================================

// الحصول على معرّف اليوم الافتراضي
export function getDefaultDateId(seasonStartDate) {
  if (!seasonStartDate) return '1';
  const start = new Date(seasonStartDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return '1';
  if (diffDays >= 13) return '13';
  return String(diffDays + 1);
}

// الحصول على التاريخ الميلادي ليوم هجري محدد
export function getGregorianDateForHijriDay(hijriDayId, seasonStartDate) {
  if (!seasonStartDate) return null;
  const start = new Date(seasonStartDate);
  start.setHours(0, 0, 0, 0);
  const dayNum = parseInt(hijriDayId);
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + dayNum - 1);
  return targetDate;
}

// تنسيق التاريخ الميلادي
export function formatGregorianDate(date) {
  if (!date) return '';
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

// الحصول على اسم اليوم الفعلي (بناءً على التاريخ الميلادي الحقيقي)
export function getDayName(date) {
  if (!date) return '';
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}
