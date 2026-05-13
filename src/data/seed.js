// =================================================================
// البيانات الأولية للنظام
// =================================================================
// هذه بيانات تجريبية للعرض. في النسخة الإنتاجية، ستأتي من Supabase.
// =================================================================

export const DATES = [
  { id: '6', label: '6 ذي الحجة', day: 'السبت', gregorian: '5 يونيو' },
  { id: '7', label: '7 ذي الحجة', day: 'الأحد', gregorian: '6 يونيو' },
  { id: '8', label: '8 ذي الحجة', day: 'الاثنين', gregorian: '7 يونيو', special: 'يوم التروية' },
  { id: '9', label: '9 ذي الحجة', day: 'الثلاثاء', gregorian: '8 يونيو', special: 'يوم عرفة' },
  { id: '10', label: '10 ذي الحجة', day: 'الأربعاء', gregorian: '9 يونيو', special: 'يوم النحر' },
  { id: '11', label: '11 ذي الحجة', day: 'الخميس', gregorian: '10 يونيو', special: 'التشريق' },
  { id: '12', label: '12 ذي الحجة', day: 'الجمعة', gregorian: '11 يونيو', special: 'التشريق' },
  { id: '13', label: '13 ذي الحجة', day: 'السبت', gregorian: '12 يونيو', special: 'التشريق' },
];

export const TODAY_INDEX = 3;
export const TODAY_ID = DATES[TODAY_INDEX].id;

export const COMPANIES = [
  { id: 'c1', name: 'شركة الإتقان', code: 'ITQ', contract: 'MOH-1447-001', active: true },
  { id: 'c2', name: 'شركة أضواء الإيمان', code: 'ADW', contract: 'MOH-1447-002', active: true },
  { id: 'c3', name: 'شركة الضيافة المتميزة', code: 'DYF', contract: 'MOH-1447-003', active: true },
];

export const USERS = [
  { id: 'u1', name: 'مدير النظام', username: 'admin', password: 'admin', role: 'admin', companyId: null, section: null, phone: '0500000000', active: true },
  { id: 'u2', name: 'أحمد محمد الغامدي', username: 'ahmed', password: '1234', role: 'data_entry', companyId: 'c1', section: 'رجال', phone: '0501234567', active: true },
  { id: 'u3', name: 'نورة خالد السبيعي', username: 'noura', password: '1234', role: 'data_entry', companyId: 'c1', section: 'نساء', phone: '0507654321', active: true },
  { id: 'u4', name: 'فهد عبدالله العتيبي', username: 'fahad', password: '1234', role: 'dashboard', companyId: null, section: null, phone: '0503456789', active: true },
];

export const ROLES_CONFIG = {
  admin: { label: 'مدير النظام', color: '#6B3AA0' },
  dashboard: { label: 'عرض لوحة المتابعة', color: '#2C5282' },
  data_entry: { label: 'مدخل بيانات', color: '#2D6A4F' },
};

export const SCALE_LABELS = {
  5: { text: 'ممتاز', color: '#2D6A4F', bg: '#D4E9DD' },
  4: { text: 'جيد جداً', color: '#4A7C59', bg: '#DFEBD4' },
  3: { text: 'جيد', color: '#B89968', bg: '#F3EADA' },
  2: { text: 'ضعيف', color: '#B86E1C', bg: '#FBE9D0' },
  1: { text: 'ضعيف جداً', color: '#A83232', bg: '#F5D5D5' },
};
