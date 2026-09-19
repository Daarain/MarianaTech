import React, { useState } from 'react';
import OceanDepthBackground, { type EnvironmentIntensity } from '@/components/sonar/OceanDepthBackground';
import Sidebar from './Sidebar';
import Header from './Header';
import SystemStatusBar from './SystemStatusBar';


interface PageLayoutProps {
  title?: string;
  children: React.ReactNode;
  showGrid?: boolean;
  intensity?: EnvironmentIntensity;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  children,
  showGrid = true,
  intensity = 'medium',
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  return (
    <OceanDepthBackground
      showGrid={showGrid}
      enableParallax={true}
      intensity={intensity}
      className="h-screen flex flex-col"
      contentClassName="h-full w-full flex flex-col overflow-hidden"
    >
      <div className="flex h-full w-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />

        {/* Main Content Column */}
        <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
          {/* Top System Bar Header */}
          <Header
            title={title}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />

          {/* Page Content Container - ONLY THIS SCROLLS */}
          <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            {children}
          </main>

          {/* Bottom Telemetry Status Bar */}
          <SystemStatusBar />
        </div>
      </div>
    </OceanDepthBackground>
  );
};

export default PageLayout;
