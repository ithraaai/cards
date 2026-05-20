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
