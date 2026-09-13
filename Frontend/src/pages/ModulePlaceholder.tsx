import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { Cpu, ArrowLeft, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModulePlaceholderProps {
  moduleName?: string;
  moduleDescription?: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  moduleName = 'SONAR MODULE',
  moduleDescription = 'This telemetry module is queued for execution in an upcoming phase.',
}) => {
  const navigate = useNavigate();

  return (
    <PageLayout title={moduleName}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Panel variant="elevated" hasCornerNotch className="max-w-xl w-full text-center p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Cpu className="h-7 w-7" />
          </div>

          <span className="rounded bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
            PHASE FRAMEWORK READY
          </span>

          <h2 className="mt-3 font-mono text-lg font-bold tracking-wider text-slate-100 uppercase">
            {moduleName}
          </h2>

          <p className="mt-2 font-mono text-xs text-slate-400 leading-relaxed">
            {moduleDescription}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/dashboard')}
            >
              RETURN TO MISSION CONTROL
            </Button>
            <Button
              variant="outline"
              icon={<Terminal className="h-4 w-4" />}
              onClick={() => navigate('/design-system')}
            >
              DESIGN SYSTEM SHOWCASE
            </Button>
          </div>
        </Panel>
      </div>
    </PageLayout>
  );
};

export default ModulePlaceholder;
