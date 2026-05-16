import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  LayoutDashboard, ClipboardList, Settings, LogOut, Menu, AlertTriangle,
  CheckCircle2, User, Calendar, Award,
  Activity, Info, AlertCircle, MessageSquare,
  Plus, X, ChevronDown, ChevronLeft, ChevronRight, Lock,
  ThumbsUp, ThumbsDown, HelpCircle, Check, Building2,
  TrendingUp, TrendingDown, Wifi, WifiOff, Recycle, Users as UsersIcon,
  Trash2, Edit2, Phone, Shield, Save, Hash, Eye, FileBarChart,
  Filter, ChevronUp, Trophy, Target, Flame,
  BarChart3, PieChart as PieChartIcon, Loader2,
} from 'lucide-react';

import { Button } from './components/Button.jsx';
import { Card, Badge } from './components/Card.jsx';
import { Input } from './components/Input.jsx';
import { Logo } from './components/Logo.jsx';
import { INITIAL_TEAMS, shouldShowCriterion, isTeamActiveOnDate } from './data/teams.js';
import {
  DATES, ROLES_CONFIG, SCALE_LABELS,
  getDefaultDateId, getGregorianDateForHijriDay, formatGregorianDate,
  getDayName,
} from './data/seed.js';
import { THEME } from './data/theme.js';
import * as api from './data/api.js';

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
  const colors = {
    success: THEME.colors.success, error: THEME.colors.danger,
    info: THEME.colors.info, warning: THEME.colors.warning,
  };
  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => {
        const Icon = icons[t.type] || Info;
        return (
          <div key={t.id} style={{
            background: THEME.colors.surface, color: THEME.colors.text,
            padding: '12px 18px', borderRadius: THEME.radius.md,
            boxShadow: THEME.shadows.lg, display: 'flex', alignItems: 'center',
            gap: 10, minWidth: 280, borderRight: `4px solid ${colors[t.type]}`,
            animation: 'slideDown 0.3s ease-out', pointerEvents: 'auto',
            fontSize: 14, fontWeight: 500, maxWidth: 480,
          }}>
            <Icon size={20} color={colors[t.type]} strokeWidth={2.5} />
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// =================================================================
// Loading Screen
// =================================================================
function LoadingScreen({ message = 'جاري التحميل...' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, #0D1824 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: '#fff', borderRadius: THEME.radius.xl, padding: 30, marginBottom: 20 }}>
        <Logo height={70} />
      </div>
      <Loader2 size={32} color={THEME.colors.accent} style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#fff', marginTop: 14, fontSize: 14, opacity: 0.9 }}>{message}</div>
    </div>
  );
}

// =================================================================
// Connection Error Screen
// =================================================================
function ConnectionErrorScreen({ error, onRetry }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, #0D1824 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: THEME.colors.surface, borderRadius: THEME.radius.xl,
        padding: 36, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <Logo height={60} />
        </div>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: THEME.colors.dangerSoft, color: THEME.colors.danger,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <WifiOff size={28} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>تعذّر الاتصال بقاعدة البيانات</h2>
        <p style={{ fontSize: 13, color: THEME.colors.textSecondary, marginBottom: 20, lineHeight: 1.7 }}>
          يبدو أن إعدادات الاتصال غير مكتملة أو الخادم غير متاح.
        </p>
        {error && (
          <div style={{
            background: THEME.colors.dangerSoft, color: THEME.colors.danger,
            padding: '10px 14px', borderRadius: THEME.radius.md,
            fontSize: 12, fontFamily: 'monospace', textAlign: 'left',
            direction: 'ltr', marginBottom: 16, wordBreak: 'break-all',
          }}>
            {error}
          </div>
        )}
        <Button variant="primary" fullWidth onClick={onRetry}>إعادة المحاولة</Button>
      </div>
    </div>
  );
}

// =================================================================
// Login Page
// =================================================================
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
      if (!user) {
        setError('اسم المستخدم غير صحيح أو الحساب معطّل');
      } else {
        const appUser = api.dbUserToApp(user);
        toast.show(`مرحباً ${appUser.name}`, 'success');
        onLogin(appUser);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بقاعدة البيانات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, #0D1824 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: THEME.colors.surface, borderRadius: THEME.radius.xl,
        padding: 36, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <Logo height={80} />
          </div>
          <p style={{ fontSize: 13, color: THEME.colors.textTertiary }}>
            نظام إدارة العمليات — موسم 1447هـ
          </p>
        </div>

        {error && (
          <div style={{
            background: THEME.colors.dangerSoft, color: THEME.colors.danger,
            padding: '12px 14px', borderRadius: THEME.radius.md,
            fontSize: 13, fontWeight: 600, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle size={18} strokeWidth={2.5} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="اسم المستخدم" icon={User}
            value={username} onChange={e => setUsername(e.target.value)}
            placeholder="أدخل اسم المستخدم"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus disabled={loading}
          />
          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={loading}>
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Filter Bar
// =================================================================
function FilterBar({ companies, teams, selectedCompanies, setSelectedCompanies, selectedTeams, setSelectedTeams, selectedSections, setSelectedSections }) {
  const toggle = (arr, setArr, value) => {
    setArr(arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]);
  };
  const activeCount = selectedCompanies.length + selectedTeams.length + selectedSections.length;

  return (
    <Card padding={16} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Filter size={18} color={THEME.colors.accent} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>الفلاتر</span>
        {activeCount > 0 && (
          <>
            <Badge color="accent">{activeCount} مفعّل</Badge>
            <button
              onClick={() => { setSelectedCompanies([]); setSelectedTeams([]); setSelectedSections([]); }}
              style={{
                marginRight: 'auto', background: 'transparent', border: 'none',
                color: THEME.colors.danger, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex',
                alignItems: 'center', gap: 4,
              }}>
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
                  style={{
                    padding: '6px 14px',
                    background: selected ? THEME.colors.success : THEME.colors.surface,
                    color: selected ? '#fff' : THEME.colors.text,
                    border: `1.5px solid ${selected ? THEME.colors.success : THEME.colors.border}`,
                    borderRadius: THEME.radius.full,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>
                  {selected && <Check size={12} style={{ display: 'inline', marginLeft: 4 }} />}
                  {s}
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
                  style={{
                    padding: '6px 12px',
                    background: selected ? THEME.colors.primary : THEME.colors.surface,
                    color: selected ? '#fff' : THEME.colors.text,
                    border: `1.5px solid ${selected ? THEME.colors.primary : THEME.colors.border}`,
                    borderRadius: THEME.radius.full,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>
                  {selected && <Check size={12} style={{ display: 'inline', marginLeft: 4 }} />}
                  {c.name}
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
                  style={{
                    padding: '6px 12px',
                    background: selected ? THEME.colors.accent : THEME.colors.surface,
                    color: selected ? '#fff' : THEME.colors.text,
                    border: `1.5px solid ${selected ? THEME.colors.accent : THEME.colors.border}`,
                    borderRadius: THEME.radius.full,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>
                  {selected && <Check size={12} style={{ display: 'inline', marginLeft: 4 }} />}
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

// =================================================================
// KPI Card
// =================================================================
function KPICard({ icon: Icon, label, value, unit, trend, trendValue, color = 'accent', subtitle }) {
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: THEME.radius.md, background: c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={c.fg} strokeWidth={2.2} />
        </div>
        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '3px 8px', borderRadius: THEME.radius.full,
            background: trend === 'up' ? THEME.colors.successSoft : THEME.colors.dangerSoft,
            color: trend === 'up' ? THEME.colors.success : THEME.colors.danger,
            fontSize: 11, fontWeight: 700,
          }}>
            {trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trendValue}
          </div>
        )}
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

// =================================================================
// Dashboard Page
// =================================================================
function DashboardPage({ teams, companies, evaluations }) {
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);

  const activeCompanies = companies.filter(c => c.active);
  const filteredCompanies = selectedCompanies.length > 0 ? activeCompanies.filter(c => selectedCompanies.includes(c.id)) : activeCompanies;
  const filteredTeams = selectedTeams.length > 0 ? teams.filter(t => selectedTeams.includes(t.id)) : teams;
  const filteredSections = selectedSections.length > 0 ? selectedSections : ['رجال', 'نساء'];

  // حساب الإحصاءات من التقييمات الفعلية
  const filteredEvals = useMemo(() => {
    return evaluations.filter(e => {
      if (!filteredCompanies.find(c => c.id === e.company_id)) return false;
      if (!filteredSections.includes(e.section)) return false;
      return true;
    });
  }, [evaluations, filteredCompanies, filteredSections]);

  const stats = useMemo(() => {
    let totalScale = 0, scaleCount = 0;
    let yesCount = 0, noCount = 0, naCount = 0;
    let negatives = 0;
    const scaleDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    filteredEvals.forEach(e => {
      if (e.value === 'yes') yesCount++;
      else if (e.value === 'no') { noCount++; negatives++; }
      else if (e.value === 'na') naCount++;
      else {
        const num = parseFloat(e.value);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          scaleDistribution[num]++;
          totalScale += num;
          scaleCount++;
          if (num < 3) negatives++;
        }
      }
    });

    const avgScore = scaleCount > 0 ? (totalScale / scaleCount).toFixed(1) : '—';
    const yesNoTotal = yesCount + noCount;
    const complianceRate = yesNoTotal > 0 ? Math.round((yesCount / yesNoTotal) * 100) : 0;

    return {
      avgScore, complianceRate, negatives,
      totalEvaluations: filteredEvals.length,
      scaleDistribution,
    };
  }, [filteredEvals]);

  // أداء الشركات
  const companyPerf = useMemo(() => {
    return filteredCompanies.map(c => {
      const companyEvals = filteredEvals.filter(e => e.company_id === c.id);
      const menEvals = companyEvals.filter(e => e.section === 'رجال');
      const womenEvals = companyEvals.filter(e => e.section === 'نساء');

      const calcRate = (evals) => {
        let yes = 0, no = 0;
        evals.forEach(e => {
          if (e.value === 'yes') yes++;
          else if (e.value === 'no') no++;
          else {
            const num = parseFloat(e.value);
            if (!isNaN(num) && num >= 1 && num <= 5) {
              if (num >= 3) yes++;
              else no++;
            }
          }
        });
        return yes + no > 0 ? Math.round((yes / (yes + no)) * 100) : 0;
      };

      return {
        name: c.name.replace('شركة ', ''),
        fullName: c.name,
        men: calcRate(menEvals),
        women: calcRate(womenEvals),
        overall: calcRate(companyEvals),
      };
    }).sort((a, b) => b.overall - a.overall);
  }, [filteredCompanies, filteredEvals]);

  const scaleDistData = [
    { name: 'ممتاز', value: stats.scaleDistribution[5], color: SCALE_LABELS[5].color },
    { name: 'جيد جداً', value: stats.scaleDistribution[4], color: SCALE_LABELS[4].color },
    { name: 'جيد', value: stats.scaleDistribution[3], color: SCALE_LABELS[3].color },
    { name: 'ضعيف', value: stats.scaleDistribution[2], color: SCALE_LABELS[2].color },
    { name: 'ضعيف جداً', value: stats.scaleDistribution[1], color: SCALE_LABELS[1].color },
  ];
  const totalScaleEvals = scaleDistData.reduce((s, x) => s + x.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FilterBar
        companies={companies} teams={teams}
        selectedCompanies={selectedCompanies} setSelectedCompanies={setSelectedCompanies}
        selectedTeams={selectedTeams} setSelectedTeams={setSelectedTeams}
        selectedSections={selectedSections} setSelectedSections={setSelectedSections}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <KPICard icon={CheckCircle2} label="نسبة الامتثال" value={stats.complianceRate} unit="%" color="success" />
        <KPICard icon={Award} label="متوسط الأداء" value={stats.avgScore} unit="/5" color="accent" />
        <KPICard icon={Activity} label="إجمالي التقييمات" value={stats.totalEvaluations} color="info" subtitle="تقييم مسجّل" />
        <KPICard icon={UsersIcon} label="شركات نشطة" value={activeCompanies.length} color="purple" />
        <KPICard icon={Building2} label="الفرق العاملة" value={teams.length} color="info" />
        <KPICard icon={AlertTriangle} label="ملاحظات سلبية" value={stats.negatives} color="warning" />
      </div>

      {stats.totalEvaluations === 0 && (
        <Card padding={30} style={{ textAlign: 'center' }}>
          <Info size={40} color={THEME.colors.textTertiary} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>لا توجد تقييمات بعد</div>
          <div style={{ fontSize: 13, color: THEME.colors.textTertiary }}>
            ستظهر الإحصاءات والرسوم البيانية هنا بمجرد بدء مدخلي البيانات في تسجيل التقييمات.
          </div>
        </Card>
      )}

      {companyPerf.length > 0 && stats.totalEvaluations > 0 && (
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
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
              {filteredSections.includes('رجال') && <Bar dataKey="men" name="قسم الرجال" fill={THEME.colors.info} radius={[0, 4, 4, 0]} />}
              {filteredSections.includes('نساء') && <Bar dataKey="women" name="قسم النساء" fill={THEME.colors.accent} radius={[0, 4, 4, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {companyPerf.length > 0 && stats.totalEvaluations > 0 && (
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
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: isTop3 ? '#FFFCF5' : THEME.colors.bgSecondary,
                  border: isTop3 ? `1.5px solid ${THEME.colors.accent}33` : '1.5px solid transparent',
                  borderRadius: THEME.radius.md,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: isTop3 ? THEME.colors.accent : THEME.colors.surface,
                    color: isTop3 ? '#fff' : THEME.colors.text,
                    border: isTop3 ? 'none' : `1.5px solid ${THEME.colors.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, flexShrink: 0,
                  }}>{isTop3 ? medals[i] : `#${i + 1}`}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.fullName}</div>
                    <div style={{ height: 8, background: THEME.colors.bgSecondary, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${c.overall}%`, height: '100%',
                        background: c.overall >= 90 ? THEME.colors.success : c.overall >= 80 ? THEME.colors.accent : THEME.colors.warning,
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 800,
                    color: c.overall >= 90 ? THEME.colors.success : c.overall >= 80 ? THEME.colors.accent : THEME.colors.warning,
                    minWidth: 50, textAlign: 'left',
                  }}>{c.overall}%</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {totalScaleEvals > 0 && (
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <PieChartIcon size={20} color={THEME.colors.accent} strokeWidth={2} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>توزيع التقييمات</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={scaleDistData.filter(d => d.value > 0)} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={2}>
                  {scaleDistData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ direction: 'rtl', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {scaleDistData.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: THEME.colors.textSecondary }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>
                    {s.value} ({totalScaleEvals > 0 ? Math.round(s.value / totalScaleEvals * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// =================================================================
// Value Selector
// =================================================================
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
              style={{
                flex: '1 1 100px', minHeight: 52, padding: '10px 14px',
                background: isSelected ? o.bg : THEME.colors.surface,
                color: isSelected ? o.color : THEME.colors.textSecondary,
                border: `2px solid ${isSelected ? o.color : THEME.colors.border}`,
                borderRadius: THEME.radius.md, fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, opacity: disabled ? 0.5 : 1, fontFamily: 'inherit',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}>
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
              style={{
                minHeight: 76,
                background: isSelected ? sl.bg : THEME.colors.surface,
                border: `2px solid ${isSelected ? sl.color : THEME.colors.border}`,
                borderRadius: THEME.radius.md, padding: '6px 4px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                opacity: disabled ? 0.5 : 1, fontFamily: 'inherit',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: isSelected ? sl.color : THEME.colors.textTertiary, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? sl.color : THEME.colors.textSecondary, textAlign: 'center', lineHeight: 1.2 }}>{sl.text}</div>
            </button>
          );
        })}
        <button onClick={() => !disabled && onChange('na')} disabled={disabled}
          style={{
            minHeight: 76, padding: '6px 10px',
            background: value === 'na' ? THEME.colors.bgSecondary : THEME.colors.surface,
            border: `2px solid ${value === 'na' ? THEME.colors.borderStrong : THEME.colors.border}`,
            borderRadius: THEME.radius.md, fontSize: 11, fontWeight: 700,
            color: THEME.colors.textSecondary,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
          <HelpCircle size={20} />
          <span style={{ fontSize: 10 }}>غير منطبق</span>
        </button>
      </div>
    );
  }

  if (criterion.type === 'number') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="number" value={value ?? ''}
          onChange={e => !disabled && onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
          disabled={disabled} placeholder="أدخل الرقم..."
          style={{
            flex: 1, padding: '12px 16px', fontSize: 16, fontWeight: 700,
            borderRadius: THEME.radius.md,
            border: `2px solid ${THEME.colors.border}`,
            outline: 'none', direction: 'rtl', minHeight: 56, boxSizing: 'border-box',
          }}/>
        {criterion.unit && (
          <div style={{
            padding: '12px 18px', background: THEME.colors.bgSecondary,
            color: THEME.colors.textSecondary, borderRadius: THEME.radius.md,
            fontSize: 14, fontWeight: 700, minHeight: 56,
            display: 'flex', alignItems: 'center',
          }}>{criterion.unit}</div>
        )}
      </div>
    );
  }
  return null;
}

// =================================================================
// Criterion Card
// =================================================================
function CriterionCard({ criterion, index, value, note, onValueChange, onNoteChange, disabled }) {
  const isFilled = value !== null && value !== undefined && value !== '';
  const numValue = typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : value;
  const isNegative = value === 'no' || (typeof numValue === 'number' && criterion.type === 'scale' && numValue < 3);
  const isNA = value === 'na';
  const noteRequired = criterion.noteRequired === 'always' || (criterion.noteRequired === 'low' && isNegative) || isNA;
  const noteMissing = noteRequired && !note?.trim();

  return (
    <div style={{
      background: isFilled ? (isNA ? THEME.colors.bgSecondary : '#FDFCF8') : THEME.colors.surface,
      border: `1.5px solid ${noteMissing ? THEME.colors.warning : isFilled ? '#E8E0D0' : THEME.colors.border}`,
      borderRadius: THEME.radius.md, padding: 16,
      opacity: disabled ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: isFilled ? (isNA ? THEME.colors.textTertiary : THEME.colors.accent) : THEME.colors.bgSecondary,
          color: isFilled ? '#fff' : THEME.colors.textTertiary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {isFilled && !isNA ? <Check size={16} strokeWidth={3} /> : index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>{criterion.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge color={criterion.type === 'yesno' ? 'info' : criterion.type === 'scale' ? 'accent' : 'purple'} style={{ fontSize: 10 }}>
              {criterion.type === 'yesno' ? 'نعم / لا' : criterion.type === 'scale' ? 'تقييم من 5' : `رقم (${criterion.unit || ''})`}
            </Badge>
            {criterion.noteRequired === 'always' && (
              <Badge color="warning" style={{ fontSize: 10 }}>
                <MessageSquare size={11} />ملاحظة إلزامية
              </Badge>
            )}
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
            placeholder={isNA ? 'اذكر سبب عدم انطباق هذا المعيار...' : isNegative ? 'اشرح سبب التقييم السلبي...' : 'أضف ملاحظة (اختياري)...'}
            rows={2}
            style={{
              width: '100%', padding: '10px 12px',
              borderRadius: THEME.radius.md,
              border: `1.5px solid ${noteMissing ? THEME.colors.warning : THEME.colors.border}`,
              fontSize: 13, direction: 'rtl', outline: 'none',
              resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
            }}/>
        </div>
      )}
    </div>
  );
}

// =================================================================
// Data Entry Page
// =================================================================
function DataEntryPage({ user, teams, settings, toast, evaluations, refreshEvaluations }) {
  const todayId = useMemo(() => getDefaultDateId(settings.season_start_date), [settings]);
  const [activeDate, setActiveDate] = useState(todayId);
  const [activeTeamId, setActiveTeamId] = useState(teams[0]?.id);
  const [saving, setSaving] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  useEffect(() => { setActiveDate(todayId); }, [todayId]);

  const activeTeam = teams.find(t => t.id === activeTeamId);
  const activeIdx = DATES.findIndex(d => d.id === activeDate);
  const todayIdx = DATES.findIndex(d => d.id === todayId);
  const isLocked = activeIdx > todayIdx;
  const teamActive = activeTeam ? isTeamActiveOnDate(activeTeam, activeDate) : false;

  const visibleCriteria = useMemo(() => {
    if (!activeTeam) return [];
    return activeTeam.criteria.filter(c => shouldShowCriterion(c, activeTeam, activeDate));
  }, [activeTeam, activeDate]);

  // البحث عن تقييم
  const getEvaluation = (criterionId) => {
    return evaluations.find(e =>
      e.company_id === user.companyId &&
      e.section === user.section &&
      e.date_id === activeDate &&
      e.criterion_id === criterionId
    );
  };

  const showSavedBriefly = useCallback(() => {
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2000);
  }, []);

  // حفظ في قاعدة البيانات
  const saveEvaluation = async (criterionId, updates) => {
    if (isLocked) {
      toast.show('لا يمكن التعديل على يوم مستقبلي', 'warning');
      return;
    }
    const existing = getEvaluation(criterionId);
    setSaving(true);
    try {
      await api.upsertEvaluation({
        userId: user.id,
        companyId: user.companyId,
        section: user.section,
        dateId: activeDate,
        criterionId,
        value: updates.value !== undefined ? updates.value : existing?.value,
        note: updates.note !== undefined ? updates.note : existing?.note,
      });
      await refreshEvaluations();
      showSavedBriefly();
    } catch (err) {
      console.error(err);
      toast.show('فشل حفظ التقييم — تحقق من الاتصال', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (criterionId, val) => saveEvaluation(criterionId, { value: val });
  const updateNote = (criterionId, note) => saveEvaluation(criterionId, { note });

  const progressMap = useMemo(() => {
    const map = {};
    teams.forEach(t => {
      if (!isTeamActiveOnDate(t, activeDate)) {
        map[t.id] = { filled: 0, total: 0, inactive: true };
        return;
      }
      const visible = t.criteria.filter(c => shouldShowCriterion(c, t, activeDate));
      let filled = 0;
      visible.forEach(c => {
        const e = evaluations.find(ev =>
          ev.company_id === user.companyId && ev.section === user.section &&
          ev.date_id === activeDate && ev.criterion_id === c.id
        );
        if (e?.value !== undefined && e?.value !== null && e?.value !== '') filled++;
      });
      map[t.id] = { filled, total: visible.length, inactive: false };
    });
    return map;
  }, [evaluations, activeDate, user, teams]);

  const currentProgress = progressMap[activeTeamId] || { filled: 0, total: 0 };

  const gregorianDate = useMemo(() => {
    return getGregorianDateForHijriDay(activeDate, settings.season_start_date);
  }, [activeDate, settings]);

  return (
    <div>
      {!settings.season_start_date && (
        <Card padding={14} style={{ marginBottom: 14, background: THEME.colors.warningSoft, border: `1.5px solid ${THEME.colors.warning}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: THEME.colors.warning, fontSize: 13, fontWeight: 600 }}>
            <AlertTriangle size={18} />
            لم يُحدَّد تاريخ بداية موسم ذي الحجة بعد. يرجى من مدير النظام تحديده.
          </div>
        </Card>
      )}

      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button size="sm" variant="outline" icon={ChevronRight}
            onClick={() => activeIdx > 0 && setActiveDate(DATES[activeIdx - 1].id)}
            disabled={activeIdx === 0}/>
          <div style={{
            flex: 1, padding: '10px 14px',
            background: isLocked ? THEME.colors.dangerSoft : THEME.colors.bgSecondary,
            borderRadius: THEME.radius.md, textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Calendar size={16} />
              {DATES[activeIdx].label}
              {gregorianDate && (
                <span style={{ fontWeight: 500, color: THEME.colors.textSecondary }}>
                  · {formatGregorianDate(gregorianDate)} · {getDayName(gregorianDate)}
                </span>
              )}
              {isLocked && <Lock size={14} />}
            </div>
            <div style={{ fontSize: 11, color: THEME.colors.textSecondary, marginTop: 2 }}>
              {DATES[activeIdx].special && DATES[activeIdx].special}
              {isLocked && ' · يوم قادم (مقفل)'}
              {activeDate === todayId && !isLocked && ' · اليوم'}
            </div>
          </div>
          <Button size="sm" variant="outline" icon={ChevronLeft}
            onClick={() => activeIdx < DATES.length - 1 && setActiveDate(DATES[activeIdx + 1].id)}
            disabled={activeIdx === DATES.length - 1}/>
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
                style={{
                  padding: '12px 14px',
                  background: isActive ? THEME.colors.bgSecondary : 'transparent',
                  color: THEME.colors.textTertiary,
                  border: `1.5px dashed ${THEME.colors.border}`,
                  borderRadius: THEME.radius.md, textAlign: 'right', minHeight: 76,
                  cursor: 'pointer', opacity: 0.6, fontFamily: 'inherit',
                }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={11} />يبدأ من {DATES.find(d => d.id === t.startDateId)?.label}
                </div>
              </button>
            );
          }

          return (
            <button key={t.id} onClick={() => setActiveTeamId(t.id)}
              style={{
                padding: '12px 14px',
                background: isActive ? THEME.colors.primary : THEME.colors.surface,
                color: isActive ? '#fff' : THEME.colors.text,
                border: `1.5px solid ${isActive ? THEME.colors.primary : THEME.colors.border}`,
                borderRadius: THEME.radius.md, textAlign: 'right', minHeight: 76,
                fontFamily: 'inherit', cursor: 'pointer',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</span>
                {pct === 100 && progress.total > 0 && <CheckCircle2 size={16} color={isActive ? '#90E0B5' : THEME.colors.success} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, opacity: 0.85 }}>
                <div style={{ flex: 1, height: 4, background: isActive ? 'rgba(255,255,255,0.15)' : THEME.colors.bgSecondary, borderRadius: 2 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: pct === 100 ? THEME.colors.success : THEME.colors.accent,
                  }} />
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
            {teamActive && (
              <Badge color={currentProgress.filled === currentProgress.total ? 'success' : 'accent'}>
                {currentProgress.filled} / {currentProgress.total} معبّأ
              </Badge>
            )}
          </div>
          {saving && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.colors.info, fontWeight: 600 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              جاري الحفظ...
            </div>
          )}
          {savedIndicator && !saving && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.colors.success, fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              تم الحفظ في قاعدة البيانات
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: THEME.colors.textTertiary, marginTop: 6 }}>{activeTeam?.description}</div>
      </Card>

      {!teamActive && activeTeam && (
        <Card padding={20} style={{ textAlign: 'center', background: THEME.colors.bgSecondary }}>
          <Lock size={32} color={THEME.colors.textTertiary} style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>هذا الفريق لم يبدأ العمل بعد</div>
          <div style={{ fontSize: 12, color: THEME.colors.textTertiary }}>
            يبدأ العمل في {DATES.find(d => d.id === activeTeam.startDateId)?.label}
          </div>
        </Card>
      )}

      {teamActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
          {visibleCriteria.map((c, i) => {
            const e = getEvaluation(c.id);
            return (
              <CriterionCard
                key={c.id} criterion={c} index={i}
                value={e?.value} note={e?.note}
                onValueChange={(v) => updateValue(c.id, v)}
                onNoteChange={(n) => updateNote(c.id, n)}
                disabled={isLocked}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// =================================================================
// Supervisor Page
// =================================================================
function SupervisorPage({ user, users, companies, teams, evaluations, settings }) {
  const todayId = useMemo(() => getDefaultDateId(settings.season_start_date), [settings]);
  const [activeDate, setActiveDate] = useState(todayId);

  const myEntries = users.filter(u =>
    u.role === 'data_entry' && u.section === user.section && u.active
  );

  const activeIdx = DATES.findIndex(d => d.id === activeDate);
  const gregorianDate = getGregorianDateForHijriDay(activeDate, settings.season_start_date);

  const entryStats = myEntries.map(entry => {
    const company = companies.find(c => c.id === entry.companyId);
    let totalCriteria = 0, filledCriteria = 0, negatives = 0, notes = 0;

    teams.forEach(t => {
      if (!isTeamActiveOnDate(t, activeDate)) return;
      const visible = t.criteria.filter(c => shouldShowCriterion(c, t, activeDate));
      visible.forEach(c => {
        totalCriteria++;
        const e = evaluations.find(ev =>
          ev.company_id === entry.companyId && ev.section === entry.section &&
          ev.date_id === activeDate && ev.criterion_id === c.id
        );
        if (e?.value !== undefined && e?.value !== null && e?.value !== '') {
          filledCriteria++;
          const numValue = parseFloat(e.value);
          if (e.value === 'no' || (!isNaN(numValue) && c.type === 'scale' && numValue < 3)) negatives++;
          if (e.note?.trim()) notes++;
        }
      });
    });

    return {
      entry, company, totalCriteria, filledCriteria, negatives, notes,
      completion: totalCriteria > 0 ? Math.round((filledCriteria / totalCriteria) * 100) : 0,
    };
  });

  const totals = entryStats.reduce((acc, s) => ({
    totalCriteria: acc.totalCriteria + s.totalCriteria,
    filledCriteria: acc.filledCriteria + s.filledCriteria,
    negatives: acc.negatives + s.negatives,
    notes: acc.notes + s.notes,
  }), { totalCriteria: 0, filledCriteria: 0, negatives: 0, notes: 0 });

  const overallCompletion = totals.totalCriteria > 0
    ? Math.round((totals.filledCriteria / totals.totalCriteria) * 100) : 0;

  return (
    <div>
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button size="sm" variant="outline" icon={ChevronRight}
            onClick={() => activeIdx > 0 && setActiveDate(DATES[activeIdx - 1].id)}
            disabled={activeIdx === 0}/>
          <div style={{ flex: 1, padding: '10px 14px', background: THEME.colors.bgSecondary, borderRadius: THEME.radius.md, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Calendar size={16} />
              {DATES[activeIdx].label}
              {gregorianDate && (
                <span style={{ fontWeight: 500, color: THEME.colors.textSecondary }}>
                  · {formatGregorianDate(gregorianDate)} · {getDayName(gregorianDate)}
                </span>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" icon={ChevronLeft}
            onClick={() => activeIdx < DATES.length - 1 && setActiveDate(DATES[activeIdx + 1].id)}
            disabled={activeIdx === DATES.length - 1}/>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPICard icon={UsersIcon} label={`مدخلو قسم ${user.section}`} value={myEntries.length} color="info" />
        <KPICard icon={CheckCircle2} label="نسبة الإنجاز اليوم" value={overallCompletion} unit="%" color="success" />
        <KPICard icon={AlertTriangle} label="ملاحظات سلبية" value={totals.negatives} color="warning" />
        <KPICard icon={MessageSquare} label="ملاحظات اليوم" value={totals.notes} color="accent" />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
        متابعة مدخلي البيانات ({myEntries.length})
      </h3>

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
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: THEME.colors.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 18, flexShrink: 0,
                }}>{s.entry.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{s.entry.name}</div>
                  <div style={{ fontSize: 12, color: THEME.colors.textSecondary, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {s.company && <span><Building2 size={11} style={{ display: 'inline', marginLeft: 4 }} />{s.company.name}</span>}
                    <span><User size={11} style={{ display: 'inline', marginLeft: 4 }} />{s.entry.username}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.completion >= 80 ? THEME.colors.success : s.completion >= 50 ? THEME.colors.accent : THEME.colors.danger }}>
                      {s.completion}%
                    </div>
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

// =================================================================
// Users Management
// =================================================================
function UsersPage({ users, companies, toast, refreshUsers }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', username: '', role: 'data_entry',
    companyId: '', section: 'رجال', phone: '',
  });

  const openNew = () => {
    setEditing(null);
    const firstCompany = companies.filter(c => c.active)[0];
    setForm({
      name: '', username: '', role: 'data_entry',
      companyId: firstCompany?.id || '', section: 'رجال', phone: '',
    });
    setShowForm(true);
  };

  const openEdit = (u) => { setEditing(u); setForm({ ...u, companyId: u.companyId || '' }); setShowForm(true); };

  const validateUsername = (username) => /^[a-zA-Z0-9_]+$/.test(username);

  const save = async () => {
    if (!form.name || !form.username) { toast.show('الاسم واسم المستخدم مطلوبان', 'warning'); return; }
    if (!validateUsername(form.username)) { toast.show('اسم المستخدم: حروف إنجليزية وأرقام فقط', 'warning'); return; }

    const dup = users.find(u => u.username.toLowerCase() === form.username.toLowerCase() && u.id !== editing?.id);
    if (dup) { toast.show('اسم المستخدم مستخدم مسبقاً', 'warning'); return; }

    let finalForm = { ...form };
    if (form.role === 'admin' || form.role === 'dashboard') {
      finalForm.companyId = null; finalForm.section = null;
    } else if (form.role === 'supervisor') {
      finalForm.companyId = null;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.updateUser(editing.id, finalForm);
        toast.show('تم تحديث الحساب', 'success');
      } else {
        await api.createUser(finalForm);
        toast.show('تم إضافة الحساب', 'success');
      }
      await refreshUsers();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.show('فشل حفظ الحساب — ' + (err.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u) => {
    if (u.username === 's123') { toast.show('لا يمكن حذف المدير الرئيسي', 'warning'); return; }
    if (!confirm(`حذف ${u.name}؟`)) return;
    try {
      await api.deleteUser(u.id);
      await refreshUsers();
      toast.show('تم حذف الحساب', 'info');
    } catch (err) {
      toast.show('فشل الحذف', 'error');
    }
  };

  const toggleActive = async (u) => {
    if (u.username === 's123') { toast.show('لا يمكن تعطيل المدير الرئيسي', 'warning'); return; }
    try {
      await api.setUserActive(u.id, !u.active);
      await refreshUsers();
      toast.show(u.active ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب', 'info');
    } catch (err) {
      toast.show('فشل التغيير', 'error');
    }
  };

  if (showForm) {
    const needsCompanyAndSection = form.role === 'data_entry';
    const needsSectionOnly = form.role === 'supervisor';

    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            {editing ? `تعديل: ${editing.name}` : 'إضافة حساب جديد'}
          </h2>
          <Button variant="ghost" icon={X} onClick={() => setShowForm(false)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="الاسم الكامل" icon={User} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثلاً: أحمد محمد" />
          <Input label="اسم المستخدم" icon={User}
            value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}
            placeholder="حروف إنجليزية أو أرقام"
            hint="بدون كلمة مرور — يدخل المستخدم بهذا الاسم فقط"/>
          <Input label="رقم الجوال (اختياري)" icon={Phone} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="05XXXXXXXX" />

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>الصلاحية</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              style={{
                width: '100%', padding: '12px 14px', fontSize: 15,
                borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`,
                direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff',
                fontFamily: 'inherit',
              }}>
              <option value="admin">مدير النظام</option>
              <option value="dashboard">عرض لوحة المتابعة (للإدارة العليا)</option>
              <option value="data_entry">مدخل بيانات</option>
              <option value="supervisor">مشرف المتابعة</option>
            </select>
            <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 4 }}>
              {ROLES_CONFIG[form.role]?.description}
            </div>
          </div>

          {needsCompanyAndSection && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>الشركة</label>
                <select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value }))}
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 15,
                    borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`,
                    direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff',
                    fontFamily: 'inherit',
                  }}>
                  {companies.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>القسم</label>
                <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 15,
                    borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`,
                    direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff',
                    fontFamily: 'inherit',
                  }}>
                  <option value="رجال">رجال</option>
                  <option value="نساء">نساء</option>
                </select>
              </div>
            </>
          )}

          {needsSectionOnly && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>قسم المتابعة</label>
              <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 15,
                  borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`,
                  direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff',
                  fontFamily: 'inherit',
                }}>
                <option value="رجال">قسم الرجال</option>
                <option value="نساء">قسم النساء</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button variant="primary" icon={Save} onClick={save} fullWidth disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} fullWidth disabled={saving}>إلغاء</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>إدارة الحسابات</h2>
        <Button variant="primary" icon={Plus} onClick={openNew}>إضافة حساب جديد</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {users.map(u => {
          const role = ROLES_CONFIG[u.role];
          const company = companies.find(c => c.id === u.companyId);
          return (
            <Card key={u.id} padding={14}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: role?.color || THEME.colors.primary,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 18, flexShrink: 0,
                }}>{u.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{u.name}</span>
                    {!u.active && <Badge color="gray">معطّل</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: THEME.colors.textSecondary, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <span><User size={11} style={{ display: 'inline', marginLeft: 4 }} />{u.username}</span>
                    <span><Shield size={11} style={{ display: 'inline', marginLeft: 4 }} />{role?.label}</span>
                    {company && <span><Building2 size={11} style={{ display: 'inline', marginLeft: 4 }} />{company.name}</span>}
                    {u.section && <span>قسم {u.section}</span>}
                    {u.phone && <span><Phone size={11} style={{ display: 'inline', marginLeft: 4 }} />{u.phone}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Button size="sm" variant="outline" icon={Edit2} onClick={() => openEdit(u)} />
                  <Button size="sm" variant={u.active ? 'outline' : 'success'} onClick={() => toggleActive(u)}>
                    {u.active ? 'تعطيل' : 'تفعيل'}
                  </Button>
                  {u.username !== 's123' && <Button size="sm" variant="danger" icon={Trash2} onClick={() => remove(u)} />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =================================================================
// Companies Management
// =================================================================
function CompaniesPage({ companies, toast, refreshCompanies }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', contract: '' });

  const openNew = () => { setEditing(null); setForm({ name: '', code: '', contract: '' }); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setShowForm(true); };

  const save = async () => {
    if (!form.name) { toast.show('اسم الشركة مطلوب', 'warning'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.updateCompany(editing.id, form);
        toast.show('تم تحديث الشركة', 'success');
      } else {
        await api.createCompany(form);
        toast.show('تم إضافة الشركة', 'success');
      }
      await refreshCompanies();
      setShowForm(false);
    } catch (err) {
      toast.show('فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c) => {
    try {
      await api.setCompanyActive(c.id, !c.active);
      await refreshCompanies();
      toast.show(c.active ? 'تم تعطيل الشركة' : 'تم تفعيل الشركة', 'info');
    } catch (err) {
      toast.show('فشل التغيير', 'error');
    }
  };

  const remove = async (c) => {
    if (!confirm(`حذف ${c.name}؟ سيتم حذف جميع البيانات المرتبطة بها.`)) return;
    try {
      await api.deleteCompany(c.id);
      await refreshCompanies();
      toast.show('تم حذف الشركة', 'info');
    } catch (err) {
      toast.show('فشل الحذف', 'error');
    }
  };

  if (showForm) {
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? `تعديل: ${editing.name}` : 'إضافة شركة جديدة'}</h2>
          <Button variant="ghost" icon={X} onClick={() => setShowForm(false)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="اسم الشركة" icon={Building2} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثلاً: شركة الإتقان" />
          <Input label="الرمز المختصر (اختياري)" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="مثلاً: ITQ" />
          <Input label="رقم العقد (اختياري)" value={form.contract} onChange={e => setForm(p => ({ ...p, contract: e.target.value }))} placeholder="مثلاً: MOH-1447-001" />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button variant="primary" icon={Save} onClick={save} fullWidth disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} fullWidth disabled={saving}>إلغاء</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>إدارة الشركات</h2>
        <Button variant="primary" icon={Plus} onClick={openNew}>إضافة شركة جديدة</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {companies.map(c => (
          <Card key={c.id} padding={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: THEME.colors.primary, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}><Building2 size={20} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</span>
                  {c.code && <Badge color="accent">{c.code}</Badge>}
                  {!c.active && <Badge color="gray">معطّلة</Badge>}
                </div>
                {c.contract && <div style={{ fontSize: 12, color: THEME.colors.textSecondary }}>عقد: {c.contract}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Button size="sm" variant="outline" icon={Edit2} onClick={() => openEdit(c)} />
                <Button size="sm" variant={c.active ? 'outline' : 'success'} onClick={() => toggleActive(c)}>
                  {c.active ? 'تعطيل' : 'تفعيل'}
                </Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => remove(c)} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =================================================================
// Teams Management
// =================================================================
function TeamsManagementPage({ teams, toast, refreshTeams }) {
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [editingCriterion, setEditingCriterion] = useState(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', startDateId: '1' });
  const [saving, setSaving] = useState(false);

  const updateTeamField = async (teamId, updates) => {
    try {
      await api.updateTeam(teamId, updates);
      await refreshTeams();
      toast.show('تم التحديث', 'success');
    } catch (err) {
      toast.show('فشل التحديث', 'error');
    }
  };

  const addCriterion = (teamId) => {
    setEditingCriterion({
      teamId, isNew: true,
      criterion: { name: '', type: 'yesno', noteRequired: 'no', repeat: 'daily' },
    });
  };

  const editCriterion = (teamId, criterion) => {
    setEditingCriterion({ teamId, isNew: false, criterion: { ...criterion } });
  };

  const saveCriterion = async () => {
    const { teamId, isNew, criterion } = editingCriterion;
    if (!criterion.name) { toast.show('اسم المعيار مطلوب', 'warning'); return; }
    setSaving(true);
    try {
      if (isNew) {
        await api.createCriterion(teamId, criterion);
        toast.show('تم إضافة المعيار', 'success');
      } else {
        await api.updateCriterion(criterion.id, criterion);
        toast.show('تم تحديث المعيار', 'success');
      }
      await refreshTeams();
      setEditingCriterion(null);
    } catch (err) {
      toast.show('فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteCrit = async (criterionId) => {
    if (!confirm('حذف المعيار؟')) return;
    try {
      await api.deleteCriterion(criterionId);
      await refreshTeams();
      toast.show('تم الحذف', 'info');
    } catch (err) {
      toast.show('فشل الحذف', 'error');
    }
  };

  const deleteTeamHandler = async (teamId) => {
    if (!confirm('حذف الفريق وكل معاييره؟')) return;
    try {
      await api.deleteTeam(teamId);
      await refreshTeams();
      toast.show('تم الحذف', 'info');
    } catch (err) {
      toast.show('فشل الحذف', 'error');
    }
  };

  const addNewTeam = async () => {
    if (!teamForm.name) { toast.show('اسم الفريق مطلوب', 'warning'); return; }
    setSaving(true);
    try {
      await api.createTeam(teamForm);
      await refreshTeams();
      toast.show('تم الإضافة', 'success');
      setShowAddTeam(false);
      setTeamForm({ name: '', description: '', startDateId: '1' });
    } catch (err) {
      toast.show('فشل الإضافة', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (editingCriterion) {
    const c = editingCriterion.criterion;
    const updateField = (field, value) => {
      setEditingCriterion(prev => ({ ...prev, criterion: { ...prev.criterion, [field]: value } }));
    };

    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            {editingCriterion.isNew ? 'إضافة معيار جديد' : 'تعديل المعيار'}
          </h2>
          <Button variant="ghost" icon={X} onClick={() => setEditingCriterion(null)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>نص المعيار</label>
            <textarea value={c.name} onChange={e => updateField('name', e.target.value)} rows={2}
              style={{
                width: '100%', padding: '12px 14px', fontSize: 15,
                borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`,
                direction: 'rtl', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit', resize: 'vertical',
              }}/>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>نوع الإجابة</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {[
                { val: 'yesno', label: 'نعم / لا', icon: ThumbsUp },
                { val: 'scale', label: 'تقييم من 5', icon: Award },
                { val: 'number', label: 'رقم', icon: Hash },
              ].map(opt => {
                const Icon = opt.icon;
                const selected = c.type === opt.val;
                return (
                  <button key={opt.val} onClick={() => updateField('type', opt.val)}
                    style={{
                      padding: '12px 14px',
                      background: selected ? THEME.colors.primary : THEME.colors.surface,
                      color: selected ? '#fff' : THEME.colors.text,
                      border: `2px solid ${selected ? THEME.colors.primary : THEME.colors.border}`,
                      borderRadius: THEME.radius.md, fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      minHeight: 48, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    <Icon size={16} />{opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {c.type === 'number' && (
            <Input label="وحدة القياس" value={c.unit || ''} onChange={e => updateField('unit', e.target.value)} placeholder="كجم"/>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>تكرار السؤال</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              {[
                { val: 'daily', label: 'يتكرر كل يوم', desc: 'يظهر في كل أيام عمل الفريق' },
                { val: 'first_day_only', label: 'أول يوم فقط', desc: 'يظهر في يوم بدء الفريق فقط' },
              ].map(opt => {
                const selected = c.repeat === opt.val;
                return (
                  <button key={opt.val} onClick={() => updateField('repeat', opt.val)}
                    style={{
                      padding: '12px 14px',
                      background: selected ? THEME.colors.primary : THEME.colors.surface,
                      color: selected ? '#fff' : THEME.colors.text,
                      border: `2px solid ${selected ? THEME.colors.primary : THEME.colors.border}`,
                      borderRadius: THEME.radius.md, fontSize: 13, fontWeight: 700,
                      display: 'flex', flexDirection: 'column', gap: 4,
                      minHeight: 56, cursor: 'pointer', textAlign: 'right',
                      fontFamily: 'inherit',
                    }}>
                    <span>{opt.label}</span>
                    <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 500 }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>إلزامية الملاحظة</label>
            <select value={c.noteRequired} onChange={e => updateField('noteRequired', e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', fontSize: 15,
                borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`,
                direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff',
                fontFamily: 'inherit',
              }}>
              <option value="no">اختيارية</option>
              <option value="low">إلزامية عند التقييم السلبي</option>
              <option value="always">إلزامية دائماً</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button variant="primary" icon={Save} onClick={saveCriterion} fullWidth disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <Button variant="outline" onClick={() => setEditingCriterion(null)} fullWidth disabled={saving}>إلغاء</Button>
          </div>
        </div>
      </Card>
    );
  }

  if (showAddTeam) {
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>إضافة فريق جديد</h2>
          <Button variant="ghost" icon={X} onClick={() => setShowAddTeam(false)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="اسم الفريق" value={teamForm.name} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))} placeholder="مثلاً: فريق الإسعاف" />
          <Input label="الوصف" value={teamForm.description} onChange={e => setTeamForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف موجز" />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>تاريخ بدء العمل</label>
            <select value={teamForm.startDateId} onChange={e => setTeamForm(p => ({ ...p, startDateId: e.target.value }))}
              style={{
                width: '100%', padding: '12px 14px', fontSize: 15,
                borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`,
                direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff',
                fontFamily: 'inherit',
              }}>
              {DATES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="primary" icon={Save} onClick={addNewTeam} fullWidth disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'إضافة الفريق'}
            </Button>
            <Button variant="outline" onClick={() => setShowAddTeam(false)} fullWidth disabled={saving}>إلغاء</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>إدارة الفرق والمعايير</h2>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddTeam(true)}>إضافة فريق جديد</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {teams.map(team => {
          const isExpanded = expandedTeam === team.id;
          const startDate = DATES.find(d => d.id === team.startDateId);
          return (
            <Card key={team.id} padding={0}>
              <div style={{
                padding: 16, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', cursor: 'pointer',
                flexWrap: 'wrap', gap: 10,
              }} onClick={() => setExpandedTeam(isExpanded ? null : team.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{team.name}</span>
                    <Badge color="info">{team.criteria.length} معيار</Badge>
                    <Badge color="accent">يبدأ {startDate?.label}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: THEME.colors.textTertiary, paddingRight: 26 }}>{team.description}</div>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${THEME.colors.border}` }}>
                  <div style={{ marginTop: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 4 }}>تاريخ بدء العمل</label>
                    <select value={team.startDateId}
                      onChange={e => updateTeamField(team.id, { startDateId: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 12px', fontSize: 13,
                        borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`,
                        direction: 'rtl', outline: 'none', background: '#fff',
                        fontFamily: 'inherit',
                      }}>
                      {DATES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>المعايير ({team.criteria.length})</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="sm" variant="primary" icon={Plus} onClick={() => addCriterion(team.id)}>إضافة معيار</Button>
                      <Button size="sm" variant="danger" icon={Trash2} onClick={() => deleteTeamHandler(team.id)}>حذف الفريق</Button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {team.criteria.map((c, i) => (
                      <div key={c.id} style={{
                        padding: '10px 12px', background: THEME.colors.bgSecondary,
                        borderRadius: THEME.radius.md,
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.textTertiary, minWidth: 24 }}>{i + 1}.</span>
                        <span style={{ flex: 1, fontSize: 13, minWidth: 200 }}>{c.name}</span>
                        <Badge color={c.type === 'yesno' ? 'info' : c.type === 'scale' ? 'accent' : 'purple'} style={{ fontSize: 10 }}>
                          {c.type === 'yesno' ? 'نعم/لا' : c.type === 'scale' ? 'تقييم 5' : `رقم (${c.unit || ''})`}
                        </Badge>
                        {c.repeat === 'first_day_only' && <Badge color="warning" style={{ fontSize: 10 }}>أول يوم</Badge>}
                        <Button size="sm" variant="outline" icon={Edit2} onClick={() => editCriterion(team.id, c)} />
                        <Button size="sm" variant="danger" icon={Trash2} onClick={() => deleteCrit(c.id)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =================================================================
// Settings Page
// =================================================================
function SettingsPage({ settings, refreshSettings, toast }) {
  const [tempDate, setTempDate] = useState(settings.season_start_date || '');
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    if (!tempDate) { toast.show('الرجاء تحديد تاريخ', 'warning'); return; }
    setSaving(true);
    try {
      await api.updateSettings({ seasonStartDate: tempDate });
      await refreshSettings();
      toast.show('تم حفظ تاريخ بداية الموسم', 'success');
    } catch (err) {
      toast.show('فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>إعدادات النظام</h2>
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Calendar size={20} color={THEME.colors.accent} strokeWidth={2} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>تاريخ بداية موسم ذي الحجة</h3>
        </div>
        <div style={{
          padding: 12, background: THEME.colors.infoSoft,
          color: THEME.colors.info, borderRadius: THEME.radius.md,
          fontSize: 13, marginBottom: 14,
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            حدّد التاريخ الميلادي ليوم 1 من شهر ذي الحجة. سيُحدّد هذا تلقائياً اليوم الافتراضي والتاريخ الميلادي لكل يوم.
          </div>
        </div>
        <Input label="تاريخ 1 ذي الحجة (ميلادي)" type="date" value={tempDate} onChange={e => setTempDate(e.target.value)} />
        {settings.season_start_date && (
          <div style={{
            marginTop: 12, padding: 10,
            background: THEME.colors.successSoft, color: THEME.colors.success,
            borderRadius: THEME.radius.md, fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <CheckCircle2 size={16} />
            التاريخ الحالي: {new Date(settings.season_start_date).toLocaleDateString('ar-SA')}
          </div>
        )}
        <Button variant="primary" icon={Save} onClick={saveSettings} fullWidth style={{ marginTop: 14 }} disabled={saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ التاريخ'}
        </Button>
      </Card>
    </div>
  );
}

// =================================================================
// Main App
// =================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { toasts, show } = useToast();
  const toast = { show };

  // البيانات من قاعدة البيانات
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [settings, setSettings] = useState({ season_start_date: null });
  const [evaluations, setEvaluations] = useState([]);

  // حالة التحميل
  const [appReady, setAppReady] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // دوال التحديث
  const refreshUsers = useCallback(async () => {
    const data = await api.getAllUsers();
    setUsers(data.map(api.dbUserToApp));
  }, []);

  const refreshCompanies = useCallback(async () => {
    const data = await api.getAllCompanies();
    setCompanies(data.map(api.dbCompanyToApp));
  }, []);

  const refreshTeams = useCallback(async () => {
    const data = await api.getAllTeamsWithCriteria();
    setTeams(data);
  }, []);

  const refreshSettings = useCallback(async () => {
    const data = await api.getSettings();
    setSettings(data || { season_start_date: null });
  }, []);

  const refreshEvaluations = useCallback(async () => {
    const data = await api.getAllEvaluations();
    setEvaluations(data);
  }, []);

  // التحميل الأولي
  const loadAll = useCallback(async () => {
    try {
      setConnectionError(null);
      // التحقق من الاتصال
      const conn = await import('./data/supabase.js').then(m => m.checkConnection());
      if (!conn.connected) {
        setConnectionError(conn.error);
        return;
      }

      // تعبئة الفرق الافتراضية إذا فارغة
      await api.seedTeamsIfEmpty(INITIAL_TEAMS);

      // تحميل كل البيانات
      await Promise.all([
        refreshUsers(), refreshCompanies(), refreshTeams(),
        refreshSettings(), refreshEvaluations(),
      ]);

      setAppReady(true);
    } catch (err) {
      console.error('فشل تحميل البيانات:', err);
      setConnectionError(err.message);
    }
  }, [refreshUsers, refreshCompanies, refreshTeams, refreshSettings, refreshEvaluations]);

  useEffect(() => {
    loadAll();
  }, []);

  const pages = useMemo(() => {
    if (!user) return [];
    const all = {
      dashboard: { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة المتابعة' },
      supervisor: { id: 'supervisor', icon: Eye, label: 'متابعة المدخلين' },
      entry: { id: 'entry', icon: ClipboardList, label: 'إدخال البيانات' },
      users: { id: 'users', icon: UsersIcon, label: 'إدارة الحسابات' },
      companies: { id: 'companies', icon: Building2, label: 'إدارة الشركات' },
      teamsAdmin: { id: 'teamsAdmin', icon: Settings, label: 'إدارة الفرق' },
      settings: { id: 'settings', icon: Settings, label: 'إعدادات النظام' },
    };
    switch (user.role) {
      case 'admin': return [all.dashboard, all.users, all.companies, all.teamsAdmin, all.settings];
      case 'dashboard': return [all.dashboard];
      case 'supervisor': return [all.supervisor];
      case 'data_entry': return [all.entry];
      default: return [];
    }
  }, [user]);

  useEffect(() => { if (user && pages.length) setPage(pages[0].id); }, [user]);

  // شاشة خطأ الاتصال
  if (connectionError) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <ConnectionErrorScreen error={connectionError} onRetry={loadAll} />
      </>
    );
  }

  // شاشة التحميل
  if (!appReady) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <LoadingScreen message="جاري الاتصال بقاعدة البيانات..." />
      </>
    );
  }

  // شاشة تسجيل الدخول
  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <LoginPage onLogin={setUser} toast={toast} />
      </>
    );
  }

  const company = companies.find(c => c.id === user.companyId);
  const currentPageLabel = pages.find(p => p.id === page)?.label;

  const sidebarContent = (
    <>
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#fff' }}>
        <Logo height={50} />
        <div style={{ fontSize: 12, color: THEME.colors.textTertiary, marginTop: 6 }}>{user.name}</div>
      </div>
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {pages.map(p => {
          const Icon = p.icon;
          const active = page === p.id;
          return (
            <button key={p.id} onClick={() => { setPage(p.id); setMobileSidebarOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 18px',
                background: active ? 'rgba(184,153,104,0.12)' : 'transparent',
                border: 'none',
                borderRight: active ? `3px solid ${THEME.colors.accent}` : '3px solid transparent',
                color: active ? THEME.colors.accent : 'rgba(255,255,255,0.65)',
                fontSize: 14, fontWeight: active ? 700 : 500,
                textAlign: 'right', fontFamily: 'inherit', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>
              <Icon size={20} />{p.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Button variant="danger" fullWidth icon={LogOut} onClick={() => { setUser(null); setMobileSidebarOpen(false); }}>
          تسجيل الخروج
        </Button>
      </div>
    </>
  );

  return (
    <>
      <ToastContainer toasts={toasts} />
      <div style={{ minHeight: '100vh', background: THEME.colors.bg }}>
        <div style={{
          background: THEME.colors.surface,
          borderBottom: `1px solid ${THEME.colors.border}`,
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={() => setMobileSidebarOpen(v => !v)}
                style={{
                  background: THEME.colors.bgSecondary, border: 'none',
                  borderRadius: THEME.radius.md, padding: 10, cursor: 'pointer',
                }}>
                <Menu size={20} color={THEME.colors.primary} />
              </button>
            )}
            <Logo height={36} />
            <div style={{ borderRight: `1px solid ${THEME.colors.border}`, paddingRight: 12, marginRight: 4 }}>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: THEME.colors.primary }}>
                {currentPageLabel}
              </h1>
              {company && (
                <p style={{ fontSize: 11, color: THEME.colors.textTertiary }}>
                  {company.name} — قسم {user.section}
                </p>
              )}
              {user.role === 'supervisor' && (
                <p style={{ fontSize: 11, color: THEME.colors.textTertiary }}>
                  مشرف قسم {user.section}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: THEME.colors.successSoft,
              borderRadius: THEME.radius.full,
              fontSize: 12, fontWeight: 600, color: THEME.colors.success,
            }}>
              <Wifi size={14} strokeWidth={2.5} />
              متصل بقاعدة البيانات
            </div>
          </div>
        </div>

        {isMobile && mobileSidebarOpen && (
          <div onClick={() => setMobileSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }}>
            <aside onClick={e => e.stopPropagation()}
              style={{
                width: 280, background: THEME.colors.primary, color: '#fff',
                height: '100vh', position: 'fixed', top: 0, right: 0,
                display: 'flex', flexDirection: 'column',
                animation: 'slideInRight 0.2s ease-out',
              }}>
              {sidebarContent}
            </aside>
          </div>
        )}

        <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto' }}>
          {!isMobile && (
            <aside style={{
              width: 240, background: THEME.colors.primary, color: '#fff',
              minHeight: 'calc(100vh - 64px)', position: 'sticky', top: 64,
              display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
              {sidebarContent}
            </aside>
          )}

          <main style={{ flex: 1, padding: 16, minWidth: 0 }}>
            {page === 'dashboard' && <DashboardPage teams={teams} companies={companies} evaluations={evaluations} />}
            {page === 'supervisor' && <SupervisorPage user={user} users={users} companies={companies} teams={teams} evaluations={evaluations} settings={settings} />}
            {page === 'entry' && <DataEntryPage user={user} teams={teams} settings={settings} toast={toast} evaluations={evaluations} refreshEvaluations={refreshEvaluations} />}
            {page === 'users' && <UsersPage users={users} companies={companies} toast={toast} refreshUsers={refreshUsers} />}
            {page === 'companies' && <CompaniesPage companies={companies} toast={toast} refreshCompanies={refreshCompanies} />}
            {page === 'teamsAdmin' && <TeamsManagementPage teams={teams} toast={toast} refreshTeams={refreshTeams} />}
            {page === 'settings' && <SettingsPage settings={settings} refreshSettings={refreshSettings} toast={toast} />}
          </main>
        </div>
      </div>
    </>
  );
}
