import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Receipt, Images, Settings } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.jsx';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard size={24} />, path: '/dashboard' },
    { id: 'bookings', label: t('bookings'), icon: <CalendarCheck size={24} />, path: '/bookings' },
    { id: 'expenses', label: t('expenses'), icon: <Receipt size={24} />, path: '/expenses' },
    { id: 'gallery', label: t('gallery'), icon: <Images size={24} />, path: '/gallery' },
    { id: 'settings', label: t('settings'), icon: <Settings size={24} />, path: '/settings' },
  ];

  return (
    <div 
      className="bottom-nav-container"
      style={{
        height: 'var(--nav-height)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 10px rgba(0,0,0,0.03)'
      }}
    >
      {navItems.map(item => {
        const isActive = location.pathname.startsWith(item.path);
        
        return (
          <div 
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              flex: 1,
              height: '100%'
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              {item.icon}
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 600 : 500 }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
