import TopBar from './TopBar.jsx';
import SideDrawer from './SideDrawer.jsx';
import { useState, useEffect } from 'react';

export default function AppShell({ children, user, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--color-background)' }}>
      {/* Sidebar for Desktop / Drawer for Mobile */}
      <SideDrawer 
        open={isDesktop || drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        isPersistent={isDesktop} 
        user={user}
      />
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        marginLeft: isDesktop ? '320px' : 0,
        transition: 'margin-left 0.3s ease',
        minWidth: 0
      }}>
        <TopBar onHamburger={() => setDrawerOpen(true)} hideHamburger={isDesktop} user={user} onLogout={onLogout} />
        
        <main style={{
          flex: 1,
          paddingTop: 'var(--topbar-height)',
          paddingBottom: 0,
          overflowY: 'auto'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
