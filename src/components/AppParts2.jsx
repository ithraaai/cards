import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
  LayoutDashboard, ClipboardList, Settings, LogOut, Menu, AlertTriangle,
  CheckCircle2, User, Calendar, Award, Activity, Info, AlertCircle,
  MessageSquare, Plus, X, ChevronDown, ChevronLeft, ChevronRight, Lock,
  ThumbsUp, ThumbsDown, HelpCircle, Check, Building2,
  TrendingUp, Wifi, Users as UsersIcon,
  Trash2, Edit2, Phone, Shield, Save, Hash, Eye, FileBarChart,
  Filter, ChevronUp, Trophy, Flame,
  PieChart as PieChartIcon, Loader2, Clock, Unlock, FileText,
  FileImage, FileDown, ArrowRight,
} from 'lucide-react';

import { Button } from './Button.jsx';
import { Card, Badge } from './Card.jsx';
import { Input } from './Input.jsx';
import { Logo } from './Logo.jsx';
import { DATES, ROLES_CONFIG, SCALE_LABELS, CLOSING_MODES, getDefaultDateId } from '../data/seed.js';
import { THEME } from '../data/theme.js';
import { calculateStats } from '../data/stats.js';
import * as api from '../data/api.js';
import { KPICard } from './AppParts1.jsx';

// =================================================================
// Users
// =================================================================
export function UsersPage({ users, companies, toast, refreshUsers }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', role: 'data_entry', companyId: '', section: 'رجال', phone: '' });

  const openNew = () => {
    setEditing(null);
    const firstCompany = companies.filter(c => c.active)[0];
    setForm({ name: '', username: '', role: 'data_entry', companyId: firstCompany?.id || '', section: 'رجال', phone: '' });
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
    if (form.role === 'admin' || form.role === 'dashboard') { finalForm.companyId = null; finalForm.section = null; }
    else if (form.role === 'supervisor') finalForm.companyId = null;

    setSaving(true);
    try {
      if (editing) { await api.updateUser(editing.id, finalForm); toast.show('تم التحديث', 'success'); }
      else { await api.createUser(finalForm); toast.show('تم الإضافة', 'success'); }
      await refreshUsers();
      setShowForm(false);
    } catch (err) { toast.show('فشل الحفظ', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (u) => {
    if (u.username === 's123') { toast.show('لا يمكن حذف المدير', 'warning'); return; }
    if (!confirm(`حذف ${u.name}؟`)) return;
    try { await api.deleteUser(u.id); await refreshUsers(); toast.show('تم الحذف', 'info'); }
    catch (err) { toast.show('فشل الحذف', 'error'); }
  };

  const toggleActive = async (u) => {
    if (u.username === 's123') { toast.show('لا يمكن تعطيل المدير', 'warning'); return; }
    try { await api.setUserActive(u.id, !u.active); await refreshUsers(); toast.show(u.active ? 'تم التعطيل' : 'تم التفعيل', 'info'); }
    catch (err) { toast.show('فشل التغيير', 'error'); }
  };

  if (showForm) {
    const needsCompanyAndSection = form.role === 'data_entry';
    const needsSectionOnly = form.role === 'supervisor';
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? `تعديل: ${editing.name}` : 'إضافة حساب جديد'}</h2>
          <Button variant="ghost" icon={X} onClick={() => setShowForm(false)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="الاسم الكامل" icon={User} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="اسم المستخدم" icon={User} value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))} placeholder="حروف إنجليزية أو أرقام" hint="بدون كلمة مرور"/>
          <Input label="رقم الجوال (اختياري)" icon={Phone} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>الصلاحية</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff', fontFamily: 'inherit' }}>
              <option value="admin">مدير النظام</option>
              <option value="dashboard">عرض لوحة المتابعة</option>
              <option value="data_entry">مدخل بيانات</option>
              <option value="supervisor">مشرف المتابعة</option>
            </select>
            <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 4 }}>{ROLES_CONFIG[form.role]?.description}</div>
          </div>
          {needsCompanyAndSection && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>الشركة</label>
                <select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff', fontFamily: 'inherit' }}>
                  {companies.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>القسم</label>
                <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff', fontFamily: 'inherit' }}>
                  <option value="رجال">رجال</option><option value="نساء">نساء</option>
                </select>
              </div>
            </>
          )}
          {needsSectionOnly && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>قسم المتابعة</label>
              <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff', fontFamily: 'inherit' }}>
                <option value="رجال">قسم الرجال</option><option value="نساء">قسم النساء</option>
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button variant="primary" icon={Save} onClick={save} fullWidth disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Button>
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
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: role?.color || THEME.colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{u.name.charAt(0)}</div>
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
                  <Button size="sm" variant={u.active ? 'outline' : 'success'} onClick={() => toggleActive(u)}>{u.active ? 'تعطيل' : 'تفعيل'}</Button>
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
// Companies
// =================================================================
export function CompaniesPage({ companies, toast, refreshCompanies }) {
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
      if (editing) await api.updateCompany(editing.id, form);
      else await api.createCompany(form);
      await refreshCompanies();
      toast.show(editing ? 'تم التحديث' : 'تم الإضافة', 'success');
      setShowForm(false);
    } catch (err) { toast.show('فشل', 'error'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (c) => {
    try { await api.setCompanyActive(c.id, !c.active); await refreshCompanies(); toast.show(c.active ? 'تم التعطيل' : 'تم التفعيل', 'info'); }
    catch (err) { toast.show('فشل', 'error'); }
  };

  const remove = async (c) => {
    if (!confirm(`حذف ${c.name}؟`)) return;
    try { await api.deleteCompany(c.id); await refreshCompanies(); toast.show('تم الحذف', 'info'); }
    catch (err) { toast.show('فشل', 'error'); }
  };

  if (showForm) {
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? `تعديل: ${editing.name}` : 'إضافة شركة جديدة'}</h2>
          <Button variant="ghost" icon={X} onClick={() => setShowForm(false)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="اسم الشركة" icon={Building2} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="الرمز المختصر (اختياري)" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
          <Input label="رقم العقد (اختياري)" value={form.contract} onChange={e => setForm(p => ({ ...p, contract: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button variant="primary" icon={Save} onClick={save} fullWidth disabled={saving}>{saving ? '...' : 'حفظ'}</Button>
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
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: THEME.colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={20} /></div>
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
                <Button size="sm" variant={c.active ? 'outline' : 'success'} onClick={() => toggleActive(c)}>{c.active ? 'تعطيل' : 'تفعيل'}</Button>
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
export function TeamsManagementPage({ teams, settings, toast, refreshTeams, refreshSettings }) {
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [editingCriterion, setEditingCriterion] = useState(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', startDateId: '1' });
  const [unifiedStartDate, setUnifiedStartDate] = useState(settings.unified_start_date_id || '1');
  const [saving, setSaving] = useState(false);

  const applyUnifiedDate = async () => {
    if (!confirm(`تطبيق "${DATES.find(d => d.id === unifiedStartDate)?.label}" كتاريخ بدء لجميع الفرق؟`)) return;
    setSaving(true);
    try {
      await api.applyUnifiedStartDateToAllTeams(unifiedStartDate);
      await api.updateSettings({ unifiedStartDateId: unifiedStartDate });
      await Promise.all([refreshTeams(), refreshSettings()]);
      toast.show('تم تطبيق التاريخ على كل الفرق', 'success');
    } catch (err) { toast.show('فشل التطبيق', 'error'); }
    finally { setSaving(false); }
  };

  const updateTeamField = async (teamId, updates) => {
    try { await api.updateTeam(teamId, updates); await refreshTeams(); toast.show('تم التحديث', 'success'); }
    catch (err) { toast.show('فشل', 'error'); }
  };

  const addCriterion = (teamId) => setEditingCriterion({ teamId, isNew: true, criterion: { name: '', type: 'yesno', noteRequired: 'no', repeat: 'daily' } });
  const editCriterion = (teamId, criterion) => setEditingCriterion({ teamId, isNew: false, criterion: { ...criterion } });

  const saveCriterion = async () => {
    const { teamId, isNew, criterion } = editingCriterion;
    if (!criterion.name) { toast.show('اسم المعيار مطلوب', 'warning'); return; }
    setSaving(true);
    try {
      if (isNew) await api.createCriterion(teamId, criterion);
      else await api.updateCriterion(criterion.id, criterion);
      await refreshTeams();
      toast.show(isNew ? 'تم الإضافة' : 'تم التحديث', 'success');
      setEditingCriterion(null);
    } catch (err) { toast.show('فشل', 'error'); }
    finally { setSaving(false); }
  };

  const deleteCrit = async (criterionId) => {
    if (!confirm('حذف المعيار؟')) return;
    try { await api.deleteCriterion(criterionId); await refreshTeams(); toast.show('تم الحذف', 'info'); }
    catch (err) { toast.show('فشل', 'error'); }
  };

  const deleteTeamHandler = async (teamId) => {
    if (!confirm('حذف الفريق؟')) return;
    try { await api.deleteTeam(teamId); await refreshTeams(); toast.show('تم الحذف', 'info'); }
    catch (err) { toast.show('فشل', 'error'); }
  };

  const addNewTeam = async () => {
    if (!teamForm.name) { toast.show('اسم الفريق مطلوب', 'warning'); return; }
    setSaving(true);
    try {
      await api.createTeam(teamForm); await refreshTeams();
      toast.show('تم الإضافة', 'success');
      setShowAddTeam(false);
      setTeamForm({ name: '', description: '', startDateId: '1' });
    } catch (err) { toast.show('فشل', 'error'); }
    finally { setSaving(false); }
  };

  if (editingCriterion) {
    const c = editingCriterion.criterion;
    const updateField = (field, value) => setEditingCriterion(prev => ({ ...prev, criterion: { ...prev.criterion, [field]: value } }));
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editingCriterion.isNew ? 'إضافة معيار' : 'تعديل معيار'}</h2>
          <Button variant="ghost" icon={X} onClick={() => setEditingCriterion(null)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>نص المعيار</label>
            <textarea value={c.name} onChange={e => updateField('name', e.target.value)} rows={2}
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}/>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>نوع الإجابة</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {[{ val: 'yesno', label: 'نعم/لا', icon: ThumbsUp }, { val: 'scale', label: 'تقييم من 5', icon: Award }, { val: 'number', label: 'رقم', icon: Hash }].map(opt => {
                const Icon = opt.icon;
                const selected = c.type === opt.val;
                return (
                  <button key={opt.val} onClick={() => updateField('type', opt.val)}
                    style={{ padding: '12px 14px', background: selected ? THEME.colors.primary : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `2px solid ${selected ? THEME.colors.primary : THEME.colors.border}`, borderRadius: THEME.radius.md, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Icon size={16} />{opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          {c.type === 'number' && <Input label="وحدة القياس" value={c.unit || ''} onChange={e => updateField('unit', e.target.value)} placeholder="كجم" />}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>تكرار السؤال</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              {[{ val: 'daily', label: 'يتكرر كل يوم' }, { val: 'first_day_only', label: 'أول يوم فقط' }].map(opt => {
                const selected = c.repeat === opt.val;
                return (
                  <button key={opt.val} onClick={() => updateField('repeat', opt.val)}
                    style={{ padding: '12px 14px', background: selected ? THEME.colors.primary : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `2px solid ${selected ? THEME.colors.primary : THEME.colors.border}`, borderRadius: THEME.radius.md, fontSize: 13, fontWeight: 700, minHeight: 48, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>إلزامية الملاحظة</label>
            <select value={c.noteRequired} onChange={e => updateField('noteRequired', e.target.value)}
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff', fontFamily: 'inherit' }}>
              <option value="no">اختيارية</option>
              <option value="low">إلزامية عند التقييم السلبي</option>
              <option value="always">إلزامية دائماً</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>
              متاح لـ (القسم)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
              {[
                { val: 'all', label: 'الكل (رجال ونساء)', icon: '👥' },
                { val: 'men', label: 'رجال فقط', icon: '👤' },
                { val: 'women', label: 'نساء فقط', icon: '👤' },
              ].map(opt => {
                const selected = (c.sectionScope || 'all') === opt.val;
                return (
                  <button key={opt.val} onClick={() => updateField('sectionScope', opt.val)}
                    style={{
                      padding: '10px 12px',
                      background: selected ? THEME.colors.primary : THEME.colors.surface,
                      color: selected ? '#fff' : THEME.colors.text,
                      border: `2px solid ${selected ? THEME.colors.primary : THEME.colors.border}`,
                      borderRadius: THEME.radius.md,
                      fontSize: 12, fontWeight: 700,
                      minHeight: 44, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    {opt.icon} {opt.label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 4 }}>
              المعيار سيظهر فقط للقسم المحدد. إذا اخترت "الكل" يظهر للجميع (الافتراضي).
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button variant="primary" icon={Save} onClick={saveCriterion} fullWidth disabled={saving}>{saving ? '...' : 'حفظ'}</Button>
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
          <Input label="اسم الفريق" value={teamForm.name} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="الوصف" value={teamForm.description} onChange={e => setTeamForm(p => ({ ...p, description: e.target.value }))} />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>تاريخ بدء العمل</label>
            <select value={teamForm.startDateId} onChange={e => setTeamForm(p => ({ ...p, startDateId: e.target.value }))}
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', minHeight: 48, background: '#fff', fontFamily: 'inherit' }}>
              {DATES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="primary" icon={Save} onClick={addNewTeam} fullWidth disabled={saving}>{saving ? '...' : 'إضافة'}</Button>
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

      <Card padding={16} style={{ marginBottom: 16, background: '#FFFCF5', border: `1.5px solid ${THEME.colors.accent}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Calendar size={18} color={THEME.colors.accent} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>توحيد تاريخ بدء جميع الفرق</span>
        </div>
        <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 10 }}>
          تطبيق تاريخ بدء واحد على كل الفرق. يمكنك بعدها تعديل أي فريق بشكل فردي.
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={unifiedStartDate} onChange={e => setUnifiedStartDate(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
            {DATES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <Button size="sm" variant="primary" icon={ArrowRight} onClick={applyUnifiedDate} disabled={saving}>تطبيق على كل الفرق</Button>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {teams.map(team => {
          const isExpanded = expandedTeam === team.id;
          const startDate = DATES.find(d => d.id === team.startDateId);
          return (
            <Card key={team.id} padding={0}>
              <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: 10 }} onClick={() => setExpandedTeam(isExpanded ? null : team.id)}>
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
                    <select value={team.startDateId} onChange={e => updateTeamField(team.id, { startDateId: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
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
                      <div key={c.id} style={{ padding: '10px 12px', background: THEME.colors.bgSecondary, borderRadius: THEME.radius.md, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.textTertiary, minWidth: 24 }}>{i + 1}.</span>
                        <span style={{ flex: 1, fontSize: 13, minWidth: 200 }}>{c.name}</span>
                        <Badge color={c.type === 'yesno' ? 'info' : c.type === 'scale' ? 'accent' : 'purple'} style={{ fontSize: 10 }}>
                          {c.type === 'yesno' ? 'نعم/لا' : c.type === 'scale' ? 'تقييم 5' : `رقم (${c.unit || ''})`}
                        </Badge>
                        {c.repeat === 'first_day_only' && <Badge color="warning" style={{ fontSize: 10 }}>أول يوم</Badge>}
                        {c.sectionScope === 'men' && <Badge color="info" style={{ fontSize: 10 }}>👤 رجال</Badge>}
                        {c.sectionScope === 'women' && <Badge color="danger" style={{ fontSize: 10 }}>👤 نساء</Badge>}
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
// Settings - مع إعدادات الإغلاق والجلسات
// =================================================================
export function SettingsPage({ settings, teams, refreshSettings, toast }) {
  const [tempDate, setTempDate] = useState(settings.season_start_date || '');
  const [closingMode, setClosingMode] = useState(settings.closing_mode || 'always_open');
  const [closingTime, setClosingTime] = useState((settings.closing_time || '19:00:00').slice(0, 5));
  const [saving, setSaving] = useState(false);

  // إعدادات الجلسات
  const [sessionsMode, setSessionsMode] = useState(settings.sessions_mode || 'single');
  const [session1Time, setSession1Time] = useState((settings.session1_close_time || '12:00:00').slice(0, 5));
  const [session2Time, setSession2Time] = useState((settings.session2_close_time || '22:00:00').slice(0, 5));
  const [sessionsScopeSection, setSessionsScopeSection] = useState(settings.sessions_scope_section || 'all');
  const [sessionsScopeTeams, setSessionsScopeTeams] = useState(settings.sessions_scope_teams || []);

  const saveSeasonDate = async () => {
    if (!tempDate) { toast.show('الرجاء تحديد تاريخ', 'warning'); return; }
    setSaving(true);
    try { await api.updateSettings({ seasonStartDate: tempDate }); await refreshSettings(); toast.show('تم الحفظ', 'success'); }
    catch (err) { toast.show('فشل', 'error'); }
    finally { setSaving(false); }
  };

  const saveClosingSettings = async () => {
    setSaving(true);
    try { await api.updateSettings({ closingMode, closingTime: closingTime + ':00' }); await refreshSettings(); toast.show('تم حفظ إعدادات الإغلاق', 'success'); }
    catch (err) { toast.show('فشل', 'error'); }
    finally { setSaving(false); }
  };

  const toggleManualClose = async (dateId) => {
    try { await api.toggleManualCloseForDate(dateId); await refreshSettings(); toast.show('تم التحديث', 'success'); }
    catch (err) { toast.show('فشل', 'error'); }
  };

  const saveSessionsSettings = async () => {
    setSaving(true);
    try {
      await api.updateSettings({
        sessionsMode,
        session1CloseTime: session1Time + ':00',
        session2CloseTime: session2Time + ':00',
        sessionsScopeSection,
        sessionsScopeTeams,
      });
      await refreshSettings();
      toast.show('تم حفظ إعدادات الجلسات', 'success');
    } catch (err) { toast.show('فشل الحفظ', 'error'); }
    finally { setSaving(false); }
  };

  const toggleScopeTeam = (teamId) => {
    setSessionsScopeTeams(prev =>
      prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
    );
  };

  const manuallyClosedDates = settings.manually_closed_dates || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>إعدادات النظام</h2>

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Calendar size={20} color={THEME.colors.accent} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>تاريخ بداية موسم ذي الحجة</h3>
        </div>
        <div style={{ padding: 12, background: THEME.colors.infoSoft, color: THEME.colors.info, borderRadius: THEME.radius.md, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>حدّد التاريخ الميلادي ليوم 1 من شهر ذي الحجة.</div>
        </div>
        <Input label="تاريخ 1 ذي الحجة (ميلادي)" type="date" value={tempDate} onChange={e => setTempDate(e.target.value)} />
        {settings.season_start_date && (
          <div style={{ marginTop: 12, padding: 10, background: THEME.colors.successSoft, color: THEME.colors.success, borderRadius: THEME.radius.md, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} />
            التاريخ الحالي: {new Date(settings.season_start_date).toLocaleDateString('ar-SA')}
          </div>
        )}
        <Button variant="primary" icon={Save} onClick={saveSeasonDate} fullWidth style={{ marginTop: 14 }} disabled={saving}>{saving ? '...' : 'حفظ التاريخ'}</Button>
      </Card>

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Clock size={20} color={THEME.colors.warning} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>إعدادات إغلاق التعبئة</h3>
        </div>
        <div style={{ fontSize: 13, color: THEME.colors.textSecondary, marginBottom: 14 }}>متى يُغلق التقييم اليومي للمدخلين؟</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 14 }}>
          {Object.entries(CLOSING_MODES).map(([key, mode]) => {
            const selected = closingMode === key;
            return (
              <button key={key} onClick={() => setClosingMode(key)}
                style={{ padding: '14px 16px', background: selected ? THEME.colors.primary : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `2px solid ${selected ? THEME.colors.primary : THEME.colors.border}`, borderRadius: THEME.radius.md, textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{mode.label}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{mode.description}</div>
              </button>
            );
          })}
        </div>
        {closingMode === 'custom_time' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>الوقت المحدد للإغلاق</label>
            <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, outline: 'none', minHeight: 48, background: '#fff', fontFamily: 'inherit' }}/>
            <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 4 }}>التعبئة تغلق في هذا الوقت من اليوم التالي</div>
          </div>
        )}
        <Button variant="primary" icon={Save} onClick={saveClosingSettings} fullWidth disabled={saving}>{saving ? '...' : 'حفظ إعدادات الإغلاق'}</Button>
      </Card>

      {/* كرت إعدادات الجلسات الجديد */}
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Clock size={20} color={THEME.colors.info} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>عدد جلسات التقييم في اليوم</h3>
        </div>
        <div style={{ fontSize: 13, color: THEME.colors.textSecondary, marginBottom: 14 }}>
          إذا أردت تقييم نفس المعايير مرّتين (صباحاً ومساءً)، فعّل الجلستين.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 14 }}>
          {[
            { val: 'single', label: 'جلسة واحدة', desc: 'تعبئة واحدة في اليوم' },
            { val: 'double', label: 'جلستان', desc: 'صباحية ومسائية منفصلتان' },
          ].map(opt => {
            const selected = sessionsMode === opt.val;
            return (
              <button key={opt.val} onClick={() => setSessionsMode(opt.val)}
                style={{
                  padding: '14px 16px',
                  background: selected ? THEME.colors.info : THEME.colors.surface,
                  color: selected ? '#fff' : THEME.colors.text,
                  border: `2px solid ${selected ? THEME.colors.info : THEME.colors.border}`,
                  borderRadius: THEME.radius.md, textAlign: 'right',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{opt.label}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>

        {sessionsMode === 'single' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 6 }}>
              وقت إغلاق التعبئة اليومية
            </label>
            <input type="time" value={session1Time} onChange={e => setSession1Time(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, outline: 'none', minHeight: 48, background: '#fff', fontFamily: 'inherit' }}/>
            <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 4 }}>
              مثال: 22:00 يعني التعبئة تغلق الساعة 10 مساءً
            </div>
          </div>
        )}

        {sessionsMode === 'double' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 4 }}>
                🌅 إغلاق الجلسة الصباحية
              </label>
              <input type="time" value={session1Time} onChange={e => setSession1Time(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, outline: 'none', background: '#fff', fontFamily: 'inherit' }}/>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 4 }}>
                🌆 إغلاق الجلسة المسائية
              </label>
              <input type="time" value={session2Time} onChange={e => setSession2Time(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, outline: 'none', background: '#fff', fontFamily: 'inherit' }}/>
            </div>
          </div>
        )}

        {sessionsMode === 'double' && (
          <>
            <div style={{
              padding: 12, background: '#F0F7FF',
              borderRadius: THEME.radius.md, marginBottom: 14,
              borderRight: `3px solid ${THEME.colors.info}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Filter size={14} color={THEME.colors.info} />
                <span style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.info }}>
                  نطاق تطبيق الجلستين
                </span>
              </div>
              <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 10 }}>
                هل ينطبق وضع الجلستين على جميع الأقسام أم على قسم محدد؟
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6 }}>
                {[
                  { val: 'all', label: 'كل الأقسام', icon: '👥' },
                  { val: 'men', label: 'قسم الرجال فقط', icon: '👤' },
                  { val: 'women', label: 'قسم النساء فقط', icon: '👤' },
                ].map(opt => {
                  const selected = sessionsScopeSection === opt.val;
                  return (
                    <button key={opt.val} onClick={() => setSessionsScopeSection(opt.val)}
                      style={{
                        padding: '10px 12px',
                        background: selected ? THEME.colors.primary : '#fff',
                        color: selected ? '#fff' : THEME.colors.text,
                        border: `1.5px solid ${selected ? THEME.colors.primary : THEME.colors.border}`,
                        borderRadius: THEME.radius.md,
                        fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      {opt.icon} {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{
              padding: 12, background: '#FFFCF5',
              borderRadius: THEME.radius.md, marginBottom: 14,
              borderRight: `3px solid ${THEME.colors.accent}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <UsersIcon size={14} color={THEME.colors.accent} />
                <span style={{ fontSize: 13, fontWeight: 700, color: THEME.colors.accent }}>
                  فرق محددة (اختياري)
                </span>
              </div>
              <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 10 }}>
                اترك فارغاً لتطبيق الجلستين على كل الفرق. اختر فرقاً محددة لتطبيقها عليها فقط.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(teams || []).map(t => {
                  const selected = sessionsScopeTeams.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleScopeTeam(t.id)}
                      style={{
                        padding: '6px 12px',
                        background: selected ? THEME.colors.accent : '#fff',
                        color: selected ? '#fff' : THEME.colors.text,
                        border: `1.5px solid ${selected ? THEME.colors.accent : THEME.colors.border}`,
                        borderRadius: THEME.radius.full,
                        fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      {selected && <Check size={11} style={{ display: 'inline', marginLeft: 4 }} />}
                      {t.name}
                    </button>
                  );
                })}
              </div>
              {sessionsScopeTeams.length > 0 && (
                <button onClick={() => setSessionsScopeTeams([])}
                  style={{
                    marginTop: 8, padding: '4px 10px',
                    background: 'transparent', border: 'none',
                    color: THEME.colors.danger, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  مسح كل التحديدات
                </button>
              )}
            </div>
          </>
        )}

        <Button variant="primary" icon={Save} onClick={saveSessionsSettings} fullWidth disabled={saving}>
          {saving ? '...' : 'حفظ إعدادات الجلسات'}
        </Button>
      </Card>

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Lock size={20} color={THEME.colors.danger} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>الإغلاق اليدوي لأيام محددة</h3>
        </div>
        <div style={{ fontSize: 13, color: THEME.colors.textSecondary, marginBottom: 14 }}>اضغط على يوم لإغلاق/فتح التعبئة فيه يدوياً.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 6 }}>
          {DATES.map(d => {
            const isClosed = manuallyClosedDates.includes(d.id);
            return (
              <button key={d.id} onClick={() => toggleManualClose(d.id)}
                style={{ padding: '10px 12px', background: isClosed ? THEME.colors.dangerSoft : THEME.colors.surface, color: isClosed ? THEME.colors.danger : THEME.colors.text, border: `1.5px solid ${isClosed ? THEME.colors.danger : THEME.colors.border}`, borderRadius: THEME.radius.md, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {isClosed ? <Lock size={12} /> : <Unlock size={12} />}
                {d.label}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// =================================================================
// Reports Page
// =================================================================
export function ReportsPage({ teams, companies, evaluations, settings, toast }) {
  const [reportPeriod, setReportPeriod] = useState('today');
  const [customStart, setCustomStart] = useState('1');
  const [customEnd, setCustomEnd] = useState('13');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [reportSections, setReportSections] = useState({
    kpis: true, companyChart: true, teamsChart: true,
    scaleDistribution: true, leaderboard: true, notes: false,
  });
  const [generating, setGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const reportRef = useRef(null);

  const criteriaById = useMemo(() => {
    const map = {};
    teams.forEach(t => t.criteria.forEach(c => { map[c.id] = { ...c, teamId: t.id }; }));
    return map;
  }, [teams]);

  const todayId = getDefaultDateId(settings.season_start_date);

  const dateRange = useMemo(() => {
    const todayNum = parseInt(todayId);
    if (reportPeriod === 'today') return { start: todayId, end: todayId };
    if (reportPeriod === 'yesterday') { const y = Math.max(1, todayNum - 1); return { start: String(y), end: String(y) }; }
    if (reportPeriod === 'last_week') { const start = Math.max(1, todayNum - 6); return { start: String(start), end: String(todayNum) }; }
    return { start: customStart, end: customEnd };
  }, [reportPeriod, customStart, customEnd, todayId]);

  const filteredEvals = useMemo(() => {
    const startNum = parseInt(dateRange.start);
    const endNum = parseInt(dateRange.end);
    const teamCriteriaIds = selectedTeams.length > 0
      ? new Set(teams.filter(t => selectedTeams.includes(t.id)).flatMap(t => t.criteria.map(c => c.id)))
      : null;
    return evaluations.filter(e => {
      const dNum = parseInt(e.date_id);
      if (dNum < startNum || dNum > endNum) return false;
      if (selectedCompanies.length > 0 && !selectedCompanies.includes(e.company_id)) return false;
      if (selectedSections.length > 0 && !selectedSections.includes(e.section)) return false;
      if (teamCriteriaIds && !teamCriteriaIds.has(e.criterion_id)) return false;
      return true;
    });
  }, [evaluations, dateRange, selectedCompanies, selectedSections, selectedTeams, teams]);

  const stats = useMemo(() => calculateStats(filteredEvals, criteriaById), [filteredEvals, criteriaById]);

  const reportTitle = useMemo(() => {
    if (reportPeriod === 'today') return 'تقرير اليوم';
    if (reportPeriod === 'yesterday') return 'تقرير الأمس';
    if (reportPeriod === 'last_week') return 'تقرير الأسبوع الماضي';
    return `تقرير من ${DATES.find(d => d.id === customStart)?.label} إلى ${DATES.find(d => d.id === customEnd)?.label}`;
  }, [reportPeriod, customStart, customEnd]);

  const toggleArr = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const downloadPNG = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#FAF7F2', scale: 2, useCORS: true, logging: false });
      const link = document.createElement('a');
      link.download = `${reportTitle}-${new Date().toISOString().slice(0, 10)}.png`;
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
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#FAF7F2', scale: 2, useCORS: true, logging: false });
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
      pdf.save(`${reportTitle}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.show('تم تنزيل PDF', 'success');
    } catch (err) { console.error(err); toast.show('فشل تنزيل PDF', 'error'); }
    finally { setGenerating(false); }
  };

  const companyPerf = useMemo(() => {
    const targets = selectedCompanies.length > 0 ? companies.filter(c => selectedCompanies.includes(c.id)) : companies.filter(c => c.active);
    return targets.map(c => {
      const cEvals = filteredEvals.filter(e => e.company_id === c.id);
      return { name: c.name.replace('شركة ', ''), fullName: c.name, overall: calculateStats(cEvals, criteriaById).overall, evals: cEvals.length };
    }).filter(c => c.evals > 0).sort((a, b) => b.overall - a.overall);
  }, [companies, selectedCompanies, filteredEvals, criteriaById]);

  const teamPerf = useMemo(() => {
    const targets = selectedTeams.length > 0 ? teams.filter(t => selectedTeams.includes(t.id)) : teams;
    return targets.map(t => {
      const teamIds = t.criteria.map(c => c.id);
      const tEvals = filteredEvals.filter(e => teamIds.includes(e.criterion_id));
      return { name: t.name.replace('فريق ', '').replace('الفريق ', ''), rate: calculateStats(tEvals, criteriaById).overall, evals: tEvals.length };
    }).filter(t => t.evals > 0).sort((a, b) => b.rate - a.rate);
  }, [teams, selectedTeams, filteredEvals, criteriaById]);

  const scaleData = [
    { name: 'ممتاز', value: stats.scaleDistribution[5], color: SCALE_LABELS[5].color },
    { name: 'جيد جداً', value: stats.scaleDistribution[4], color: SCALE_LABELS[4].color },
    { name: 'جيد', value: stats.scaleDistribution[3], color: SCALE_LABELS[3].color },
    { name: 'ضعيف', value: stats.scaleDistribution[2], color: SCALE_LABELS[2].color },
    { name: 'ضعيف جداً', value: stats.scaleDistribution[1], color: SCALE_LABELS[1].color },
  ].filter(s => s.value > 0);
  const totalScale = scaleData.reduce((s, x) => s + x.value, 0);

  const negativeNotes = useMemo(() => {
    return filteredEvals.filter(e => {
      if (!e.note?.trim()) return false;
      const num = parseFloat(e.value);
      return e.value === 'no' || e.value === 'na' || (!isNaN(num) && num < 3);
    }).slice(0, 30);
  }, [filteredEvals]);

  if (previewMode) {
    return (
      <div>
        <Card padding={14} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <Button variant="outline" icon={ChevronRight} onClick={() => setPreviewMode(false)}>رجوع</Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" icon={FileImage} onClick={downloadPNG} disabled={generating}>{generating ? '...' : 'تنزيل صورة'}</Button>
              <Button variant="primary" icon={FileDown} onClick={downloadPDF} disabled={generating}>{generating ? '...' : 'تنزيل PDF'}</Button>
            </div>
          </div>
        </Card>
        <div ref={reportRef} style={{ background: THEME.colors.bg, padding: 20 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginBottom: 16, textAlign: 'center', border: `1px solid ${THEME.colors.border}` }}>
            <Logo height={60} />
            <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 12, color: THEME.colors.primary }}>{reportTitle}</h1>
            <div style={{ fontSize: 13, color: THEME.colors.textSecondary, marginTop: 6 }}>شركة إثراء التجربة — موسم 1447هـ</div>
            <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginTop: 4 }}>تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</div>
          </div>

          {reportSections.kpis && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              <KPICard icon={CheckCircle2} label="المعدل العام" value={stats.overall} unit="%" color="success" />
              <KPICard icon={Award} label="متوسط التقييم" value={stats.avgScale} unit="/5" color="accent" />
              <KPICard icon={Activity} label="إجمالي التقييمات" value={stats.total} color="info" />
              <KPICard icon={ThumbsUp} label="الامتثال" value={stats.complianceRate} unit="%" color="success" />
              <KPICard icon={AlertTriangle} label="ملاحظات سلبية" value={stats.negatives} color="warning" />
              <KPICard icon={MessageSquare} label="ملاحظات" value={stats.notes} color="info" />
            </div>
          )}

          {reportSections.companyChart && companyPerf.length > 0 && (
            <Card padding={20} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Building2 size={20} color={THEME.colors.primary} />
                <div style={{ fontSize: 15, fontWeight: 700 }}>أداء الشركات</div>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(200, companyPerf.length * 50)}>
                <BarChart data={companyPerf} layout="vertical" margin={{ right: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Bar dataKey="overall" radius={[0, 6, 6, 0]}>
                    {companyPerf.map((c, i) => <Cell key={i} fill={c.overall >= 90 ? THEME.colors.success : c.overall >= 80 ? THEME.colors.accent : THEME.colors.warning} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {reportSections.teamsChart && teamPerf.length > 0 && (
            <Card padding={20} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <UsersIcon size={20} color={THEME.colors.primary} />
                <div style={{ fontSize: 15, fontWeight: 700 }}>أداء الفرق</div>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(200, teamPerf.length * 35)}>
                <BarChart data={teamPerf} layout="vertical" margin={{ right: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                    {teamPerf.map((t, i) => <Cell key={i} fill={t.rate >= 90 ? THEME.colors.success : t.rate >= 80 ? THEME.colors.accent : THEME.colors.warning} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {reportSections.scaleDistribution && totalScale > 0 && (
            <Card padding={20} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <PieChartIcon size={20} color={THEME.colors.accent} />
                <div style={{ fontSize: 15, fontWeight: 700 }}>توزيع التقييمات</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={scaleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                      {scaleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {scaleData.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                      <span style={{ flex: 1 }}>{s.name}</span>
                      <span style={{ fontWeight: 700, color: s.color }}>{s.value} ({Math.round(s.value / totalScale * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {reportSections.leaderboard && companyPerf.length > 0 && (
            <Card padding={20} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Trophy size={20} color={THEME.colors.accent} />
                <div style={{ fontSize: 15, fontWeight: 700 }}>ترتيب الشركات</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {companyPerf.map((c, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: i < 3 ? '#FFFCF5' : THEME.colors.bgSecondary, borderRadius: 8 }}>
                      <div style={{ minWidth: 32, fontSize: 14, fontWeight: 800 }}>{i < 3 ? medals[i] : `#${i + 1}`}</div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.fullName}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: c.overall >= 90 ? THEME.colors.success : c.overall >= 80 ? THEME.colors.accent : THEME.colors.warning }}>{c.overall}%</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {reportSections.notes && negativeNotes.length > 0 && (
            <Card padding={20} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <MessageSquare size={20} color={THEME.colors.warning} />
                <div style={{ fontSize: 15, fontWeight: 700 }}>ملاحظات سلبية ({negativeNotes.length})</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {negativeNotes.map((n, i) => {
                  const company = companies.find(c => c.id === n.company_id);
                  const criterion = criteriaById[n.criterion_id];
                  return (
                    <div key={i} style={{ padding: 12, background: THEME.colors.bgSecondary, borderRadius: 8, borderRight: `3px solid ${THEME.colors.warning}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: THEME.colors.primary }}>{criterion?.name || 'معيار محذوف'}</div>
                      <div style={{ fontSize: 11, color: THEME.colors.textTertiary, marginBottom: 6 }}>{company?.name} · {n.section} · {DATES.find(d => d.id === n.date_id)?.label}</div>
                      <div style={{ fontSize: 12, color: THEME.colors.textSecondary, lineHeight: 1.6 }}>{n.note}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>التقارير</h2>

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Calendar size={18} color={THEME.colors.accent} />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>الفترة الزمنية</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 14 }}>
          {[{ val: 'today', label: 'اليوم' }, { val: 'yesterday', label: 'الأمس' }, { val: 'last_week', label: 'الأسبوع الماضي' }, { val: 'custom', label: 'فترة مخصصة' }].map(opt => {
            const selected = reportPeriod === opt.val;
            return (
              <button key={opt.val} onClick={() => setReportPeriod(opt.val)}
                style={{ padding: '12px 14px', background: selected ? THEME.colors.primary : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `2px solid ${selected ? THEME.colors.primary : THEME.colors.border}`, borderRadius: THEME.radius.md, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{opt.label}</button>
            );
          })}
        </div>
        {reportPeriod === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 4 }}>من</label>
              <select value={customStart} onChange={e => setCustomStart(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
                {DATES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: THEME.colors.textSecondary, marginBottom: 4 }}>إلى</label>
              <select value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: THEME.radius.md, border: `1.5px solid ${THEME.colors.border}`, direction: 'rtl', outline: 'none', background: '#fff', fontFamily: 'inherit' }}>
                {DATES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </Card>

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Filter size={18} color={THEME.colors.accent} />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>الفلاتر</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.textTertiary, marginBottom: 6 }}>القسم:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['رجال', 'نساء'].map(s => {
                const selected = selectedSections.includes(s);
                return (
                  <button key={s} onClick={() => toggleArr(selectedSections, setSelectedSections, s)}
                    style={{ padding: '6px 14px', background: selected ? THEME.colors.success : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `1.5px solid ${selected ? THEME.colors.success : THEME.colors.border}`, borderRadius: THEME.radius.full, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {selected && <Check size={12} style={{ display: 'inline', marginLeft: 4 }} />}{s}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.textTertiary, marginBottom: 6 }}>الشركات:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {companies.filter(c => c.active).map(c => {
                const selected = selectedCompanies.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleArr(selectedCompanies, setSelectedCompanies, c.id)}
                    style={{ padding: '6px 12px', background: selected ? THEME.colors.primary : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `1.5px solid ${selected ? THEME.colors.primary : THEME.colors.border}`, borderRadius: THEME.radius.full, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {selected && <Check size={12} style={{ display: 'inline', marginLeft: 4 }} />}{c.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: THEME.colors.textTertiary, marginBottom: 6 }}>الفرق:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {teams.map(t => {
                const selected = selectedTeams.includes(t.id);
                return (
                  <button key={t.id} onClick={() => toggleArr(selectedTeams, setSelectedTeams, t.id)}
                    style={{ padding: '6px 12px', background: selected ? THEME.colors.accent : THEME.colors.surface, color: selected ? '#fff' : THEME.colors.text, border: `1.5px solid ${selected ? THEME.colors.accent : THEME.colors.border}`, borderRadius: THEME.radius.full, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {selected && <Check size={12} style={{ display: 'inline', marginLeft: 4 }} />}{t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <FileText size={18} color={THEME.colors.accent} />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>أقسام التقرير</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'kpis', label: 'المؤشرات الرئيسية (KPIs)' },
            { key: 'companyChart', label: 'رسم أداء الشركات' },
            { key: 'teamsChart', label: 'رسم أداء الفرق' },
            { key: 'scaleDistribution', label: 'توزيع التقييمات' },
            { key: 'leaderboard', label: 'ترتيب الشركات' },
            { key: 'notes', label: 'الملاحظات السلبية' },
          ].map(opt => (
            <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: reportSections[opt.key] ? THEME.colors.successSoft : THEME.colors.bgSecondary, borderRadius: THEME.radius.md, cursor: 'pointer' }}>
              <input type="checkbox" checked={reportSections[opt.key]} onChange={e => setReportSections(prev => ({ ...prev, [opt.key]: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }}/>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card padding={20} style={{ background: '#FFFCF5', border: `2px solid ${THEME.colors.accent}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <FileBarChart size={20} color={THEME.colors.accent} />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>إنشاء التقرير</h3>
        </div>
        <div style={{ fontSize: 12, color: THEME.colors.textSecondary, marginBottom: 12 }}>{filteredEvals.length} تقييم في النطاق المحدد · المعدل العام: {stats.overall}%</div>
        <Button variant="primary" icon={Eye} fullWidth size="lg" onClick={() => setPreviewMode(true)} disabled={filteredEvals.length === 0}>
          {filteredEvals.length === 0 ? 'لا توجد بيانات في النطاق المحدد' : 'معاينة التقرير'}
        </Button>
      </Card>
    </div>
  );
}
