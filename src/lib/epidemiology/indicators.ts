/**
 * Denominator-Aware Epidemiological Indicators & Fiscal Year Calculations
 */

export interface DenominatorAwareMetrics {
  totalBusinesses: number;
  inspectedBusinesses: number;
  failedInspections: number;
  complaintCount: number;
  overdueInspections: number;
  followupRequired: number;
  followupOverdue: number;

  // Calculated rates (safe division)
  inspectionCoverageRate: number; // % (Inspected / Total * 100)
  complianceFailureRate: number; // % (Failed / Inspected * 100)
  complaintRatePer100: number; // (Complaints / Total * 100)
  overdueRate: number; // % (Overdue / Total * 100)
  followupFailureRate: number; // % (Overdue Follow-up / Follow-up Required * 100)
}

export function calculateDenominatorAwareMetrics(raw: {
  totalBusinesses: number;
  inspectedBusinesses: number;
  failedInspections: number;
  complaintCount: number;
  overdueInspections: number;
  followupRequired: number;
  followupOverdue: number;
}): DenominatorAwareMetrics {
  const total = Math.max(0, raw.totalBusinesses);
  const inspected = Math.max(0, raw.inspectedBusinesses);
  const failed = Math.max(0, raw.failedInspections);
  const complaints = Math.max(0, raw.complaintCount);
  const overdue = Math.max(0, raw.overdueInspections);
  const followupReq = Math.max(0, raw.followupRequired);
  const followupOver = Math.max(0, raw.followupOverdue);

  // Safe rates with 1 decimal place
  const inspectionCoverageRate = total > 0 ? Number(((inspected / total) * 100).toFixed(1)) : 0;
  const complianceFailureRate = inspected > 0 ? Number(((failed / inspected) * 100).toFixed(1)) : 0;
  const complaintRatePer100 = total > 0 ? Number(((complaints / total) * 100).toFixed(1)) : 0;
  const overdueRate = total > 0 ? Number(((overdue / total) * 100).toFixed(1)) : 0;
  const followupFailureRate = followupReq > 0 ? Number(((followupOver / followupReq) * 100).toFixed(1)) : 0;

  return {
    totalBusinesses: total,
    inspectedBusinesses: inspected,
    failedInspections: failed,
    complaintCount: complaints,
    overdueInspections: overdue,
    followupRequired: followupReq,
    followupOverdue: followupOver,
    inspectionCoverageRate,
    complianceFailureRate,
    complaintRatePer100,
    overdueRate,
    followupFailureRate,
  };
}

/**
 * Thai Fiscal Year Calculation
 * Thai fiscal year starts October 1 and ends September 30.
 * In Buddhist Era: AD year + 543 (if month >= October, fiscal year = AD year + 544)
 */
export function getThaiFiscalYear(date: Date = new Date()): number {
  const month = date.getMonth(); // 0-indexed: 9 is October
  const year = date.getFullYear();
  if (month >= 9) {
    return year + 543 + 1;
  }
  return year + 543;
}

export function getFiscalYearDateRange(fiscalYearBE: number): {
  startDate: Date;
  endDate: Date;
} {
  const startYearAD = fiscalYearBE - 544;
  const endYearAD = fiscalYearBE - 543;

  return {
    startDate: new Date(startYearAD, 9, 1, 0, 0, 0), // Oct 1
    endDate: new Date(endYearAD, 8, 30, 23, 59, 59), // Sep 30
  };
}
