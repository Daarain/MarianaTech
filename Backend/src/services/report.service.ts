import fs from 'fs';
import path from 'path';
import { Mission } from '../models/mission.model';
import { AnomalyModel } from '../models/anomaly.model';
import { ProcessingRunModel } from '../models/processingRun.model';
import { ReportModel, IReportDoc, ReportFormatType } from '../models/report.model';

export interface GenerateReportResult {
  reportId: string;
  format: ReportFormatType;
  url: string;
  storagePath: string;
}

export function buildCSVReport(mission: any, run: any, anomalies: any[]): string {
  const lines: string[] = [];
  lines.push('# MarianaTech Side-scan Sonar Mission Intelligence Report');
  lines.push(`# Generated At: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('# MISSION SUMMARY');
  lines.push(
    'Mission ID,Mission Name,Status,Date,Location,Vessel,Operator,Sonar Type,Processing Run ID,Model Version,Anomaly Count'
  );
  lines.push(
    `"${mission.id || mission.customId}","${mission.name}","${mission.status}","${mission.date}","${mission.location}","${mission.vessel || ''}","${mission.operator || ''}","${mission.sonarType || ''}","${run?.runId || 'N/A'}","${run?.modelVersion || 'v1.0.0'}",${anomalies.length}`
  );
  lines.push('');
  lines.push('# DETECTED ACOUSTIC ANOMALIES');
  lines.push(
    'Anomaly ID,Class Name,Confidence,Priority,Latitude,Longitude,Depth (m),Size (m),Verification Status,Description'
  );

  for (const a of anomalies) {
    lines.push(
      `"${a.id || a.customId}","${a.className}","${a.confidence}","${a.priority}","${a.latitude ?? ''}","${a.longitude ?? ''}","${a.depthM}","${a.sizeM}","${a.status}","${(a.description || '').replace(/"/g, '""')}"`
    );
  }

  return lines.join('\n');
}

export function buildJSONReport(mission: any, run: any, anomalies: any[]): string {
  return JSON.stringify(
    {
      reportTitle: 'MarianaTech Side-scan Sonar Mission Intelligence Report',
      generatedAt: new Date().toISOString(),
      mission: {
        id: mission.id || mission.customId,
        name: mission.name,
        status: mission.status,
        date: mission.date,
        location: mission.location,
        vessel: mission.vessel,
        operator: mission.operator,
        sonarType: mission.sonarType,
        depthM: mission.depthM,
        areaKm2: mission.areaKm2,
        anomalyCount: anomalies.length,
      },
      processingRun: {
        runId: run?.runId || 'N/A',
        jobId: run?.jobId || 'N/A',
        modelVersion: run?.modelVersion || 'v1.0.0',
        preprocessingVersion: run?.preprocessingVersion || 'v1.0',
        status: run?.status || 'completed',
        completedAt: run?.completedAt || new Date(),
      },
      anomalies: anomalies.map((a) => ({
        id: a.id || a.customId,
        className: a.className,
        confidence: a.confidence,
        priority: a.priority,
        latitude: a.latitude,
        longitude: a.longitude,
        depthM: a.depthM,
        sizeM: a.sizeM,
        status: a.status,
        description: a.description,
        boundingBox: a.boundingBox,
      })),
    },
    null,
    2
  );
}

export async function createMissionReport(
  missionId: string,
  requestedFormat: string = 'csv',
  createdBy: string = 'system'
): Promise<GenerateReportResult> {
  const mission = await Mission.findOne({
    $or: [{ id: missionId }, { customId: missionId }],
  });

  if (!mission) {
    throw new Error('Mission not found');
  }

  const format: ReportFormatType = requestedFormat.toLowerCase() === 'json' ? 'json' : 'csv';

  const run = await ProcessingRunModel.findOne({ missionId }).sort({ createdAt: -1 });
  const anomalies = await AnomalyModel.find({ missionId }).sort({ createdAt: -1 });

  let reportContent = '';
  if (format === 'csv') {
    reportContent = buildCSVReport(mission, run, anomalies);
  } else {
    reportContent = buildJSONReport(mission, run, anomalies);
  }

  const reportId = `RPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const dirPath = path.join(process.cwd(), 'uploads', 'reports', missionId);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filename = `${reportId}.${format}`;
  const fullPath = path.join(dirPath, filename);

  await fs.promises.writeFile(fullPath, reportContent, 'utf-8');

  const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');

  await ReportModel.create({
    reportId,
    missionId,
    format,
    storagePath: relativePath,
    status: 'completed',
    createdBy,
  });

  const url = `/reports/file/${reportId}`;

  return {
    reportId,
    format,
    url,
    storagePath: relativePath,
  };
}

export async function getMissionReportDownloadUrl(
  missionId: string,
  requestedFormat: string = 'csv'
): Promise<{ url: string; reportId: string; storagePath: string; format: ReportFormatType }> {
  const format: ReportFormatType = requestedFormat.toLowerCase() === 'json' ? 'json' : 'csv';

  let report = await ReportModel.findOne({ missionId, format }).sort({ createdAt: -1 });

  if (!report) {
    const generated = await createMissionReport(missionId, format);
    return {
      url: generated.url,
      reportId: generated.reportId,
      storagePath: generated.storagePath,
      format: generated.format,
    };
  }

  return {
    url: `/reports/file/${report.reportId}`,
    reportId: report.reportId,
    storagePath: report.storagePath,
    format: report.format,
  };
}

export async function getReportFileById(reportId: string): Promise<{ fullPath: string; format: string } | null> {
  const report = await ReportModel.findOne({ reportId });
  if (!report) return null;

  const fullPath = path.join(process.cwd(), report.storagePath);
  if (!fs.existsSync(fullPath)) return null;

  return {
    fullPath,
    format: report.format,
  };
}
