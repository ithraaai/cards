import { supabase } from './supabase.js';

// =================================================================
// المجالات والمراحل (Lookups)
// =================================================================
export async function getDomains() {
  const { data, error } = await supabase
    .from('contract_domains')
    .select('*')
    .eq('active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function getPhases() {
  const { data, error } = await supabase
    .from('contract_phases')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function getViolationLevels() {
  const { data, error } = await supabase
    .from('violation_levels')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

// =================================================================
// المتعهدون
// =================================================================
export async function getContractors() {
  const { data, error } = await supabase
    .from('contractors')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createContractor(contractor) {
  const { data, error } = await supabase
    .from('contractors')
    .insert({
      name: contractor.name,
      short_name: contractor.shortName || null,
      commercial_reg: contractor.commercialReg || null,
      representative: contractor.representative || null,
      phone: contractor.phone || null,
      email: contractor.email || null,
      address: contractor.address || null,
      notes: contractor.notes || null,
      active: contractor.active !== false,
    })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateContractor(id, updates) {
  const payload = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.shortName !== undefined) payload.short_name = updates.shortName;
  if (updates.commercialReg !== undefined) payload.commercial_reg = updates.commercialReg;
  if (updates.representative !== undefined) payload.representative = updates.representative;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.active !== undefined) payload.active = updates.active;
  const { data, error } = await supabase
    .from('contractors').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteContractor(id) {
  const { error } = await supabase.from('contractors').delete().eq('id', id);
  if (error) throw error;
}

// =================================================================
// العقود
// =================================================================
export async function getContracts() {
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      contractor:contractors(id, name, short_name),
      company:companies(id, name),
      domain:contract_domains(id, name_ar, icon)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getContractById(id) {
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      contractor:contractors(id, name, short_name, representative, phone),
      company:companies(id, name),
      domain:contract_domains(id, name_ar, icon)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createContract(contract) {
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      contractor_id: contract.contractorId,
      company_id: contract.companyId,
      domain_id: contract.domainId,
      contract_number: contract.contractNumber || null,
      hijri_year: contract.hijriYear || '1447',
      pilgrims_count: contract.pilgrimsCount || null,
      start_date: contract.startDate || null,
      end_date: contract.endDate || null,
      total_value: contract.totalValue || null,
      performance_bond: contract.performanceBond || null,
      max_penalty_pct: contract.maxPenaltyPct || 30.00,
      notes: contract.notes || null,
      active: contract.active !== false,
    })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateContract(id, updates) {
  const payload = { updated_at: new Date().toISOString() };
  if (updates.contractorId !== undefined) payload.contractor_id = updates.contractorId;
  if (updates.contractNumber !== undefined) payload.contract_number = updates.contractNumber;
  if (updates.pilgrimsCount !== undefined) payload.pilgrims_count = updates.pilgrimsCount;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.totalValue !== undefined) payload.total_value = updates.totalValue;
  if (updates.performanceBond !== undefined) payload.performance_bond = updates.performanceBond;
  if (updates.maxPenaltyPct !== undefined) payload.max_penalty_pct = updates.maxPenaltyPct;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.active !== undefined) payload.active = updates.active;
  const { data, error } = await supabase
    .from('contracts').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteContract(id) {
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw error;
}

// =================================================================
// القوائم والمعايير
// =================================================================
export async function getChecklists(domainId = null, phaseId = null) {
  let query = supabase
    .from('contract_checklists')
    .select('*')
    .eq('active', true)
    .order('sort_order');
  if (domainId) query = query.eq('domain_id', domainId);
  if (phaseId) query = query.eq('phase_id', phaseId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getChecklistCriteria(checklistId, contractId = null) {
  // معايير القوالب (contract_id IS NULL) + معايير العقد المحدد إن وُجد
  let query = supabase
    .from('contract_criteria')
    .select('*')
    .eq('checklist_id', checklistId)
    .eq('active', true)
    .order('sort_order');
  const { data, error } = await query;
  if (error) throw error;
  // فلترة: قوالب فقط أو المخصصة للعقد
  if (contractId) {
    return data.filter(c => c.contract_id === null || c.contract_id === contractId);
  }
  return data.filter(c => c.contract_id === null);
}

export async function createCriterion(criterion) {
  const { data, error } = await supabase
    .from('contract_criteria')
    .insert({
      checklist_id: criterion.checklistId,
      contract_id: criterion.contractId || null,
      section: criterion.section || null,
      code: criterion.code || null,
      name_ar: criterion.nameAr,
      description: criterion.description || null,
      answer_type: criterion.answerType || 'compliance',
      required_qty: criterion.requiredQty || null,
      qty_unit: criterion.qtyUnit || null,
      min_value: criterion.minValue || null,
      max_value: criterion.maxValue || null,
      target_value: criterion.targetValue || null,
      is_critical: criterion.isCritical || false,
      default_violation_level: criterion.defaultViolationLevel || null,
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
  if (updates.answerType !== undefined) payload.answer_type = updates.answerType;
  if (updates.requiredQty !== undefined) payload.required_qty = updates.requiredQty;
  if (updates.qtyUnit !== undefined) payload.qty_unit = updates.qtyUnit;
  if (updates.minValue !== undefined) payload.min_value = updates.minValue;
  if (updates.maxValue !== undefined) payload.max_value = updates.maxValue;
  if (updates.targetValue !== undefined) payload.target_value = updates.targetValue;
  if (updates.isCritical !== undefined) payload.is_critical = updates.isCritical;
  if (updates.noteRequired !== undefined) payload.note_required = updates.noteRequired;
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
// ملخص العقود (للوحة القيادة)
// =================================================================
export async function getContractSummary() {
  const { data, error } = await supabase
    .from('v_contract_summary')
    .select('*');
  if (error) throw error;
  return data;
}
