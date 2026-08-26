import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A1628' }}>
      <Sidebar />
      <div className="min-h-screen flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
