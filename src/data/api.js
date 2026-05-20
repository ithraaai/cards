// =================================================================
// طبقة API — كل عمليات قاعدة البيانات
// =================================================================
import { supabase } from './supabase.js';

// =================================================================
// USERS
// =================================================================

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users').select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function findUserByUsername(username) {
  const { data, error } = await supabase
    .from('users').select('*')
    .eq('username', username.toLowerCase())
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createUser(user) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      name: user.name,
      username: user.username.toLowerCase(),
      role: user.role,
      company_id: user.companyId || null,
      section: user.section || null,
      phone: user.phone || null,
      contractor_company_id: user.contractorCompanyId || null,
      contractor_scope_domain: user.role === 'contractor_monitor_food' ? 'food'
        : user.role === 'contractor_monitor_transport' ? 'transport'
        : user.role === 'contractor_monitor_security' ? 'security'
        : null,
      active: user.active !== false,
    })
    .select().single();
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
    contractor_company_id: updates.contractorCompanyId || null,
    contractor_scope_domain: updates.role === 'contractor_monitor_food' ? 'food'
      : updates.role === 'contractor_monitor_transport' ? 'transport'
      : updates.role === 'contractor_monitor_security' ? 'security'
      : null,
    updated_at: new Date().toISOString(),
  };
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  const { data, error } = await supabase
    .from('users').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function setUserActive(id, active) {
  const { data, error } = await supabase
    .from('users')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteUser(id) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =================================================================
// COMPANIES
// =================================================================

export async function getAllCompanies() {
  const { data, error } = await supabase
    .from('companies').select('*')
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
    .select().single();
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
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function setCompanyActive(id, active) {
  const { data, error } = await supabase
    .from('companies')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCompany(id) {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =================================================================
// SETTINGS — مع الإعدادات الجديدة
// =================================================================

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSettings(updates) {
  const payload = { updated_at: new Date().toISOString() };
  if (updates.seasonStartDate !== undefined) payload.season_start_date = updates.seasonStartDate;
  if (updates.closingMode !== undefined) payload.closing_mode = updates.closingMode;
  if (updates.closingTime !== undefined) payload.closing_time = updates.closingTime;
  if (updates.unifiedStartDateId !== undefined) payload.unified_start_date_id = updates.unifiedStartDateId;
  if (updates.manuallyClosedDates !== undefined) payload.manually_closed_dates = updates.manuallyClosedDates;
  if (updates.sessionsMode !== undefined) payload.sessions_mode = updates.sessionsMode;
  if (updates.session1CloseTime !== undefined) payload.session1_close_time = updates.session1CloseTime;
  if (updates.session2CloseTime !== undefined) payload.session2_close_time = updates.session2CloseTime;
  if (updates.sessionsScopeSection !== undefined) payload.sessions_scope_section = updates.sessionsScopeSection;
  if (updates.sessionsScopeTeams !== undefined) payload.sessions_scope_teams = updates.sessionsScopeTeams;
  if (updates.entryReportSections !== undefined) payload.entry_report_sections = updates.entryReportSections;
  if (updates.adminReportSections !== undefined) payload.admin_report_sections = updates.adminReportSections;

  const { data, error } = await supabase
    .from('settings').update(payload).eq('id', 1).select().single();
  if (error) throw error;
  return data;
}

// تطبيق تاريخ بدء موحد على كل الفرق
export async function applyUnifiedStartDateToAllTeams(startDateId) {
  const { data, error } = await supabase
    .from('teams')
    .update({ start_date_id: startDateId, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000') // كل الصفوف
    .select();
  if (error) throw error;
  return data;
}

// تبديل حالة الإغلاق اليدوي ليوم محدد
export async function toggleManualCloseForDate(dateId) {
  const settings = await getSettings();
  const closed = settings.manually_closed_dates || [];
  const newClosed = closed.includes(dateId)
    ? closed.filter(d => d !== dateId)
    : [...closed, dateId];
  return await updateSettings({ manuallyClosedDates: newClosed });
}

// =================================================================
// TEAMS - تحميل سريع متوازي
// =================================================================

export async function getAllTeamsWithCriteria() {
  // تحميل متوازي للسرعة
  const [teamsResult, criteriaResult] = await Promise.all([
    supabase.from('teams').select('*').order('sort_order', { ascending: true }),
    supabase.from('criteria').select('*').order('sort_order', { ascending: true }),
  ]);

  if (teamsResult.error) throw teamsResult.error;
  if (criteriaResult.error) throw criteriaResult.error;

  const teams = teamsResult.data;
  const criteria = criteriaResult.data;

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
        sectionScope: c.section_scope || 'all',
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
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateTeam(id, updates) {
  const payload = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.startDateId !== undefined) payload.start_date_id = updates.startDateId;
  const { data, error } = await supabase
    .from('teams').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =================================================================
// CRITERIA
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
      section_scope: criterion.sectionScope || 'all',
    })
    .select().single();
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
  if (updates.sectionScope !== undefined) payload.section_scope = updates.sectionScope;
  const { data, error } = await supabase
    .from('criteria').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCriterion(id) {
  const { error } = await supabase.from('criteria').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// =================================================================
// EVALUATIONS
// =================================================================

export async function getAllEvaluations() {
  const { data, error } = await supabase.from('evaluations').select('*');
  if (error) throw error;
  return data;
}

export async function getEvaluationsForDateRange(startDateId, endDateId) {
  const { data, error } = await supabase
    .from('evaluations').select('*')
    .gte('date_id', startDateId).lte('date_id', endDateId);
  if (error) throw error;
  return data;
}

export async function upsertEvaluation(evaluation) {
  const payload = {
    user_id: evaluation.userId,
    company_id: evaluation.companyId,
    section: evaluation.section,
    date_id: evaluation.dateId,
    criterion_id: evaluation.criterionId,
    session: evaluation.session || 1,
    value: evaluation.value !== undefined && evaluation.value !== null ? String(evaluation.value) : null,
    note: evaluation.note || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('evaluations')
    .upsert(payload, { onConflict: 'company_id,section,date_id,criterion_id,session' })
    .select().single();
  if (error) throw error;
  return data;
}

// =================================================================
// SEED
// =================================================================

export async function seedTeamsIfEmpty(initialTeams) {
  const { count, error: countError } = await supabase
    .from('teams').select('*', { count: 'exact', head: true });
  if (countError) throw countError;

  if (count > 0) return false;

  for (let i = 0; i < initialTeams.length; i++) {
    const team = initialTeams[i];
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: team.name, description: team.description,
        start_date_id: team.startDateId, sort_order: i,
      })
      .select().single();
    if (teamError) throw teamError;

    const criteriaToInsert = team.criteria.map((c, idx) => ({
      team_id: newTeam.id, name: c.name, type: c.type,
      unit: c.unit || null, note_required: c.noteRequired || 'no',
      repeat_type: c.repeat || 'daily', sort_order: idx,
      section_scope: c.sectionScope || 'all',
    }));

    if (criteriaToInsert.length > 0) {
      const { error: critError } = await supabase.from('criteria').insert(criteriaToInsert);
      if (critError) throw critError;
    }
  }
  return true;
}

// =================================================================
// تحويلات
// =================================================================

export function dbUserToApp(dbUser) {
  return {
    id: dbUser.id, name: dbUser.name, username: dbUser.username,
    role: dbUser.role, companyId: dbUser.company_id, section: dbUser.section,
    phone: dbUser.phone, active: dbUser.active,
  };
}

export function dbCompanyToApp(dbCompany) {
  return {
    id: dbCompany.id, name: dbCompany.name, code: dbCompany.code,
    contract: dbCompany.contract, active: dbCompany.active,
  };
}
