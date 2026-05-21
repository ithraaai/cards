import { supabase } from './supabase.js';

// =================================================================
// المجالات والمراحل (Lookups)
// =================================================================
export async function getDomains() {
  const { data, error } = await supabase
    .from('contract_domains').select('*').eq('active', true).order('sort_order');
  if (error) throw error;
  return data;
}

export async function getPhases() {
  const { data, error } = await supabase
    .from('contract_phases').select('*').order('sort_order');
  if (error) throw error;
  return data;
}

export async function getViolationLevels() {
  const { data, error } = await supabase
    .from('violation_levels').select('*').order('sort_order');
  if (error) throw error;
  return data;
}

// =================================================================
// القوائم والمعايير
// =================================================================
export async function getChecklists(domainId = null, phaseId = null) {
  let query = supabase
    .from('contract_checklists').select('*').eq('active', true).order('sort_order');
  if (domainId) query = query.eq('domain_id', domainId);
  if (phaseId) query = query.eq('phase_id', phaseId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getChecklistCriteria(checklistId, companyId = null) {
  let query = supabase
    .from('contract_criteria')
    .select('*')
    .eq('checklist_id', checklistId)
    .eq('active', true)
    .order('sort_order');
  const { data, error } = await query;
  if (error) throw error;
  if (companyId) {
    return data.filter(c => c.company_id === null || c.company_id === companyId);
  }
  return data.filter(c => c.company_id === null);
}

export async function createCriterion(criterion) {
  const { data, error } = await supabase
    .from('contract_criteria')
    .insert({
      checklist_id: criterion.checklistId,
      company_id: criterion.companyId || null,
      section: criterion.section || null,
      name_ar: criterion.nameAr,
      description: criterion.description || null,
      answer_type: criterion.answerType || 'compliance',
      required_qty: criterion.requiredQty || null,
      qty_unit: criterion.qtyUnit || null,
      min_value: criterion.minValue || null,
      max_value: criterion.maxValue || null,
      is_critical: criterion.isCritical || false,
      note_required: criterion.noteRequired || 'on_violation',
      sort_order: criterion.sortOrder || 0,
      active: true,
    })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateCriterion(id, updates) {
  const payload = {};
  if (updates.nameAr !== undefined) payload.name_ar = updates.nameAr;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.section !== undefined) payload.section = updates.section;
  if (updates.answerType !== undefined) payload.answer_type = updates.answerType;
  if (updates.requiredQty !== undefined) payload.required_qty = updates.requiredQty;
  if (updates.qtyUnit !== undefined) payload.qty_unit = updates.qtyUnit;
  if (updates.minValue !== undefined) payload.min_value = updates.minValue;
  if (updates.maxValue !== undefined) payload.max_value = updates.maxValue;
  if (updates.isCritical !== undefined) payload.is_critical = updates.isCritical;
  if (updates.noteRequired !== undefined) payload.note_required = updates.noteRequired;
  if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
  if (updates.active !== undefined) payload.active = updates.active;
  const { data, error } = await supabase
    .from('contract_criteria').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCriterion(id) {
  const { error } = await supabase.from('contract_criteria').delete().eq('id', id);
  if (error) throw error;
}

// =================================================================
// ملخص الشركات/المجالات
// =================================================================
export async function getCompanyDomainSummary() {
  const { data, error } = await supabase.from('v_company_domain_summary').select('*');
  if (error) throw error;
  return data;
}

// =================================================================
// جلسات التعبئة (المراقبون)
// =================================================================

// إنشاء جلسة جديدة (أو إرجاع جلسة موجودة لنفس الشركة/المجال/اليوم/القائمة)
export async function getOrCreateSession({ companyId, domainId, checklistId, dateId, monitorId }) {
  // ابحث عن جلسة موجودة (للقوائم اليومية: نفس اليوم. للجاهزية: قد تكون NULL)
  const { data: existing, error: searchErr } = await supabase
    .from('contract_evaluation_sessions')
    .select('*')
    .eq('company_id', companyId)
    .eq('domain_id', domainId)
    .eq('checklist_id', checklistId)
    .eq('date_id', dateId || '')
    .neq('status', 'approved')  // لو معتمدة، أنشئ جديدة
    .maybeSingle();
  if (searchErr) console.error('بحث الجلسة:', searchErr);

  if (existing) return existing;

  // أنشئ جلسة جديدة
  const { data, error } = await supabase
    .from('contract_evaluation_sessions')
    .insert({
      company_id: companyId,
      domain_id: domainId,
      checklist_id: checklistId,
      date_id: dateId || null,
      monitor_id: monitorId,
      status: 'in_progress',
    })
    .select().single();
  if (error) throw error;
  return data;
}

// جلب الجلسات السابقة للمراقب
export async function getMonitorSessions(monitorId, limit = 30) {
  const { data, error } = await supabase
    .from('contract_evaluation_sessions')
    .select(`
      *,
      checklist:contract_checklists(name_ar, phase_id)
    `)
    .eq('monitor_id', monitorId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// جلب التعبئات الحالية لجلسة
export async function getSessionEvaluations(sessionId) {
  const { data, error } = await supabase
    .from('contract_evaluations')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data;
}

// حفظ تعبئة معيار (upsert)
export async function saveEvaluation({ sessionId, criterionId, status, note, valueText, valueNumber, valueBool, filledBy }) {
  const { data, error } = await supabase
    .from('contract_evaluations')
    .upsert({
      session_id: sessionId,
      criterion_id: criterionId,
      status: status || null,
      note: note || null,
      value_text: valueText || null,
      value_number: valueNumber != null ? valueNumber : null,
      value_bool: valueBool != null ? valueBool : null,
      filled_by: filledBy,
      filled_at: new Date().toISOString(),
    }, { onConflict: 'session_id,criterion_id' })
    .select().single();
  if (error) throw error;
  // تحديث عدّاد الجلسة
  await refreshSessionCounts(sessionId);
  return data;
}

// تحديث الإحصاءات في الجلسة
async function refreshSessionCounts(sessionId) {
  const { data: evals } = await supabase
    .from('contract_evaluations').select('status').eq('session_id', sessionId);
  if (!evals) return;
  const compliant = evals.filter(e => e.status === 'compliant').length;
  const violation = evals.filter(e => e.status === 'violation').length;
  await supabase
    .from('contract_evaluation_sessions')
    .update({
      total_items: evals.length,
      compliant_items: compliant,
      violation_items: violation,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

// إكمال الجلسة (submit)
export async function submitSession(sessionId) {
  const { data, error } = await supabase
    .from('contract_evaluation_sessions')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', sessionId).select().single();
  if (error) throw error;
  return data;
}

// =================================================================
// المخالفات والشواهد
// =================================================================

// تسجيل مخالفة (تلقائياً عند ضغط "مخالف")
export async function recordViolation({
  companyId, domainId, sessionId, criterionId,
  dateId, levelId, description, evidenceUrl, reportedBy, isCritical
}) {
  const { data, error } = await supabase
    .from('contract_violations')
    .insert({
      company_id: companyId,
      domain_id: domainId,
      session_id: sessionId,
      criterion_id: criterionId,
      violation_date: new Date().toISOString().split('T')[0],
      date_id: dateId,
      level_id: levelId || (isCritical ? 'critical' : 'medium'),
      description: description || 'مخالفة مسجّلة تلقائياً',
      evidence_url: evidenceUrl || null,
      reported_by: reportedBy,
      escalated: isCritical || false,
      status: 'open',
    })
    .select().single();
  if (error) throw error;
  return data;
}

// حذف مخالفة مرتبطة بتقييم (عند تغيير المخالف لمطابق)
export async function deleteViolationByCriterion(sessionId, criterionId) {
  const { error } = await supabase
    .from('contract_violations')
    .delete()
    .eq('session_id', sessionId)
    .eq('criterion_id', criterionId);
  if (error) console.error('فشل حذف المخالفة:', error);
}

// تحديث المخالفة (الوصف، الشاهد، الإبلاغ)
export async function updateViolation(id, updates) {
  const payload = {};
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.evidenceUrl !== undefined) payload.evidence_url = updates.evidenceUrl;
  if (updates.notifiedParty !== undefined) {
    payload.notified_party = updates.notifiedParty;
    if (updates.notifiedParty) payload.notified_at = new Date().toISOString();
  }
  if (updates.actionTaken !== undefined) payload.action_taken = updates.actionTaken;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.levelId !== undefined) payload.level_id = updates.levelId;
  payload.updated_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('contract_violations').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// جلب المخالفات لجلسة معينة
export async function getSessionViolations(sessionId) {
  const { data, error } = await supabase
    .from('contract_violations')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data;
}

// جلب المخالفات لشركة ومجال
export async function getViolations({ companyId, domainId, dateFrom, dateTo, status, limit = 100 }) {
  let query = supabase
    .from('contract_violations')
    .select(`
      *,
      level:violation_levels(name_ar, color),
      criterion:contract_criteria(name_ar, is_critical)
    `)
    .order('violation_date', { ascending: false })
    .limit(limit);
  if (companyId) query = query.eq('company_id', companyId);
  if (domainId) query = query.eq('domain_id', domainId);
  if (status) query = query.eq('status', status);
  if (dateFrom) query = query.gte('violation_date', dateFrom);
  if (dateTo) query = query.lte('violation_date', dateTo);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// إحصاءات المخالفات
export async function getViolationStats(companyId, domainId) {
  const { data, error } = await supabase
    .from('contract_violations')
    .select('level_id, escalated, status')
    .eq('company_id', companyId)
    .eq('domain_id', domainId);
  if (error) throw error;
  return {
    total: data.length,
    critical: data.filter(v => v.level_id === 'critical').length,
    high: data.filter(v => v.level_id === 'high').length,
    open: data.filter(v => v.status === 'open').length,
    notified: data.filter(v => v.notified_party).length,
  };
}
