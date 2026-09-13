import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Globe,
  ArrowLeft,
  Eye,
  Sliders,
  RotateCcw,
  Search,
  Filter,
  Activity,
  Layers,
  MapPin,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { ROUTES } from '@/constants/routes';
import { useMissionContext } from '@/context/MissionContext';
import { useToast } from '@/context/ToastContext';
import { getMissionById } from '@/api/missions';
import { getAnomalies as getMissionAnomalies } from '@/api/anomalies';
import type { Mission, Anomaly, Priority } from '@/types/api';
import { partitionByGeolocation } from '@/utils/geolocationUtils';
import {
  getClassMetadata,
  filterDetectionsCombined,
  SUPPORTED_CLASSES,
} from '@/utils/classificationUtils';
import {
  normalizeConfidence,
  formatConfidenceLabel,
} from '@/utils/confidenceUtils';
import GeospatialMapContainer from '@/components/sonar/GeospatialMapContainer';
import ConfidenceControlPanel, { type SortOrder } from '@/components/sonar/ConfidenceControlPanel';
import ClassificationInspectorPanel from '@/components/sonar/ClassificationInspectorPanel';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';

export default function MapView() {
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

  // Phase 10 & 11 Filtering & Classification State
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('CONFIDENCE_DESC');

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
        console.warn('Failed to load mission for map view:', err);
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

  // Compute combined filtered anomalies list
  const visibleAnomalies: Anomaly[] = useMemo(() => {
    let filtered = filterDetectionsCombined(
      rawAnomalies,
      selectedClassFilter,
      confidenceThreshold,
      searchQuery
    );

    if (sortOrder === 'CONFIDENCE_DESC') {
      filtered = [...filtered].sort(
        (a, b) => normalizeConfidence(b.confidence) - normalizeConfidence(a.confidence)
      );
    } else if (sortOrder === 'CONFIDENCE_ASC') {
      filtered = [...filtered].sort(
        (a, b) => normalizeConfidence(a.confidence) - normalizeConfidence(b.confidence)
      );
    }

    return filtered;
  }, [rawAnomalies, selectedClassFilter, confidenceThreshold, searchQuery, sortOrder]);

  const handleResetFilters = () => {
    setConfidenceThreshold(0);
    setSelectedClassFilter('ALL');
    setSearchQuery('');
    setSortOrder('CONFIDENCE_DESC');
    showToast('Map filters reset to default', 'info');
  };

  const handleNavigateToSonar = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    navigate(ROUTES.sonarAnalysis);
  };

  const originLat = stagedFile ? stagedLatitude : mission?.latitude || -6.3000;
  const originLon = stagedFile ? stagedLongitude : mission?.longitude || 71.2000;

  return (
    <PageLayout title="Geospatial Anomaly Map" intensity="low">

      <div className="flex flex-col gap-6 font-mono">
        {/* Header Navigation & Info Bar */}
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
                GEOSPATIAL INTELLIGENCE MAP • WGS 84
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Side-Scan Sonar Anomaly Map Station
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.sonarAnalysis)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              VIEW IN SONAR ENGINE
            </Button>
          </div>
        </div>

        {/* Filter Summary Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/10 bg-[#050D1A]/80 px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
            <span>
              TOTAL CONTACTS: <strong className="text-cyan-400">{rawAnomalies.length}</strong>
            </span>
            <span>
              VISIBLE ON MAP: <strong className="text-emerald-400">{visibleAnomalies.length}</strong>
            </span>
            <span>
              CLASS FILTER: <strong className="text-cyan-300 uppercase">{selectedClassFilter}</strong>
            </span>
            <span>
              CONFIDENCE THRESHOLD: <strong className="text-cyan-300">≥ {confidenceThreshold}%</strong>
            </span>
          </div>

          {(selectedClassFilter !== 'ALL' || confidenceThreshold > 0 || searchQuery !== '') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-amber-400 hover:text-white text-[11px] border-amber-500/40"
            >
              <RotateCcw className="h-3 w-3 mr-1 inline" />
              RESET MAP FILTERS
            </Button>
          )}
        </div>

        {/* Main Grid Layout: Map Viewport (8 cols) & Filter Controls (4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Interactive Map Viewport */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <GeospatialMapContainer
              anomalies={visibleAnomalies}
              rawAnomalies={rawAnomalies}
              selectedAnomaly={selectedAnomaly}
              onSelectAnomaly={setSelectedAnomaly}
              onNavigateToSonar={handleNavigateToSonar}
              originLat={originLat}
              originLon={originLon}
              height="580px"
            />
          </div>

          {/* Right Column: Classification Inspector & Filter Controls */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Classification Inspector Panel */}
            <ClassificationInspectorPanel
              allAnomalies={rawAnomalies}
              selectedClassFilter={selectedClassFilter}
              setSelectedClassFilter={setSelectedClassFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedAnomaly={selectedAnomaly}
              onClearSelection={() => setSelectedAnomaly(null)}
            />

            {/* Confidence Control Panel */}
            <ConfidenceControlPanel
              allAnomalies={rawAnomalies}
              threshold={confidenceThreshold}
              setThreshold={setConfidenceThreshold}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              onResetFilter={() => setConfidenceThreshold(0)}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
