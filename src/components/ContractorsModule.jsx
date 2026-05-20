import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, ChevronLeft, ShieldCheck, Truck, Utensils,
  Info, ChevronRight, FileText, ListChecks, Activity,
  Plus, Edit2, Trash2, X, Save, AlertCircle, Filter,
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
        const d = await cApi.getDomains();
        setDomains(d);
      } catch (err) {
        console.error(err);
        toast.show('فشل تحميل المجالات', 'error');
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
          desc="نظرة شاملة على أداء جميع الشركات"
          count="قريباً"
          color="#27500A"
          disabled
          onClick={() => alert('قريباً في المرحلة 4')}
        />
        <NavCard
          icon={FileText}
          title="التقارير"
          desc="تقارير تفصيلية لكل شركة ومجال"
          count="قريباً"
          color="#BA7517"
          disabled
          onClick={() => alert('قريباً في المرحلة 4')}
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
              المرحلة 1 — تبسيط البنية
            </div>
            <div style={{ fontSize: 12, color: THEME.colors.textSecondary, lineHeight: 1.7 }}>
              النظام الآن مبني على نموذج <strong>"شركة + مجال"</strong> بدلاً من العقود.
              المعايير محفوظة كقوالب موحدة، وكل شركة تُقيَّم في كل مجال.
              <br />
              <strong>قادم:</strong> واجهات الإدخال للمراقبين، المخالفات والشواهد، لوحات القيادة.
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
