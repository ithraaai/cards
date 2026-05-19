import { useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, MessageSquare, Award, Activity, ThumbsUp,
  ChevronRight, Calendar, Building2, User, Eye, FileDown, FileImage,
  PieChart as PieChartIcon, Target, BarChart3, Info, ClipboardCheck,
} from 'lucide-react';

import { Button } from './Button.jsx';
import { Card, Badge } from './Card.jsx';
import { Logo } from './Logo.jsx';
import { DATES, SCALE_LABELS, getGregorianDateForHijriDay, formatGregorianDate, getDayName } from '../data/seed.js';
import { THEME } from '../data/theme.js';
import { shouldShowCriterion, isTeamActiveOnDate } from '../data/teams.js';

// =================================================================
// صفحة تقرير اليوم لمدخل البيانات
// =================================================================
export function EntryReportPage({ user, company, teams, settings, evaluations, activeDate, activeSession, onBack, toast }) {
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);

  const dateInfo = DATES.find(d => d.id === activeDate);
  const gregorianDate = getGregorianDateForHijriDay(activeDate, settings.season_start_date);
  const sessionsMode = activeSession !== null && activeSession !== undefined;

  // خريطة المعايير
  const criteriaById = useMemo(() => {
    const map = {};
    teams.forEach(t => t.criteria.forEach(c => { map[c.id] = { ...c, teamName: t.name, teamId: t.id }; }));
    return map;
  }, [teams]);

  // التقييمات الخاصة بهذا المدخل في هذا اليوم (والجلسة إن كانت الجلستان مفعّلتين)
  const myEvals = useMemo(() => {
    return evaluations.filter(e => {
      if (e.company_id !== user.companyId) return false;
      if (e.section !== user.section) return false;
      if (e.date_id !== activeDate) return false;
      if (sessionsMode && (e.session || 1) !== activeSession) return false;
      return true;
    });
  }, [evaluations, user, activeDate, sessionsMode, activeSession]);

  // إحصاءات شاملة
  const stats = useMemo(() => {
    let totalCriteria = 0, filledCriteria = 0;
    let yesCount = 0, noCount = 0, naCount = 0;
    let totalScale = 0, scaleCount = 0;
    let negatives = 0, notesCount = 0;
    const scaleDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const teamStats = {};

    teams.forEach(t => {
      if (!isTeamActiveOnDate(t, activeDate)) return;
      const visible = t.criteria.filter(c => shouldShowCriterion(c, t, activeDate, user.section));
      teamStats[t.id] = {
        name: t.name, total: visible.length, filled: 0, negatives: 0, notes: 0,
      };
      visible.forEach(c => {
        totalCriteria++;
        const e = myEvals.find(ev => ev.criterion_id === c.id);
        if (e?.value !== undefined && e?.value !== null && e?.value !== '') {
          filledCriteria++;
          teamStats[t.id].filled++;
          if (e.note?.trim()) { notesCount++; teamStats[t.id].notes++; }

          if (e.value === 'yes') yesCount++;
          else if (e.value === 'no') { noCount++; negatives++; teamStats[t.id].negatives++; }
          else if (e.value === 'na') naCount++;
          else {
            const num = parseFloat(e.value);
            if (!isNaN(num) && c.type === 'scale' && num >= 1 && num <= 5) {
              scaleDistribution[num]++;
              totalScale += num;
              scaleCount++;
              if (num < 3) { negatives++; teamStats[t.id].negatives++; }
            }
          }
        }
      });
    });

    const completion = totalCriteria > 0 ? Math.round((filledCriteria / totalCriteria) * 100) : 0;
    const avgScale = scaleCount > 0 ? (totalScale / scaleCount) : 0;
    const yesNoTotal = yesCount + noCount;
    const complianceRate = yesNoTotal > 0 ? Math.round((yesCount / yesNoTotal) * 100) : 0;

    return {
      totalCriteria, filledCriteria, completion,
      yesCount, noCount, naCount,
      avgScale: avgScale.toFixed(1), scaleCount,
      complianceRate, negatives, notesCount,
      scaleDistribution,
      teamStats: Object.values(teamStats).filter(t => t.total > 0),
    };
  }, [teams, myEvals, activeDate]);

  // المعايير ذات التقييم السلبي مع الملاحظات
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
          ...e, criterion,
          isNegative, isNA,
          displayValue: e.value === 'no' ? 'لا' : e.value === 'na' ? 'غير منطبق' : `تقييم ${num}`,
        });
      }
    });
    return result;
  }, [myEvals, criteriaById]);

  // توزيع التقييمات (للرسم الدائري)
  const scaleData = [
    { name: 'ممتاز', value: stats.scaleDistribution[5], color: SCALE_LABELS[5].color },
    { name: 'جيد جداً', value: stats.scaleDistribution[4], color: SCALE_LABELS[4].color },
    { name: 'جيد', value: stats.scaleDistribution[3], color: SCALE_LABELS[3].color },
    { name: 'ضعيف', value: stats.scaleDistribution[2], color: SCALE_LABELS[2].color },
    { name: 'ضعيف جداً', value: stats.scaleDistribution[1], color: SCALE_LABELS[1].color },
  ].filter(s => s.value > 0);

  // نسبة الإجابات (نعم/لا/غير منطبق)
  const yesNoData = [];
  if (stats.yesCount > 0) yesNoData.push({ name: 'نعم', value: stats.yesCount, color: THEME.colors.success });
  if (stats.noCount > 0) yesNoData.push({ name: 'لا', value: stats.noCount, color: THEME.colors.danger });
  if (stats.naCount > 0) yesNoData.push({ name: 'غير منطبق', value: stats.naCount, color: THEME.colors.textTertiary });

  const downloadPNG = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#FAF7F2', scale: 2, useCORS: true, logging: false,
      });
      const link = document.createElement('a');
      link.download = `تقرير-${user.name}-${dateInfo?.label}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.show('تم تنزيل الصورة', 'success');
    } catch (err) { console.error(err); toast.show('فشل تنزيل الصورة', 'error'); }
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
      pdf.save(`تقرير-${user.name}-${dateInfo?.label}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.show('تم تنزيل PDF', 'success');
    } catch (err) { console.error(err); toast.show('فشل تنزيل PDF', 'error'); }
    finally { setGenerating(false); }
  };

  return (
    <div>
      {/* شريط الأزرار */}
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <Button variant="outline" icon={ChevronRight} onClick={onBack}>رجوع للإدخال</Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" icon={FileImage} onClick={downloadPNG} disabled={generating}>
              {generating ? '...' : 'تنزيل صورة'}
            </Button>
            <Button variant="primary" icon={FileDown} onClick={downloadPDF} disabled={generating}>
              {generating ? '...' : 'تنزيل PDF'}
            </Button>
          </div>
        </div>
      </Card>

      {/* محتوى التقرير */}
      <div ref={reportRef} style={{ background: THEME.colors.bg, padding: 20 }}>
        {/* رأس التقرير */}
        <div style={{
          background: '#fff', padding: 28, borderRadius: 12, marginBottom: 16,
          textAlign: 'center', border: `1px solid ${THEME.colors.border}`,
        }}>
          <Logo height={70} />
          <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 14, color: THEME.colors.primary }}>
            تقرير المتابعة اليومي
          </h1>
          {sessionsMode && (
            <div style={{
              display: 'inline-block', marginTop: 8, padding: '4px 12px',
              background: THEME.colors.info, color: '#fff', borderRadius: 20,
              fontSize: 12, fontWeight: 700,
            }}>
              {activeSession === 1 ? '🌅 الجلسة الصباحية' : '🌆 الجلسة المسائية'}
            </div>
          )}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
            padding: '8px 16px', background: THEME.colors.bgSecondary, borderRadius: 30,
            fontSize: 13, fontWeight: 600, color: THEME.colors.primary,
          }}>
            <Calendar size={16} color={THEME.colors.accent} />
            {dateInfo?.label}
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
            <div style={{ marginTop: 8, fontSize: 12, color: THEME.colors.accent, fontWeight: 700 }}>
              {dateInfo.special}
            </div>
          )}
        </div>

        {/* معلومات المدخل والشركة */}
        <Card padding={18} style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: THEME.colors.accent,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 20, flexShrink: 0,
              }}>{user.name.charAt(0)}</div>
              <div>
                <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginBottom: 2 }}>مدخل البيانات</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{user.name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: THEME.colors.primary,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}><Building2 size={22} /></div>
              <div>
                <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginBottom: 2 }}>الشركة</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{company?.name || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: user.section === 'رجال' ? THEME.colors.info : '#D96E8A',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 16, fontWeight: 800,
              }}>{user.section === 'رجال' ? 'ر' : 'ن'}</div>
              <div>
                <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginBottom: 2 }}>القسم</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>قسم {user.section}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* المؤشرات الرئيسية */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color={THEME.colors.accent} />
            مؤشرات الأداء
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            <MiniKPI icon={ClipboardCheck} label="نسبة الإنجاز" value={stats.completion} unit="%" color="success" />
            <MiniKPI icon={Activity} label="المعايير المعبّأة" value={`${stats.filledCriteria}/${stats.totalCriteria}`} color="info" />
            <MiniKPI icon={ThumbsUp} label="نسبة الامتثال" value={stats.complianceRate} unit="%" color="success" />
            <MiniKPI icon={Award} label="متوسط التقييم" value={stats.avgScale} unit="/5" color="accent" />
            <MiniKPI icon={AlertTriangle} label="ملاحظات سلبية" value={stats.negatives} color="warning" />
            <MiniKPI icon={MessageSquare} label="ملاحظات مكتوبة" value={stats.notesCount} color="purple" />
          </div>
        </div>

        {/* إنجاز كل فريق */}
        {stats.teamStats.length > 0 && (
          <Card padding={20} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Target size={20} color={THEME.colors.primary} />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>إنجاز كل فريق</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.teamStats.map((t, i) => {
                const pct = t.total > 0 ? Math.round((t.filled / t.total) * 100) : 0;
                return (
                  <div key={i} style={{
                    padding: '10px 14px', background: THEME.colors.bgSecondary,
                    borderRadius: THEME.radius.md,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {t.negatives > 0 && <Badge color="danger" style={{ fontSize: 10 }}>{t.negatives} سلبي</Badge>}
                        {t.notes > 0 && <Badge color="info" style={{ fontSize: 10 }}>{t.notes} ملاحظة</Badge>}
                        <span style={{
                          fontSize: 14, fontWeight: 800,
                          color: pct === 100 ? THEME.colors.success : pct >= 50 ? THEME.colors.accent : THEME.colors.warning,
                        }}>{t.filled}/{t.total} ({pct}%)</span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: '#fff', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: pct === 100 ? THEME.colors.success : pct >= 50 ? THEME.colors.accent : THEME.colors.warning,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* الرسوم البيانية */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
          {/* رسم نعم/لا */}
          {yesNoData.length > 0 && (
            <Card padding={20}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <PieChartIcon size={18} color={THEME.colors.info} />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>إجابات نعم/لا</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={yesNoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} label>
                    {yesNoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {yesNoData.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                    <span style={{ flex: 1 }}>{s.name}</span>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* رسم تقييم 5 */}
          {scaleData.length > 0 && (
            <Card padding={20}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Award size={18} color={THEME.colors.accent} />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>توزيع التقييمات</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={scaleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45} label>
                    {scaleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {scaleData.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                    <span style={{ flex: 1 }}>{s.name}</span>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* الفرق - رسم بياني عمودي */}
        {stats.teamStats.length > 0 && (
          <Card padding={20} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <BarChart3 size={18} color={THEME.colors.primary} />
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>مقارنة إنجاز الفرق</h3>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(200, stats.teamStats.length * 38)}>
              <BarChart data={stats.teamStats.map(t => ({
                name: t.name.replace('فريق ', '').replace('الفريق ', ''),
                pct: t.total > 0 ? Math.round((t.filled / t.total) * 100) : 0,
              }))} layout="vertical" margin={{ right: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `${v}%`} contentStyle={{ direction: 'rtl', borderRadius: 8 }} />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                  {stats.teamStats.map((t, i) => {
                    const pct = t.total > 0 ? (t.filled / t.total) * 100 : 0;
                    return <Cell key={i} fill={pct === 100 ? THEME.colors.success : pct >= 50 ? THEME.colors.accent : THEME.colors.warning} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* المعايير التي فيها مشاكل */}
        {problematicCriteria.length > 0 ? (
          <Card padding={20} style={{ marginBottom: 16, background: '#FFF8F0', border: `1.5px solid ${THEME.colors.warning}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AlertTriangle size={20} color={THEME.colors.warning} />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>المعايير التي تحتاج انتباه ({problematicCriteria.length})</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {problematicCriteria.map((p, i) => (
                <div key={i} style={{
                  padding: 14, background: '#fff', borderRadius: THEME.radius.md,
                  borderRight: `4px solid ${p.isNA ? THEME.colors.textTertiary : THEME.colors.danger}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: THEME.colors.primary }}>
                        {p.criterion.name}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.colors.textTertiary }}>
                        {p.criterion.teamName}
                      </div>
                    </div>
                    <Badge color={p.isNA ? 'gray' : 'danger'} style={{ fontSize: 11, flexShrink: 0 }}>
                      {p.displayValue}
                    </Badge>
                  </div>
                  {p.note ? (
                    <div style={{
                      marginTop: 8, padding: '8px 10px',
                      background: THEME.colors.bgSecondary, borderRadius: 6,
                      fontSize: 12, color: THEME.colors.textSecondary, lineHeight: 1.6,
                      display: 'flex', gap: 6, alignItems: 'flex-start',
                    }}>
                      <MessageSquare size={13} color={THEME.colors.textTertiary} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{p.note}</span>
                    </div>
                  ) : (
                    <div style={{
                      marginTop: 8, padding: '6px 10px',
                      background: THEME.colors.warningSoft, borderRadius: 6,
                      fontSize: 11, color: THEME.colors.warning, fontWeight: 600,
                      display: 'flex', gap: 6, alignItems: 'center',
                    }}>
                      <Info size={13} />
                      <span>لم تُكتب ملاحظة لهذا المعيار</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : stats.filledCriteria > 0 && (
          <Card padding={20} style={{ marginBottom: 16, background: THEME.colors.successSoft, textAlign: 'center' }}>
            <CheckCircle2 size={36} color={THEME.colors.success} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: THEME.colors.success }}>
              ممتاز! لا توجد ملاحظات سلبية اليوم
            </div>
            <div style={{ fontSize: 12, color: THEME.colors.success, marginTop: 4, opacity: 0.85 }}>
              كل المعايير المعبّأة بتقييم إيجابي
            </div>
          </Card>
        )}

        {/* رسالة عند عدم وجود تعبئة */}
        {stats.filledCriteria === 0 && (
          <Card padding={30} style={{ textAlign: 'center', marginBottom: 16 }}>
            <Info size={40} color={THEME.colors.textTertiary} style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>لم تبدأ التعبئة بعد</div>
            <div style={{ fontSize: 12, color: THEME.colors.textTertiary, marginTop: 4 }}>
              ابدأ بإدخال التقييمات ثم عُد لإصدار التقرير
            </div>
          </Card>
        )}

        {/* تذييل */}
        <div style={{
          background: '#fff', padding: 14, borderRadius: 10,
          textAlign: 'center', border: `1px solid ${THEME.colors.border}`,
          fontSize: 11, color: THEME.colors.textTertiary,
        }}>
          تاريخ إصدار التقرير: {new Date().toLocaleDateString('ar-SA')} — {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          <br />
          شركة إثراء التجربة — موسم 1447هـ
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ icon: Icon, label, value, unit, color = 'accent' }) {
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
    <div style={{
      background: '#fff', padding: 14, borderRadius: THEME.radius.md,
      border: `1px solid ${THEME.colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={c.fg} strokeWidth={2.4} />
        </div>
        <div style={{ fontSize: 11, color: THEME.colors.textSecondary, fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: c.fg, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: THEME.colors.textTertiary, fontWeight: 600 }}>{unit}</span>}
      </div>
    </div>
  );
}
