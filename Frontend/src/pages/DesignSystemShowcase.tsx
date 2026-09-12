import React, { useState } from 'react';
import OceanDepthBackground from '@/components/sonar/OceanDepthBackground';
import SonarGrid from '@/components/sonar/SonarGrid';
import SonarPulse from '@/components/sonar/SonarPulse';
import ScanLine from '@/components/sonar/ScanLine';
import DetectionMarker from '@/components/sonar/DetectionMarker';
import ImageViewerFrame from '@/components/sonar/ImageViewerFrame';

import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import MetricCard from '@/components/ui/Card';
import StatusIndicator from '@/components/ui/StatusIndicator';
import ProgressBar from '@/components/ui/ProgressBar';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';

import { Waves, Shield, Cpu, UploadCloud, Search, Eye, AlertTriangle } from 'lucide-react';

export default function DesignSystemShowcase() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'components' | 'sonar' | 'tables'>('overview');
  const [loadingBtn, setLoadingBtn] = useState(false);

  const sampleData = [
    { id: 'ANM-0142-001', class_name: 'unidentified_object', confidence: 0.94, priority: 'critical', lat: -6.31, lon: 71.21, status: 'pending_review' },
    { id: 'ANM-0142-002', class_name: 'shipwreck', confidence: 0.88, priority: 'high', lat: -6.34, lon: 71.18, status: 'verified' },
    { id: 'ANM-0142-003', class_name: 'mine_like_contact', confidence: 0.81, priority: 'critical', lat: -6.29, lon: 71.24, status: 'pending_review' },
  ];

  return (
    <OceanDepthBackground showGrid={true} enableParallax={true}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-cyan-400" />
              <h1 className="font-mono text-xl font-bold tracking-wider text-cyan-400 uppercase">
                MarianaTech Design System
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-400">
              SIH 2026 PS 26057 - Tactical Underwater Side-Scan Sonar Visual Identity
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusIndicator status="online" label="DESIGN SYSTEM ONLINE" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoadingBtn(true);
                setTimeout(() => setLoadingBtn(false), 1500);
              }}
              loading={loadingBtn}
            >
              TRIGGER TEST
            </Button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-cyan-500/20 pb-2">
          {(['overview', 'components', 'sonar', 'tables'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`rounded px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${selectedTab === tab ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-cyan-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content: OVERVIEW */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <MetricCard title="Total Surveys" value="42" subtitle="Across Indian Ocean Trench" icon={<Shield className="h-4 w-4" />} trend="+12%" />
            <MetricCard title="Anomalies Found" value="147" subtitle="Verified contacts" icon={<Cpu className="h-4 w-4" />} variant="green" />
            <MetricCard title="Critical Contacts" value="18" subtitle="Requires ROV review" icon={<AlertTriangle className="h-4 w-4" />} variant="hazard" />
            <MetricCard title="Avg AI Confidence" value="91.4%" subtitle="CV Pipeline SNR 14.2dB" icon={<Eye className="h-4 w-4" />} />
          </div>
        )}

        {/* Tab Content: COMPONENTS */}
        {selectedTab === 'components' && (
          <div className="space-y-6">
            {/* Buttons & Status Indicators */}
            <Panel headerTitle="Buttons & System Indicators" hasCornerNotch>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Button variant="primary">START ANALYSIS</Button>
                <Button variant="secondary" icon={<UploadCloud className="h-4 w-4" />}>UPLOAD SONAR</Button>
                <Button variant="outline">GENERATE REPORT</Button>
                <Button variant="hazard">CRITICAL ALARM</Button>
                <Button variant="success">VERIFY CONTACT</Button>
                <Button variant="primary" loading>PROCESSING</Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 border-t border-cyan-500/20 pt-4">
                <StatusIndicator status="online" />
                <StatusIndicator status="processing" />
                <StatusIndicator status="warning" />
                <StatusIndicator status="error" />
                <StatusIndicator status="offline" />
              </div>
            </Panel>

            {/* Inputs & Progress */}
            <Panel headerTitle="Form Controls & Signals" variant="elevated">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input label="SURVEY LATITUDE" defaultValue="-6.3120" icon={<Search className="h-4 w-4" />} />
                <Input label="SURVEY LONGITUDE" defaultValue="71.2140" />
              </div>
              <div className="space-y-3">
                <ProgressBar value={94} label="ACOUSTIC SIGNAL CONTRAST" variant="cyan" />
                <ProgressBar value={78} label="SPECKLE NOISE REDUCTION (SNR)" variant="green" />
                <ProgressBar value={45} label="ANALYSIS TIMEOUT BUFFER" variant="hazard" />
              </div>
            </Panel>
          </div>
        )}

        {/* Tab Content: SONAR VISUALS */}
        {selectedTab === 'sonar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel headerTitle="Sonar Canvas & Telemetry Frame" hasCornerNotch>
              <ImageViewerFrame title="CHAGOS TRENCH SWEEP" lat={-6.31} lon={71.21} isScanning>
                <div className="relative h-64 w-full bg-slate-950 flex items-center justify-center">
                  <DetectionMarker id="ANM-001" classNameLabel="shipwreck" confidence={0.92} priority="critical" bbox={{ x: 25, y: 25, w: 40, h: 40 }} />
                </div>
              </ImageViewerFrame>
            </Panel>

            <Panel headerTitle="Tactical Sonar Pulse & Grid" variant="analysis">
              <div className="relative flex h-72 w-full items-center justify-center bg-black/60 rounded border border-cyan-500/30 overflow-hidden">
                <SonarGrid className="absolute inset-0" opacity={0.4} />
                <ScanLine direction="horizontal" />
                <SonarPulse size="lg" variant="cyan" />
              </div>
            </Panel>
          </div>
        )}

        {/* Tab Content: TABLES */}
        {selectedTab === 'tables' && (
          <Panel headerTitle="Detection Telemetry Table" variant="elevated" hasCornerNotch>
            <Table
              columns={[
                { key: 'id', header: 'CONTACT ID' },
                { key: 'class_name', header: 'CLASSIFICATION' },
                { key: 'confidence', header: 'CONFIDENCE', render: (item) => `${Math.round(item.confidence * 100)}%` },
                { key: 'priority', header: 'PRIORITY', render: (item) => item.priority.toUpperCase() },
                { key: 'status', header: 'STATUS', render: (item) => <StatusIndicator status={item.status === 'verified' ? 'complete' : 'processing'} label={item.status.toUpperCase()} /> },
              ]}
              data={sampleData}
              onRowClick={(item) => alert(`Selected contact: ${item.id}`)}
            />
          </Panel>
        )}
      </div>
    </OceanDepthBackground>
  );
}
