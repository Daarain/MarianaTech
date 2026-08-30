import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Report } from '../models/Report';
import { Anomaly } from '../models/Anomaly';
import { Mission } from '../models/Mission';
import { config } from '../config/env';

export async function generateReportForMission(
  missionId: string,
  format: 'csv' | 'json' | 'pdf' = 'csv'
): Promise<{ url: string }> {
  const mission = await Mission.findOne({ id: missionId });
  const anomalies = await Anomaly.find({ mission_id: missionId });

  const reportsDir = path.join(config.uploadsDir, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${missionId}-report-${timestamp}.${format}`;
  const filePath = path.join(reportsDir, filename);

  if (format === 'csv') {
    const headers = 'id,class_name,confidence,latitude,longitude,priority,status,depth_m,detected_at,size_m,description\n';
    const rows = anomalies
      .map(
        (a) =>
          `"${a.id}","${a.class_name}",${a.confidence},${a.latitude},${a.longitude},"${a.priority}","${a.status}",${a.depth_m},"${a.detected_at}",${a.size_m},"${a.description.replace(/"/g, '""')}"`
      )
      .join('\n');
    fs.writeFileSync(filePath, headers + rows, 'utf-8');
  } else if (format === 'json') {
    const data = {
      mission: mission || { id: missionId },
      generated_at: new Date().toISOString(),
      anomaly_count: anomalies.length,
      anomalies,
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } else {
    // Generate PDF report using PDFKit
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text('MarianaTech - Sonar Anomaly Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Mission ID: ${missionId}`);
      doc.fontSize(12).text(`Mission Name: ${mission?.name || 'N/A'}`);
      doc.text(`Location: ${mission?.location || 'N/A'}`);
      doc.text(`Total Anomalies Detected: ${anomalies.length}`);
      doc.text(`Report Date: ${new Date().toLocaleDateString('en-GB')}`);
      doc.moveDown();

      doc.fontSize(14).text('Detected Anomalies:');
      doc.moveDown(0.5);

      anomalies.forEach((a, i) => {
        doc
          .fontSize(10)
          .text(
            `${i + 1}. [${a.id}] ${a.class_name.toUpperCase()} (Confidence: ${(a.confidence * 100).toFixed(0)}%) - Priority: ${a.priority.toUpperCase()}`
          );
        doc.text(`   Depth: ${a.depth_m}m | Lat: ${a.latitude}, Lon: ${a.longitude} | Status: ${a.status}`);
        doc.text(`   Description: ${a.description}`);
        doc.moveDown(0.5);
      });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  const stat = fs.statSync(filePath);
  await Report.create({
    mission_id: missionId,
    report_name: filename,
    format,
    file_path: filePath,
    file_size_bytes: stat.size,
  });

  return { url: `/reports/download/${filename}` };
}

export async function downloadReportFile(filename: string): Promise<string> {
  const filePath = path.join(config.uploadsDir, 'reports', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('Report file not found');
  }
  return filePath;
}
