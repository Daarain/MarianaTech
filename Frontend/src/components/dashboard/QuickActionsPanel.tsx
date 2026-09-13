import React from 'react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { ArrowRight, UploadCloud, Map, FileText, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Panel
      headerTitle="QUICK OPERATIONAL ACTIONS"
      headerIcon={<Zap className="h-4 w-4 text-cyan-400" />}
      hasCornerNotch
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="primary"
          icon={<ArrowRight className="h-4 w-4" />}
          onClick={() => navigate('/missions/MSN-2026-0142/viewer')}
        >
          START SONAR ANALYSIS
        </Button>
        <Button
          variant="secondary"
          icon={<UploadCloud className="h-4 w-4" />}
          onClick={() => navigate('/missions/new')}
        >
          UPLOAD SONAR DATA
        </Button>
        <Button
          variant="outline"
          icon={<Map className="h-4 w-4" />}
          onClick={() => navigate('/missions/MSN-2026-0142/map')}
        >
          VIEW ANOMALY MAP
        </Button>
        <Button
          variant="outline"
          icon={<FileText className="h-4 w-4" />}
          onClick={() => navigate('/missions/MSN-2026-0142/reports')}
        >
          EXPORT SURVEY REPORTS
        </Button>
      </div>
    </Panel>
  );
};

export default QuickActionsPanel;
