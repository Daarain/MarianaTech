import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { AlertOctagon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageLayout title="SIGNAL LOST (404)">
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Panel variant="warning" hasCornerNotch className="max-w-md w-full text-center p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(255,59,48,0.3)]">
            <AlertOctagon className="h-7 w-7" />
          </div>

          <h2 className="font-mono text-xl font-bold tracking-wider text-rose-400 uppercase">
            SIGNAL LOST
          </h2>

          <p className="mt-2 font-mono text-xs text-slate-300">
            The requested oceanographic telemetry module could not be located on the current frequency.
          </p>

          <div className="mt-6 flex justify-center">
            <Button
              variant="hazard"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/dashboard')}
            >
              RETURN TO MISSION CONTROL
            </Button>
          </div>
        </Panel>
      </div>
    </PageLayout>
  );
};

export default NotFound;
