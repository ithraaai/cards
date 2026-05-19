// =================================================================
// دوال حساب الإحصاءات
// =================================================================

/**
 * يحسب إحصاءات لمجموعة تقييمات
 */
export function calculateStats(evaluations, criteriaById = {}) {
  let yesCount = 0, noCount = 0, naCount = 0;
  let totalScale = 0, scaleCount = 0;
  let negatives = 0, totalNotes = 0;
  const scaleDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  evaluations.forEach(e => {
    if (e.note?.trim()) totalNotes++;

    if (e.value === 'yes') yesCount++;
    else if (e.value === 'no') { noCount++; negatives++; }
    else if (e.value === 'na') naCount++;
    else {
      const num = parseFloat(e.value);
      if (!isNaN(num)) {
        // إذا كان معيار scale (1-5)
        const criterion = criteriaById[e.criterion_id];
        if (criterion?.type === 'scale' && num >= 1 && num <= 5) {
          scaleDistribution[num]++;
          totalScale += num;
          scaleCount++;
          if (num < 3) negatives++;
        }
      }
    }
  });

  const yesNoTotal = yesCount + noCount;
  const complianceRate = yesNoTotal > 0 ? Math.round((yesCount / yesNoTotal) * 100) : 0;
  const avgScale = scaleCount > 0 ? (totalScale / scaleCount) : 0;

  // المعدل العام: مزيج من نسبة الامتثال ومتوسط التقييمات
  let overallScore = 0;
  let overallCount = 0;
  if (yesNoTotal > 0) {
    overallScore += complianceRate;
    overallCount++;
  }
  if (scaleCount > 0) {
    overallScore += (avgScale / 5) * 100;
    overallCount++;
  }
  const overall = overallCount > 0 ? Math.round(overallScore / overallCount) : 0;

  return {
    total: evaluations.length,
    yesCount, noCount, naCount,
    complianceRate,
    avgScale: avgScale.toFixed(2),
    avgScaleNum: avgScale,
    scaleCount,
    scaleDistribution,
    negatives,
    notes: totalNotes,
    overall,
  };
}

/**
 * تصفية التقييمات حسب الفلاتر
 */
export function filterEvaluations(evaluations, filters) {
  return evaluations.filter(e => {
    if (filters.companyIds?.length && !filters.companyIds.includes(e.company_id)) return false;
    if (filters.sections?.length && !filters.sections.includes(e.section)) return false;
    if (filters.dateIds?.length && !filters.dateIds.includes(e.date_id)) return false;
    if (filters.criterionIds?.length && !filters.criterionIds.includes(e.criterion_id)) return false;
    if (filters.teamId) {
      // نحتاج خريطة criteria -> team
      if (!filters.criteriaByTeam) return false;
      if (!filters.criteriaByTeam[filters.teamId]?.includes(e.criterion_id)) return false;
    }
    return true;
  });
}

/**
 * تجميع التقييمات حسب اليوم
 */
export function groupByDate(evaluations, criteriaById) {
  const map = {};
  evaluations.forEach(e => {
    if (!map[e.date_id]) map[e.date_id] = [];
    map[e.date_id].push(e);
  });
  const result = {};
  Object.keys(map).forEach(dateId => {
    result[dateId] = calculateStats(map[dateId], criteriaById);
  });
  return result;
}

/**
 * تجميع التقييمات حسب الشركة
 */
export function groupByCompany(evaluations, companies, criteriaById) {
  return companies.map(c => {
    const compEvals = evaluations.filter(e => e.company_id === c.id);
    const stats = calculateStats(compEvals, criteriaById);
    return { ...c, stats };
  });
}

/**
 * تجميع حسب الفريق (يحتاج خريطة criteria -> team)
 */
export function groupByTeam(evaluations, teams, criteriaById) {
  return teams.map(t => {
    const teamCriterionIds = t.criteria.map(c => c.id);
    const teamEvals = evaluations.filter(e => teamCriterionIds.includes(e.criterion_id));
    const stats = calculateStats(teamEvals, criteriaById);
    return { ...t, stats };
  });
}

/**
 * تجميع حسب المعيار
 */
export function groupByCriterion(evaluations, criteria, criteriaById) {
  return criteria.map(c => {
    const critEvals = evaluations.filter(e => e.criterion_id === c.id);
    const stats = calculateStats(critEvals, criteriaById);
    return { ...c, stats };
  });
}
