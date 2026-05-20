import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ListChecks, ChevronLeft, ChevronRight, Calendar, AlertCircle,
  CheckCircle2, XCircle, Save, FileText, Eye, Clock, Loader2,
  Truck, ShieldCheck, Utensils, Building2, AlertTriangle, Edit3,
} from 'lucide-react';

import { Button } from './Button.jsx';
import { Card, Badge } from './Card.jsx';
import { THEME } from '../data/theme.js';
import * as cApi from '../data/contractorsApi.js';

// =================================================================
// الصفحة الرئيسية لشاشة المراقب
// =================================================================
export function MonitorPage({ user, companies, toast }) {
  const [view, setView] = useState('home');  // home | session
  const [activeSession, setActiveSession] = useState(null);
  const [activeChecklist, setActiveChecklist] = useState(null);
  const [activeDateId, setActiveDateId] = useState(null);

  // معلومات المراقب
  const domainId = user.contractor_scope_domain || user.contractorScopeDomain;
  const companyId = user.contractor_company_id || user.contractorCompanyId;
  const company = companies.find(c => c.id === companyId);

  const domainInfo = {
    food: { name: 'الإعاشة', color: '#E85D24', icon: Utensils },
    transport: { name: 'النقل', color: '#185FA5', icon: Truck },
    security: { name: 'الحراسات', color: '#27500A', icon: ShieldCheck },
  }[domainId] || { name: 'غير محدد', color: THEME.colors.textTertiary, icon: ListChecks };

  if (!domainId || !companyId) {
    return (
      <Card padding={20}>
        <div style={{ textAlign: 'center', padding: 30 }}>
          <AlertCircle size={40} color={THEME.colors.danger} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>إعدادات الحساب ناقصة</h3>
          <p style={{ fontSize: 13, color: THEME.colors.textSecondary, lineHeight: 1.7 }}>
            حسابك يحتاج إلى تعيين <strong>الشركة المُراقَبة</strong> و<strong>المجال</strong>.
            <br />
            الرجاء التواصل مع مدير النظام.
          </p>
        </div>
      </Card>
    );
  }

  const openSession = (checklist, dateId) => {
    setActiveChecklist(checklist);
    setActiveDateId(dateId);
    setView('session');
  };

  const closeSession = () => {
    setView('home');
    setActiveSession(null);
    setActiveChecklist(null);
  };

  if (view === 'session') {
    return <SessionFillPage
      user={user}
      companyId={companyId}
      domainId={domainId}
      company={company}
      domainInfo={domainInfo}
      checklist={activeChecklist}
      dateId={activeDateId}
      onBack={closeSession}
      toast={toast}
    />;
  }

  return <MonitorHome
    user={user}
    company={company}
    domainId={domainId}
    domainInfo={domainInfo}
    onOpenSession={openSession}
    toast={toast}
  />;
}

// =================================================================
// الصفحة الرئيسية: ترحيب + اختيار اليوم والقائمة
// =================================================================
function MonitorHome({ user, company, domainId, domainInfo, onOpenSession, toast }) {
  const [checklists, setChecklists] = useState([]);
  const [selectedDateId, setSelectedDateId] = useState('1');
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cl, recents] = await Promise.all([
          cApi.getChecklists(domainId),
          cApi.getMonitorSessions(user.id, 10),
        ]);
        setChecklists(cl);
        setRecentSessions(recents);
      } catch (err) {
        console.error(err);
        toast.show('فشل تحميل البيانات', 'error');
      } finally { setLoading(false); }
    })();
  }, [domainId, user.id]);

  if (loading) {
    return <Card padding={40} style={{ textAlign: 'center' }}>جاري التحميل...</Card>;
  }

  const Icon = domainInfo.icon;
  const dateIds = Array.from({ length: 13 }, (_, i) => String(i + 1));

  // تصنيف القوائم حسب المرحلة
  const preChecklists = checklists.filter(c => c.phase_id === 'pre');
  const dailyChecklists = checklists.filter(c => c.phase_id === 'daily');
  const closingChecklists = checklists.filter(c => c.phase_id === 'closing');

  return (
    <div>
      {/* رأس مع معلومات المراقب */}
      <Card padding={18} style={{
        marginBottom: 14,
        background: `linear-gradient(135deg, ${domainInfo.color} 0%, ${darken(domainInfo.color)} 100%)`,
        border: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={26} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>مرحباً</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{user.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.85)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ListChecks size={12} /> مراقب {domainInfo.name}
              </span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={12} /> {company?.name || 'شركة غير محددة'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* اختيار اليوم */}
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Calendar size={16} color={domainInfo.color} />
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>اختر اليوم (ذو الحجة)</h3>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {dateIds.map(id => {
            const active = selectedDateId === id;
            return (
              <button key={id} onClick={() => setSelectedDateId(id)}
                style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: active ? domainInfo.color : '#fff',
                  color: active ? '#fff' : THEME.colors.text,
                  border: `1.5px solid ${active ? domainInfo.color : THEME.colors.border}`,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}>
                {id}
              </button>
            );
          })}
        </div>
      </Card>

      {/* القوائم اليومية - الأكثر استخداماً */}
      {dailyChecklists.length > 0 && (
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px dashed ${THEME.colors.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>📋 القوائم اليومية</span>
            <Badge color="info" style={{ fontSize: 10 }}>اليوم {selectedDateId}</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dailyChecklists.map(cl => (
              <ChecklistButton key={cl.id} checklist={cl} color={domainInfo.color}
                onClick={() => onOpenSession(cl, selectedDateId)} />
            ))}
          </div>
        </Card>
      )}

      {/* القوائم الأولية */}
      {preChecklists.length > 0 && (
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px dashed ${THEME.colors.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>📌 القوائم الأولية (مرة واحدة قبل الموسم)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {preChecklists.map(cl => (
              <ChecklistButton key={cl.id} checklist={cl} color={domainInfo.color}
                onClick={() => onOpenSession(cl, null)} />
            ))}
          </div>
        </Card>
      )}

      {/* القوائم الختامية */}
      {closingChecklists.length > 0 && (
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px dashed ${THEME.colors.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>🏁 القوائم النهائية</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {closingChecklists.map(cl => (
              <ChecklistButton key={cl.id} checklist={cl} color={domainInfo.color}
                onClick={() => onOpenSession(cl, selectedDateId)} />
            ))}
          </div>
        </Card>
      )}

      {/* سجل الجلسات السابقة */}
      {recentSessions.length > 0 && (
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px dashed ${THEME.colors.border}` }}>
            <Clock size={14} color={THEME.colors.textSecondary} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>الجلسات الأخيرة</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentSessions.slice(0, 5).map(s => (
              <div key={s.id} style={{
                padding: 10, background: THEME.colors.bgSecondary, borderRadius: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 11, color: THEME.colors.textSecondary,
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: THEME.colors.text }}>{s.checklist?.name_ar || 'قائمة'}</div>
                  <div style={{ fontSize: 10, color: THEME.colors.textTertiary, marginTop: 2 }}>
                    {s.date_id ? `اليوم ${s.date_id}` : 'بدون يوم'} • {new Date(s.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <Badge color={s.status === 'submitted' ? 'success' : s.status === 'approved' ? 'info' : 'warning'} style={{ fontSize: 10 }}>
                  {s.status === 'submitted' ? 'مُرسلة' : s.status === 'approved' ? 'مُعتمدة' : 'قيد الإكمال'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// =================================================================
// زر اختيار قائمة
// =================================================================
function ChecklistButton({ checklist, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        width: '100%', padding: '12px 14px',
        background: '#fff', border: `1.5px solid ${color}33`, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        textAlign: 'right',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = color; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = `${color}33`; }}>
      <ChevronLeft size={18} color={color} />
      <div style={{ flex: 1, marginRight: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{checklist.name_ar}</div>
        {checklist.description && (
          <div style={{ fontSize: 10, color: THEME.colors.textTertiary }}>{checklist.description}</div>
        )}
      </div>
    </button>
  );
}

// =================================================================
// صفحة تعبئة جلسة (المعايير)
// =================================================================
function SessionFillPage({ user, companyId, domainId, company, domainInfo, checklist, dateId, onBack, toast }) {
  const [session, setSession] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [evaluations, setEvaluations] = useState({});  // criterionId -> evaluation
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(new Set());  // criteria currently saving
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // 1) إنشاء أو جلب الجلسة
        const s = await cApi.getOrCreateSession({
          companyId, domainId, checklistId: checklist.id, dateId, monitorId: user.id,
        });
        setSession(s);

        // 2) جلب المعايير
        const c = await cApi.getChecklistCriteria(checklist.id, companyId);
        setCriteria(c);

        // 3) جلب التعبئات الموجودة
        const evals = await cApi.getSessionEvaluations(s.id);
        const map = {};
        evals.forEach(e => { map[e.criterion_id] = e; });
        setEvaluations(map);
      } catch (err) {
        console.error(err);
        toast.show('فشل فتح الجلسة', 'error');
      } finally { setLoading(false); }
    })();
  }, []);

  // حفظ تعبئة فوري
  const handleSave = async (criterionId, status, note = null) => {
    if (!session) return;
    setSaving(prev => new Set([...prev, criterionId]));
    try {
      const saved = await cApi.saveEvaluation({
        sessionId: session.id,
        criterionId,
        status,
        note,
        filledBy: user.id,
      });
      setEvaluations(prev => ({ ...prev, [criterionId]: saved }));
    } catch (err) {
      console.error(err);
      toast.show('فشل الحفظ', 'error');
    } finally {
      setSaving(prev => {
        const next = new Set(prev);
        next.delete(criterionId);
        return next;
      });
    }
  };

  const handleNoteChange = async (criterionId, note) => {
    const existing = evaluations[criterionId];
    if (!existing) return;
    // تحديث محلي فوري + حفظ debounced
    setEvaluations(prev => ({ ...prev, [criterionId]: { ...existing, note } }));
  };

  const handleNoteBlur = async (criterionId) => {
    const existing = evaluations[criterionId];
    if (!existing) return;
    await handleSave(criterionId, existing.status, existing.note);
  };

  const handleSubmit = async () => {
    // تحقق أن كل المعايير معبأة
    const unfilled = criteria.filter(c => !evaluations[c.id]?.status);
    if (unfilled.length > 0) {
      toast.show(`لم يتم تعبئة ${unfilled.length} معيار(ات) بعد`, 'warning');
      return;
    }
    // تحقق من الملاحظات الإلزامية
    const missingNotes = criteria.filter(c => {
      const e = evaluations[c.id];
      if (!e) return false;
      if (c.note_required === 'always' && !e.note?.trim()) return true;
      if (c.note_required === 'on_violation' && e.status === 'violation' && !e.note?.trim()) return true;
      return false;
    });
    if (missingNotes.length > 0) {
      toast.show(`${missingNotes.length} معيار(ات) تحتاج ملاحظة`, 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await cApi.submitSession(session.id);
      toast.show('تم إرسال التقرير بنجاح ✓', 'success');
      onBack();
    } catch (err) {
      console.error(err);
      toast.show('فشل الإرسال', 'error');
    } finally { setSubmitting(false); }
  };

  if (loading) return <Card padding={40} style={{ textAlign: 'center' }}>جاري التحميل...</Card>;

  const compliantCount = Object.values(evaluations).filter(e => e.status === 'compliant').length;
  const violationCount = Object.values(evaluations).filter(e => e.status === 'violation').length;
  const totalFilled = compliantCount + violationCount;
  const progress = criteria.length > 0 ? Math.round((totalFilled / criteria.length) * 100) : 0;
  const isComplete = totalFilled === criteria.length;
  const isSubmitted = session?.status === 'submitted' || session?.status === 'approved';

  return (
    <div>
      {/* رأس الجلسة */}
      <Card padding={14} style={{ marginBottom: 14, borderRight: `4px solid ${domainInfo.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <Button variant="outline" icon={ChevronRight} onClick={onBack} size="sm">رجوع</Button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{checklist.name_ar}</div>
            <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 2 }}>
              {company?.name} • {dateId ? `اليوم ${dateId}` : 'بدون تاريخ'}
            </div>
          </div>
          {isSubmitted && <Badge color="success">مُرسلة</Badge>}
        </div>

        {/* شريط التقدم */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: THEME.colors.textSecondary, fontWeight: 600 }}>
              التقدم: {totalFilled} / {criteria.length}
            </span>
            <span style={{ fontSize: 11, color: domainInfo.color, fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ height: 8, background: THEME.colors.bgSecondary, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`, background: domainInfo.color,
              transition: 'width 0.3s ease', borderRadius: 4,
            }} />
          </div>
        </div>

        {/* إحصاءات سريعة */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1, padding: '6px 10px', background: THEME.colors.successSoft, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: THEME.colors.success }}>{compliantCount}</div>
            <div style={{ fontSize: 10, color: THEME.colors.success }}>مطابق</div>
          </div>
          <div style={{ flex: 1, padding: '6px 10px', background: THEME.colors.dangerSoft, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: THEME.colors.danger }}>{violationCount}</div>
            <div style={{ fontSize: 10, color: THEME.colors.danger }}>مخالف</div>
          </div>
          <div style={{ flex: 1, padding: '6px 10px', background: THEME.colors.bgSecondary, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: THEME.colors.textTertiary }}>{criteria.length - totalFilled}</div>
            <div style={{ fontSize: 10, color: THEME.colors.textTertiary }}>متبقي</div>
          </div>
        </div>
      </Card>

      {/* بنود المعايير */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 80 }}>
        {criteria.map((cr, idx) => (
          <CriterionRow
            key={cr.id}
            index={idx + 1}
            criterion={cr}
            evaluation={evaluations[cr.id]}
            saving={saving.has(cr.id)}
            disabled={isSubmitted}
            domainColor={domainInfo.color}
            onSave={(status) => handleSave(cr.id, status, evaluations[cr.id]?.note)}
            onNoteChange={(note) => handleNoteChange(cr.id, note)}
            onNoteBlur={() => handleNoteBlur(cr.id)}
          />
        ))}
      </div>

      {/* زر الإكمال - ثابت في الأسفل */}
      {!isSubmitted && (
        <div style={{
          position: 'sticky', bottom: 12, marginTop: 16,
          background: '#fff', padding: 12, borderRadius: 12,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', border: `1px solid ${THEME.colors.border}`,
        }}>
          <Button
            variant="primary"
            icon={isComplete ? CheckCircle2 : AlertCircle}
            onClick={handleSubmit}
            disabled={!isComplete || submitting}
            style={{
              width: '100%',
              background: isComplete ? THEME.colors.success : THEME.colors.textTertiary,
              borderColor: isComplete ? THEME.colors.success : THEME.colors.textTertiary,
            }}>
            {submitting ? 'جاري الإرسال...'
              : isComplete ? `إكمال وإرسال التقرير (${criteria.length}/${criteria.length})`
              : `أكمل المعايير المتبقية (${criteria.length - totalFilled} متبقي)`}
          </Button>
        </div>
      )}
    </div>
  );
}

// =================================================================
// سطر معيار واحد
// =================================================================
function CriterionRow({ index, criterion, evaluation, saving, disabled, domainColor, onSave, onNoteChange, onNoteBlur }) {
  const status = evaluation?.status;
  const note = evaluation?.note || '';
  const needsNoteForViolation = criterion.note_required === 'on_violation' && status === 'violation' && !note.trim();
  const needsNoteAlways = criterion.note_required === 'always' && !note.trim();
  const noteError = needsNoteForViolation || needsNoteAlways;

  const isCompliance = criterion.answer_type === 'compliance' || criterion.answer_type === 'yesno' || criterion.answer_type === 'checkbox';

  return (
    <Card padding={12} style={{
      borderRight: criterion.is_critical ? `4px solid ${THEME.colors.danger}` : `4px solid ${status === 'compliant' ? THEME.colors.success : status === 'violation' ? THEME.colors.danger : 'transparent'}`,
      background: criterion.is_critical ? '#FFF8F8' : '#fff',
      position: 'relative',
    }}>
      {/* عنوان المعيار */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: domainColor, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {index}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
            {criterion.name_ar}
            {criterion.is_critical && (
              <span style={{
                marginRight: 8, fontSize: 10, fontWeight: 700,
                color: THEME.colors.danger,
                background: THEME.colors.dangerSoft,
                padding: '2px 6px', borderRadius: 8,
                display: 'inline-flex', alignItems: 'center', gap: 3,
                verticalAlign: 'middle',
              }}>
                <AlertTriangle size={10} /> حرج
              </span>
            )}
          </div>
          {criterion.description && (
            <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 4 }}>
              {criterion.description}
            </div>
          )}
          {criterion.required_qty && (
            <div style={{ fontSize: 10, color: THEME.colors.info, marginTop: 4, fontWeight: 600 }}>
              المطلوب: {criterion.required_qty} {criterion.qty_unit}
            </div>
          )}
        </div>
        {saving && <Loader2 size={14} color={domainColor} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
      </div>

      {/* أزرار الإجابة */}
      {isCompliance && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={disabled}
            onClick={() => onSave('compliant')}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 8,
              background: status === 'compliant' ? THEME.colors.success : '#fff',
              color: status === 'compliant' ? '#fff' : THEME.colors.success,
              border: `1.5px solid ${THEME.colors.success}`,
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
              opacity: disabled ? 0.6 : 1,
            }}>
            <CheckCircle2 size={16} />
            {criterion.answer_type === 'yesno' ? 'نعم' : criterion.answer_type === 'checkbox' ? 'تم' : 'مطابق'}
          </button>
          <button
            disabled={disabled}
            onClick={() => onSave('violation')}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 8,
              background: status === 'violation' ? THEME.colors.danger : '#fff',
              color: status === 'violation' ? '#fff' : THEME.colors.danger,
              border: `1.5px solid ${THEME.colors.danger}`,
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
              opacity: disabled ? 0.6 : 1,
            }}>
            <XCircle size={16} />
            {criterion.answer_type === 'yesno' ? 'لا' : criterion.answer_type === 'checkbox' ? 'لم يتم' : 'مخالف'}
          </button>
          <button
            disabled={disabled}
            onClick={() => onSave('na')}
            style={{
              padding: '10px 14px', borderRadius: 8,
              background: status === 'na' ? THEME.colors.textTertiary : '#fff',
              color: status === 'na' ? '#fff' : THEME.colors.textTertiary,
              border: `1.5px solid ${THEME.colors.textTertiary}`,
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              transition: 'all 0.15s',
              opacity: disabled ? 0.6 : 1,
            }}>
            غير منطبق
          </button>
        </div>
      )}

      {/* ملاحظة */}
      {(status === 'violation' || criterion.note_required === 'always' || note) && (
        <div style={{ marginTop: 10 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 4 }}>
            ملاحظة {noteError && <span style={{ color: THEME.colors.danger }}>(إلزامية)</span>}
          </label>
          <textarea
            disabled={disabled}
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            onBlur={onNoteBlur}
            rows={2}
            placeholder={status === 'violation' ? 'اشرح تفاصيل المخالفة...' : 'ملاحظة (اختياري)...'}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 6,
              border: `1.5px solid ${noteError ? THEME.colors.danger : THEME.colors.border}`,
              fontSize: 12, fontFamily: 'inherit', direction: 'rtl',
              outline: 'none', resize: 'vertical',
              opacity: disabled ? 0.6 : 1,
            }}/>
        </div>
      )}
    </Card>
  );
}

// =================================================================
// مساعدات
// =================================================================
function darken(hex, amount = 0.15) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
