import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, ChevronLeft, ShieldCheck, Truck, Utensils,
  Info, ChevronRight, FileText, ListChecks, Activity,
  Plus, Edit2, Trash2, X, Save, AlertCircle, AlertTriangle,
  CheckCircle2, Filter,
} from 'lucide-react';

import { Button } from './Button.jsx';
import { Card, Badge } from './Card.jsx';
import { Input } from './Input.jsx';
import { THEME } from '../data/theme.js';
import * as cApi from '../data/contractorsApi.js';

// =================================================================
// الصفحة الرئيسية لوحدة المتعهدين (مبسطة)
// =================================================================
export function ContractorsModule({ user, companies, toast }) {
  const [view, setView] = useState('home'); // home, criteria
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        console.log('🔍 جاري تحميل المجالات...');
        const d = await cApi.getDomains();
        console.log('✅ المجالات المُحمَّلة:', d);
        if (!d || d.length === 0) {
          console.warn('⚠️ المصفوفة فارغة! تحقق من Supabase.');
          toast.show('لم يتم العثور على مجالات في قاعدة البيانات', 'warning');
        }
        setDomains(d || []);
      } catch (err) {
        console.error('❌ خطأ في تحميل المجالات:', err);
        toast.show('فشل تحميل المجالات: ' + (err.message || 'خطأ غير معروف'), 'error');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <Card padding={40} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: THEME.colors.textSecondary }}>جاري التحميل...</div>
      </Card>
    );
  }

  if (view === 'criteria') {
    return <CriteriaPage domains={domains} companies={companies} onBack={() => setView('home')} toast={toast} />;
  }
  if (view === 'violations') {
    return <ViolationsPage domains={domains} companies={companies} onBack={() => setView('home')} toast={toast} />;
  }
  if (view === 'dashboard') {
    return <ContractorsDashboard domains={domains} companies={companies} onBack={() => setView('home')} toast={toast} />;
  }

  return <ContractorsHome domains={domains} onSelectView={setView} />;
}

// =================================================================
// الصفحة الرئيسية - بطاقات تنقل
// =================================================================
function ContractorsHome({ domains, onSelectView }) {
  const domainIcon = (id) => {
    if (id === 'food') return Utensils;
    if (id === 'transport') return Truck;
    if (id === 'security') return ShieldCheck;
    return Briefcase;
  };

  return (
    <div>
      <Card padding={20} style={{
        marginBottom: 14,
        background: 'linear-gradient(135deg, #1B2D3E 0%, #2C4055 100%)',
        border: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(184,153,104,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Briefcase size={24} color="#B89968" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              وحدة متابعة عقود المتعهدين
            </h2>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              تقييم تنفيذ معايير الإعاشة والنقل والحراسات
            </div>
          </div>
        </div>
      </Card>

      {/* عرض المجالات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
        {domains.map(d => {
          const Icon = domainIcon(d.id);
          const color = d.id === 'food' ? '#E85D24' : d.id === 'transport' ? '#185FA5' : '#27500A';
          return (
            <div key={d.id} style={{
              background: '#fff', borderRadius: 12, padding: 14,
              border: `1.5px solid ${color}33`, textAlign: 'center',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <Icon size={22} color={color} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: color }}>{d.name_ar}</div>
            </div>
          );
        })}
      </div>

      {/* بطاقات التنقل */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <NavCard
          icon={ListChecks}
          title="القوائم والمعايير"
          desc="عرض وتعديل معايير المراقبة لكل مجال"
          color="#185FA5"
          onClick={() => onSelectView('criteria')}
        />
        <NavCard
          icon={Activity}
          title="لوحة قيادة المتعهدين"
          desc="نظرة شاملة على أداء جميع الشركات والمجالات"
          color="#27500A"
          onClick={() => onSelectView('dashboard')}
        />
        <NavCard
          icon={AlertCircle}
          title="سجل المخالفات والشواهد"
          desc="عرض وإدارة كل المخالفات المسجّلة + الإبلاغ"
          color="#A32D2D"
          onClick={() => onSelectView('violations')}
        />
      </div>

      {/* ملاحظة المرحلة */}
      <Card padding={14} style={{
        marginTop: 14,
        background: '#F0F7FF',
        border: `1.5px solid ${THEME.colors.info}33`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Info size={18} color={THEME.colors.info} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.info, marginBottom: 4 }}>
              ✓ الوحدة جاهزة بالكامل
            </div>
            <div style={{ fontSize: 12, color: THEME.colors.textSecondary, lineHeight: 1.7 }}>
              يمكن للمراقبين الآن تعبئة القوائم اليومية، تسجيل المخالفات بالشواهد،
              وإبلاغ المتعهدين. اللوحة تعرض الأداء الكامل لكل شركة في كل مجال.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// =================================================================
// مكوّن بطاقة التنقل
// =================================================================
function NavCard({ icon: Icon, title, desc, count, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        background: '#fff', borderRadius: 12, padding: 16,
        border: `1.5px solid ${color}33`, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, textAlign: 'right', fontFamily: 'inherit',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${color}22`; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={22} color={color} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 11, color: THEME.colors.textTertiary, lineHeight: 1.6 }}>{desc}</div>
        </div>
      </div>
      {count && (
        <div style={{
          display: 'inline-block', padding: '4px 10px', borderRadius: 10,
          background: `${color}15`, color: color, fontSize: 11, fontWeight: 700,
        }}>
          {count}
        </div>
      )}
    </button>
  );
}

// =================================================================
// صفحة القوائم والمعايير
// =================================================================
function CriteriaPage({ domains, companies, onBack, toast }) {
  const [phases, setPhases] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('food');
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const [p, c] = await Promise.all([cApi.getPhases(), cApi.getChecklists()]);
      setPhases(p);
      setChecklists(c);
    } catch (err) {
      console.error(err);
      toast.show('فشل التحميل', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  // عند اختيار قائمة، نحمّل معاييرها
  useEffect(() => {
    if (!selectedChecklist) { setCriteria([]); return; }
    (async () => {
      try {
        const list = await cApi.getChecklistCriteria(selectedChecklist.id);
        setCriteria(list);
      } catch (err) { console.error(err); }
    })();
  }, [selectedChecklist]);

  const domainChecklists = useMemo(() => {
    return checklists.filter(c => c.domain_id === selectedDomain);
  }, [checklists, selectedDomain]);

  const handleSaveCriterion = async (data) => {
    setSaving(true);
    try {
      if (data.id) await cApi.updateCriterion(data.id, data);
      else await cApi.createCriterion({ ...data, checklistId: selectedChecklist.id });
      // إعادة تحميل المعايير
      const list = await cApi.getChecklistCriteria(selectedChecklist.id);
      setCriteria(list);
      setEditing(null);
      toast.show('تم الحفظ', 'success');
    } catch (err) {
      console.error(err);
      toast.show('فشل الحفظ', 'error');
    } finally { setSaving(false); }
  };

  const handleDeleteCriterion = async (id) => {
    if (!confirm('هل تريد حذف هذا المعيار؟')) return;
    try {
      await cApi.deleteCriterion(id);
      const list = await cApi.getChecklistCriteria(selectedChecklist.id);
      setCriteria(list);
      toast.show('تم الحذف', 'success');
    } catch (err) { toast.show('فشل الحذف', 'error'); }
  };

  if (loading) return <Card padding={40} style={{ textAlign: 'center' }}>جاري التحميل...</Card>;

  const domainColor = (id) => id === 'food' ? '#E85D24' : id === 'transport' ? '#185FA5' : '#27500A';
  const domainIcon = (id) => id === 'food' ? Utensils : id === 'transport' ? Truck : ShieldCheck;

  return (
    <div>
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="outline" icon={ChevronLeft} onClick={onBack} size="sm">رجوع</Button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListChecks size={20} color={THEME.colors.info} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>القوائم والمعايير</h2>
          </div>
        </div>
      </Card>

      {/* فلتر المجال */}
      <Card padding={12} style={{ marginBottom: 14 }}>
        {domains.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: THEME.colors.warning }}>
            ⚠️ لم يتم العثور على مجالات. تأكد من تنفيذ ملف SQL "إصلاح-المجالات" على Supabase.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: THEME.colors.textSecondary, marginLeft: 6 }}>المجال:</span>
            {domains.map(d => {
              const Icon = domainIcon(d.id);
              const color = domainColor(d.id);
              const active = selectedDomain === d.id;
              return (
                <button key={d.id} onClick={() => { setSelectedDomain(d.id); setSelectedChecklist(null); }}
                  style={{
                    padding: '6px 12px',
                    background: active ? color : '#fff',
                    color: active ? '#fff' : color,
                    border: `1.5px solid ${color}`,
                    borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                  }}>
                  <Icon size={14} />
                  {d.name_ar}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* قائمتان: القوائم على اليمين، المعايير على اليسار */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 12 }}>
        {/* القوائم */}
        <Card padding={10}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: THEME.colors.textSecondary }}>
            القوائم ({domainChecklists.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 600, overflowY: 'auto' }}>
            {phases.map(phase => {
              const phaseLists = domainChecklists.filter(c => c.phase_id === phase.id);
              if (phaseLists.length === 0) return null;
              return (
                <div key={phase.id}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: domainColor(selectedDomain), padding: '6px 8px', background: `${domainColor(selectedDomain)}10`, borderRadius: 6, marginTop: 6, marginBottom: 4 }}>
                    {phase.name_ar}
                  </div>
                  {phaseLists.map(cl => {
                    const active = selectedChecklist?.id === cl.id;
                    return (
                      <button key={cl.id} onClick={() => setSelectedChecklist(cl)}
                        style={{
                          width: '100%', textAlign: 'right',
                          padding: '8px 10px',
                          background: active ? domainColor(selectedDomain) : '#fff',
                          color: active ? '#fff' : THEME.colors.text,
                          border: `1px solid ${active ? domainColor(selectedDomain) : THEME.colors.border}`,
                          borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'inherit', marginBottom: 2,
                        }}>
                        {cl.name_ar}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>

        {/* المعايير */}
        <Card padding={14}>
          {!selectedChecklist ? (
            <div style={{ textAlign: 'center', padding: 40, color: THEME.colors.textTertiary, fontSize: 13 }}>
              <ListChecks size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div>اختر قائمة من اليمين لعرض معاييرها</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: `1px dashed ${THEME.colors.border}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedChecklist.name_ar}</div>
                  <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 2 }}>
                    {criteria.length} معيار
                  </div>
                </div>
                <Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing({})}>إضافة</Button>
              </div>

              {criteria.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: THEME.colors.textTertiary, fontSize: 12 }}>
                  لا توجد معايير في هذه القائمة
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 550, overflowY: 'auto' }}>
                  {criteria.map((cr, idx) => (
                    <div key={cr.id} style={{
                      padding: 10, background: cr.is_critical ? '#FCEBEB' : THEME.colors.bgSecondary,
                      borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
                      border: cr.is_critical ? `1px solid ${THEME.colors.danger}33` : 'none',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                          {idx + 1}. {cr.name_ar}
                          {cr.is_critical && <span style={{ marginRight: 6, fontSize: 10, color: THEME.colors.danger, fontWeight: 700 }}>⚠ حرج</span>}
                        </div>
                        <div style={{ fontSize: 10, color: THEME.colors.textTertiary, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span>النوع: {answerTypeLabel(cr.answer_type)}</span>
                          {cr.required_qty && <span>الكمية: {cr.required_qty} {cr.qty_unit}</span>}
                          {cr.section && <span>القسم: {cr.section}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setEditing(cr)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: THEME.colors.info }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteCriterion(cr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: THEME.colors.danger }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {editing && (
        <CriterionEditModal
          criterion={editing}
          onSave={handleSaveCriterion}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

function answerTypeLabel(type) {
  const labels = {
    compliance: 'مطابق/مخالف', yesno: 'نعم/لا', checkbox: 'تم/لم يتم',
    number: 'رقمي', ratio: 'نسبة', temperature: 'حرارة', time: 'وقت',
  };
  return labels[type] || type;
}

// =================================================================
// نموذج تعديل/إضافة معيار
// =================================================================
function CriterionEditModal({ criterion, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    id: criterion.id,
    nameAr: criterion.name_ar || '',
    description: criterion.description || '',
    section: criterion.section || '',
    answerType: criterion.answer_type || 'compliance',
    requiredQty: criterion.required_qty || '',
    qtyUnit: criterion.qty_unit || '',
    minValue: criterion.min_value || '',
    maxValue: criterion.max_value || '',
    isCritical: criterion.is_critical || false,
    noteRequired: criterion.note_required || 'on_violation',
    sortOrder: criterion.sort_order || 0,
  });

  const handleSubmit = () => {
    if (!form.nameAr.trim()) { alert('اسم المعيار إلزامي'); return; }
    onSave({
      ...form,
      requiredQty: form.requiredQty ? parseFloat(form.requiredQty) : null,
      minValue: form.minValue !== '' ? parseFloat(form.minValue) : null,
      maxValue: form.maxValue !== '' ? parseFloat(form.maxValue) : null,
      sortOrder: parseInt(form.sortOrder) || 0,
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 540, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{form.id ? 'تعديل المعيار' : 'إضافة معيار جديد'}</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SimpleInput label="نص المعيار *" value={form.nameAr} onChange={v => setForm({...form, nameAr: v})} />
          <SimpleTextarea label="الوصف (اختياري)" value={form.description} onChange={v => setForm({...form, description: v})} rows={2} />

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>نوع الإجابة</label>
            <select value={form.answerType} onChange={e => setForm({...form, answerType: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
              <option value="compliance">مطابق / مخالف</option>
              <option value="yesno">نعم / لا</option>
              <option value="checkbox">تم / لم يتم</option>
              <option value="number">رقم</option>
              <option value="ratio">نسبة (مع المطلوب والفعلي)</option>
              <option value="temperature">حرارة</option>
              <option value="time">وقت</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SimpleInput label="الكمية المطلوبة" type="number" value={form.requiredQty} onChange={v => setForm({...form, requiredQty: v})} />
            <SimpleInput label="الوحدة" value={form.qtyUnit} onChange={v => setForm({...form, qtyUnit: v})} placeholder="حافلة، عامل..." />
          </div>

          {(form.answerType === 'temperature' || form.answerType === 'number') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <SimpleInput label="الحد الأدنى" type="number" value={form.minValue} onChange={v => setForm({...form, minValue: v})} />
              <SimpleInput label="الحد الأعلى" type="number" value={form.maxValue} onChange={v => setForm({...form, maxValue: v})} />
            </div>
          )}

          <SimpleInput label="القسم (اختياري)" value={form.section} onChange={v => setForm({...form, section: v})} placeholder="kitchen, fleet, guards..." />

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>إلزامية الملاحظة</label>
            <select value={form.noteRequired} onChange={e => setForm({...form, noteRequired: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
              <option value="no">اختيارية</option>
              <option value="on_violation">إلزامية عند المخالفة</option>
              <option value="always">إلزامية دائماً</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, padding: 8, background: form.isCritical ? '#FCEBEB' : THEME.colors.bgSecondary, borderRadius: 8 }}>
            <input type="checkbox" checked={form.isCritical} onChange={e => setForm({...form, isCritical: e.target.checked})} style={{ width: 18, height: 18 }}/>
            <AlertCircle size={16} color={form.isCritical ? THEME.colors.danger : THEME.colors.textTertiary} />
            بند حرج (تصعيد فوري عند المخالفة)
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button variant="outline" onClick={onCancel} style={{ flex: 1 }}>إلغاء</Button>
          <Button variant="primary" icon={Save} onClick={handleSubmit} disabled={saving} style={{ flex: 1 }}>{saving ? '...' : 'حفظ'}</Button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// مكوّنات Input بسيطة (تجاوز مشكلة [object Object])
// =================================================================
function SimpleInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, outline: 'none', fontFamily: 'inherit', direction: 'rtl' }}/>
    </div>
  );
}

function SimpleTextarea({ label, value, onChange, rows = 3 }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, fontSize: 13, fontFamily: 'inherit', direction: 'rtl', outline: 'none', resize: 'vertical' }}/>
    </div>
  );
}

// =================================================================
// صفحة سجل المخالفات
// =================================================================
function ViolationsPage({ domains, companies, onBack, toast }) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editing, setEditing] = useState(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterDomain !== 'all') filters.domainId = filterDomain;
      if (filterCompany !== 'all') filters.companyId = filterCompany;
      if (filterStatus !== 'all') filters.status = filterStatus;
      const data = await cApi.getViolations(filters);
      setViolations(data);
    } catch (err) {
      console.error(err);
      toast.show('فشل التحميل', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [filterDomain, filterCompany, filterStatus]);

  const domainColor = (id) => id === 'food' ? '#E85D24' : id === 'transport' ? '#185FA5' : id === 'security' ? '#27500A' : THEME.colors.accent;
  const domainName = (id) => domains.find(d => d.id === id)?.name_ar || id;
  const companyName = (id) => companies.find(c => c.id === id)?.name || 'غير معروف';

  return (
    <div>
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="outline" icon={ChevronLeft} onClick={onBack} size="sm">رجوع</Button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={20} color={THEME.colors.danger} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>سجل المخالفات والشواهد</h2>
            <Badge color="danger" style={{ fontSize: 11 }}>{violations.length} مخالفة</Badge>
          </div>
          {violations.length > 0 && (
            <Button size="sm" variant="outline" icon={FileText} onClick={() => exportViolationsCSV(violations, companies, domains)}>
              تصدير CSV
            </Button>
          )}
        </div>
      </Card>

      {/* الفلاتر */}
      <Card padding={12} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: THEME.colors.textSecondary }}>المجال:</span>
          <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${THEME.colors.border}`, fontFamily: 'inherit' }}>
            <option value="all">الكل</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
          </select>

          <span style={{ fontSize: 11, fontWeight: 600, color: THEME.colors.textSecondary }}>الشركة:</span>
          <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${THEME.colors.border}`, fontFamily: 'inherit' }}>
            <option value="all">الكل</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <span style={{ fontSize: 11, fontWeight: 600, color: THEME.colors.textSecondary }}>الحالة:</span>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${THEME.colors.border}`, fontFamily: 'inherit' }}>
            <option value="all">الكل</option>
            <option value="open">مفتوحة</option>
            <option value="closed">مغلقة</option>
          </select>
        </div>
      </Card>

      {/* قائمة المخالفات */}
      {loading ? (
        <Card padding={40} style={{ textAlign: 'center' }}>جاري التحميل...</Card>
      ) : violations.length === 0 ? (
        <Card padding={40} style={{ textAlign: 'center' }}>
          <CheckCircle2 size={40} color={THEME.colors.success} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>لا توجد مخالفات مسجّلة</div>
          <div style={{ fontSize: 12, color: THEME.colors.textTertiary }}>المخالفات تُسجَّل تلقائياً عند ضغط "مخالف" في صفحة المراقبة</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {violations.map(v => (
            <Card key={v.id} padding={12} style={{
              borderRight: `4px solid ${v.level?.color || THEME.colors.danger}`,
              background: v.criterion?.is_critical ? '#FFF8F8' : '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {v.criterion?.name_ar || v.description}
                    </span>
                    {v.criterion?.is_critical && (
                      <span style={{ fontSize: 9, padding: '2px 6px', background: THEME.colors.dangerSoft, color: THEME.colors.danger, borderRadius: 6, fontWeight: 700 }}>
                        ⚠ حرج
                      </span>
                    )}
                    <span style={{ fontSize: 9, padding: '2px 6px', background: `${v.level?.color}22`, color: v.level?.color, borderRadius: 6, fontWeight: 700 }}>
                      {v.level?.name_ar}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: THEME.colors.textTertiary, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ color: domainColor(v.domain_id), fontWeight: 600 }}>{domainName(v.domain_id)}</span>
                    <span>•</span>
                    <span>{companyName(v.company_id)}</span>
                    <span>•</span>
                    <span>{v.violation_date}</span>
                    {v.date_id && <><span>•</span><span>اليوم {v.date_id}</span></>}
                  </div>
                  {v.description && v.description !== v.criterion?.name_ar && (
                    <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginTop: 6, padding: '6px 8px', background: THEME.colors.bgSecondary, borderRadius: 6, lineHeight: 1.5 }}>
                      {v.description}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  {v.notified_party ? (
                    <Badge color="success" style={{ fontSize: 10 }}>✓ تم الإبلاغ</Badge>
                  ) : (
                    <Badge color="warning" style={{ fontSize: 10 }}>⚠ لم يُبلَّغ</Badge>
                  )}
                  <Badge color={v.status === 'open' ? 'danger' : 'gray'} style={{ fontSize: 10 }}>
                    {v.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" icon={Edit2} onClick={() => setEditing(v)} fullWidth>
                إدارة المخالفة + الشواهد
              </Button>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <ViolationEditModal
          violation={editing}
          onSave={async (updates) => {
            try {
              await cApi.updateViolation(editing.id, updates);
              await refresh();
              setEditing(null);
              toast.show('تم التحديث', 'success');
            } catch { toast.show('فشل التحديث', 'error'); }
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// =================================================================
// Modal إدارة مخالفة
// =================================================================
function ViolationEditModal({ violation, onSave, onCancel }) {
  const [form, setForm] = useState({
    description: violation.description || '',
    evidenceUrl: violation.evidence_url || '',
    notifiedParty: violation.notified_party || false,
    actionTaken: violation.action_taken || '',
    status: violation.status || 'open',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
      background: 'rgba(13, 24, 36, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 540, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>إدارة المخالفة</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SimpleTextarea label="وصف المخالفة" value={form.description} onChange={v => setForm({...form, description: v})} rows={3} />
          <SimpleInput label="رابط الشاهد (صورة/فيديو)" value={form.evidenceUrl} onChange={v => setForm({...form, evidenceUrl: v})} placeholder="https://..." />

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 10, borderRadius: 8,
            background: form.notifiedParty ? THEME.colors.successSoft : THEME.colors.bgSecondary,
            border: `1.5px solid ${form.notifiedParty ? THEME.colors.success : THEME.colors.border}`,
            cursor: 'pointer',
          }}>
            <input type="checkbox" checked={form.notifiedParty}
              onChange={e => setForm({...form, notifiedParty: e.target.checked})}
              style={{ width: 18, height: 18 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>تم إبلاغ المتعهد بالمخالفة</div>
              <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 2 }}>
                {form.notifiedParty ? 'سيُحفظ تاريخ الإبلاغ تلقائياً' : 'لم يُبلَّغ بعد'}
              </div>
            </div>
          </label>

          <SimpleTextarea label="الإجراء المتخذ" value={form.actionTaken} onChange={v => setForm({...form, actionTaken: v})} rows={2} />

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>حالة المخالفة</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
              <option value="open">مفتوحة</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="closed">مُغلقة</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button variant="outline" onClick={onCancel} style={{ flex: 1 }}>إلغاء</Button>
          <Button variant="primary" icon={Save} onClick={handleSubmit} disabled={saving} style={{ flex: 1 }}>
            {saving ? '...' : 'حفظ'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// لوحة قيادة المتعهدين
// =================================================================
function ContractorsDashboard({ domains, companies, onBack, toast }) {
  const [summary, setSummary] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, v] = await Promise.all([
          cApi.getCompanyDomainSummary(),
          cApi.getViolations({ limit: 20 }),
        ]);
        setSummary(s);
        setViolations(v);
      } catch (err) {
        console.error(err);
        toast.show('فشل التحميل', 'error');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Card padding={40} style={{ textAlign: 'center' }}>جاري التحميل...</Card>;

  const domainColor = (id) => id === 'food' ? '#E85D24' : id === 'transport' ? '#185FA5' : id === 'security' ? '#27500A' : THEME.colors.accent;
  const domainIcon = (id) => id === 'food' ? Utensils : id === 'transport' ? Truck : id === 'security' ? ShieldCheck : Briefcase;

  // إحصاءات عامة
  const totalSessions = summary.reduce((s, r) => s + (r.total_sessions || 0), 0);
  const submittedSessions = summary.reduce((s, r) => s + (r.submitted_sessions || 0), 0);
  const totalViolations = summary.reduce((s, r) => s + (r.total_violations || 0), 0);
  const criticalViolations = violations.filter(v => v.level_id === 'critical').length;

  return (
    <div>
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="outline" icon={ChevronLeft} onClick={onBack} size="sm">رجوع</Button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} color={'#27500A'} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>لوحة قيادة المتعهدين</h2>
          </div>
        </div>
      </Card>

      {/* KPIs العامة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
        <KpiBox label="إجمالي الجلسات" value={totalSessions} color={THEME.colors.info} icon={ListChecks} />
        <KpiBox label="جلسات مُرسلة" value={submittedSessions} color={THEME.colors.success} icon={CheckCircle2} />
        <KpiBox label="إجمالي المخالفات" value={totalViolations} color={THEME.colors.warning} icon={AlertCircle} />
        <KpiBox label="مخالفات حرجة" value={criticalViolations} color={THEME.colors.danger} icon={AlertTriangle} />
      </div>

      {/* مصفوفة الشركات × المجالات */}
      <Card padding={14} style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: `1px dashed ${THEME.colors.border}` }}>
          📊 الأداء حسب الشركة والمجال
        </h3>
        {companies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: THEME.colors.textTertiary, fontSize: 12 }}>لا توجد شركات</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: THEME.colors.bgSecondary }}>
                  <th style={{ padding: 8, textAlign: 'right', fontWeight: 700, borderBottom: `1px solid ${THEME.colors.border}` }}>الشركة</th>
                  {domains.map(d => (
                    <th key={d.id} style={{ padding: 8, textAlign: 'center', fontWeight: 700, color: domainColor(d.id), borderBottom: `1px solid ${THEME.colors.border}` }}>
                      {d.name_ar}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.filter(c => c.active).map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px dashed ${THEME.colors.border}` }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{c.name}</td>
                    {domains.map(d => {
                      const row = summary.find(s => s.company_id === c.id && s.domain_id === d.id);
                      const sessions = row?.total_sessions || 0;
                      const submitted = row?.submitted_sessions || 0;
                      const vios = row?.total_violations || 0;
                      const color = domainColor(d.id);
                      return (
                        <td key={d.id} style={{ padding: 10, textAlign: 'center' }}>
                          {sessions === 0 ? (
                            <span style={{ color: THEME.colors.textTertiary, fontSize: 11 }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color }}>{submitted}/{sessions}</div>
                              <div style={{ fontSize: 9, color: vios > 0 ? THEME.colors.danger : THEME.colors.textTertiary }}>
                                {vios > 0 ? `${vios} مخالفة` : 'بدون مخالفات'}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* آخر المخالفات */}
      <Card padding={14}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: `1px dashed ${THEME.colors.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={16} color={THEME.colors.danger} />
          آخر المخالفات المسجّلة
        </h3>
        {violations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: THEME.colors.textTertiary, fontSize: 12 }}>
            لا توجد مخالفات بعد
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {violations.slice(0, 10).map(v => (
              <div key={v.id} style={{
                padding: 10, background: THEME.colors.bgSecondary, borderRadius: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                borderRight: `3px solid ${v.level?.color || THEME.colors.danger}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{v.criterion?.name_ar || v.description}</div>
                  <div style={{ fontSize: 10, color: THEME.colors.textTertiary, marginTop: 2 }}>
                    {companies.find(c => c.id === v.company_id)?.name} • {v.violation_date} • {v.date_id ? `اليوم ${v.date_id}` : ''}
                  </div>
                </div>
                <Badge color={v.notified_party ? 'success' : 'warning'} style={{ fontSize: 10 }}>
                  {v.notified_party ? '✓ مُبلَّغ' : '⚠ لم يُبلَّغ'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function KpiBox({ label, value, color, icon: Icon }) {
  return (
    <div style={{
      background: '#fff', padding: 12, borderRadius: 10,
      border: `1px solid ${THEME.colors.border}`,
      borderRight: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon size={14} color={color} />
        <div style={{ fontSize: 11, color: THEME.colors.textSecondary, fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// =================================================================
// تصدير المخالفات إلى CSV (Excel-compatible)
// =================================================================
function exportViolationsCSV(violations, companies, domains) {
  const domainName = (id) => domains.find(d => d.id === id)?.name_ar || id;
  const companyName = (id) => companies.find(c => c.id === id)?.name || 'غير معروف';

  const headers = ['التاريخ', 'اليوم', 'المجال', 'الشركة', 'المعيار', 'الوصف', 'المستوى', 'حرج؟', 'الحالة', 'تم الإبلاغ؟', 'تاريخ الإبلاغ', 'الإجراء المتخذ'];
  const rows = violations.map(v => [
    v.violation_date || '',
    v.date_id ? `اليوم ${v.date_id}` : '',
    domainName(v.domain_id),
    companyName(v.company_id),
    v.criterion?.name_ar || '',
    v.description || '',
    v.level?.name_ar || v.level_id,
    v.criterion?.is_critical ? 'نعم' : 'لا',
    v.status === 'open' ? 'مفتوحة' : v.status === 'closed' ? 'مغلقة' : 'قيد المعالجة',
    v.notified_party ? 'نعم' : 'لا',
    v.notified_at ? new Date(v.notified_at).toLocaleString('ar-SA') : '',
    v.action_taken || '',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // BOM لدعم العربية في Excel
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `المخالفات-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
