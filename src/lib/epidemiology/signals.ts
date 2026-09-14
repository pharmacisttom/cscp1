/**
 * Temporal Surveillance Signal Detection Engine
 * Implements Moving Average, EWMA (Exponentially Weighted Moving Average), and CUSUM (Cumulative Sum)
 * strictly labeled as "Surveillance Signal" rather than legal or conclusive epidemiological findings.
 */

export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD or YYYY-MM
  value: number;
}

export interface SurveillanceSignalAlert {
  date: string;
  observedValue: number;
  expectedValue: number;
  signalType: "EWMA_SURVEILLANCE_SIGNAL" | "CUSUM_SURVEILLANCE_SIGNAL" | "MOVING_AVG_SPIKE";
  severity: "LOW" | "MODERATE" | "HIGH";
  message: string;
  zScore?: number;
}

/**
 * Detects surveillance signals using EWMA (Exponentially Weighted Moving Average)
 * @param series Time series array
 * @param lambda Smoothing weight (default 0.2)
 * @param thresholdStdDev Number of standard deviations for threshold (default 2.5)
 */
export function detectEwmaSignals(
  series: TimeSeriesPoint[],
  lambda = 0.2,
  thresholdStdDev = 2.5
): SurveillanceSignalAlert[] {
  if (series.length < 5) return [];

  const values = series.map((s) => s.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const alerts: SurveillanceSignalAlert[] = [];
  let ewma = series[0].value;

  for (let t = 1; t < series.length; t++) {
    const actual = series[t].value;
    ewma = lambda * actual + (1 - lambda) * ewma;

    // Standard deviation of EWMA at step t
    const sigmaEwma =
      stdDev * Math.sqrt((lambda / (2 - lambda)) * (1 - Math.pow(1 - lambda, 2 * t)));

    const upperControlLimit = mean + thresholdStdDev * sigmaEwma;

    if (actual > upperControlLimit && stdDev > 0) {
      const zScore = Number(((actual - mean) / stdDev).toFixed(2));
      alerts.push({
        date: series[t].date,
        observedValue: actual,
        expectedValue: Number(ewma.toFixed(2)),
        signalType: "EWMA_SURVEILLANCE_SIGNAL",
        severity: zScore > 3.5 ? "HIGH" : "MODERATE",
        message: `Surveillance Signal: พบการเพิ่มขึ้นผิดปกติของข้อมูล (${actual} รายการ เทียบกับค่าคาดหวัง ${ewma.toFixed(1)})`,
        zScore,
      });
    }
  }

  return alerts;
}

/**
 * Detects upward trends using CUSUM (Cumulative Sum Control Chart)
 * @param series Time series array
 * @param k Reference value / slack (default 0.5)
 * @param h Decision interval / threshold (default 4.0)
 */
export function detectCusumSignals(
  series: TimeSeriesPoint[],
  k = 0.5,
  h = 4.0
): SurveillanceSignalAlert[] {
  if (series.length < 5) return [];

  const values = series.map((s) => s.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance) || 1;

  const alerts: SurveillanceSignalAlert[] = [];
  let cusumPlus = 0;

  for (let t = 0; t < series.length; t++) {
    const standardized = (series[t].value - mean) / stdDev;
    cusumPlus = Math.max(0, cusumPlus + standardized - k);

    if (cusumPlus > h) {
      alerts.push({
        date: series[t].date,
        observedValue: series[t].value,
        expectedValue: Number(mean.toFixed(2)),
        signalType: "CUSUM_SURVEILLANCE_SIGNAL",
        severity: cusumPlus > 6.0 ? "HIGH" : "MODERATE",
        message: `Surveillance Signal (CUSUM): ตรวจพบแนวโน้มการสะสมของปัญหาต่อเนื่องเกินเกณฑ์เฝ้าระวัง (CUSUM=${cusumPlus.toFixed(1)})`,
      });
    }
  }

  return alerts;
}
