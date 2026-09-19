import type { Anomaly, Mission } from '@/types/api';
import { getClassMetadata, calculateClassDistribution } from './classificationUtils';
import { normalizeConfidence, formatConfidenceLabel } from './confidenceUtils';
import { formatCoordinate, isValidCoordinate } from './geolocationUtils';

export type ReportExportScope = 'FULL_ANALYSIS' | 'FILTERED_VIEW';
export type ReportExportFormat = 'json' | 'csv' | 'pdf';

export interface ReportFilterContext {
  classFilter: string;
  confidenceThreshold: number;
  searchQuery: string;
}

export interface ReportMetadata {
  reportId: string;
  missionId: string;
  datasetName: string;
  sensorType: string;
  analysisTimestamp: string;
  reportGeneratedAt: string;
  modelName: string;
  modelVersion: string;
  exportScope: ReportExportScope;
  filterContext?: ReportFilterContext;
}

export interface ReportExecutiveSummary {
  totalDetections: number;
  exportedDetections: number;
  classifiedCount: number;
  geolocatedCount: number;
  unlocatedCount: number;
  avgConfidence: number;
  maxConfidence: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface AnalysisReportModel {
  metadata: ReportMetadata;
  summary: ReportExecutiveSummary;
  classBreakdown: ReturnType<typeof calculateClassDistribution>;
  anomalies: Anomaly[];
}

/**
 * Builds a structured, normalized survey report model from backend analysis outputs.
 */
export function buildAnalysisReportModel(
  visibleAnomalies: Anomaly[],
  rawAnomalies: Anomaly[],
  scope: ReportExportScope = 'FULL_ANALYSIS',
  filterContext?: ReportFilterContext,
  missionMeta?: {
    missionId?: string;
    datasetName?: string;
    sonarType?: string;
    lat?: number;
    lon?: number;
  }
): AnalysisReportModel {
  const targetAnomalies = scope === 'FILTERED_VIEW' ? visibleAnomalies : rawAnomalies;
  const nowIso = new Date().toISOString();
  const missionId = missionMeta?.missionId || 'MSN-2026-0142';
  const reportId = `RPT-${missionId.replace('MSN-', '')}-${Date.now().toString().slice(-6)}`;

  let geolocatedCount = 0;
  let unlocatedCount = 0;
  let confSum = 0;
  let maxConf = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const a of targetAnomalies) {
    if (isValidCoordinate(a.latitude, a.longitude)) {
      geolocatedCount++;
    } else {
      unlocatedCount++;
    }

    const confPct = normalizeConfidence(a.confidence);
    confSum += confPct;
    if (confPct > maxConf) maxConf = confPct;

    if (a.priority === 'critical') criticalCount++;
    else if (a.priority === 'high') highCount++;
    else if (a.priority === 'medium') mediumCount++;
    else lowCount++;
  }

  const totalCount = targetAnomalies.length;
  const avgConfidence = totalCount > 0 ? Math.round(confSum / totalCount) : 0;
  const maxConfidence = totalCount > 0 ? maxConf : 0;
  const classBreakdown = calculateClassDistribution(targetAnomalies);

  return {
    metadata: {
      reportId,
      missionId,
      datasetName: missionMeta?.datasetName || `${missionId}_sonar_scan.png`,
      sensorType: missionMeta?.sonarType || 'Side-Scan Sonar 900 kHz',
      analysisTimestamp: nowIso,
      reportGeneratedAt: nowIso,
      modelName: 'Bilateral CLAHE Contour CV-Net',
      modelVersion: 'v1.4',
      exportScope: scope,
      filterContext: scope === 'FILTERED_VIEW' ? filterContext : undefined,
    },
    summary: {
      totalDetections: rawAnomalies.length,
      exportedDetections: totalCount,
      classifiedCount: totalCount,
      geolocatedCount,
      unlocatedCount,
      avgConfidence,
      maxConfidence,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    },
    classBreakdown,
    anomalies: targetAnomalies,
  };
}

/**
 * Triggers browser download of a structured JSON report payload.
 */
export function exportReportJSON(reportModel: AnalysisReportModel, filename?: string): void {
  const jsonStr = JSON.stringify(reportModel, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const fname = filename || `${reportModel.metadata.reportId.toLowerCase()}_survey_report.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Triggers browser download of an RFC-4180 compliant CSV report.
 */
export function exportReportCSV(reportModel: AnalysisReportModel, filename?: string): void {
  const headers = [
    'Report ID',
    'Mission ID',
    'Anomaly ID',
    'Class Identifier',
    'Class Label',
    'Category',
    'Confidence Percent',
    'Latitude',
    'Longitude',
    'Location Status',
    'Depth (m)',
    'Size (m)',
    'Priority',
    'Review Status',
    'Acoustic Description',
  ];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [headers.map(escapeCSV).join(',')];

  for (const a of reportModel.anomalies) {
    const meta = getClassMetadata(a.class_name);
    const hasGeo = isValidCoordinate(a.latitude, a.longitude);
    const geoStatus = hasGeo ? 'Geolocated' : 'Location Unavailable';
    const lat = hasGeo ? a.latitude : '';
    const lon = hasGeo ? a.longitude : '';
    const confPct = `${normalizeConfidence(a.confidence)}%`;

    rows.push(
      [
        reportModel.metadata.reportId,
        reportModel.metadata.missionId,
        a.id,
        a.class_name,
        meta.label,
        meta.categoryLabel,
        confPct,
        lat,
        lon,
        geoStatus,
        a.depth_m || 4180,
        a.size_m || 1.0,
        a.priority,
        a.status,
        a.description || meta.description,
      ]
        .map(escapeCSV)
        .join(',')
    );
  }

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const fname = filename || `${reportModel.metadata.reportId.toLowerCase()}_survey_anomalies.csv`;

  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Opens browser print dialog formatted for PDF export with oceanographer print layout.
 */
export function triggerReportPrint(reportModel: AnalysisReportModel): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the printable PDF survey report.');
    return;
  }

  const meta = reportModel.metadata;
  const sum = reportModel.summary;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MARIANATECH Survey Report - ${meta.reportId}</title>
        <style>
          body { font-family: monospace, sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 24px; font-size: 11px; }
          .header { border-bottom: 2px solid #D97732; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 18px; font-weight: bold; color: #D97732; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
          .badge { background: #242930; color: #E8E5DF; border: 1px solid #B9C0C8; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
          .section { margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; }
          .section-title { font-size: 12px; font-weight: bold; color: #D97732; text-transform: uppercase; border-bottom: 1px solid #B9C0C8; padding-bottom: 6px; margin-bottom: 10px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; text-align: center; }
          .stat-val { font-size: 16px; font-weight: bold; color: #D97732; }
          .stat-lbl { font-size: 9px; color: #64748b; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 6px 8px; border-bottom: 1px solid #cbd5e1; color: #334155; font-weight: bold; text-transform: uppercase; }
          td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">MARIANATECH :: SIDE-SCAN SONAR SURVEY REPORT</h1>
            <div class="subtitle">SIH 2026 Problem Statement 26057 • NIOT / Ministry of Earth Sciences</div>
          </div>
          <div>
            <span class="badge">REPORT ID: ${meta.reportId}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">METADATA & SURVEY SPECIFICATIONS</div>
          <div class="grid">
            <div class="stat-card">
              <div class="stat-lbl">Mission Identifier</div>
              <div class="stat-val" style="font-size:12px;">${meta.missionId}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Dataset Name</div>
              <div class="stat-val" style="font-size:11px; word-break:break-all;">${meta.datasetName}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Export Scope</div>
              <div class="stat-val" style="font-size:11px;">${meta.exportScope.replace('_', ' ')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">AI CV Pipeline</div>
              <div class="stat-val" style="font-size:11px;">${meta.modelName} ${meta.modelVersion}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">EXECUTIVE SUMMARY METRICS</div>
          <div class="grid">
            <div class="stat-card">
              <div class="stat-lbl">Total Detections</div>
              <div class="stat-val">${sum.totalDetections}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Exported Detections</div>
              <div class="stat-val">${sum.exportedDetections}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Geolocated Contacts</div>
              <div class="stat-val">${sum.geolocatedCount}</div>
            </div>
            <div class="stat-card">
              <div class="stat-lbl">Mean Confidence</div>
              <div class="stat-val">${sum.avgConfidence}%</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">ANOMALY CONTACTS DETAILED INDEX (${reportModel.anomalies.length})</div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Class / Category</th>
                <th>Confidence</th>
                <th>Latitude / Longitude</th>
                <th>Depth</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              ${reportModel.anomalies
                .map((a) => {
                  const metaInfo = getClassMetadata(a.class_name);
                  const geoStr = formatCoordinate(a.latitude, a.longitude);
                  return `
                    <tr>
                      <td><strong>${a.id}</strong></td>
                      <td><strong>${metaInfo.label}</strong><br/><span style="color:#64748b; font-size:9px;">${metaInfo.categoryLabel}</span></td>
                      <td><strong>${formatConfidenceLabel(a.confidence)}</strong></td>
                      <td>${geoStr}</td>
                      <td>${a.depth_m || 4180} m</td>
                      <td style="text-transform:uppercase; font-weight:bold;">${a.priority}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          Report Generated: ${new Date(meta.reportGeneratedAt).toUTCString()} • Authorized for NIOT/MoES Hydrographic Operations • MarianaTech Sonar Engine
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
