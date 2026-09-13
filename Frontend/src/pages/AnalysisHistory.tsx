import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  ScanLine,
  FileText,
  MapPin,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ChevronRight,
  Eye,
  Info,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { useMissionContext } from '@/context/MissionContext';
import { ROUTES } from '@/constants/routes';
import {
  getAnalysisHistory,
  getAnalysisStats,
  deleteAnalysis,
  retryAnalysis,
  type GetAnalysesParams,
} from '@/api/history';
import type { AnalysisHistoryItem, AnalysisHistoryStats, AnalysisStatus } from '@/types/api';

export const AnalysisHistory: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveMission, setStagedDataset } = useMissionContext();

  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [stats, setStats] = useState<AnalysisHistoryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistoryItem | null>(null);

  // Deletion Modal state
  const [deleteCandidate, setDeleteCandidate] = useState<AnalysisHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GetAnalysesParams = {
        status: statusFilter,
        search: searchTerm,
        sortBy: sortBy === 'detections' ? 'detections' : sortBy === 'oldest' ? 'oldest' : 'created_at',
      };
      const [listRes, statsRes] = await Promise.all([
        getAnalysisHistory(params),
        getAnalysisStats(),
      ]);
      setAnalyses(listRes.items);
      setStats(statsRes);
      if (listRes.items.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(listRes.items[0]);
      }
    } catch (err: any) {
      console.error('Failed to load analysis history:', err);
      setError(err?.message || 'Unable to retrieve analysis history from MarianaTech backend.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, sortBy, selectedAnalysis]);

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, sortBy]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Actions
  const handleOpenAnalysis = (item: AnalysisHistoryItem) => {
    setActiveMission({
      id: item.dataset_id,
      name: item.name,
      date: item.created_at.split('T')[0],
      location: item.latitude && item.longitude ? `${item.latitude.toFixed(2)}°, ${item.longitude.toFixed(2)}°` : 'Indian Ocean',
      latitude: item.latitude ?? -6.3,
      longitude: item.longitude ?? 71.2,
      status: item.status === 'completed' ? 'complete' : item.status === 'processing' ? 'processing' : 'failed',
      anomaly_count: item.detection_count,
      priority: item.priority,
      depth_m: item.depth_m,
      area_km2: 25,
      operator: item.operator,
      sonar_type: item.sonar_type,
    });
    setStagedDataset(null, null, item.latitude ?? -6.3, item.longitude ?? 71.2);
    navigate(ROUTES.sonarAnalysis);
  };

  const handleOpenReport = (item: AnalysisHistoryItem) => {
    navigate(ROUTES.missionReports.replace(':id', item.dataset_id));
  };

  const handleOpenMap = (item: AnalysisHistoryItem) => {
    navigate(ROUTES.missionMap.replace(':id', item.dataset_id));
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await deleteAnalysis(deleteCandidate.id);
      if (selectedAnalysis?.id === deleteCandidate.id) {
        setSelectedAnalysis(null);
      }
      setDeleteCandidate(null);
      await fetchHistory();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetry = async (item: AnalysisHistoryItem) => {
    try {
      await retryAnalysis(item.id);
      await fetchHistory();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const getStatusBadge = (status: AnalysisStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            COMPLETED
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-300 animate-pulse">
            <Clock className="h-3 w-3 text-cyan-400" />
            PROCESSING
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded bg-rose-950/70 border border-rose-500/40 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-400">
            <XCircle className="h-3 w-3 text-rose-400" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded bg-slate-900 border border-slate-700 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-400">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6 pb-12">
        {/* Header Title Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-cyan-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Archive className="h-6 w-6 text-cyan-400" />
              <h1 className="font-mono text-xl font-bold tracking-wider text-cyan-400 uppercase">
                MISSION ARCHIVE
              </h1>
              <span className="rounded bg-cyan-950 border border-cyan-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400">
                PHASE 14 PERSISTENT STORE
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-400">
              Traceable Sonar Analysis Registry & Reopenable Inspection Records
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchHistory()}
              className="flex items-center gap-2 rounded border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 font-mono text-xs text-cyan-300 hover:bg-cyan-900/40 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              REFRESH
            </button>
            <button
              onClick={() => navigate(ROUTES.missionNew)}
              className="flex items-center gap-2 rounded border border-cyan-500/50 bg-cyan-500/20 px-3.5 py-1.5 font-mono text-xs font-bold text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:bg-cyan-500/30 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              START NEW ANALYSIS
            </button>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded border border-cyan-500/30 bg-[#050D1A]/90 p-3 shadow-md">
              <div className="font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                TOTAL ANALYSES
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-cyan-400">
                {stats.total_analyses}
              </div>
            </div>

            <div className="rounded border border-emerald-500/30 bg-[#050D1A]/90 p-3 shadow-md">
              <div className="font-mono text-[10px] font-bold tracking-wider text-emerald-400/80 uppercase">
                COMPLETED
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                {stats.completed}
              </div>
            </div>

            <div className="rounded border border-cyan-500/30 bg-[#050D1A]/90 p-3 shadow-md">
              <div className="font-mono text-[10px] font-bold tracking-wider text-cyan-400/80 uppercase">
                PROCESSING
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-cyan-300">
                {stats.processing}
              </div>
            </div>

            <div className="rounded border border-rose-500/30 bg-[#050D1A]/90 p-3 shadow-md">
              <div className="font-mono text-[10px] font-bold tracking-wider text-rose-400/80 uppercase">
                FAILED
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-rose-400">
                {stats.failed}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded border border-amber-500/30 bg-[#050D1A]/90 p-3 shadow-md">
              <div className="font-mono text-[10px] font-bold tracking-wider text-amber-400/80 uppercase">
                TOTAL DETECTIONS
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-amber-400">
                {stats.total_anomalies}
              </div>
            </div>
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded border border-cyan-500/20 bg-[#050D1A]/95 p-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search analysis ID, dataset file, operator, model..."
              className="w-full rounded border border-cyan-500/30 bg-[#0A1628] py-1.5 pl-9 pr-3 font-mono text-xs text-cyan-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 font-mono text-xs text-slate-400 hover:text-cyan-300"
              >
                ×
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="font-mono text-xs text-slate-400 hidden sm:inline">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-cyan-500/30 bg-[#0A1628] py-1.5 px-2.5 font-mono text-xs text-cyan-300 focus:border-cyan-400 focus:outline-none"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="completed">COMPLETED</option>
              <option value="processing">PROCESSING</option>
              <option value="failed">FAILED</option>
            </select>

            {/* Sort Order */}
            <ArrowUpDown className="h-3.5 w-3.5 text-cyan-400 shrink-0 ml-2" />
            <span className="font-mono text-xs text-slate-400 hidden sm:inline">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border border-cyan-500/30 bg-[#0A1628] py-1.5 px-2.5 font-mono text-xs text-cyan-300 focus:border-cyan-400 focus:outline-none"
            >
              <option value="created_at">NEWEST FIRST</option>
              <option value="oldest">OLDEST FIRST</option>
              <option value="detections">MOST DETECTIONS</option>
            </select>
          </div>
        </div>

        {/* Content Section: Table + Details Drawer */}
        {error ? (
          <div className="rounded border border-rose-500/40 bg-rose-950/20 p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-400 mb-3" />
            <h3 className="font-mono text-base font-bold text-rose-300 uppercase">
              MISSION ARCHIVE UNAVAILABLE
            </h3>
            <p className="mt-1 font-mono text-xs text-rose-200/80 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchHistory()}
              className="mt-4 rounded border border-rose-500/50 bg-rose-900/40 px-4 py-1.5 font-mono text-xs font-bold text-rose-200 hover:bg-rose-800/40 transition-colors"
            >
              RETRY CONNECTION
            </button>
          </div>
        ) : loading ? (
          <div className="rounded border border-cyan-500/20 bg-[#050D1A]/90 p-12 text-center">
            <RefreshCw className="mx-auto h-8 w-8 text-cyan-400 animate-spin mb-3" />
            <p className="font-mono text-xs tracking-wider text-cyan-400 uppercase">
              LOADING MISSION ARCHIVE...
            </p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="rounded border border-cyan-500/20 bg-[#050D1A]/90 p-12 text-center">
            <Archive className="mx-auto h-10 w-10 text-slate-500 mb-3" />
            {searchTerm || statusFilter !== 'ALL' ? (
              <>
                <h3 className="font-mono text-sm font-bold text-slate-300 uppercase">
                  NO MATCHING ANALYSES
                </h3>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  No analysis records match your active search term or status filters.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                  }}
                  className="mt-4 rounded border border-cyan-500/40 bg-cyan-950 px-4 py-1.5 font-mono text-xs text-cyan-300 hover:bg-cyan-900/50"
                >
                  CLEAR FILTERS
                </button>
              </>
            ) : (
              <>
                <h3 className="font-mono text-sm font-bold text-slate-300 uppercase">
                  MISSION ARCHIVE EMPTY
                </h3>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  No side-scan sonar analyses have been recorded in the database yet.
                </p>
                <button
                  onClick={() => navigate(ROUTES.missionNew)}
                  className="mt-4 rounded border border-cyan-500/50 bg-cyan-500/20 px-4 py-1.5 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
                >
                  START NEW ANALYSIS
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analysis List Table (Takes 2 columns on desktop) */}
            <div className="lg:col-span-2 rounded border border-cyan-500/20 bg-[#050D1A]/95 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-cyan-500/20 bg-cyan-950/40 text-[10px] tracking-wider text-slate-400 uppercase">
                      <th className="py-2.5 px-3">ANALYSIS ID / DATASET</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3 text-center">DETECTIONS</th>
                      <th className="py-2.5 px-3">CREATED</th>
                      <th className="py-2.5 px-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/10">
                    {analyses.map((item) => {
                      const isSelected = selectedAnalysis?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedAnalysis(item)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-cyan-950/60 border-l-4 border-l-cyan-400'
                              : 'hover:bg-cyan-950/20'
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-bold text-cyan-300">{item.id}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]" title={item.filename}>
                              {item.filename}
                            </div>
                          </td>

                          <td className="py-3 px-3">{getStatusBadge(item.status)}</td>

                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-amber-400 text-sm">
                              {item.detection_count}
                            </span>
                            {item.geolocated_count > 0 && (
                              <span className="block text-[9px] text-emerald-400">
                                ({item.geolocated_count} GPS)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {new Date(item.created_at).toLocaleDateString()}
                            <span className="block text-[10px] text-slate-500">
                              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenAnalysis(item)}
                                title="Open in Sonar Analysis Workspace"
                                className="rounded bg-cyan-950 border border-cyan-500/40 p-1.5 text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                              >
                                <ScanLine className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenReport(item)}
                                title="Open Survey Report"
                                className="rounded bg-slate-900 border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800 transition-colors"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>

                              {item.latitude != null && item.longitude != null && (
                                <button
                                  onClick={() => handleOpenMap(item)}
                                  title="View on Geospatial Map"
                                  className="rounded bg-emerald-950 border border-emerald-500/40 p-1.5 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                                >
                                  <MapPin className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => setDeleteCandidate(item)}
                                title="Delete Record"
                                className="rounded bg-rose-950/40 border border-rose-500/30 p-1.5 text-rose-400 hover:bg-rose-900/60 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Analysis Inspector Card (1 Column) */}
            <div className="lg:col-span-1">
              {selectedAnalysis ? (
                <div className="rounded border border-cyan-500/30 bg-[#050D1A]/95 p-4 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-cyan-400" />
                      <h3 className="font-mono text-xs font-bold text-cyan-400 tracking-wider uppercase">
                        ANALYSIS DETAILS
                      </h3>
                    </div>
                    {getStatusBadge(selectedAnalysis.status)}
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">ANALYSIS ID</span>
                      <p className="font-bold text-cyan-300 text-sm">{selectedAnalysis.id}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">DATASET FILE</span>
                      <p className="text-slate-200 break-all">{selectedAnalysis.filename}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">AI MODEL SPECIFICATION</span>
                      <p className="text-cyan-400 font-semibold">{selectedAnalysis.model}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-500/10">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">DETECTIONS</span>
                        <p className="font-bold text-amber-400">{selectedAnalysis.detection_count} contacts</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">GEOLOCATED</span>
                        <p className="font-bold text-emerald-400">{selectedAnalysis.geolocated_count} contacts</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-500/10">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">LAT / LON</span>
                        <p className="text-slate-300">
                          {selectedAnalysis.latitude != null && selectedAnalysis.longitude != null
                            ? `${selectedAnalysis.latitude.toFixed(2)}°, ${selectedAnalysis.longitude.toFixed(2)}°`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">DEPTH</span>
                        <p className="text-slate-300">{selectedAnalysis.depth_m} m</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">OPERATOR / VESSEL</span>
                      <p className="text-slate-300">{selectedAnalysis.operator}</p>
                    </div>

                    {selectedAnalysis.error && (
                      <div className="rounded border border-rose-500/40 bg-rose-950/40 p-2 text-rose-300 text-[11px]">
                        <span className="font-bold block text-rose-400 uppercase">FAILURE REASON:</span>
                        {selectedAnalysis.error}
                      </div>
                    )}
                  </div>

                  {/* Primary Handoff Action Buttons */}
                  <div className="pt-3 border-t border-cyan-500/20 space-y-2">
                    <button
                      onClick={() => handleOpenAnalysis(selectedAnalysis)}
                      className="w-full flex items-center justify-center gap-2 rounded border border-cyan-500/50 bg-cyan-500/20 py-2 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                    >
                      <ScanLine className="h-4 w-4" />
                      REOPEN IN SONAR WORKSPACE
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenReport(selectedAnalysis)}
                        className="flex items-center justify-center gap-1.5 rounded border border-slate-700 bg-slate-900 py-1.5 font-mono text-xs font-semibold text-slate-300 hover:bg-slate-800"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        VIEW REPORT
                      </button>

                      {selectedAnalysis.latitude != null && selectedAnalysis.longitude != null ? (
                        <button
                          onClick={() => handleOpenMap(selectedAnalysis)}
                          className="flex items-center justify-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-950/60 py-1.5 font-mono text-xs font-semibold text-emerald-400 hover:bg-emerald-900/60"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          VIEW MAP
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex items-center justify-center gap-1.5 rounded border border-slate-800 bg-slate-950 py-1.5 font-mono text-[11px] text-slate-600 cursor-not-allowed"
                        >
                          NO GPS DATA
                        </button>
                      )}
                    </div>

                    {selectedAnalysis.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(selectedAnalysis)}
                        className="w-full flex items-center justify-center gap-2 rounded border border-amber-500/40 bg-amber-950/60 py-1.5 font-mono text-xs font-bold text-amber-300 hover:bg-amber-900/60"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        RETRY FAILED INFERENCE
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded border border-cyan-500/20 bg-[#050D1A]/90 p-8 text-center text-slate-500 font-mono text-xs">
                  Select an analysis row from the list to inspect details.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deletion Confirmation Modal */}
        {deleteCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="max-w-md w-full rounded border border-rose-500/50 bg-[#050D1A] p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-rose-500/30 pb-3">
                <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
                <h3 className="font-mono text-base font-bold text-rose-300 uppercase">
                  DELETE ANALYSIS RECORD?
                </h3>
              </div>

              <div className="space-y-2 font-mono text-xs text-slate-300">
                <p>
                  This action will permanently delete analysis record{' '}
                  <span className="font-bold text-rose-400">{deleteCandidate.id}</span> ({deleteCandidate.filename}) from the backend archive.
                </p>
                <p className="text-[11px] text-slate-400">
                  This action cannot be undone. Associated stored anomaly detections and reports for this record will be purged.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteCandidate(null)}
                  disabled={isDeleting}
                  className="rounded border border-slate-700 bg-slate-900 px-4 py-1.5 font-mono text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 rounded border border-rose-500/60 bg-rose-950 px-4 py-1.5 font-mono text-xs font-bold text-rose-300 hover:bg-rose-900/80 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                >
                  {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  PERMANENTLY DELETE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AnalysisHistory;
