// =================================================================
// طبقة API — كل عمليات قاعدة البيانات
// =================================================================
// هذا الملف يحتوي على كل الدوال التي تتعامل مع Supabase.
// التطبيق يستدعي هذه الدوال بدلاً من التعامل مع قاعدة البيانات مباشرة.
// =================================================================

import { supabase } from './supabase.js';

// =================================================================
// USERS - المستخدمون
// =================================================================

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function findUserByUsername(username) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createUser(user) {
  const payload = {
    name: user.name,
    username: user.username.toLowerCase(),
    role: user.role,
    company_id: user.companyId || null,
    section: user.section || null,
    phone: user.phone || null,
    active: user.active !== false,
  };
  const { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUser(id, updates) {
  const payload = {
    name: updates.name,
    username: updates.username?.toLowerCase(),
    role: updates.role,
    company_id: updates.companyId || null,
    section: updates.section || null,
    phone: updates.phone || null,
    updated_at: new Date().toISOString(),
  };
  // إزالة undefined fields
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setUserActive(id, active) {
  const { data, error } = await supabase
    .from('users')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUser(id) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =================================================================
// COMPANIES - الشركات
// =================================================================

export async function getAllCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCompany(company) {
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: company.name,
      code: company.code || null,
      contract: company.contract || null,
      active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id, updates) {
  const { data, error } = await supabase
    .from('companies')
    .update({
      name: updates.name,
      code: updates.code || null,
      contract: updates.contract || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setCompanyActive(id, active) {
  const { data, error } = await supabase
    .from('companies')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCompany(id) {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =================================================================
// SETTINGS - الإعدادات
// =================================================================

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSettings(updates) {
  const { data, error } = await supabase
    .from('settings')
    .update({
      season_start_date: updates.seasonStartDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// =================================================================
// TEAMS - الفرق
// =================================================================

export async function getAllTeamsWithCriteria() {
  // جلب الفرق
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .order('sort_order', { ascending: true });
  if (teamsError) throw teamsError;

  // جلب كل المعايير
  const { data: criteria, error: criteriaError } = await supabase
    .from('criteria')
    .select('*')
    .order('sort_order', { ascending: true });
  if (criteriaError) throw criteriaError;

  // دمج المعايير مع فرقها
  return teams.map(team => ({
    ...team,
    startDateId: team.start_date_id,
    criteria: criteria
      .filter(c => c.team_id === team.id)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        unit: c.unit,
        noteRequired: c.note_required,
        repeat: c.repeat_type,
      })),
  }));
}

export async function createTeam(team) {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: team.name,
      description: team.description || null,
      start_date_id: team.startDateId || '1',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeam(id, updates) {
  const payload = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.startDateId !== undefined) payload.start_date_id = updates.startDateId;

  const { data, error } = await supabase
    .from('teams')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =================================================================
// CRITERIA - المعايير
// =================================================================

export async function createCriterion(teamId, criterion) {
  const { data, error } = await supabase
    .from('criteria')
    .insert({
      team_id: teamId,
      name: criterion.name,
      type: criterion.type,
      unit: criterion.unit || null,
      note_required: criterion.noteRequired || 'no',
      repeat_type: criterion.repeat || 'daily',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCriterion(id, updates) {
  const payload = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.unit !== undefined) payload.unit = updates.unit;
  if (updates.noteRequired !== undefined) payload.note_required = updates.noteRequired;
  if (updates.repeat !== undefined) payload.repeat_type = updates.repeat;

  const { data, error } = await supabase
    .from('criteria')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCriterion(id) {
  const { error } = await supabase.from('criteria').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =================================================================
// EVALUATIONS - التقييمات
// =================================================================

export async function getEvaluationsForDate(dateId) {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('date_id', dateId);
  if (error) throw error;
  return data;
}

export async function getEvaluationsForCompanySection(companyId, section, dateId) {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('company_id', companyId)
    .eq('section', section)
    .eq('date_id', dateId);
  if (error) throw error;
  return data;
}

export async function getAllEvaluations() {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*');
  if (error) throw error;
  return data;
}

// upsert: يُدخل أو يُحدّث حسب وجود السجل
export async function upsertEvaluation(evaluation) {
  const payload = {
    user_id: evaluation.userId,
    company_id: evaluation.companyId,
    section: evaluation.section,
    date_id: evaluation.dateId,
    criterion_id: evaluation.criterionId,
    value: evaluation.value !== undefined && evaluation.value !== null ? String(evaluation.value) : null,
    note: evaluation.note || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('evaluations')
    .upsert(payload, {
      onConflict: 'company_id,section,date_id,criterion_id',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// =================================================================
// SEED - تعبئة البيانات الأولية للفرق
// =================================================================

export async function seedTeamsIfEmpty(initialTeams) {
  // تحقق هل توجد فرق
  const { count, error: countError } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true });
  if (countError) throw countError;

  if (count > 0) return false; // الفرق موجودة، لا نفعل شيئاً

  // إنشاء الفرق ومعاييرها
  for (let i = 0; i < initialTeams.length; i++) {
    const team = initialTeams[i];
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: team.name,
        description: team.description,
        start_date_id: team.startDateId,
        sort_order: i,
      })
      .select()
      .single();
    if (teamError) throw teamError;

    // إنشاء معايير الفريق
    const criteriaToInsert = team.criteria.map((c, idx) => ({
      team_id: newTeam.id,
      name: c.name,
      type: c.type,
      unit: c.unit || null,
      note_required: c.noteRequired || 'no',
      repeat_type: c.repeat || 'daily',
      sort_order: idx,
    }));

    if (criteriaToInsert.length > 0) {
      const { error: critError } = await supabase
        .from('criteria')
        .insert(criteriaToInsert);
      if (critError) throw critError;
    }
  }

  return true;
}

// =================================================================
// نموذج: تحويل بيانات قاعدة البيانات لصيغة التطبيق
// =================================================================

// تحويل user من DB إلى صيغة التطبيق
export function dbUserToApp(dbUser) {
  return {
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    role: dbUser.role,
    companyId: dbUser.company_id,
    section: dbUser.section,
    phone: dbUser.phone,
    active: dbUser.active,
  };
}

// تحويل company من DB إلى صيغة التطبيق
export function dbCompanyToApp(dbCompany) {
  return {
    id: dbCompany.id,
    name: dbCompany.name,
    code: dbCompany.code,
    contract: dbCompany.contract,
    active: dbCompany.active,
  };
}
