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
    <OceanDepthBackground showGrid={showGrid} enableParallax={true} intensity={intensity}>

      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />

        {/* Main Content Column */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top System Bar Header */}
          <Header
            title={title}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />

          {/* Page Content Container */}
          <main className="flex-1 p-4 md:p-6">{children}</main>

          {/* Bottom Telemetry Status Bar */}
          <SystemStatusBar />
        </div>
      </div>
    </OceanDepthBackground>
  );
};

export default PageLayout;
