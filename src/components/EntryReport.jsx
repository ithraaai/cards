import { useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, MessageSquare, Award, Activity, ThumbsUp,
  ThumbsDown, ChevronRight, Calendar, Building2, User, FileDown, FileImage,
  PieChart as PieChartIcon, Target, BarChart3, Info, ClipboardCheck, Clock,
  TrendingUp, Sunrise, Sunset,
} from 'lucide-react';

import { Button } from './Button.jsx';
import { Card, Badge } from './Card.jsx';
import { Logo } from './Logo.jsx';
import { DATES, SCALE_LABELS, getGregorianDateForHijriDay, formatGregorianDate, getDayName } from '../data/seed.js';
import { THEME } from '../data/theme.js';
import { shouldShowCriterion, isTeamActiveOnDate } from '../data/teams.js';

// =================================================================
// إعدادات افتراضية لعناصر التقرير (يمكن للمدير تخصيصها لاحقاً)
// =================================================================
export const DEFAULT_ENTRY_REPORT_SECTIONS = [
  { id: 'kpis', label: 'المؤشرات الرئيسية', enabled: true, order: 1 },
  { id: 'teams_progress', label: 'إنجاز كل فريق', enabled: true, order: 2 },
  { id: 'sessions_comparison', label: 'مقارنة الجلستين (للفرق المعنية)', enabled: true, order: 3 },
  { id: 'charts', label: 'الرسوم البيانية', enabled: true, order: 4 },
  { id: 'teams_chart', label: 'مقارنة الفرق (شريطي)', enabled: true, order: 5 },
  { id: 'radar', label: 'رسم رادار للفرق', enabled: true, order: 6 },
  { id: 'problems', label: 'المعايير التي تحتاج انتباه', enabled: true, order: 7 },
  { id: 'positive_highlights', label: 'الإنجازات الإيجابية', enabled: false, order: 8 },
];

// =================================================================
// صفحة تقرير اليوم لمدخل البيانات
// =================================================================
export function EntryReportPage({ user, company, teams, settings, evaluations, activeDate, teamsWithSessions, onBack, toast }) {
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);

  const dateInfo = DATES.find(d => d.id === activeDate);
  const gregorianDate = getGregorianDateForHijriDay(activeDate, settings.season_start_date);

  // إعدادات الأقسام (للآن default، لاحقاً نقرأها من settings)
  const reportSections = useMemo(() => {
    const fromSettings = settings.entry_report_sections;
    if (fromSettings && Array.isArray(fromSettings) && fromSettings.length > 0) return fromSettings;
    return DEFAULT_ENTRY_REPORT_SECTIONS;
  }, [settings]);

  const isEnabled = (id) => reportSections.find(s => s.id === id)?.enabled;
  const sortedSections = useMemo(() => [...reportSections].sort((a, b) => a.order - b.order), [reportSections]);

  // خريطة المعايير
  const criteriaById = useMemo(() => {
    const map = {};
    teams.forEach(t => t.criteria.forEach(c => { map[c.id] = { ...c, teamName: t.name, teamId: t.id }; }));
    return map;
  }, [teams]);

  // تقييمات المدخل لهذا اليوم (كل الجلسات)
  const myEvals = useMemo(() => {
    return evaluations.filter(e =>
      e.company_id === user.companyId &&
      e.section === user.section &&
      e.date_id === activeDate
    );
  }, [evaluations, user, activeDate]);

  // حساب إحصاءات مع التمييز بين الجلستين
  const computeStats = (evalsFilter) => {
    const evals = evalsFilter ? myEvals.filter(evalsFilter) : myEvals;
    let totalCriteria = 0, filledCriteria = 0;
    let yesCount = 0, noCount = 0, naCount = 0;
    let totalScale = 0, scaleCount = 0;
    let negatives = 0, notesCount = 0;
    const scaleDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    teams.forEach(t => {
      if (!isTeamActiveOnDate(t, activeDate)) return;
      const visible = t.criteria.filter(c => shouldShowCriterion(c, t, activeDate, user.section));
      const hasSessions = teamsWithSessions?.has(t.id);
      const sessionsToCount = hasSessions ? [1, 2] : [1];
      sessionsToCount.forEach(sNum => {
        visible.forEach(c => {
          totalCriteria++;
          const e = evals.find(ev => ev.criterion_id === c.id && (ev.session || 1) === sNum);
          if (e?.value !== undefined && e?.value !== null && e?.value !== '') {
            filledCriteria++;
            if (e.note?.trim()) notesCount++;
            if (e.value === 'yes') yesCount++;
            else if (e.value === 'no') { noCount++; negatives++; }
            else if (e.value === 'na') naCount++;
            else {
              const num = parseFloat(e.value);
              if (!isNaN(num) && c.type === 'scale' && num >= 1 && num <= 5) {
                scaleDistribution[num]++;
                totalScale += num;
                scaleCount++;
                if (num < 3) negatives++;
              }
            }
          }
        });
      });
    });

    const completion = totalCriteria > 0 ? Math.round((filledCriteria / totalCriteria) * 100) : 0;
    const avgScale = scaleCount > 0 ? (totalScale / scaleCount) : 0;
    const yesNoTotal = yesCount + noCount;
    const complianceRate = yesNoTotal > 0 ? Math.round((yesCount / yesNoTotal) * 100) : 0;

    return {
      totalCriteria, filledCriteria, completion,
      yesCount, noCount, naCount,
      avgScale: avgScale.toFixed(1), avgScaleNum: avgScale, scaleCount,
      complianceRate, negatives, notesCount,
      scaleDistribution,
    };
  };

  const stats = useMemo(() => computeStats(), [myEvals, teams, activeDate, user.section, teamsWithSessions]);

  // إحصاءات لكل فريق مع التمييز بين الجلستين
  const teamsStats = useMemo(() => {
    return teams.map(t => {
      if (!isTeamActiveOnDate(t, activeDate)) return null;
      const visible = t.criteria.filter(c => shouldShowCriterion(c, t, activeDate, user.section));
      if (visible.length === 0) return null;
      const hasSessions = teamsWithSessions?.has(t.id);

      const computeSession = (sNum) => {
        let filled = 0, negatives = 0, notes = 0, totalScale = 0, scaleCount = 0;
        visible.forEach(c => {
          const e = myEvals.find(ev => ev.criterion_id === c.id && (ev.session || 1) === sNum);
          if (e?.value !== undefined && e?.value !== null && e?.value !== '') {
            filled++;
            if (e.note?.trim()) notes++;
            const num = parseFloat(e.value);
            if (e.value === 'no') negatives++;
            else if (c.type === 'scale' && !isNaN(num)) {
              totalScale += num; scaleCount++;
              if (num < 3) negatives++;
            }
          }
        });
        const avg = scaleCount > 0 ? totalScale / scaleCount : 0;
        return { filled, total: visible.length, negatives, notes, avg };
      };

      if (hasSessions) {
        return {
          team: t, hasSessions: true,
          session1: computeSession(1),
          session2: computeSession(2),
        };
      }
      const single = computeSession(1);
      return { team: t, hasSessions: false, session1: single };
    }).filter(Boolean);
  }, [teams, myEvals, activeDate, user.section, teamsWithSessions]);

  // المعايير التي فيها مشاكل (من كلتا الجلستين)
  const problematicCriteria = useMemo(() => {
    const result = [];
    myEvals.forEach(e => {
      const criterion = criteriaById[e.criterion_id];
      if (!criterion) return;
      const num = parseFloat(e.value);
      const isNegative = e.value === 'no' || (criterion.type === 'scale' && !isNaN(num) && num < 3);
      const isNA = e.value === 'na';
      if (isNegative || isNA) {
        result.push({
          ...e, criterion, isNegative, isNA,
          sessionLabel: (e.session || 1) === 1 ? 'صباحية' : 'مسائية',
          displayValue: e.value === 'no' ? 'لا' : e.value === 'na' ? 'غير منطبق' : `تقييم ${num}`,
        });
      }
    });
    return result;
  }, [myEvals, criteriaById]);

  // إنجازات إيجابية (تقييمات ممتازة)
  const positives = useMemo(() => {
    const result = [];
    myEvals.forEach(e => {
      const criterion = criteriaById[e.criterion_id];
      if (!criterion) return;
      const num = parseFloat(e.value);
      const isExcellent = (e.value === 'yes') || (criterion.type === 'scale' && num === 5);
      if (isExcellent) {
        result.push({ ...e, criterion, sessionLabel: (e.session || 1) === 1 ? 'صباحية' : 'مسائية' });
      }
    });
    return result;
  }, [myEvals, criteriaById]);

  // بيانات للرسوم
  const scaleData = [
    { name: 'ممتاز', value: stats.scaleDistribution[5], color: SCALE_LABELS[5].color },
    { name: 'جيد جداً', value: stats.scaleDistribution[4], color: SCALE_LABELS[4].color },
    { name: 'جيد', value: stats.scaleDistribution[3], color: SCALE_LABELS[3].color },
    { name: 'ضعيف', value: stats.scaleDistribution[2], color: SCALE_LABELS[2].color },
    { name: 'ضعيف جداً', value: stats.scaleDistribution[1], color: SCALE_LABELS[1].color },
  ].filter(s => s.value > 0);
  const totalScale = scaleData.reduce((s, x) => s + x.value, 0);

  const yesNoData = [];
  if (stats.yesCount > 0) yesNoData.push({ name: 'نعم', value: stats.yesCount, color: THEME.colors.success });
  if (stats.noCount > 0) yesNoData.push({ name: 'لا', value: stats.noCount, color: THEME.colors.danger });
  if (stats.naCount > 0) yesNoData.push({ name: 'غير منطبق', value: stats.naCount, color: THEME.colors.textTertiary });

  // بيانات رسم رادار للفرق
  const radarData = useMemo(() => {
    return teamsStats.map(ts => {
      const total = ts.team.criteria.length;
      const filled1 = ts.session1?.filled || 0;
      const filled2 = ts.hasSessions ? (ts.session2?.filled || 0) : filled1;
      const pct = total > 0 ? Math.round(((filled1 + (ts.hasSessions ? filled2 : 0)) / (total * (ts.hasSessions ? 2 : 1))) * 100) : 0;
      return {
        team: ts.team.name.replace('فريق ', '').replace('الفريق ', '').substring(0, 12),
        pct,
      };
    });
  }, [teamsStats]);

  // تنزيل التقرير
  const downloadPNG = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#FAF7F2', scale: 2, useCORS: true, logging: false,
      });
      const link = document.createElement('a');
      link.download = `تقرير-${user.name}-${dateInfo?.label}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.show('تم تنزيل الصورة', 'success');
    } catch (err) { console.error(err); toast.show('فشل التنزيل', 'error'); }
    finally { setGenerating(false); }
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#FAF7F2', scale: 2, useCORS: true, logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`تقرير-${user.name}-${dateInfo?.label}.pdf`);
      toast.show('تم تنزيل PDF', 'success');
    } catch (err) { console.error(err); toast.show('فشل التنزيل', 'error'); }
    finally { setGenerating(false); }
  };

  // مكوّن KPI صغير
  const MiniKPI = ({ icon: Icon, label, value, unit, color = 'accent' }) => {
    const colorMap = {
      accent: { bg: '#FAF3E0', fg: THEME.colors.accent },
      success: { bg: THEME.colors.successSoft, fg: THEME.colors.success },
      warning: { bg: THEME.colors.warningSoft, fg: THEME.colors.warning },
      danger: { bg: THEME.colors.dangerSoft, fg: THEME.colors.danger },
      info: { bg: THEME.colors.infoSoft, fg: THEME.colors.info },
      purple: { bg: THEME.colors.purpleSoft, fg: THEME.colors.purple },
    };
    const c = colorMap[color];
    return (
      <div style={{ background: '#fff', padding: 12, borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} color={c.fg} strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: 10, color: THEME.colors.textSecondary, fontWeight: 600 }}>{label}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: c.fg, lineHeight: 1 }}>{value}</span>
          {unit && <span style={{ fontSize: 10, color: THEME.colors.textTertiary, fontWeight: 600 }}>{unit}</span>}
        </div>
      </div>
    );
  };

  // عرض القسم حسب الـ id
  const renderSection = (id) => {
    if (!isEnabled(id)) return null;

    if (id === 'kpis') {
      return (
        <div style={{ marginBottom: 14 }} key={id}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color={THEME.colors.accent} />
            مؤشرات الأداء
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            <MiniKPI icon={ClipboardCheck} label="نسبة الإنجاز" value={stats.completion} unit="%" color="success" />
            <MiniKPI icon={Activity} label="المعايير" value={`${stats.filledCriteria}/${stats.totalCriteria}`} color="info" />
            <MiniKPI icon={ThumbsUp} label="الامتثال" value={stats.complianceRate} unit="%" color="success" />
            <MiniKPI icon={Award} label="متوسط التقييم" value={stats.avgScale} unit="/5" color="accent" />
            <MiniKPI icon={AlertTriangle} label="ملاحظات سلبية" value={stats.negatives} color="warning" />
            <MiniKPI icon={MessageSquare} label="ملاحظات مكتوبة" value={stats.notesCount} color="purple" />
          </div>
        </div>
      );
    }

    if (id === 'teams_progress') {
      return (
        <Card padding={16} style={{ marginBottom: 14 }} key={id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Target size={18} color={THEME.colors.primary} />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>إنجاز كل فريق</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teamsStats.map((ts, i) => {
              const total = ts.team.criteria.filter(c => shouldShowCriterion(c, ts.team, activeDate, user.section)).length;
              if (ts.hasSessions) {
                const pct1 = total > 0 ? Math.round((ts.session1.filled / total) * 100) : 0;
                const pct2 = total > 0 ? Math.round((ts.session2.filled / total) * 100) : 0;
                return (
                  <div key={i} style={{ padding: 12, background: '#F0F7FF', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.info}33` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{ts.team.name}</span>
                        <Badge color="info" style={{ fontSize: 10 }}><Clock size={10} />جلستان</Badge>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ padding: 8, background: '#fff', borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: THEME.colors.textSecondary, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sunrise size={12} color={THEME.colors.accent} /> صباحية
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                          {ts.session1.filled}/{total} ({pct1}%)
                        </div>
                        <div style={{ height: 5, background: THEME.colors.bgSecondary, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct1}%`, height: '100%', background: pct1 === 100 ? THEME.colors.success : THEME.colors.accent }} />
                        </div>
                      </div>
                      <div style={{ padding: 8, background: '#fff', borderRadius: 6 }}>
                        <div style={{ fontSize: 11, color: THEME.colors.textSecondary, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sunset size={12} color={THEME.colors.purple} /> مسائية
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                          {ts.session2.filled}/{total} ({pct2}%)
                        </div>
                        <div style={{ height: 5, background: THEME.colors.bgSecondary, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct2}%`, height: '100%', background: pct2 === 100 ? THEME.colors.success : THEME.colors.purple }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              const pct = total > 0 ? Math.round((ts.session1.filled / total) * 100) : 0;
              return (
                <div key={i} style={{ padding: '10px 14px', background: THEME.colors.bgSecondary, borderRadius: THEME.radius.md }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{ts.team.name}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {ts.session1.negatives > 0 && <Badge color="danger" style={{ fontSize: 10 }}>{ts.session1.negatives} سلبي</Badge>}
                      <span style={{ fontSize: 13, fontWeight: 800, color: pct === 100 ? THEME.colors.success : pct >= 50 ? THEME.colors.accent : THEME.colors.warning }}>
                        {ts.session1.filled}/{total} ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#fff', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? THEME.colors.success : pct >= 50 ? THEME.colors.accent : THEME.colors.warning }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      );
    }

    if (id === 'sessions_comparison') {
      const dualTeams = teamsStats.filter(ts => ts.hasSessions);
      if (dualTeams.length === 0) return null;
      return (
        <Card padding={16} style={{ marginBottom: 14, background: '#F0F7FF' }} key={id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <TrendingUp size={18} color={THEME.colors.info} />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>مقارنة الجلستين</h3>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(180, dualTeams.length * 50)}>
            <BarChart data={dualTeams.map(ts => ({
              name: ts.team.name.replace('فريق ', '').replace('الفريق ', ''),
              صباحية: ts.session1.avg.toFixed(2),
              مسائية: ts.session2.avg.toFixed(2),
            }))} layout="vertical" margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
              <Bar dataKey="صباحية" fill={THEME.colors.accent} radius={[0, 4, 4, 0]} />
              <Bar dataKey="مسائية" fill={THEME.colors.purple} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      );
    }

    if (id === 'charts') {
      if (yesNoData.length === 0 && scaleData.length === 0) return null;
      return (
        <div key={id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 14 }}>
          {yesNoData.length > 0 && (
            <Card padding={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <PieChartIcon size={16} color={THEME.colors.info} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>إجابات نعم/لا</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={yesNoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} label={({name, value}) => `${name}: ${value}`}>
                    {yesNoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
          {scaleData.length > 0 && (
            <Card padding={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Award size={16} color={THEME.colors.accent} />
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>توزيع التقييمات</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={scaleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} label={({name, value}) => `${value}`}>
                    {scaleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
                {scaleData.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                    <span style={{ flex: 1 }}>{s.name}</span>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.value} ({Math.round(s.value / totalScale * 100)}%)</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      );
    }

    if (id === 'teams_chart') {
      if (teamsStats.length === 0) return null;
      const data = teamsStats.map(ts => {
        const total = ts.team.criteria.filter(c => shouldShowCriterion(c, ts.team, activeDate, user.section)).length;
        const totalSessions = ts.hasSessions ? 2 : 1;
        const filled = ts.session1.filled + (ts.hasSessions ? ts.session2.filled : 0);
        const pct = total > 0 ? Math.round((filled / (total * totalSessions)) * 100) : 0;
        return { name: ts.team.name.replace('فريق ', '').replace('الفريق ', ''), pct };
      });
      return (
        <Card padding={16} style={{ marginBottom: 14 }} key={id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <BarChart3 size={16} color={THEME.colors.primary} />
            <h3 style={{ fontSize: 13, fontWeight: 700 }}>مقارنة إنجاز الفرق</h3>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(180, data.length * 32)}>
            <BarChart data={data} layout="vertical" margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `${v}%`} contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.pct === 100 ? THEME.colors.success : d.pct >= 50 ? THEME.colors.accent : THEME.colors.warning} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      );
    }

    if (id === 'radar') {
      if (radarData.length < 3) return null;
      return (
        <Card padding={16} style={{ marginBottom: 14 }} key={id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Target size={16} color={THEME.colors.purple} />
            <h3 style={{ fontSize: 13, fontWeight: 700 }}>نظرة شاملة (رادار)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={THEME.colors.border} />
              <PolarAngleAxis dataKey="team" tick={{ fontSize: 10, fill: THEME.colors.textSecondary }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="الإنجاز" dataKey="pct" stroke={THEME.colors.accent} fill={THEME.colors.accent} fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      );
    }

    if (id === 'problems') {
      if (problematicCriteria.length === 0 && stats.filledCriteria > 0) {
        return (
          <Card padding={20} style={{ marginBottom: 14, background: THEME.colors.successSoft, textAlign: 'center' }} key={id}>
            <CheckCircle2 size={32} color={THEME.colors.success} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.colors.success }}>
              ممتاز! لا توجد ملاحظات سلبية اليوم
            </div>
          </Card>
        );
      }
      if (problematicCriteria.length === 0) return null;
      return (
        <Card padding={16} style={{ marginBottom: 14, background: '#FFF8F0', border: `1.5px solid ${THEME.colors.warning}33` }} key={id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={18} color={THEME.colors.warning} />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>المعايير التي تحتاج انتباه ({problematicCriteria.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {problematicCriteria.map((p, i) => (
              <div key={i} style={{ padding: 12, background: '#fff', borderRadius: 8, borderRight: `3px solid ${p.isNA ? THEME.colors.textTertiary : THEME.colors.danger}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: THEME.colors.primary }}>{p.criterion.name}</div>
                    <div style={{ fontSize: 10, color: THEME.colors.textTertiary, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span>{p.criterion.teamName}</span>
                      {teamsWithSessions?.has(p.criterion.teamId) && (
                        <Badge color="info" style={{ fontSize: 9 }}>{p.sessionLabel}</Badge>
                      )}
                    </div>
                  </div>
                  <Badge color={p.isNA ? 'gray' : 'danger'} style={{ fontSize: 10 }}>{p.displayValue}</Badge>
                </div>
                {p.note ? (
                  <div style={{ marginTop: 6, padding: '6px 8px', background: THEME.colors.bgSecondary, borderRadius: 5, fontSize: 11, color: THEME.colors.textSecondary, lineHeight: 1.5 }}>
                    <MessageSquare size={11} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
                    {p.note}
                  </div>
                ) : (
                  <div style={{ marginTop: 6, padding: '4px 8px', background: THEME.colors.warningSoft, borderRadius: 5, fontSize: 10, color: THEME.colors.warning, fontWeight: 600 }}>
                    لم تُكتب ملاحظة
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (id === 'positive_highlights') {
      if (positives.length === 0) return null;
      return (
        <Card padding={16} style={{ marginBottom: 14, background: THEME.colors.successSoft, border: `1.5px solid ${THEME.colors.success}33` }} key={id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CheckCircle2 size={18} color={THEME.colors.success} />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>الإنجازات الإيجابية ({positives.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
            {positives.slice(0, 15).map((p, i) => (
              <div key={i} style={{ padding: 8, background: '#fff', borderRadius: 6, fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <span>{p.criterion.name}</span>
                <span style={{ fontSize: 10, color: THEME.colors.textTertiary }}>{p.criterion.teamName}</span>
              </div>
            ))}
            {positives.length > 15 && (
              <div style={{ fontSize: 11, color: THEME.colors.textTertiary, textAlign: 'center', paddingTop: 4 }}>
                ... و {positives.length - 15} إنجاز آخر
              </div>
            )}
          </div>
        </Card>
      );
    }

    return null;
  };

  return (
    <div>
      {/* شريط الأزرار */}
      <Card padding={12} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button variant="outline" icon={ChevronRight} onClick={onBack}>رجوع للإدخال</Button>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="outline" icon={FileImage} onClick={downloadPNG} disabled={generating}>
              {generating ? '...' : 'صورة'}
            </Button>
            <Button variant="primary" icon={FileDown} onClick={downloadPDF} disabled={generating}>
              {generating ? '...' : 'PDF'}
            </Button>
          </div>
        </div>
      </Card>

      {/* محتوى التقرير */}
      <div ref={reportRef} style={{ background: THEME.colors.bg, padding: 16 }}>
        {/* رأس التقرير - مدمج وبدون فراغات */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF7F2 100%)',
          padding: 18, borderRadius: 12, marginBottom: 12,
          border: `1px solid ${THEME.colors.border}`,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ flexShrink: 0 }}>
            <Logo height={56} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: THEME.colors.primary, marginBottom: 4 }}>
              تقرير المتابعة اليومي
            </h1>
            <div style={{ fontSize: 12, color: THEME.colors.textSecondary, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} color={THEME.colors.accent} />
                {dateInfo?.label}
              </span>
              {gregorianDate && (
                <>
                  <span style={{ color: THEME.colors.textTertiary }}>·</span>
                  <span>{formatGregorianDate(gregorianDate)}</span>
                  <span style={{ color: THEME.colors.textTertiary }}>·</span>
                  <span>{getDayName(gregorianDate)}</span>
                </>
              )}
            </div>
            {dateInfo?.special && (
              <div style={{ fontSize: 11, color: THEME.colors.accent, fontWeight: 700, marginTop: 4 }}>
                ★ {dateInfo.special}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <User size={12} color={THEME.colors.accent} />
              {user.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Building2 size={12} color={THEME.colors.primary} />
              {company?.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: user.section === 'رجال' ? THEME.colors.info : '#D96E8A',
                display: 'inline-block',
              }} />
              قسم {user.section}
            </div>
          </div>
        </div>

        {/* رسالة لو لا توجد تعبئة */}
        {stats.filledCriteria === 0 && (
          <Card padding={24} style={{ textAlign: 'center', marginBottom: 14 }}>
            <Info size={36} color={THEME.colors.textTertiary} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 14, fontWeight: 700 }}>لم تبدأ التعبئة بعد</div>
            <div style={{ fontSize: 12, color: THEME.colors.textTertiary, marginTop: 4 }}>
              ابدأ بإدخال التقييمات ثم عُد لإصدار التقرير
            </div>
          </Card>
        )}

        {/* عرض الأقسام بالترتيب */}
        {sortedSections.map(s => renderSection(s.id))}

        {/* تذييل */}
        <div style={{
          background: '#fff', padding: 10, borderRadius: 8,
          textAlign: 'center', border: `1px solid ${THEME.colors.border}`,
          fontSize: 10, color: THEME.colors.textTertiary,
        }}>
          إصدار التقرير: {new Date().toLocaleDateString('ar-SA')} — {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          · شركة إثراء التجربة — موسم 1447هـ
        </div>
      </div>
    </div>
  );
}
