// =================================================================
// البيانات الأولية والدوال المساعدة
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

export const DEFAULT_SETTINGS = {
  season_start_date: null,
  closing_mode: 'always_open',
  closing_time: '19:00:00',
  unified_start_date_id: null,
  manually_closed_dates: [],
  sessions_mode: 'single',
  session1_close_time: '12:00:00',
  session2_close_time: '22:00:00',
  sessions_scope_section: 'all',
  sessions_scope_teams: [],
};

export const INITIAL_USERS = [
  { id: 'u1', name: 'مدير النظام', username: 's123', role: 'admin' },
];

export const ROLES_CONFIG = {
  admin: { label: 'مدير النظام', color: '#6B3AA0', description: 'صلاحية كاملة على كل النظام' },
  dashboard: { label: 'عرض لوحة المتابعة', color: '#2C5282', description: 'الإدارة العليا لاستعراض التقارير' },
  data_entry: { label: 'مدخل بيانات', color: '#2D6A4F', description: 'إدخال التقييمات لشركة وقسم محددَين' },
  supervisor: { label: 'مشرف المتابعة', color: '#B86E1C', description: 'متابعة مدخلي البيانات في قسم محدد' },
  contractor_monitor_food: { label: 'مراقب الإعاشة', color: '#E85D24', description: 'مراقبة تنفيذ عقود الإعاشة', module: 'contractors' },
  contractor_monitor_transport: { label: 'مراقب النقل', color: '#185FA5', description: 'مراقبة تنفيذ عقود النقل', module: 'contractors' },
  contractor_monitor_security: { label: 'مراقب الحراسات', color: '#27500A', description: 'مراقبة تنفيذ عقود الحراسات', module: 'contractors' },
  contractor_pmo: { label: 'مدير المشروع (PMO)', color: '#4B1528', description: 'إدارة كاملة لوحدة المتعهدين', module: 'contractors' },
};

// الأدوار التي تنتمي لوحدة المتعهدين
export const CONTRACTOR_ROLES = ['contractor_monitor_food', 'contractor_monitor_transport', 'contractor_monitor_security', 'contractor_pmo'];

// هل المستخدم له صلاحية على وحدة المتعهدين؟
export function hasContractorsAccess(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return CONTRACTOR_ROLES.includes(user.role);
}

// هل المستخدم له صلاحية على وحدة البطاقات (النظام الأساسي)؟
export function hasCardsAccess(user) {
  if (!user) return false;
  return !CONTRACTOR_ROLES.includes(user.role);
}

export const SCALE_LABELS = {
  1: { text: 'ضعيف جداً', color: '#A83232', bg: '#F5D5D5' },
  2: { text: 'ضعيف', color: '#B86E1C', bg: '#FBE9D0' },
  3: { text: 'جيد', color: '#B89968', bg: '#F3EADA' },
  4: { text: 'جيد جداً', color: '#4A7C59', bg: '#DFEBD4' },
  5: { text: 'ممتاز', color: '#2D6A4F', bg: '#D4E9DD' },
};

export const CLOSING_MODES = {
  always_open: { label: 'مفتوح دائماً', description: 'التقييم لا يغلق تلقائياً' },
  end_of_day: { label: 'نهاية اليوم', description: 'يغلق منتصف الليل (12 صباحاً اليوم التالي)' },
  mid_day: { label: 'منتصف اليوم', description: 'يغلق الساعة 12 ظهراً اليوم التالي' },
  custom_time: { label: 'وقت محدد', description: 'يغلق في الوقت الذي تحدده يومياً' },
  manual: { label: 'إغلاق يدوي فقط', description: 'لا يغلق تلقائياً — يتحكم به المدير فقط' },
};

// =================================================================
// دوال التواريخ
// =================================================================

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

export function getGregorianDateForHijriDay(hijriDayId, seasonStartDate) {
  if (!seasonStartDate) return null;
  const start = new Date(seasonStartDate);
  start.setHours(0, 0, 0, 0);
  const dayNum = parseInt(hijriDayId);
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + dayNum - 1);
  return targetDate;
}

export function formatGregorianDate(date) {
  if (!date) return '';
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export function getDayName(date) {
  if (!date) return '';
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

// =================================================================
// منطق إغلاق التقييم
// =================================================================

/**
 * يتحقق هل التقييم مغلق لتاريخ محدد بناءً على الإعدادات
 * Returns: { closed: boolean, reason: string }
 */
export function isEvaluationClosed(dateId, settings) {
  if (!settings) return { closed: false, reason: '' };

  // 1. الإغلاق اليدوي
  const manualClosed = settings.manually_closed_dates || [];
  if (manualClosed.includes(dateId)) {
    return { closed: true, reason: 'مغلق يدوياً من المدير' };
  }

  // 2. تواريخ مستقبلية مقفلة دائماً
  const todayId = getDefaultDateId(settings.season_start_date);
  const dateNum = parseInt(dateId);
  const todayNum = parseInt(todayId);
  if (dateNum > todayNum) {
    return { closed: true, reason: 'يوم قادم' };
  }

  // 3. الأيام السابقة لليوم الحالي + الإغلاق التلقائي
  if (dateNum < todayNum) {
    // اليوم السابق دائماً مغلق إذا كان وضع الإغلاق ليس "always_open"
    if (settings.closing_mode !== 'always_open' && settings.closing_mode !== 'manual') {
      return { closed: true, reason: 'يوم سابق مغلق تلقائياً' };
    }
  }

  // 4. اليوم الحالي + إغلاق تلقائي
  if (dateNum === todayNum && settings.season_start_date) {
    const now = new Date();
    const gregDate = getGregorianDateForHijriDay(dateId, settings.season_start_date);

    if (gregDate) {
      const dayStart = new Date(gregDate);
      dayStart.setHours(0, 0, 0, 0);

      if (settings.closing_mode === 'mid_day') {
        const nextDayMidday = new Date(dayStart);
        nextDayMidday.setDate(nextDayMidday.getDate() + 1);
        nextDayMidday.setHours(12, 0, 0, 0);
        if (now >= nextDayMidday) {
          return { closed: true, reason: 'انتهى موعد التعبئة (منتصف اليوم التالي)' };
        }
      } else if (settings.closing_mode === 'end_of_day') {
        const nextDayMidnight = new Date(dayStart);
        nextDayMidnight.setDate(nextDayMidnight.getDate() + 1);
        nextDayMidnight.setHours(0, 0, 0, 0);
        if (now >= nextDayMidnight) {
          return { closed: true, reason: 'انتهى موعد التعبئة (نهاية اليوم)' };
        }
      } else if (settings.closing_mode === 'custom_time' && settings.closing_time) {
        // الإغلاق في الوقت المحدد من اليوم التالي
        const closingTimeParts = settings.closing_time.split(':');
        const nextDayClosing = new Date(dayStart);
        nextDayClosing.setDate(nextDayClosing.getDate() + 1);
        nextDayClosing.setHours(parseInt(closingTimeParts[0]), parseInt(closingTimeParts[1] || '0'), 0, 0);
        if (now >= nextDayClosing) {
          return { closed: true, reason: `انتهى موعد التعبئة (${settings.closing_time.slice(0, 5)})` };
        }
      }
    }
  }

  return { closed: false, reason: '' };
}

// =================================================================
// منطق الجلسات (الإصدار الجديد)
// =================================================================

/**
 * التحقق هل الجلستان مفعّلتان لمستخدم معين
 * يأخذ بعين الاعتبار: قسم المستخدم، فرق محددة (إن وجدت)
 */
/**
 * هل الجلستان مفعّلتان لمستخدم في فريق معيّن؟
 * - يفحص: قسم المستخدم، وهل هذا الفريق محدد في scope_teams (إن وُجد)
 * - إذا scope_teams فارغ، يعتبر الكل
 */
export function isSessionsEnabledForTeam(user, settings, teamId) {
  if (!settings || settings.sessions_mode !== 'double') return false;

  // فحص نطاق القسم
  const scopeSec = settings.sessions_scope_section || 'all';
  if (scopeSec === 'men' && user?.section !== 'رجال') return false;
  if (scopeSec === 'women' && user?.section !== 'نساء') return false;

  // فحص نطاق الفرق: إذا تم تحديد فرق معينة، يجب أن يكون هذا الفريق منها
  const scopeTeams = settings.sessions_scope_teams || [];
  if (scopeTeams.length > 0 && teamId) {
    if (!scopeTeams.includes(teamId)) return false;
  }

  return true;
}

/**
 * @deprecated استخدم isSessionsEnabledForTeam بدلاً منه
 */
export function isSessionsEnabledForUser(user, settings, teamIds = []) {
  if (!settings || settings.sessions_mode !== 'double') return false;
  const scopeSec = settings.sessions_scope_section || 'all';
  if (scopeSec === 'men' && user?.section !== 'رجال') return false;
  if (scopeSec === 'women' && user?.section !== 'نساء') return false;
  const scopeTeams = settings.sessions_scope_teams || [];
  if (scopeTeams.length > 0 && teamIds.length > 0) {
    const hasMatch = teamIds.some(tid => scopeTeams.includes(tid));
    if (!hasMatch) return false;
  }
  return true;
}

/**
 * هل جلسة معينة (1 أو 2) مغلقة لتاريخ معيّن؟
 * المنطق الجديد: الجلستان متاحتان كاملاً طوال اليوم.
 * تُغلقان فقط إذا انتهى اليوم (يوم سابق) أو أُغلق يدوياً.
 */
export function isSessionClosed(sessionNum, dateId, settings) {
  if (!settings || !settings.season_start_date) return { closed: false, reason: '' };

  const manualClosed = settings.manually_closed_dates || [];
  if (manualClosed.includes(dateId)) {
    return { closed: true, reason: 'مغلق يدوياً من المدير' };
  }

  const todayId = getDefaultDateId(settings.season_start_date);
  const dateNum = parseInt(dateId);
  const todayNum = parseInt(todayId);

  if (dateNum > todayNum) return { closed: true, reason: 'يوم قادم' };
  if (dateNum < todayNum) return { closed: true, reason: 'يوم سابق' };

  // اليوم الحالي: مفتوح دائماً (لا قيود توقيت على الجلسة)
  return { closed: false, reason: '' };
}

/**
 * فلترة المعايير حسب قسم المستخدم
 */
export function filterCriteriaForSection(criteria, userSection) {
  return criteria.filter(c => {
    const scope = c.sectionScope || 'all';
    if (scope === 'all') return true;
    if (scope === 'men' && userSection === 'رجال') return true;
    if (scope === 'women' && userSection === 'نساء') return true;
    return false;
  });
}

export const SECTION_SCOPE_LABELS = {
  all: { label: 'الكل (رجال ونساء)', icon: '👥', color: '#185FA5' },
  men: { label: 'رجال فقط', icon: '👤', color: '#2C5282' },
  women: { label: 'نساء فقط', icon: '👤', color: '#D96E8A' },
};

export const SESSIONS_SCOPE_LABELS = {
  all: { label: 'كل الأقسام (رجال ونساء)', color: '#185FA5' },
  men: { label: 'قسم الرجال فقط', color: '#2C5282' },
  women: { label: 'قسم النساء فقط', color: '#D96E8A' },
};
