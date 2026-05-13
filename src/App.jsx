import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from 'recharts';
import {
  LayoutDashboard, ClipboardList, FileText, LogOut, Menu, AlertTriangle,
  CheckCircle2, Clock, User, KeyRound, Eye, EyeOff, Calendar, Award,
  Target, Activity, Sparkles, Info, AlertCircle, MessageSquare, Camera,
  Save, Plus, X, ChevronDown, ChevronLeft, ChevronRight, Lock, Copy,
  ThumbsUp, ThumbsDown, HelpCircle, Star, Check, Building2, Bell,
  TrendingUp, TrendingDown, Wifi, WifiOff, Recycle, Hash,
} from 'lucide-react';

import { Button } from './components/Button.jsx';
import { Card, Badge } from './components/Card.jsx';
import { Input } from './components/Input.jsx';
import { TEAMS } from './data/teams.js';
import { DATES, TODAY_ID, COMPANIES, USERS, ROLES_CONFIG, SCALE_LABELS } from './data/seed.js';
import { THEME } from './data/theme.js';

const genId = () => crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

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
    success: THEME.colors.success,
    error: THEME.colors.danger,
    info: THEME.colors.info,
    warning: THEME.colors.warning,
  };

  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => {
        const Icon = icons[t.type] || Info;
        return (
          <div key={t.id} style={{
            background: THEME.colors.surface,
            color: THEME.colors.text,
            padding: '12px 18px',
            borderRadius: THEME.radius.md,
            boxShadow: THEME.shadows.lg,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 280,
            borderRight: `4px solid ${colors[t.type]}`,
            animation: 'slideDown 0.3s ease-out',
            pointerEvents: 'auto',
            fontSize: 14,
            fontWeight: 500,
          }}>
            <Icon size={20} color={colors[t.type]} strokeWidth={2.5} />
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

// =================================================================
// Login Page
// =================================================================
function LoginPage({ onLogin, toast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!username || !password) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const user = USERS.find(u => u.username === username && u.password === password && u.active);
    setLoading(false);
    if (!user) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    } else {
      toast.show(`مرحباً ${user.name}`, 'success');
      onLogin(user);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, #0D1824 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: THEME.colors.surface,
        borderRadius: THEME.radius.xl,
        padding: 36,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: THEME.radius.xl,
            background: `linear-gradient(135deg, ${THEME.colors.primary} 0%, ${THEME.colors.accent} 100%)`,
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={36} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: THEME.colors.primary, marginBottom: 4 }}>إثراء التجربة</h1>
          <p style={{ fontSize: 13, color: THEME.colors.textTertiary }}>نظام إدارة العمليات — موسم 1447هـ</p>
        </div>

        {error && (
          <div style={{
            background: THEME.colors.dangerSoft,
            color: THEME.colors.danger,
            padding: '12px 14px',
            borderRadius: THEME.radius.md,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertTriangle size={18} strokeWidth={2.5} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="اسم المستخدم"
            icon={User}
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="أدخل اسم المستخدم"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          <div style={{ position: 'relative' }}>
            <Input
              label="كلمة المرور"
              icon={KeyRound}
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={{
                position: 'absolute',
                left: 12,
                top: 34,
                background: 'transparent',
                border: 'none',
                color: THEME.colors.textTertiary,
                padding: 6,
                display: 'flex',
              }}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={loading} style={{ marginTop: 6 }}>
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </Button>
        </div>

        <div style={{
          marginTop: 24,
          padding: 14,
          background: THEME.colors.bgSecondary,
          borderRadius: THEME.radius.md,
          fontSize: 12,
          color: THEME.colors.textSecondary,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: THEME.colors.text }}>حسابات تجريبية:</div>
          <div style={{ lineHeight: 1.8 }}>
            <div>• مدير: <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 4 }}>admin / admin</code></div>
            <div>• مدخل بيانات: <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 4 }}>ahmed / 1234</code></div>
            <div>• داشبورد: <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 4 }}>fahad / 1234</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Dashboard Page
// =================================================================
function DashboardPage() {
  const dailyTrend = DATES.map((d, i) => ({
    day: d.id,
    compliance: Math.round(75 + Math.sin(i * 0.7) * 8 + i * 1.5),
    issues: Math.max(5, Math.round(18 - i * 1.2 + Math.sin(i * 1.5) * 3)),
  }));

  const teamPerf = TEAMS.map(t => ({
    name: t.name.replace('فريق ', '').replace('الفريق ', ''),
    rate: Math.round(75 + Math.random() * 20),
  }));

  const kpis = [
    { icon: CheckCircle2, label: 'نسبة الامتثال', value: '87.3', unit: '%', trend: 'up', trendValue: '+3.2%', color: 'success' },
    { icon: Award, label: 'متوسط الأداء', value: '4.2', unit: '/5', trend: 'up', trendValue: '+0.3', color: 'accent' },
    { icon: Recycle, label: 'نفايات اليوم', value: '1,420', unit: 'كجم', trend: 'down', trendValue: '-12%', color: 'info' },
    { icon: AlertTriangle, label: 'الملاحظات النشطة', value: '23', trend: 'down', trendValue: '-5', color: 'warning' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {kpis.map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Activity size={20} color={THEME.colors.accent} strokeWidth={2} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>الاتجاه اليومي للامتثال والملاحظات</div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={THEME.colors.accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={THEME.colors.accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={THEME.colors.danger} stopOpacity={0.25} />
                <stop offset="100%" stopColor={THEME.colors.danger} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#fff', border: `1px solid ${THEME.colors.border}`, borderRadius: 10, fontSize: 12, direction: 'rtl' }} />
            <Area type="monotone" dataKey="compliance" name="الامتثال %" stroke={THEME.colors.accent} strokeWidth={2.5} fill="url(#g1)" />
            <Area type="monotone" dataKey="issues" name="الملاحظات" stroke={THEME.colors.danger} strokeWidth={2} fill="url(#g2)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Target size={20} color={THEME.colors.primary} strokeWidth={2} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>أداء الفرق</div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={teamPerf} layout="vertical" margin={{ right: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
            <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => `${v}%`} contentStyle={{ direction: 'rtl' }} />
            <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
              {teamPerf.map((e, i) => (
                <Cell key={i} fill={e.rate >= 90 ? THEME.colors.success : e.rate >= 80 ? THEME.colors.accent : THEME.colors.warning} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, unit, trend, trendValue, color = 'accent' }) {
  const colors = {
    accent: { bg: '#FAF3E0', fg: THEME.colors.accent },
    success: { bg: THEME.colors.successSoft, fg: THEME.colors.success },
    warning: { bg: THEME.colors.warningSoft, fg: THEME.colors.warning },
    danger: { bg: THEME.colors.dangerSoft, fg: THEME.colors.danger },
    info: { bg: THEME.colors.infoSoft, fg: THEME.colors.info },
  };
  const c = colors[color];

  return (
    <Card padding={18}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: THEME.radius.md,
          background: c.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={22} color={c.fg} strokeWidth={2.2} />
        </div>
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            padding: '3px 8px',
            borderRadius: THEME.radius.full,
            background: trend === 'up' ? THEME.colors.successSoft : THEME.colors.dangerSoft,
            color: trend === 'up' ? THEME.colors.success : THEME.colors.danger,
            fontSize: 11,
            fontWeight: 700,
          }}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendValue}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: THEME.colors.textTertiary, fontWeight: 600 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 13, color: THEME.colors.textSecondary, fontWeight: 500 }}>{label}</div>
    </Card>
  );
}

// =================================================================
// Value Selector — يدعم الآن أنواع المعايير الجديدة
// =================================================================
function ValueSelector({ criterion, value, onChange, disabled }) {
  // نوع نعم/لا
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
            <button
              key={o.val}
              onClick={() => !disabled && onChange(o.val)}
              disabled={disabled}
              style={{
                flex: '1 1 100px',
                minHeight: 52,
                padding: '10px 14px',
                background: isSelected ? o.bg : THEME.colors.surface,
                color: isSelected ? o.color : THEME.colors.textSecondary,
                border: `2px solid ${isSelected ? o.color : THEME.colors.border}`,
                borderRadius: THEME.radius.md,
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Icon size={18} strokeWidth={2.4} />
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  // نوع تقييم 1-5
  if (criterion.type === 'scale') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4, 5].map(n => {
            const isSelected = value === n;
            const sl = SCALE_LABELS[n];
            return (
              <button
                key={n}
                onClick={() => !disabled && onChange(n)}
                disabled={disabled}
                style={{
                  flex: 1,
                  minHeight: 56,
                  background: isSelected ? sl.bg : THEME.colors.surface,
                  border: `2px solid ${isSelected ? sl.color : THEME.colors.border}`,
                  borderRadius: THEME.radius.md,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: isSelected ? sl.color : THEME.colors.textTertiary, lineHeight: 1 }}>{n}</div>
                <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={8}
                      fill={i < n ? (isSelected ? sl.color : THEME.colors.textTertiary) : 'none'}
                      color={isSelected ? sl.color : THEME.colors.borderStrong}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </button>
            );
          })}
          <button
            onClick={() => !disabled && onChange('na')}
            disabled={disabled}
            style={{
              minHeight: 56,
              padding: '8px 12px',
              background: value === 'na' ? THEME.colors.bgSecondary : THEME.colors.surface,
              border: `2px solid ${value === 'na' ? THEME.colors.borderStrong : THEME.colors.border}`,
              borderRadius: THEME.radius.md,
              fontSize: 12,
              fontWeight: 700,
              color: THEME.colors.textSecondary,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <HelpCircle size={18} />
            <span style={{ fontSize: 10 }}>غير منطبق</span>
          </button>
        </div>
        {value && value !== 'na' && (
          <div style={{
            padding: '6px 12px',
            background: SCALE_LABELS[value]?.bg,
            color: SCALE_LABELS[value]?.color,
            borderRadius: THEME.radius.sm,
            fontSize: 12,
            fontWeight: 700,
            textAlign: 'center',
          }}>
            {SCALE_LABELS[value]?.text}
          </div>
        )}
      </div>
    );
  }

  // نوع رقمي (للنفايات بالكجم وعدد الأكياس)
  if (criterion.type === 'number') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="number"
          value={value ?? ''}
          onChange={e => !disabled && onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
          disabled={disabled}
          placeholder="أدخل الرقم..."
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 16,
            fontWeight: 700,
            borderRadius: THEME.radius.md,
            border: `2px solid ${THEME.colors.border}`,
            outline: 'none',
            direction: 'rtl',
            minHeight: 56,
            boxSizing: 'border-box',
          }}
        />
        {criterion.unit && (
          <div style={{
            padding: '12px 18px',
            background: THEME.colors.bgSecondary,
            color: THEME.colors.textSecondary,
            borderRadius: THEME.radius.md,
            fontSize: 14,
            fontWeight: 700,
            minHeight: 56,
            display: 'flex',
            alignItems: 'center',
          }}>
            {criterion.unit}
          </div>
        )}
      </div>
    );
  }

  // نوع نصي
  if (criterion.type === 'text') {
    return (
      <textarea
        value={value ?? ''}
        onChange={e => !disabled && onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder="أدخل البيانات..."
        style={{
          width: '100%',
          padding: '12px 14px',
          fontSize: 14,
          borderRadius: THEME.radius.md,
          border: `2px solid ${THEME.colors.border}`,
          outline: 'none',
          direction: 'rtl',
          resize: 'vertical',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
    );
  }

  return null;
}

// =================================================================
// Criterion Card
// =================================================================
function CriterionCard({ criterion, index, value, note, onValueChange, onNoteChange, disabled }) {
  const isFilled = value !== null && value !== undefined && value !== '';
  const isNegative = value === 'no' || (typeof value === 'number' && criterion.type === 'scale' && value < 3);
  const isNA = value === 'na';
  const noteRequired = criterion.noteRequired === 'always' || (criterion.noteRequired === 'low' && isNegative) || isNA;
  const noteMissing = noteRequired && !note?.trim();

  return (
    <div style={{
      background: isFilled ? (isNA ? THEME.colors.bgSecondary : '#FDFCF8') : THEME.colors.surface,
      border: `1.5px solid ${noteMissing ? THEME.colors.warning : isFilled ? '#E8E0D0' : THEME.colors.border}`,
      borderRadius: THEME.radius.md,
      padding: 16,
      opacity: disabled ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: isFilled ? (isNA ? THEME.colors.textTertiary : THEME.colors.accent) : THEME.colors.bgSecondary,
          color: isFilled ? '#fff' : THEME.colors.textTertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {isFilled && !isNA ? <Check size={16} strokeWidth={3} /> : index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>{criterion.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge color={
              criterion.type === 'yesno' ? 'info' :
              criterion.type === 'scale' ? 'accent' :
              criterion.type === 'number' ? 'purple' :
              'gray'
            } style={{ fontSize: 10 }}>
              {criterion.type === 'yesno' ? 'نعم / لا' :
               criterion.type === 'scale' ? 'تقييم من 5' :
               criterion.type === 'number' ? `رقم (${criterion.unit || 'وحدة'})` :
               'نص'}
            </Badge>
            {criterion.noteRequired === 'always' && (
              <Badge color="warning" style={{ fontSize: 10 }}>
                <MessageSquare size={11} />
                ملاحظة إلزامية
              </Badge>
            )}
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
          <textarea
            value={note || ''}
            onChange={e => onNoteChange(e.target.value)}
            disabled={disabled}
            placeholder={isNA ? 'اذكر سبب عدم انطباق هذا المعيار...' : isNegative ? 'اشرح سبب التقييم السلبي...' : 'أضف ملاحظة (اختياري)...'}
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: THEME.radius.md,
              border: `1.5px solid ${noteMissing ? THEME.colors.warning : THEME.colors.border}`,
              fontSize: 13,
              direction: 'rtl',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>
      )}
    </div>
  );
}

// =================================================================
// Data Entry Page
// =================================================================
function DataEntryPage({ user, toast }) {
  const [activeDate, setActiveDate] = useState(TODAY_ID);
  const [activeTeamId, setActiveTeamId] = useState(TEAMS[0].id);
  const [evaluations, setEvaluations] = useState({});
  const [lastSaved, setLastSaved] = useState(null);

  const activeTeam = TEAMS.find(t => t.id === activeTeamId);
  const activeIdx = DATES.findIndex(d => d.id === activeDate);
  const todayIdx = DATES.findIndex(d => d.id === TODAY_ID);
  const isLocked = activeIdx > todayIdx;

  const getKey = (criterionId) => `${user.companyId}_${user.section}_${activeDate}_${criterionId}`;

  const updateValue = useCallback((criterionId, val) => {
    if (isLocked) {
      toast.show('لا يمكن التعديل على يوم مستقبلي', 'warning');
      return;
    }
    const key = getKey(criterionId);
    setEvaluations(prev => ({
      ...prev,
      [key]: { ...prev[key], value: val, updatedAt: new Date().toISOString() },
    }));
    setTimeout(() => setLastSaved(new Date()), 1500);
  }, [isLocked, activeDate, user, toast]);

  const updateNote = useCallback((criterionId, note) => {
    const key = getKey(criterionId);
    setEvaluations(prev => ({
      ...prev,
      [key]: { ...prev[key], note, updatedAt: new Date().toISOString() },
    }));
    setTimeout(() => setLastSaved(new Date()), 1500);
  }, [activeDate, user]);

  const progressMap = useMemo(() => {
    const map = {};
    TEAMS.forEach(t => {
      let filled = 0;
      t.criteria.forEach(c => {
        const e = evaluations[getKey(c.id)];
        if (e?.value !== undefined && e?.value !== null && e?.value !== '') filled++;
      });
      map[t.id] = { filled, total: t.criteria.length };
    });
    return map;
  }, [evaluations, activeDate, user]);

  const currentProgress = progressMap[activeTeamId];

  return (
    <div>
      {/* Date picker */}
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button size="sm" variant="outline" icon={ChevronRight}
            onClick={() => activeIdx > 0 && setActiveDate(DATES[activeIdx - 1].id)}
            disabled={activeIdx === 0}
          />
          <div style={{
            flex: 1,
            padding: '10px 14px',
            background: isLocked ? THEME.colors.dangerSoft : THEME.colors.bgSecondary,
            borderRadius: THEME.radius.md,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Calendar size={16} />
              {DATES[activeIdx].label} — {DATES[activeIdx].day}
              {isLocked && <Lock size={14} />}
            </div>
            <div style={{ fontSize: 11, color: THEME.colors.textSecondary, marginTop: 2 }}>
              {DATES[activeIdx].gregorian}
              {DATES[activeIdx].special && ` · ${DATES[activeIdx].special}`}
              {isLocked && ' · يوم قادم (مقفل)'}
            </div>
          </div>
          <Button size="sm" variant="outline" icon={ChevronLeft}
            onClick={() => activeIdx < DATES.length - 1 && setActiveDate(DATES[activeIdx + 1].id)}
            disabled={activeIdx === DATES.length - 1}
          />
        </div>
      </Card>

      {/* Team selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
        {TEAMS.map(t => {
          const isActive = t.id === activeTeamId;
          const progress = progressMap[t.id];
          const pct = (progress.filled / progress.total) * 100;

          return (
            <button
              key={t.id}
              onClick={() => setActiveTeamId(t.id)}
              style={{
                padding: '12px 14px',
                background: isActive ? THEME.colors.primary : THEME.colors.surface,
                color: isActive ? '#fff' : THEME.colors.text,
                border: `1.5px solid ${isActive ? THEME.colors.primary : THEME.colors.border}`,
                borderRadius: THEME.radius.md,
                textAlign: 'right',
                minHeight: 76,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</span>
                {pct === 100 && <CheckCircle2 size={16} color={isActive ? '#90E0B5' : THEME.colors.success} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, opacity: 0.85 }}>
                <div style={{ flex: 1, height: 4, background: isActive ? 'rgba(255,255,255,0.15)' : THEME.colors.bgSecondary, borderRadius: 2 }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
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
            <div style={{ fontSize: 14, fontWeight: 700 }}>{activeTeam.name}</div>
            <Badge color={currentProgress.filled === currentProgress.total ? 'success' : 'accent'}>
              {currentProgress.filled} / {currentProgress.total} معبّأ
            </Badge>
          </div>
          {lastSaved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: THEME.colors.success, fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              تم الحفظ التلقائي
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: THEME.colors.textTertiary, marginTop: 6 }}>{activeTeam.description}</div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 80 }}>
        {activeTeam.criteria.map((c, i) => {
          const e = evaluations[getKey(c.id)];
          return (
            <CriterionCard
              key={c.id}
              criterion={c}
              index={i}
              value={e?.value}
              note={e?.note}
              onValueChange={(v) => updateValue(c.id, v)}
              onNoteChange={(n) => updateNote(c.id, n)}
              disabled={isLocked}
            />
          );
        })}
      </div>

      <div style={{
        position: 'sticky',
        bottom: 0,
        background: `linear-gradient(to top, ${THEME.colors.bg} 70%, transparent)`,
        padding: '16px 0 8px',
      }}>
        <Button
          variant="primary"
          size="lg"
          icon={Save}
          fullWidth
          onClick={() => { setLastSaved(new Date()); toast.show('تم حفظ التقييم ✓', 'success'); }}
          disabled={isLocked}
        >
          حفظ التقييم
        </Button>
      </div>
    </div>
  );
}

// =================================================================
// Main App
// =================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, show } = useToast();
  const toast = { show };

  const pages = useMemo(() => {
    if (!user) return [];
    const all = {
      dashboard: { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة المتابعة' },
      entry: { id: 'entry', icon: ClipboardList, label: 'إدخال البيانات' },
    };
    switch (user.role) {
      case 'admin': return [all.dashboard, all.entry];
      case 'dashboard': return [all.dashboard];
      case 'data_entry': return [all.entry];
      default: return [];
    }
  }, [user]);

  useEffect(() => {
    if (user && pages.length) setPage(pages[0].id);
  }, [user, pages]);

  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <LoginPage onLogin={setUser} toast={toast} />
      </>
    );
  }

  const company = COMPANIES.find(c => c.id === user.companyId);

  return (
    <>
      <ToastContainer toasts={toasts} />
      <div style={{ minHeight: '100vh', background: THEME.colors.bg }}>
        {/* Top Bar */}
        <div style={{
          background: THEME.colors.surface,
          borderBottom: `1px solid ${THEME.colors.border}`,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{
                background: THEME.colors.bgSecondary,
                border: 'none',
                borderRadius: THEME.radius.md,
                padding: 10,
                cursor: 'pointer',
              }}
            >
              <Menu size={20} color={THEME.colors.primary} />
            </button>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: THEME.colors.primary }}>
                {pages.find(p => p.id === page)?.label}
              </h1>
              {company && (
                <p style={{ fontSize: 12, color: THEME.colors.textTertiary }}>
                  {company.name} — قسم {user.section}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: THEME.colors.successSoft,
              borderRadius: THEME.radius.full,
              fontSize: 12,
              fontWeight: 600,
              color: THEME.colors.success,
            }}>
              <Wifi size={14} strokeWidth={2.5} />
              متصل
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 100,
            }}
          >
            <aside
              onClick={e => e.stopPropagation()}
              style={{
                width: 260,
                background: THEME.colors.primary,
                color: '#fff',
                height: '100vh',
                position: 'fixed',
                top: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideDown 0.2s',
              }}
            >
              <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Sparkles size={24} color={THEME.colors.accent} />
                <div>
                  <div style={{ fontWeight: 800 }}>إثراء التجربة</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{user.name}</div>
                </div>
              </div>

              <nav style={{ flex: 1, padding: '12px 0' }}>
                {pages.map(p => {
                  const Icon = p.icon;
                  const active = page === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setPage(p.id); setSidebarOpen(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 18px',
                        background: active ? 'rgba(184,153,104,0.12)' : 'transparent',
                        border: 'none',
                        borderRight: active ? `3px solid ${THEME.colors.accent}` : '3px solid transparent',
                        color: active ? THEME.colors.accent : 'rgba(255,255,255,0.65)',
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        textAlign: 'right',
                      }}
                    >
                      <Icon size={20} />
                      {p.label}
                    </button>
                  );
                })}
              </nav>

              <div style={{ padding: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Button variant="danger" fullWidth icon={LogOut} onClick={() => setUser(null)}>
                  تسجيل الخروج
                </Button>
              </div>
            </aside>
          </div>
        )}

        <main style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
          {page === 'dashboard' && <DashboardPage />}
          {page === 'entry' && <DataEntryPage user={user} toast={toast} />}
        </main>
      </div>
    </>
  );
}
