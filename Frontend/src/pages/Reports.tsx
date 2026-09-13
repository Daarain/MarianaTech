import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Printer,
  FileCode,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  MapPin,
  Compass,
  ArrowLeft,
  Search,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { ROUTES } from '@/constants/routes';
import { useMissionContext } from '@/context/MissionContext';
import { useToast } from '@/context/ToastContext';
import { getMissionById } from '@/api/missions';
import { getAnomalies as getMissionAnomalies } from '@/api/anomalies';
import type { Mission, Anomaly } from '@/types/api';
import {
  buildAnalysisReportModel,
  exportReportJSON,
  exportReportCSV,
  triggerReportPrint,
  type ReportExportScope,
  type AnalysisReportModel,
} from '@/utils/reportUtils';
import { getClassMetadata, filterDetectionsCombined } from '@/utils/classificationUtils';
import { formatConfidenceLabel, normalizeConfidence } from '@/utils/confidenceUtils';
import { formatCoordinate, isValidCoordinate } from '@/utils/geolocationUtils';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import StatusIndicator from '@/components/ui/StatusIndicator';

export default function Reports() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    stagedFile,
    stagedLatitude,
    stagedLongitude,
    stagedDetectionResult,
    selectedAnomaly,
    setSelectedAnomaly,
  } = useMissionContext();

  const missionId = id || 'MSN-2026-0142';
  const [mission, setMission] = useState<Mission | null>(null);
  const [existingAnomalies, setExistingAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Scope & Filter State
  const [exportScope, setExportScope] = useState<ReportExportScope>('FULL_ANALYSIS');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generation Feedback State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Load mission details if no staged detection result
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([getMissionById(missionId), getMissionAnomalies(missionId)])
      .then(([m, anoms]) => {
        if (!mounted) return;
        setMission(m);
        setExistingAnomalies(anoms);
      })
      .catch((err) => {
        console.warn('Failed to load mission for reports view:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [missionId]);

  // Compute raw anomaly detections list (from live result or mission fallback)
  const rawAnomalies: Anomaly[] = useMemo(() => {
    if (stagedDetectionResult && stagedDetectionResult.anomalies) {
      return stagedDetectionResult.anomalies;
    }
    return existingAnomalies;
  }, [stagedDetectionResult, existingAnomalies]);

  // Compute filtered anomalies list
  const visibleAnomalies: Anomaly[] = useMemo(() => {
    return filterDetectionsCombined(
      rawAnomalies,
      selectedClassFilter,
      confidenceThreshold,
      searchQuery
    );
  }, [rawAnomalies, selectedClassFilter, confidenceThreshold, searchQuery]);

  // Build authoritative report data model
  const reportModel: AnalysisReportModel = useMemo(() => {
    return buildAnalysisReportModel(
      visibleAnomalies,
      rawAnomalies,
      exportScope,
      {
        classFilter: selectedClassFilter,
        confidenceThreshold,
        searchQuery,
      },
      {
        missionId,
        datasetName: stagedFile ? stagedFile.name : mission?.name ? `${mission.name} Sonar Log` : 'Chagos Trench Survey Stream',
        sonarType: stagedFile ? 'Side-Scan Sonar 900 kHz' : mission?.sonar_type || 'Side-scan 900 kHz',
        lat: stagedFile ? stagedLatitude : mission?.latitude || -6.3000,
        lon: stagedFile ? stagedLongitude : mission?.longitude || 71.2000,
      }
    );
  }, [
    visibleAnomalies,
    rawAnomalies,
    exportScope,
    selectedClassFilter,
    confidenceThreshold,
    searchQuery,
    missionId,
    stagedFile,
    stagedLatitude,
    stagedLongitude,
    mission,
  ]);

  const handleExportJSON = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportReportJSON(reportModel);
      setIsExporting(false);
      setExportSuccessMessage(`Exported JSON report for ${reportModel.metadata.reportId}`);
      showToast('JSON report download initiated successfully', 'success');
    }, 400);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportReportCSV(reportModel);
      setIsExporting(false);
      setExportSuccessMessage(`Exported CSV report for ${reportModel.metadata.reportId}`);
      showToast('CSV report download initiated successfully', 'success');
    }, 400);
  };

  const handlePrintPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      triggerReportPrint(reportModel);
      setIsExporting(false);
      showToast('Opened printable PDF report window', 'info');
    }, 300);
  };

  return (
    <PageLayout title="Survey Reports & Data Export Station" intensity="minimal">

      <div className="flex flex-col gap-6 font-mono">
        {/* Header Telemetry Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-cyan-500/20 bg-[#050D1A]/90 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.sonarAnalysis)}
              className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              SONAR WORKSPACE
            </Button>
            <div>
              <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-semibold uppercase tracking-widest">
                AUTOMATED SURVEY REPORT GENERATOR • SIH 2026 / NIOT-MoES
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Side-Scan Sonar Anomaly Survey Report Station
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusIndicator status="complete" label="REPORT ENGINE READY" />
          </div>
        </div>

        {/* Scope Selector Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-[#050D1A]/80 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase">EXPORT SCOPE:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExportScope('FULL_ANALYSIS')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                  exportScope === 'FULL_ANALYSIS'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                FULL ANALYSIS EXPORT ({rawAnomalies.length} Contacts)
              </button>
              <button
                onClick={() => setExportScope('FILTERED_VIEW')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                  exportScope === 'FILTERED_VIEW'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                FILTERED VIEW EXPORT ({visibleAnomalies.length} Contacts)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintPDF} className="border-cyan-500/40 text-cyan-300">
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              PRINT / SAVE PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              DOWNLOAD CSV
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportJSON}>
              <FileCode className="h-3.5 w-3.5 mr-1.5" />
              DOWNLOAD JSON
            </Button>
          </div>
        </div>

        {/* Filter Notice Banner if Exporting Filtered View */}
        {exportScope === 'FILTERED_VIEW' && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>FILTERED EXPORT ACTIVE:</strong> Export includes <strong className="text-white">{visibleAnomalies.length}</strong> of{' '}
                <strong className="text-white">{rawAnomalies.length}</strong> total AI detections. Export metadata will record applied class filter ('{selectedClassFilter}') and threshold (≥ {confidenceThreshold}%).
              </span>
            </div>
          </div>
        )}

        {/* Executive Summary Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-lg border border-cyan-500/20 bg-[#050D1A] p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total AI Detections</span>
            <span className="text-2xl font-bold text-cyan-400 mt-1 block">{reportModel.summary.totalDetections}</span>
          </div>

          <div className="rounded-lg border border-cyan-500/20 bg-[#050D1A] p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Exported Contacts</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{reportModel.summary.exportedDetections}</span>
          </div>

          <div className="rounded-lg border border-cyan-500/20 bg-[#050D1A] p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Geolocated Contacts</span>
            <span className="text-2xl font-bold text-cyan-300 mt-1 block">{reportModel.summary.geolocatedCount}</span>
          </div>

          <div className="rounded-lg border border-cyan-500/20 bg-[#050D1A] p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Mean Confidence</span>
            <span className="text-2xl font-bold text-cyan-300 mt-1 block">{reportModel.summary.avgConfidence}%</span>
          </div>

          <div className="rounded-lg border border-cyan-500/20 bg-[#050D1A] p-4 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Highest Confidence</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{reportModel.summary.maxConfidence}%</span>
          </div>
        </div>

        {/* Main Grid: Classification Breakdown & Anomaly Table */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Detailed Anomaly Table (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Panel title={`SURVEY ANOMALY CONTACTS INDEX (${reportModel.anomalies.length})`}>
              {reportModel.anomalies.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-cyan-500/20 bg-slate-900/80 text-[11px] text-cyan-400 uppercase">
                        <th className="p-3">ID</th>
                        <th className="p-3">Class Label</th>
                        <th className="p-3">Confidence</th>
                        <th className="p-3">Latitude / Longitude</th>
                        <th className="p-3">Depth</th>
                        <th className="p-3">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {reportModel.anomalies.map((anom) => {
                        const meta = getClassMetadata(anom.class_name);
                        const confLabel = formatConfidenceLabel(anom.confidence);
                        const geoStr = formatCoordinate(anom.latitude, anom.longitude, 4);

                        return (
                          <tr key={anom.id} className="hover:bg-cyan-950/20 transition-colors">
                            <td className="p-3 font-bold text-white">{anom.id}</td>
                            <td className="p-3">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                                {meta.label}
                              </span>
                              <span className="text-[10px] text-slate-400 block">{meta.categoryLabel}</span>
                            </td>
                            <td className="p-3 font-bold text-cyan-400">{confLabel}</td>
                            <td className="p-3 font-mono text-slate-300 text-[11px]">{geoStr}</td>
                            <td className="p-3">{anom.depth_m || 4180} m</td>
                            <td className="p-3 uppercase font-bold text-cyan-300">{anom.priority}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-cyan-400 mb-2" />
                  <span className="font-bold uppercase tracking-wider text-slate-300">
                    NO ANOMALY CONTACTS IN REPORT SCOPE
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    The underlying survey dataset or selected export criteria contains zero detected anomaly contacts.
                  </p>
                </div>
              )}
            </Panel>
          </div>

          {/* Right Column: Metadata & Classification Breakdown (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Metadata Specifications Card */}
            <Panel title="REPORT SPECIFICATIONS & METADATA">
              <div className="space-y-2.5 font-mono text-xs text-slate-300 py-1">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Report ID:</span>
                  <span className="font-bold text-cyan-300">{reportModel.metadata.reportId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Mission ID:</span>
                  <span className="font-bold text-white">{reportModel.metadata.missionId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Dataset Name:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[160px]">{reportModel.metadata.datasetName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Sensor Payload:</span>
                  <span className="text-slate-300">{reportModel.metadata.sensorType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">AI CV Pipeline:</span>
                  <span className="text-cyan-300 font-semibold">{reportModel.metadata.modelName} {reportModel.metadata.modelVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Generated:</span>
                  <span className="text-slate-400 text-[11px]">{new Date(reportModel.metadata.reportGeneratedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </Panel>

            {/* Classification Breakdown Panel */}
            <Panel title="CLASSIFICATION DISTRIBUTION SUMMARY">
              <div className="space-y-2.5 font-mono text-xs">
                {reportModel.classBreakdown.map((item) => (
                  <div key={item.classKey} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white font-semibold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <span className="text-cyan-300 font-bold">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
