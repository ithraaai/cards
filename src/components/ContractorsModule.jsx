import { useState, useEffect, useMemo } from 'react';
import {
  Users as UsersIcon, Briefcase, Plus, Edit2, Trash2, X, Save,
  Building2, Phone, FileText, ChevronLeft, ShieldCheck, Truck,
  Utensils, AlertCircle, CheckCircle2, Info, Eye, Filter,
  Award, Target, Activity, BarChart3, Settings, ChevronRight,
} from 'lucide-react';

import { Button } from './Button.jsx';
import { Card, Badge } from './Card.jsx';
import { Input } from './Input.jsx';
import { THEME } from '../data/theme.js';
import * as cApi from '../data/contractorsApi.js';

// =================================================================
// الصفحة الرئيسية لوحدة المتعهدين
// =================================================================
export function ContractorsModule({ user, companies, toast, onBack }) {
  const [view, setView] = useState('home'); // home, contractors, contracts, criteria
  const [contractors, setContractors] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const [d, c, cn] = await Promise.all([
        cApi.getDomains(),
        cApi.getContractors(),
        cApi.getContracts(),
      ]);
      setDomains(d);
      setContractors(c);
      setContracts(cn);
    } catch (err) {
      console.error(err);
      toast.show('فشل تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  if (loading) {
    return (
      <Card padding={40} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: THEME.colors.textSecondary }}>جاري التحميل...</div>
      </Card>
    );
  }

  // إذا اختار المستخدم صفحة فرعية
  if (view === 'contractors') {
    return <ContractorsList contractors={contractors} onRefresh={refresh} onBack={() => setView('home')} toast={toast} />;
  }
  if (view === 'contracts') {
    return <ContractsList contracts={contracts} contractors={contractors} companies={companies} domains={domains} onRefresh={refresh} onBack={() => setView('home')} toast={toast} />;
  }

  // الصفحة الرئيسية - بطاقات تنقّل
  return <ContractorsHome user={user} contractors={contractors} contracts={contracts} domains={domains} onSelectView={setView} onBack={onBack} />;
}

// =================================================================
// الصفحة الرئيسية - بطاقات تنقل
// =================================================================
function ContractorsHome({ user, contractors, contracts, domains, onSelectView, onBack }) {
  // إحصاءات سريعة
  const totalContractors = contractors.length;
  const totalContracts = contracts.length;
  const contractsByDomain = useMemo(() => {
    const map = {};
    domains.forEach(d => { map[d.id] = 0; });
    contracts.forEach(c => { if (map[c.domain_id] !== undefined) map[c.domain_id]++; });
    return map;
  }, [contracts, domains]);

  const domainIcon = (id) => {
    if (id === 'food') return Utensils;
    if (id === 'transport') return Truck;
    if (id === 'security') return ShieldCheck;
    return Briefcase;
  };

  const domainColor = (id) => {
    if (id === 'food') return '#E85D24';
    if (id === 'transport') return '#185FA5';
    if (id === 'security') return '#27500A';
    return THEME.colors.accent;
  };

  return (
    <div>
      {/* رأس الصفحة */}
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
              متابعة الإعاشة والنقل والحراسات للشركات الأربع
            </div>
          </div>
          {onBack && (
            <Button variant="outline" icon={ChevronLeft} onClick={onBack}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
              العودة للنظام
            </Button>
          )}
        </div>
      </Card>

      {/* الإحصاءات السريعة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
        <StatCard icon={UsersIcon} label="المتعهدون" value={totalContractors} color="purple" />
        <StatCard icon={Briefcase} label="إجمالي العقود" value={totalContracts} color="info" />
        {domains.map(d => {
          const Icon = domainIcon(d.id);
          return (
            <StatCard key={d.id} icon={Icon} label={`عقود ${d.name_ar}`} value={contractsByDomain[d.id] || 0} color="accent" />
          );
        })}
      </div>

      {/* بطاقات التنقل */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <NavCard
          icon={UsersIcon}
          title="إدارة المتعهدين"
          desc="إضافة وتعديل بيانات المتعهدين والموردين"
          count={`${totalContractors} متعهد`}
          color="#6B3AA0"
          onClick={() => onSelectView('contractors')}
        />
        <NavCard
          icon={Briefcase}
          title="إدارة العقود"
          desc="ربط متعهد بشركة في مجال محدد"
          count={`${totalContracts} عقد`}
          color="#185FA5"
          onClick={() => onSelectView('contracts')}
        />
        <NavCard
          icon={Activity}
          title="لوحة قيادة المتعهدين"
          desc="نظرة شاملة على صحة كل العقود"
          count="قريباً"
          color="#27500A"
          onClick={() => alert('لوحة القيادة ستكون متاحة في المرحلة القادمة')}
          disabled
        />
        <NavCard
          icon={FileText}
          title="التقارير"
          desc="تقارير تفصيلية لكل عقد"
          count="قريباً"
          color="#BA7517"
          onClick={() => alert('التقارير ستكون متاحة في المرحلة القادمة')}
          disabled
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
              المرحلة 1 من 4 — البنية الأساسية
            </div>
            <div style={{ fontSize: 12, color: THEME.colors.textSecondary, lineHeight: 1.7 }}>
              في هذه المرحلة يمكنك إدارة المتعهدين والعقود. <strong>المراحل القادمة:</strong>
              <br />
              ⏳ المرحلة 2: واجهات المراقبين للإدخال اليومي (إعاشة/نقل/حراسات)
              <br />
              ⏳ المرحلة 3: نظام المخالفات والغرامات + KPI الأسبوعية + المحاضر
              <br />
              ⏳ المرحلة 4: لوحات القيادة المتقدمة والتقارير
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// =================================================================
// مكوّن بطاقة إحصاء
// =================================================================
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    purple: { bg: THEME.colors.purpleSoft, fg: THEME.colors.purple },
    info: { bg: THEME.colors.infoSoft, fg: THEME.colors.info },
    accent: { bg: '#FAF3E0', fg: THEME.colors.accent },
    success: { bg: THEME.colors.successSoft, fg: THEME.colors.success },
  };
  const c = colors[color] || colors.accent;
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 12,
      border: `1px solid ${THEME.colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={c.fg} strokeWidth={2.2} />
        </div>
        <div style={{ fontSize: 11, color: THEME.colors.textSecondary, fontWeight: 600 }}>{label}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: c.fg, lineHeight: 1 }}>{value}</div>
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
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${color}22`; }}
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
      <div style={{
        display: 'inline-block', padding: '4px 10px', borderRadius: 10,
        background: `${color}15`, color: color, fontSize: 11, fontWeight: 700,
      }}>
        {count}
      </div>
    </button>
  );
}

// =================================================================
// قائمة المتعهدين
// =================================================================
function ContractorsList({ contractors, onRefresh, onBack, toast }) {
  const [editing, setEditing] = useState(null); // null أو {} (جديد) أو contractor
  const [saving, setSaving] = useState(false);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (data.id) await cApi.updateContractor(data.id, data);
      else await cApi.createContractor(data);
      await onRefresh();
      setEditing(null);
      toast.show('تم الحفظ', 'success');
    } catch (err) { toast.show('فشل الحفظ', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل تريد حذف هذا المتعهد؟')) return;
    try {
      await cApi.deleteContractor(id);
      await onRefresh();
      toast.show('تم الحذف', 'success');
    } catch (err) { toast.show('لا يمكن الحذف - قد توجد عقود مرتبطة', 'error'); }
  };

  return (
    <div>
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="outline" icon={ChevronLeft} onClick={onBack} size="sm">رجوع</Button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UsersIcon size={20} color={THEME.colors.purple} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>إدارة المتعهدين</h2>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>إضافة متعهد</Button>
        </div>
      </Card>

      {contractors.length === 0 ? (
        <Card padding={40} style={{ textAlign: 'center' }}>
          <UsersIcon size={40} color={THEME.colors.textTertiary} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>لا يوجد متعهدون</div>
          <div style={{ fontSize: 12, color: THEME.colors.textTertiary }}>اضغط "إضافة متعهد" لإضافة أول واحد</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {contractors.map(c => (
            <Card key={c.id} padding={14}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{c.name}</div>
                  {c.short_name && <div style={{ fontSize: 11, color: THEME.colors.textTertiary }}>{c.short_name}</div>}
                </div>
                <Badge color={c.active ? 'success' : 'gray'} style={{ fontSize: 10 }}>
                  {c.active ? 'نشط' : 'معطّل'}
                </Badge>
              </div>
              {c.representative && (
                <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 4 }}>
                  <strong>الممثل:</strong> {c.representative}
                </div>
              )}
              {c.phone && (
                <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 4 }}>
                  <Phone size={11} style={{ display: 'inline', marginLeft: 4 }} />
                  {c.phone}
                </div>
              )}
              {c.notes && (
                <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 6, padding: '6px 8px', background: THEME.colors.bgSecondary, borderRadius: 6, lineHeight: 1.5 }}>
                  {c.notes}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${THEME.colors.border}` }}>
                <Button size="sm" variant="outline" icon={Edit2} onClick={() => setEditing(c)} style={{ flex: 1 }}>تعديل</Button>
                <Button size="sm" variant="outline" icon={Trash2} onClick={() => handleDelete(c.id)} style={{ color: THEME.colors.danger, borderColor: THEME.colors.danger }}>حذف</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <ContractorEditModal
          contractor={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

// =================================================================
// نموذج تعديل/إضافة متعهد
// =================================================================
function ContractorEditModal({ contractor, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    id: contractor.id,
    name: contractor.name || '',
    shortName: contractor.short_name || '',
    representative: contractor.representative || '',
    phone: contractor.phone || '',
    email: contractor.email || '',
    commercialReg: contractor.commercial_reg || '',
    address: contractor.address || '',
    notes: contractor.notes || '',
    active: contractor.active !== false,
  });

  const handleSubmit = () => {
    if (!form.name.trim()) { alert('اسم المتعهد إلزامي'); return; }
    onSave(form);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, padding: 20,
          maxWidth: 540, width: '100%', maxHeight: '90vh', overflow: 'auto',
          animation: 'scaleIn 0.2s ease-out',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>
            {form.id ? 'تعديل بيانات المتعهد' : 'إضافة متعهد جديد'}
          </h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input label="اسم المتعهد *" value={form.name} onChange={v => setForm({...form, name: v})} />
          <Input label="اسم مختصر" value={form.shortName} onChange={v => setForm({...form, shortName: v})} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="الممثل" value={form.representative} onChange={v => setForm({...form, representative: v})} />
            <Input label="السجل التجاري" value={form.commercialReg} onChange={v => setForm({...form, commercialReg: v})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="رقم الجوال" value={form.phone} onChange={v => setForm({...form, phone: v})} />
            <Input label="البريد الإلكتروني" value={form.email} onChange={v => setForm({...form, email: v})} />
          </div>
          <Input label="العنوان" value={form.address} onChange={v => setForm({...form, address: v})} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>ملاحظات</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, fontSize: 13, fontFamily: 'inherit', direction: 'rtl', outline: 'none', resize: 'vertical' }}/>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} style={{ width: 18, height: 18 }}/>
            متعهد نشط
          </label>
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
// قائمة العقود
// =================================================================
function ContractsList({ contracts, contractors, companies, domains, onRefresh, onBack, toast }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');

  const filtered = useMemo(() => {
    return contracts.filter(c => {
      if (filterDomain !== 'all' && c.domain_id !== filterDomain) return false;
      if (filterCompany !== 'all' && c.company_id !== filterCompany) return false;
      return true;
    });
  }, [contracts, filterDomain, filterCompany]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (data.id) await cApi.updateContract(data.id, data);
      else await cApi.createContract(data);
      await onRefresh();
      setEditing(null);
      toast.show('تم الحفظ', 'success');
    } catch (err) {
      console.error(err);
      toast.show(err.message?.includes('duplicate') ? 'العقد موجود بالفعل (نفس الشركة والمجال)' : 'فشل الحفظ', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل تريد حذف هذا العقد؟ سيُحذف معه كل البيانات المرتبطة.')) return;
    try {
      await cApi.deleteContract(id);
      await onRefresh();
      toast.show('تم الحذف', 'success');
    } catch (err) { toast.show('فشل الحذف', 'error'); }
  };

  const domainColor = (id) => {
    if (id === 'food') return '#E85D24';
    if (id === 'transport') return '#185FA5';
    if (id === 'security') return '#27500A';
    return THEME.colors.accent;
  };

  const domainIcon = (id) => {
    if (id === 'food') return Utensils;
    if (id === 'transport') return Truck;
    if (id === 'security') return ShieldCheck;
    return Briefcase;
  };

  return (
    <div>
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="outline" icon={ChevronLeft} onClick={onBack} size="sm">رجوع</Button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={20} color={THEME.colors.info} />
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>إدارة العقود</h2>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>إضافة عقد</Button>
        </div>
      </Card>

      {/* فلاتر */}
      <Card padding={12} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Filter size={14} color={THEME.colors.textSecondary} />
          <span style={{ fontSize: 12, fontWeight: 600, color: THEME.colors.textSecondary }}>المجال:</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <FilterChip label="الكل" active={filterDomain === 'all'} onClick={() => setFilterDomain('all')} />
            {domains.map(d => (
              <FilterChip key={d.id} label={d.name_ar} active={filterDomain === d.id} onClick={() => setFilterDomain(d.id)} color={domainColor(d.id)} />
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: THEME.colors.textSecondary, marginRight: 12 }}>الشركة:</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <FilterChip label="الكل" active={filterCompany === 'all'} onClick={() => setFilterCompany('all')} />
            {companies?.map(co => (
              <FilterChip key={co.id} label={co.name} active={filterCompany === co.id} onClick={() => setFilterCompany(co.id)} />
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card padding={40} style={{ textAlign: 'center' }}>
          <Briefcase size={40} color={THEME.colors.textTertiary} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            {contracts.length === 0 ? 'لا توجد عقود' : 'لا توجد نتائج مطابقة للفلتر'}
          </div>
          <div style={{ fontSize: 12, color: THEME.colors.textTertiary }}>
            {contracts.length === 0 ? 'اضغط "إضافة عقد" لإضافة أول عقد' : 'جرّب تغيير الفلاتر'}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
          {filtered.map(c => {
            const Icon = domainIcon(c.domain_id);
            const color = domainColor(c.domain_id);
            return (
              <Card key={c.id} padding={14} style={{ borderRight: `4px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      عقد {c.domain?.name_ar} — {c.company?.name}
                    </div>
                    <div style={{ fontSize: 11, color: THEME.colors.textTertiary }}>
                      {c.contract_number || 'بدون رقم عقد'}
                    </div>
                  </div>
                  <Badge color={c.active ? 'success' : 'gray'} style={{ fontSize: 10 }}>
                    {c.active ? 'نشط' : 'معطّل'}
                  </Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: THEME.colors.textTertiary }}>المتعهد:</span>
                    <span style={{ fontWeight: 600 }}>{c.contractor?.name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: THEME.colors.textTertiary }}>عدد الحجاج:</span>
                    <span style={{ fontWeight: 600 }}>{c.pilgrims_count || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: THEME.colors.textTertiary }}>سقف الغرامات:</span>
                    <span style={{ fontWeight: 600, color: THEME.colors.warning }}>{c.max_penalty_pct}%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${THEME.colors.border}` }}>
                  <Button size="sm" variant="outline" icon={Edit2} onClick={() => setEditing(c)} style={{ flex: 1 }}>تعديل</Button>
                  <Button size="sm" variant="outline" icon={Trash2} onClick={() => handleDelete(c.id)} style={{ color: THEME.colors.danger, borderColor: THEME.colors.danger }}>حذف</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <ContractEditModal
          contract={editing}
          contractors={contractors}
          companies={companies}
          domains={domains}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick, color }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '4px 10px',
        background: active ? (color || THEME.colors.primary) : '#fff',
        color: active ? '#fff' : THEME.colors.text,
        border: `1px solid ${active ? (color || THEME.colors.primary) : THEME.colors.border}`,
        borderRadius: 12, fontSize: 11, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
      {label}
    </button>
  );
}

// =================================================================
// نموذج تعديل/إضافة عقد
// =================================================================
function ContractEditModal({ contract, contractors, companies, domains, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    id: contract.id,
    contractorId: contract.contractor_id || '',
    companyId: contract.company_id || '',
    domainId: contract.domain_id || '',
    contractNumber: contract.contract_number || '',
    hijriYear: contract.hijri_year || '1447',
    pilgrimsCount: contract.pilgrims_count || '',
    maxPenaltyPct: contract.max_penalty_pct || 30,
    notes: contract.notes || '',
    active: contract.active !== false,
  });

  const handleSubmit = () => {
    if (!form.contractorId || !form.companyId || !form.domainId) {
      alert('المتعهد والشركة والمجال إلزاميون');
      return;
    }
    onSave({
      ...form,
      pilgrimsCount: form.pilgrimsCount ? parseInt(form.pilgrimsCount) : null,
      maxPenaltyPct: parseFloat(form.maxPenaltyPct),
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, padding: 20,
          maxWidth: 540, width: '100%', maxHeight: '90vh', overflow: 'auto',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>
            {form.id ? 'تعديل العقد' : 'إضافة عقد جديد'}
          </h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* المجال */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>المجال *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {domains.map(d => {
                const selected = form.domainId === d.id;
                return (
                  <button key={d.id} onClick={() => setForm({...form, domainId: d.id})}
                    disabled={!!form.id}
                    style={{
                      padding: '10px 8px',
                      background: selected ? THEME.colors.primary : '#fff',
                      color: selected ? '#fff' : THEME.colors.text,
                      border: `1.5px solid ${selected ? THEME.colors.primary : THEME.colors.border}`,
                      borderRadius: 8, cursor: form.id ? 'not-allowed' : 'pointer',
                      fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                      opacity: form.id ? 0.6 : 1,
                    }}>
                    {d.name_ar}
                  </button>
                );
              })}
            </div>
          </div>

          {/* الشركة */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>الشركة العميلة *</label>
            <select value={form.companyId} onChange={e => setForm({...form, companyId: e.target.value})}
              disabled={!!form.id}
              style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
              <option value="">— اختر الشركة —</option>
              {companies?.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
            </select>
          </div>

          {/* المتعهد */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>المتعهد *</label>
            <select value={form.contractorId} onChange={e => setForm({...form, contractorId: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
              <option value="">— اختر المتعهد —</option>
              {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="رقم العقد" value={form.contractNumber} onChange={v => setForm({...form, contractNumber: v})} />
            <Input label="عدد الحجاج" type="number" value={form.pilgrimsCount} onChange={v => setForm({...form, pilgrimsCount: v})} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>
              سقف الغرامات (%) — افتراضي 30%
            </label>
            <input type="number" min="0" max="100" step="0.5"
              value={form.maxPenaltyPct} onChange={e => setForm({...form, maxPenaltyPct: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, outline: 'none', fontFamily: 'inherit' }}/>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>ملاحظات</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${THEME.colors.border}`, fontSize: 13, fontFamily: 'inherit', direction: 'rtl', outline: 'none', resize: 'vertical' }}/>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} style={{ width: 18, height: 18 }}/>
            عقد نشط
          </label>

          {form.id && (
            <div style={{ padding: 10, background: THEME.colors.warningSoft, borderRadius: 8, fontSize: 11, color: THEME.colors.warning, lineHeight: 1.6 }}>
              ⚠️ لا يمكن تغيير الشركة أو المجال بعد إنشاء العقد. لتغييرها، احذف العقد وأنشئ آخر.
            </div>
          )}
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
