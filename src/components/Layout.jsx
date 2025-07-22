import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden fade-in"
          onClick={closeSidebar}
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} collapsed={sidebarCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onToggleSidebar={toggleSidebar} 
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-950 p-4 lg:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-transparent to-zinc-900/20 pointer-events-none"></div>
          <div className="relative z-10 max-w-full">
          {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;