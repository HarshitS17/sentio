'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative flex min-h-screen text-white overflow-hidden bg-transparent">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{ paddingLeft: collapsed ? '112px' : '292px' }} 
      >
        <div className="p-4 pb-0">
          <TopNav collapsed={collapsed} />
        </div>
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
