import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
  LayoutDashboard, ClipboardList, Settings, LogOut, Menu, AlertTriangle,
  CheckCircle2, User, Calendar, Award, Activity, Info, AlertCircle,
  MessageSquare, Plus, X, ChevronDown, ChevronLeft, ChevronRight, Lock,
  ThumbsUp, ThumbsDown, HelpCircle, Check, Building2,
  TrendingUp, TrendingDown, Wifi, WifiOff, Users as UsersIcon,
  Trash2, Edit2, Phone, Shield, Save, Hash, Eye, FileBarChart,
  Filter, ChevronUp, Trophy, Flame,
  PieChart as PieChartIcon, Loader2, Clock, Unlock, FileText,
  FileImage, FileDown, ArrowRight,
} from 'lucide-react';

import { Button } from './Button.jsx';
import { Card, Badge } from './Card.jsx';
import { Input } from './Input.jsx';
import { Logo } from './Logo.jsx';
import { EntryReportPage } from './EntryReport.jsx';
import { shouldShowCriterion, isTeamActiveOnDate } from '../data/teams.js';
import {
  DATES, ROLES_CONFIG, SCALE_LABELS,
  getDefaultDateId, getGregorianDateForHijriDay, formatGregorianDate,
  getDayName, isEvaluationClosed, isSessionsEnabledForUser, isSessionClosed,
} from '../data/seed.js';
import { THEME } from '../data/theme.js';
import { calculateStats } from '../data/stats.js';
import * as api from '../data/api.js';

// =================================================================
// Toast System
// =================================================================
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  const icons = { success: CheckCircle2, error: AlertTriangle, info: Info, warning: AlertCircle };
  const colors = { success: THEME.colors.success, error: THEME.colors.danger, info: THEME.colors.info, warning: THEME.colors.warning };
  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => {
        const Icon = icons[t.type] || Info;
        return (
          <div key={t.id} style={{ background: THEME.colors.surface, color: THEME.colors.text, padding: '12px 18px', borderRadius: THEME.radius.md, boxShadow: THEME.shadows.lg, display: 'flex', alignItems: 'center', gap: 10, minWidth: 280, borderRight: `4px solid ${colors[t.type]}`, animation: 'slideDown 0.3s ease-out', pointerEvents: 'auto', fontSize: 14, fontWeight: 500, maxWidth: 480 }}>
            <Icon size={20} color={colors[t.type]} strokeWidth={2.5} />
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

function LoadingScreen({ message = 'جاري التحميل...' }) {
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, #0D1824 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: THEME.radius.xl, padding: 30, marginBottom: 20 }}>
        <Logo height={70} />
      </div>
      <Loader2 size={32} color={THEME.colors.accent} style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#fff', marginTop: 14, fontSize: 14, opacity: 0.9 }}>{message}</div>
    </div>
  );
}

function ConnectionErrorScreen({ error, onRetry }) {
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, #0D1824 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: THEME.colors.surface, borderRadius: THEME.radius.xl, padding: 36, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <Logo height={60} />
        </div>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: THEME.colors.dangerSoft, color: THEME.colors.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <WifiOff size={28} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>تعذّر الاتصال بقاعدة البيانات</h2>
        {error && (
          <div style={{ background: THEME.colors.dangerSoft, color: THEME.colors.danger, padding: '10px 14px', borderRadius: THEME.radius.md, fontSize: 12, fontFamily: 'monospace', textAlign: 'left', direction: 'ltr', marginBottom: 16, wordBreak: 'break-all' }}>{error}</div>
        )}
        <Button variant="primary" fullWidth onClick={onRetry}>إعادة المحاولة</Button>
      </div>
    </div>
  );
}

function LoginPage({ onLogin, toast }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!username.trim()) { setError('الرجاء إدخال اسم المستخدم'); return; }
    setLoading(true);
    try {
      const user = await api.findUserByUsername(username);
      if (!user) setError('اسم المستخدم غير صحيح أو الحساب معطّل');
      else {
        const appUser = api.dbUserToApp(user);
        toast.show(`مرحباً ${appUser.name}`, 'success');
        onLogin(appUser);
      }
    } catch (err) { setError('حدث خطأ في الاتصال'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, #0D1824 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: THEME.colors.surface, borderRadius: THEME.radius.xl, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><Logo height={80} /></div>
          <p style={{ fontSize: 13, color: THEME.colors.textTertiary }}>نظام إدارة العمليات — موسم 1447هـ</p>
        </div>
        {error && (
          <div style={{ background: THEME.colors.dangerSoft, color: THEME.colors.danger, padding: '12px 14px', borderRadius: THEME.radius.md, fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} strokeWidth={2.5} />{error}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="اسم المستخدم" icon={User} value={username} onChange={e => setUsername(e.target.value)} placeholder="أدخل اسم المستخدم" onKeyDown={e => e.key === 'Enter' && handleSubmit()} autoFocus disabled={loading}/>
          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={loading}>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</Button>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, unit, color = 'accent', subtitle }) {
  const colors = {
    accent: { bg: '#FAF3E0', fg: THEME.colors.accent },
    success: { bg: THEME.colors.successSoft, fg: THEME.colors.success },
    warning: { bg: THEME.colors.warningSoft, fg: THEME.colors.warning },
    danger: { bg: THEME.colors.dangerSoft, fg: THEME.colors.danger },
    info: { bg: THEME.colors.infoSoft, fg: THEME.colors.info },
    purple: { bg: THEME.colors.purpleSoft, fg: THEME.colors.purple },
  };
  const c = colors[color];
  return (
    <Card padding={16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: THEME.radius.md, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={c.fg} strokeWidth={2.2} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
        <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: c.fg }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: THEME.colors.textTertiary, fontWeight: 600 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 12, color: THEME.colors.textSecondary, fontWeight: 600 }}>{label}</div>
      {subtitle && <div style={{ fontSize: 10, color: THEME.colors.textTertiary, marginTop: 2 }}>{subtitle}</div>}
    </Card>
  );
}

function FilterChips({ companies, teams, selectedCompanies, setSelectedCompanies, selectedTeams, setSelectedTeams, selectedSections, setSelectedSections }) {
  const toggle = (arr, setArr, value) => setArr(arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]);
  const activeCount = selectedCompanies.length + selectedTeams.length + selectedSections.length;

  return (
    <Card padding={16} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Filter size={18} color={THEME.colors.accent} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>الفلاتر</span>
        {activeCount > 0 && (
          <>
            <Badge color="accent">{activeCount} مفعّل</Badge>
            <button onClick={() => { setSelectedCompanies([]); setSelectedTeams([]); setSelectedSections([]); }}
              style={{ marginRight: 'auto', background: 'transparent', border: 'none', color: THEME.colors.danger, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={14} /> مسح الكل
            </button>
          </>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.textTertiary, minWidth: 50 }}>القسم:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['رجال', 'نساء'].map(s => {
              const selected = selectedSections.includes(s);
              return (
                <button key={s} onClick={() => toggle(selectedSections, setSelectedSections, s)}
                  style={{ padding: '6px 14px', background: selected ? THEME.colors.success : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `1.5px solid ${selected ? THEME.colors.success : THEME.colors.border}`, borderRadius: THEME.radius.full, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {selected && <Check size={12} style={{ display: 'inline', marginLeft: 4 }} />}{s}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.textTertiary, minWidth: 50, paddingTop: 5 }}>الشركات:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
            {companies.filter(c => c.active).map(c => {
              const selected = selectedCompanies.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggle(selectedCompanies, setSelectedCompanies, c.id)}
                  style={{ padding: '6px 12px', background: selected ? THEME.colors.primary : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `1.5px solid ${selected ? THEME.colors.primary : THEME.colors.border}`, borderRadius: THEME.radius.full, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {selected && <Check size={12} style={{ display: 'inline', marginLeft: 4 }} />}{c.name}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.textTertiary, minWidth: 50, paddingTop: 5 }}>الفرق:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
            {teams.map(t => {
              const selected = selectedTeams.includes(t.id);
              return (
                <button key={t.id} onClick={() => toggle(selectedTeams, setSelectedTeams, t.id)}
                  style={{ padding: '6px 12px', background: selected ? THEME.colors.accent : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `1.5px solid ${selected ? THEME.colors.accent : THEME.colors.border}`, borderRadius: THEME.radius.full, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {selected && <Check size={12} style={{ display: 'inline', marginLeft: 4 }} />}{t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function DashboardPage({ teams, companies, evaluations }) {
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);

  const activeCompanies = companies.filter(c => c.active);
  const criteriaById = useMemo(() => {
    const map = {};
    teams.forEach(t => t.criteria.forEach(c => { map[c.id] = { ...c, teamId: t.id }; }));
    return map;
  }, [teams]);

  const filteredEvals = useMemo(() => {
    const teamCriteriaIds = selectedTeams.length > 0
      ? new Set(teams.filter(t => selectedTeams.includes(t.id)).flatMap(t => t.criteria.map(c => c.id)))
      : null;
    return evaluations.filter(e => {
      if (selectedCompanies.length > 0 && !selectedCompanies.includes(e.company_id)) return false;
      if (selectedSections.length > 0 && !selectedSections.includes(e.section)) return false;
      if (teamCriteriaIds && !teamCriteriaIds.has(e.criterion_id)) return false;
      return true;
    });
  }, [evaluations, selectedCompanies, selectedSections, selectedTeams, teams]);

  const stats = useMemo(() => calculateStats(filteredEvals, criteriaById), [filteredEvals, criteriaById]);

  const companyPerf = useMemo(() => {
    const targets = selectedCompanies.length > 0 ? activeCompanies.filter(c => selectedCompanies.includes(c.id)) : activeCompanies;
    return targets.map(c => {
      const cEvals = filteredEvals.filter(e => e.company_id === c.id);
      const menEvals = cEvals.filter(e => e.section === 'رجال');
      const womenEvals = cEvals.filter(e => e.section === 'نساء');
      return {
        id: c.id, name: c.name.replace('شركة ', ''), fullName: c.name,
        men: calculateStats(menEvals, criteriaById).overall,
        women: calculateStats(womenEvals, criteriaById).overall,
        overall: calculateStats(cEvals, criteriaById).overall,
        evals: cEvals.length,
      };
    }).filter(c => c.evals > 0).sort((a, b) => b.overall - a.overall);
  }, [activeCompanies, selectedCompanies, filteredEvals, criteriaById]);

  const teamPerf = useMemo(() => {
    const targets = selectedTeams.length > 0 ? teams.filter(t => selectedTeams.includes(t.id)) : teams;
    return targets.map(t => {
      const teamCritIds = t.criteria.map(c => c.id);
      const tEvals = filteredEvals.filter(e => teamCritIds.includes(e.criterion_id));
      const tStats = calculateStats(tEvals, criteriaById);
      return { id: t.id, name: t.name.replace('فريق ', '').replace('الفريق ', ''), fullName: t.name, rate: tStats.overall, evals: tStats.total };
    }).filter(t => t.evals > 0).sort((a, b) => b.rate - a.rate);
  }, [teams, selectedTeams, filteredEvals, criteriaById]);

  const topTeams = teamPerf.slice(0, 5);
  const bottomTeams = teamPerf.length > 5 ? teamPerf.slice(-5).reverse() : [];

  const scaleDistData = useMemo(() => [
    { name: 'ممتاز', value: stats.scaleDistribution[5], color: SCALE_LABELS[5].color },
    { name: 'جيد جداً', value: stats.scaleDistribution[4], color: SCALE_LABELS[4].color },
    { name: 'جيد', value: stats.scaleDistribution[3], color: SCALE_LABELS[3].color },
    { name: 'ضعيف', value: stats.scaleDistribution[2], color: SCALE_LABELS[2].color },
    { name: 'ضعيف جداً', value: stats.scaleDistribution[1], color: SCALE_LABELS[1].color },
  ], [stats]);
  const totalScale = scaleDistData.reduce((s, x) => s + x.value, 0);

  const dailyTrend = useMemo(() => {
    return DATES.map(d => {
      const dayEvals = filteredEvals.filter(e => e.date_id === d.id);
      const dStats = calculateStats(dayEvals, criteriaById);
      return { day: d.id, label: `${d.id} ذ.ح`, overall: dStats.overall, total: dStats.total };
    }).filter(d => d.total > 0);
  }, [filteredEvals, criteriaById]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FilterChips
        companies={companies} teams={teams}
        selectedCompanies={selectedCompanies} setSelectedCompanies={setSelectedCompanies}
        selectedTeams={selectedTeams} setSelectedTeams={setSelectedTeams}
        selectedSections={selectedSections} setSelectedSections={setSelectedSections}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <KPICard icon={CheckCircle2} label="المعدل العام" value={stats.overall} unit="%" color="success" />
        <KPICard icon={Award} label="متوسط التقييم" value={stats.avgScale} unit="/5" color="accent" />
        <KPICard icon={ThumbsUp} label="نسبة الامتثال" value={stats.complianceRate} unit="%" color="info" />
        <KPICard icon={Activity} label="إجمالي التقييمات" value={stats.total} color="purple" />
        <KPICard icon={AlertTriangle} label="ملاحظات سلبية" value={stats.negatives} color="warning" />
        <KPICard icon={MessageSquare} label="ملاحظات مكتوبة" value={stats.notes} color="info" />
      </div>

      {stats.total === 0 && (
        <Card padding={30} style={{ textAlign: 'center' }}>
          <Info size={40} color={THEME.colors.textTertiary} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>لا توجد تقييمات بعد</div>
          <div style={{ fontSize: 13, color: THEME.colors.textTertiary }}>ستظهر الإحصاءات هنا بمجرد بدء تسجيل التقييمات.</div>
        </Card>
      )}

      {dailyTrend.length > 0 && (
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Activity size={20} color={THEME.colors.accent} strokeWidth={2} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>الاتجاه اليومي</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyTrend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={THEME.colors.accent} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={THEME.colors.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
              <Area type="monotone" dataKey="overall" name="المعدل %" stroke={THEME.colors.accent} strokeWidth={2.5} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {companyPerf.length > 0 && (
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Building2 size={20} color={THEME.colors.primary} strokeWidth={2} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>مقارنة الشركات</div>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(220, companyPerf.length * 70)}>
            <BarChart data={companyPerf} layout="vertical" margin={{ right: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={v => `${v}%`} contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
              <Legend />
              {(selectedSections.length === 0 || selectedSections.includes('رجال')) && <Bar dataKey="men" name="رجال" fill={THEME.colors.info} radius={[0, 4, 4, 0]} />}
              {(selectedSections.length === 0 || selectedSections.includes('نساء')) && <Bar dataKey="women" name="نساء" fill={THEME.colors.accent} radius={[0, 4, 4, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {companyPerf.length > 0 && (
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Trophy size={20} color={THEME.colors.accent} strokeWidth={2} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>ترتيب الشركات</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {companyPerf.map((c, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              const isTop3 = i < 3;
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: isTop3 ? '#FFFCF5' : THEME.colors.bgSecondary, border: isTop3 ? `1.5px solid ${THEME.colors.accent}33` : '1.5px solid transparent', borderRadius: THEME.radius.md }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isTop3 ? THEME.colors.accent : THEME.colors.surface, color: isTop3 ? '#fff' : THEME.colors.text, border: isTop3 ? 'none' : `1.5px solid ${THEME.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{isTop3 ? medals[i] : `#${i + 1}`}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.fullName}</div>
                    <div style={{ height: 8, background: THEME.colors.bgSecondary, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${c.overall}%`, height: '100%', background: c.overall >= 90 ? THEME.colors.success : c.overall >= 80 ? THEME.colors.accent : THEME.colors.warning, borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.overall >= 90 ? THEME.colors.success : c.overall >= 80 ? THEME.colors.accent : THEME.colors.warning, minWidth: 50, textAlign: 'left' }}>{c.overall}%</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
        {topTeams.length > 0 && (
          <Card padding={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Flame size={20} color={THEME.colors.success} />
              <div style={{ fontSize: 15, fontWeight: 700 }}>أفضل 5 فرق</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topTeams.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: i === 0 ? THEME.colors.successSoft : THEME.colors.bgSecondary, borderRadius: THEME.radius.md }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? THEME.colors.success : THEME.colors.surface, color: i === 0 ? '#fff' : THEME.colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{t.fullName}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: THEME.colors.success }}>{t.rate}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {bottomTeams.length > 0 && (
          <Card padding={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AlertTriangle size={20} color={THEME.colors.warning} />
              <div style={{ fontSize: 15, fontWeight: 700 }}>فرق تحتاج تحسيناً</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bottomTeams.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: i === 0 ? THEME.colors.warningSoft : THEME.colors.bgSecondary, borderRadius: THEME.radius.md }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? THEME.colors.warning : THEME.colors.surface, color: i === 0 ? '#fff' : THEME.colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>!</div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{t.fullName}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: THEME.colors.warning }}>{t.rate}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {totalScale > 0 && (
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <PieChartIcon size={20} color={THEME.colors.accent} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>توزيع التقييمات (تقييم من 5)</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={scaleDistData.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={2}>
                  {scaleDistData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {scaleDistData.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: THEME.colors.textSecondary }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value} ({totalScale > 0 ? Math.round(s.value / totalScale * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function ValueSelector({ criterion, value, onChange, disabled }) {
  if (criterion.type === 'yesno') {
    const options = [
      { val: 'yes', label: 'نعم', icon: ThumbsUp, color: THEME.colors.success, bg: THEME.colors.successSoft },
      { val: 'no', label: 'لا', icon: ThumbsDown, color: THEME.colors.danger, bg: THEME.colors.dangerSoft },
      { val: 'na', label: 'غير منطبق', icon: HelpCircle, color: THEME.colors.textTertiary, bg: THEME.colors.bgSecondary },
    ];
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(o => {
          const Icon = o.icon;
          const isSelected = value === o.val;
          return (
            <button key={o.val} onClick={() => !disabled && onChange(o.val)} disabled={disabled}
              style={{ flex: '1 1 100px', minHeight: 52, padding: '10px 14px', background: isSelected ? o.bg : THEME.colors.surface, color: isSelected ? o.color : THEME.colors.textSecondary, border: `2px solid ${isSelected ? o.color : THEME.colors.border}`, borderRadius: THEME.radius.md, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.5 : 1, fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer' }}>
              <Icon size={18} strokeWidth={2.4} />{o.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (criterion.type === 'scale') {
    const numValue = typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : value;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => {
          const isSelected = numValue === n;
          const sl = SCALE_LABELS[n];
          return (
            <button key={n} onClick={() => !disabled && onChange(n)} disabled={disabled}
              style={{ minHeight: 76, background: isSelected ? sl.bg : THEME.colors.surface, border: `2px solid ${isSelected ? sl.color : THEME.colors.border}`, borderRadius: THEME.radius.md, padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: disabled ? 0.5 : 1, fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: isSelected ? sl.color : THEME.colors.textTertiary, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? sl.color : THEME.colors.textSecondary, textAlign: 'center', lineHeight: 1.2 }}>{sl.text}</div>
            </button>
          );
        })}
        <button onClick={() => !disabled && onChange('na')} disabled={disabled}
          style={{ minHeight: 76, padding: '6px 10px', background: value === 'na' ? THEME.colors.bgSecondary : THEME.colors.surface, border: `2px solid ${value === 'na' ? THEME.colors.borderStrong : THEME.colors.border}`, borderRadius: THEME.radius.md, fontSize: 11, fontWeight: 700, color: THEME.colors.textSecondary, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          <HelpCircle size={20} />
          <span style={{ fontSize: 10 }}>غير منطبق</span>
        </button>
      </div>
    );
  }
  if (criterion.type === 'number') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="number" value={value ?? ''} onChange={e => !disabled && onChange(e.target.value === '' ? null : parseFloat(e.target.value))} disabled={disabled} placeholder="أدخل الرقم..."
          style={{ flex: 1, padding: '12px 16px', fontSize: 16, fontWeight: 700, borderRadius: THEME.radius.md, border: `2px solid ${THEME.colors.border}`, outline: 'none', direction: 'rtl', minHeight: 56, boxSizing: 'border-box' }}/>
        {criterion.unit && <div style={{ padding: '12px 18px', background: THEME.colors.bgSecondary, color: THEME.colors.textSecondary, borderRadius: THEME.radius.md, fontSize: 14, fontWeight: 700, minHeight: 56, display: 'flex', alignItems: 'center' }}>{criterion.unit}</div>}
      </div>
    );
  }
  return null;
}

function CriterionCard({ criterion, index, value, note, onValueChange, onNoteChange, disabled }) {
  const isFilled = value !== null && value !== undefined && value !== '';
  const numValue = typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : value;
  const isNegative = value === 'no' || (typeof numValue === 'number' && criterion.type === 'scale' && numValue < 3);
  const isNA = value === 'na';
  const noteRequired = criterion.noteRequired === 'always' || (criterion.noteRequired === 'low' && isNegative) || isNA;
  const noteMissing = noteRequired && !note?.trim();

  return (
    <div style={{ background: isFilled ? (isNA ? THEME.colors.bgSecondary : '#FDFCF8') : THEME.colors.surface, border: `1.5px solid ${noteMissing ? THEME.colors.warning : isFilled ? '#E8E0D0' : THEME.colors.border}`, borderRadius: THEME.radius.md, padding: 16, opacity: disabled ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isFilled ? (isNA ? THEME.colors.textTertiary : THEME.colors.accent) : THEME.colors.bgSecondary, color: isFilled ? '#fff' : THEME.colors.textTertiary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {isFilled && !isNA ? <Check size={16} strokeWidth={3} /> : index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>{criterion.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge color={criterion.type === 'yesno' ? 'info' : criterion.type === 'scale' ? 'accent' : 'purple'} style={{ fontSize: 10 }}>
              {criterion.type === 'yesno' ? 'نعم / لا' : criterion.type === 'scale' ? 'تقييم من 5' : `رقم (${criterion.unit || ''})`}
            </Badge>
            {criterion.noteRequired === 'always' && <Badge color="warning" style={{ fontSize: 10 }}><MessageSquare size={11} />ملاحظة إلزامية</Badge>}
            {criterion.repeat === 'first_day_only' && <Badge color="info" style={{ fontSize: 10 }}>أول يوم فقط</Badge>}
          </div>
        </div>
      </div>
      <ValueSelector criterion={criterion} value={value} onChange={onValueChange} disabled={disabled} />
      {(noteRequired || note) && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${THEME.colors.border}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: noteMissing ? THEME.colors.warning : THEME.colors.textSecondary, marginBottom: 6 }}>
            <MessageSquare size={14} />
            ملاحظة {noteRequired && <span style={{ color: THEME.colors.danger }}>*</span>}
            {noteMissing && <span style={{ fontSize: 11, marginRight: 'auto' }}>(مطلوبة)</span>}
          </label>
          <textarea value={note || ''} onChange={e => onNoteChange(e.target.value)} disabled={disabled}
            placeholder={isNA ? 'اذكر سبب عدم انطباق المعيار...' : isNegative ? 'اشرح سبب التقييم السلبي...' : 'أضف ملاحظة (اختياري)...'}
            rows={2}
            style={{ width: '100%', padding: '10px 12px', borderRadius: THEME.radius.md, border: `1.5px solid ${noteMissing ? THEME.colors.warning : THEME.colors.border}`, fontSize: 13, direction: 'rtl', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}/>
        </div>
      )}
    </div>
  );
}

function DataEntryPage({ user, teams, settings, toast, evaluations, refreshEvaluations, companies }) {
  const todayId = useMemo(() => getDefaultDateId(settings.season_start_date), [settings]);
  const [activeDate, setActiveDate] = useState(todayId);
  const [activeTeamId, setActiveTeamId] = useState(teams[0]?.id);
  const [activeSession, setActiveSession] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => { setActiveDate(todayId); }, [todayId]);

  const company = companies?.find(c => c.id === user.companyId);

  // فحص هل الجلستان مفعّلتان لهذا المستخدم
  const sessionsEnabled = useMemo(() => {
    return isSessionsEnabledForUser(user, settings, teams.map(t => t.id));
  }, [user, settings, teams]);

  const activeTeam = teams.find(t => t.id === activeTeamId);
  const activeIdx = DATES.findIndex(d => d.id === activeDate);

  // منطق الإغلاق المختلف حسب وضع الجلسات
  const closedInfo = useMemo(() => {
    if (sessionsEnabled) {
      return isSessionClosed(activeSession, activeDate, settings);
    }
    return isEvaluationClosed(activeDate, settings);
  }, [sessionsEnabled, activeSession, activeDate, settings]);

  const isLocked = closedInfo.closed;
  const teamActive = activeTeam ? isTeamActiveOnDate(activeTeam, activeDate) : false;

  // المعايير الظاهرة - مع فلترة القسم
  const visibleCriteria = useMemo(() => {
    if (!activeTeam) return [];
    return activeTeam.criteria.filter(c => shouldShowCriterion(c, activeTeam, activeDate, user.section));
  }, [activeTeam, activeDate, user.section]);

  // إذا اختار المستخدم عرض التقرير
  if (showReport) {
    return (
      <EntryReportPage
        user={user} company={company} teams={teams}
        settings={settings} evaluations={evaluations}
        activeDate={activeDate} activeSession={sessionsEnabled ? activeSession : null}
        onBack={() => setShowReport(false)} toast={toast}
      />
    );
  }

  const getEvaluation = (criterionId) => evaluations.find(e =>
    e.company_id === user.companyId && e.section === user.section &&
    e.date_id === activeDate && e.criterion_id === criterionId &&
    (e.session || 1) === activeSession
  );

  const showSavedBriefly = useCallback(() => {
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2000);
  }, []);

  const saveEvaluation = async (criterionId, updates) => {
    if (isLocked) { toast.show(closedInfo.reason || 'مغلق', 'warning'); return; }
    const existing = getEvaluation(criterionId);
    setSaving(true);
    try {
      await api.upsertEvaluation({
        userId: user.id, companyId: user.companyId, section: user.section,
        dateId: activeDate, criterionId, session: activeSession,
        value: updates.value !== undefined ? updates.value : existing?.value,
        note: updates.note !== undefined ? updates.note : existing?.note,
      });
      await refreshEvaluations();
      showSavedBriefly();
    } catch (err) { toast.show('فشل الحفظ', 'error'); }
    finally { setSaving(false); }
  };

  const progressMap = useMemo(() => {
    const map = {};
    teams.forEach(t => {
      if (!isTeamActiveOnDate(t, activeDate)) { map[t.id] = { filled: 0, total: 0, inactive: true }; return; }
      const visible = t.criteria.filter(c => shouldShowCriterion(c, t, activeDate, user.section));
      let filled = 0;
      visible.forEach(c => {
        const e = evaluations.find(ev =>
          ev.company_id === user.companyId && ev.section === user.section &&
          ev.date_id === activeDate && ev.criterion_id === c.id &&
          (ev.session || 1) === activeSession
        );
        if (e?.value !== undefined && e?.value !== null && e?.value !== '') filled++;
      });
      map[t.id] = { filled, total: visible.length, inactive: false };
    });
    return map;
  }, [evaluations, activeDate, user, teams, activeSession]);

  // إجمالي الإنجاز عبر كل الفرق (للتحقق من الإكمال)
  const overallProgress = useMemo(() => {
    let totalFilled = 0, totalCount = 0;
    Object.values(progressMap).forEach(p => {
      if (!p.inactive) { totalFilled += p.filled; totalCount += p.total; }
    });
    return { filled: totalFilled, total: totalCount, complete: totalCount > 0 && totalFilled === totalCount };
  }, [progressMap]);

  const currentProgress = progressMap[activeTeamId] || { filled: 0, total: 0 };
  const gregorianDate = useMemo(() => getGregorianDateForHijriDay(activeDate, settings.season_start_date), [activeDate, settings]);

  return (
    <div>
      {!settings.season_start_date && (
        <Card padding={14} style={{ marginBottom: 14, background: THEME.colors.warningSoft, border: `1.5px solid ${THEME.colors.warning}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: THEME.colors.warning, fontSize: 13, fontWeight: 600 }}>
            <AlertTriangle size={18} />
            لم يُحدَّد تاريخ بداية الموسم. يرجى من المدير تحديده.
          </div>
        </Card>
      )}
      {isLocked && (
        <Card padding={14} style={{ marginBottom: 14, background: THEME.colors.dangerSoft, border: `1.5px solid ${THEME.colors.danger}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: THEME.colors.danger, fontSize: 13, fontWeight: 600 }}>
            <Lock size={18} />
            التعبئة مغلقة — {closedInfo.reason}
          </div>
        </Card>
      )}
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button size="sm" variant="outline" icon={ChevronRight} onClick={() => activeIdx > 0 && setActiveDate(DATES[activeIdx - 1].id)} disabled={activeIdx === 0}/>
          <div style={{ flex: 1, padding: '10px 14px', background: isLocked ? THEME.colors.dangerSoft : THEME.colors.bgSecondary, borderRadius: THEME.radius.md, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Calendar size={16} />{DATES[activeIdx].label}
              {gregorianDate && <span style={{ fontWeight: 500, color: THEME.colors.textSecondary }}>· {formatGregorianDate(gregorianDate)} · {getDayName(gregorianDate)}</span>}
              {isLocked && <Lock size={14} />}
            </div>
          </div>
          <Button size="sm" variant="outline" icon={ChevronLeft} onClick={() => activeIdx < DATES.length - 1 && setActiveDate(DATES[activeIdx + 1].id)} disabled={activeIdx === DATES.length - 1}/>
        </div>
      </Card>

      {/* تبديل الجلسات (إذا مفعّلة) */}
      {sessionsEnabled && (
        <Card padding={12} style={{ marginBottom: 14, background: '#F0F7FF', border: `1.5px solid ${THEME.colors.info}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Clock size={16} color={THEME.colors.info} />
            <span style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.info }}>
              التقييم في جلستين — اختر الجلسة
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { num: 1, label: 'الجلسة الصباحية', time: (settings.session1_close_time || '12:00:00').slice(0, 5) },
              { num: 2, label: 'الجلسة المسائية', time: (settings.session2_close_time || '22:00:00').slice(0, 5) },
            ].map(s => {
              const selected = activeSession === s.num;
              const sClosed = isSessionClosed(s.num, activeDate, settings);
              return (
                <button key={s.num} onClick={() => setActiveSession(s.num)}
                  style={{
                    padding: '12px 14px',
                    background: selected ? THEME.colors.info : '#fff',
                    color: selected ? '#fff' : THEME.colors.text,
                    border: `2px solid ${selected ? THEME.colors.info : THEME.colors.border}`,
                    borderRadius: THEME.radius.md, cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'right',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    {sClosed.closed && <Lock size={12} />}
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>
                    تغلق الساعة {s.time}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* زر تقرير اليوم - مشروط بالإكمال */}
      <Card padding={14} style={{
        marginBottom: 14,
        background: overallProgress.complete ? THEME.colors.successSoft : '#FFFCF5',
        border: `1.5px solid ${overallProgress.complete ? THEME.colors.success : THEME.colors.accent + '33'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            width: 40, height: 40, borderRadius: THEME.radius.md,
            background: overallProgress.complete ? THEME.colors.success : THEME.colors.accent,
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {overallProgress.complete ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <FileBarChart size={20} />}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              تقرير {sessionsEnabled ? (activeSession === 1 ? 'الجلسة الصباحية' : 'الجلسة المسائية') : 'اليوم'}
            </div>
            {overallProgress.complete ? (
              <div style={{ fontSize: 12, color: THEME.colors.success, fontWeight: 600 }}>
                ✓ اكتمل التعبئة — التقرير جاهز
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 6 }}>
                  أكمل التعبئة لإصدار التقرير ({overallProgress.filled} من {overallProgress.total})
                </div>
                <div style={{ height: 6, background: '#fff', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${overallProgress.total > 0 ? (overallProgress.filled / overallProgress.total) * 100 : 0}%`,
                    height: '100%', background: THEME.colors.accent,
                  }} />
                </div>
              </>
            )}
          </div>
          <Button
            variant={overallProgress.complete ? 'success' : 'outline'}
            icon={FileBarChart}
            onClick={() => {
              if (!overallProgress.complete) {
                toast.show(`أكمل تعبئة كل المعايير أولاً (${overallProgress.total - overallProgress.filled} متبقي)`, 'warning');
                return;
              }
              setShowReport(true);
            }}
            disabled={!overallProgress.complete}>
            عرض التقرير
          </Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
        {teams.map(t => {
          const isActive = t.id === activeTeamId;
          const progress = progressMap[t.id];
          const pct = progress.total > 0 ? (progress.filled / progress.total) * 100 : 0;
          if (progress.inactive) {
            return (
              <button key={t.id} onClick={() => setActiveTeamId(t.id)}
                style={{ padding: '12px 14px', background: isActive ? THEME.colors.bgSecondary : 'transparent', color: THEME.colors.textTertiary, border: `1.5px dashed ${THEME.colors.border}`, borderRadius: THEME.radius.md, textAlign: 'right', minHeight: 76, cursor: 'pointer', opacity: 0.6, fontFamily: 'inherit' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={11} />يبدأ من {DATES.find(d => d.id === t.startDateId)?.label}
                </div>
              </button>
            );
          }
          return (
            <button key={t.id} onClick={() => setActiveTeamId(t.id)}
              style={{ padding: '12px 14px', background: isActive ? THEME.colors.primary : THEME.colors.surface, color: isActive ? '#fff' : THEME.colors.text, border: `1.5px solid ${isActive ? THEME.colors.primary : THEME.colors.border}`, borderRadius: THEME.radius.md, textAlign: 'right', minHeight: 76, fontFamily: 'inherit', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</span>
                {pct === 100 && progress.total > 0 && <CheckCircle2 size={16} color={isActive ? '#90E0B5' : THEME.colors.success} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, opacity: 0.85 }}>
                <div style={{ flex: 1, height: 4, background: isActive ? 'rgba(255,255,255,0.15)' : THEME.colors.bgSecondary, borderRadius: 2 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? THEME.colors.success : THEME.colors.accent }} />
                </div>
                <span style={{ fontWeight: 600 }}>{progress.filled}/{progress.total}</span>
              </div>
            </button>
          );
        })}
      </div>

      <Card padding={16} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{activeTeam?.name}</div>
            {teamActive && <Badge color={currentProgress.filled === currentProgress.total ? 'success' : 'accent'}>{currentProgress.filled} / {currentProgress.total} معبّأ</Badge>}
          </div>
          {saving && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.colors.info, fontWeight: 600 }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />جاري الحفظ...</div>}
          {savedIndicator && !saving && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.colors.success, fontWeight: 600 }}><CheckCircle2 size={14} />تم الحفظ</div>}
        </div>
        <div style={{ fontSize: 12, color: THEME.colors.textTertiary, marginTop: 6 }}>{activeTeam?.description}</div>
      </Card>

      {!teamActive && activeTeam && (
        <Card padding={20} style={{ textAlign: 'center', background: THEME.colors.bgSecondary }}>
          <Lock size={32} color={THEME.colors.textTertiary} style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>هذا الفريق لم يبدأ العمل بعد</div>
          <div style={{ fontSize: 12, color: THEME.colors.textTertiary }}>يبدأ في {DATES.find(d => d.id === activeTeam.startDateId)?.label}</div>
        </Card>
      )}

      {teamActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
          {visibleCriteria.map((c, i) => {
            const e = getEvaluation(c.id);
            return (
              <CriterionCard key={c.id} criterion={c} index={i}
                value={e?.value} note={e?.note}
                onValueChange={(v) => saveEvaluation(c.id, { value: v })}
                onNoteChange={(n) => saveEvaluation(c.id, { note: n })}
                disabled={isLocked}/>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SupervisorPage({ user, users, companies, teams, evaluations, settings }) {
  const todayId = useMemo(() => getDefaultDateId(settings.season_start_date), [settings]);
  const [activeDate, setActiveDate] = useState(todayId);
  const myEntries = users.filter(u => u.role === 'data_entry' && u.section === user.section && u.active);
  const activeIdx = DATES.findIndex(d => d.id === activeDate);
  const gregorianDate = getGregorianDateForHijriDay(activeDate, settings.season_start_date);

  const entryStats = myEntries.map(entry => {
    const company = companies.find(c => c.id === entry.companyId);
    let totalCriteria = 0, filledCriteria = 0, negatives = 0, notes = 0;
    teams.forEach(t => {
      if (!isTeamActiveOnDate(t, activeDate)) return;
      const visible = t.criteria.filter(c => shouldShowCriterion(c, t, activeDate, entry.section));
      visible.forEach(c => {
        totalCriteria++;
        const e = evaluations.find(ev => ev.company_id === entry.companyId && ev.section === entry.section && ev.date_id === activeDate && ev.criterion_id === c.id);
        if (e?.value !== undefined && e?.value !== null && e?.value !== '') {
          filledCriteria++;
          const numValue = parseFloat(e.value);
          if (e.value === 'no' || (!isNaN(numValue) && c.type === 'scale' && numValue < 3)) negatives++;
          if (e.note?.trim()) notes++;
        }
      });
    });
    return { entry, company, totalCriteria, filledCriteria, negatives, notes, completion: totalCriteria > 0 ? Math.round((filledCriteria / totalCriteria) * 100) : 0 };
  });

  const totals = entryStats.reduce((acc, s) => ({ totalCriteria: acc.totalCriteria + s.totalCriteria, filledCriteria: acc.filledCriteria + s.filledCriteria, negatives: acc.negatives + s.negatives, notes: acc.notes + s.notes }), { totalCriteria: 0, filledCriteria: 0, negatives: 0, notes: 0 });
  const overallCompletion = totals.totalCriteria > 0 ? Math.round((totals.filledCriteria / totals.totalCriteria) * 100) : 0;

  return (
    <div>
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button size="sm" variant="outline" icon={ChevronRight} onClick={() => activeIdx > 0 && setActiveDate(DATES[activeIdx - 1].id)} disabled={activeIdx === 0}/>
          <div style={{ flex: 1, padding: '10px 14px', background: THEME.colors.bgSecondary, borderRadius: THEME.radius.md, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Calendar size={16} />{DATES[activeIdx].label}
              {gregorianDate && <span style={{ fontWeight: 500, color: THEME.colors.textSecondary }}>· {formatGregorianDate(gregorianDate)}</span>}
            </div>
          </div>
          <Button size="sm" variant="outline" icon={ChevronLeft} onClick={() => activeIdx < DATES.length - 1 && setActiveDate(DATES[activeIdx + 1].id)} disabled={activeIdx === DATES.length - 1}/>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPICard icon={UsersIcon} label={`مدخلو قسم ${user.section}`} value={myEntries.length} color="info" />
        <KPICard icon={CheckCircle2} label="نسبة الإنجاز" value={overallCompletion} unit="%" color="success" />
        <KPICard icon={AlertTriangle} label="ملاحظات سلبية" value={totals.negatives} color="warning" />
        <KPICard icon={MessageSquare} label="ملاحظات" value={totals.notes} color="accent" />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>متابعة مدخلي البيانات ({myEntries.length})</h3>
      {entryStats.length === 0 ? (
        <Card padding={30} style={{ textAlign: 'center' }}>
          <Info size={32} color={THEME.colors.textTertiary} style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 14, fontWeight: 700 }}>لا يوجد مدخلون في قسم {user.section}</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entryStats.map(s => (
            <Card key={s.entry.id} padding={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: THEME.colors.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{s.entry.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{s.entry.name}</div>
                  <div style={{ fontSize: 12, color: THEME.colors.textSecondary, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {s.company && <span><Building2 size={11} style={{ display: 'inline', marginLeft: 4 }} />{s.company.name}</span>}
                    <span><User size={11} style={{ display: 'inline', marginLeft: 4 }} />{s.entry.username}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.completion >= 80 ? THEME.colors.success : s.completion >= 50 ? THEME.colors.accent : THEME.colors.danger }}>{s.completion}%</div>
                    <div style={{ fontSize: 10, color: THEME.colors.textTertiary }}>إنجاز</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{s.filledCriteria}/{s.totalCriteria}</div>
                    <div style={{ fontSize: 10, color: THEME.colors.textTertiary }}>معايير</div>
                  </div>
                  {s.negatives > 0 && <Badge color="danger">{s.negatives} سلبي</Badge>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export {
  ToastContainer, LoadingScreen, ConnectionErrorScreen, LoginPage,
  DashboardPage, DataEntryPage, SupervisorPage, KPICard, useToast,
};
