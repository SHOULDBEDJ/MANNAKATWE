import { useState, useEffect } from 'react';
import { Menu, Sun, Moon, User as UserIcon, LogOut } from 'lucide-react';
import { getProfile } from '../../api/profile.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function TopBar({ onHamburger, hideHamburger, user, onLogout }) {
  const { lang, toggle, t } = useTranslation();
  const [businessName, setBusinessName] = useState('Shiva Shakti Shamiyana');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    getProfile()
      .then(res => {
        if (res.data && res.data.business_name) {
          setBusinessName(res.data.business_name);
        }
      })
      .catch(() => {});

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setIsInstallable(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div style={{
      height: 'var(--topbar-height)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 var(--spacing-md)',
      position: 'fixed',
      top: 0,
      left: hideHamburger ? '320px' : 0,
      right: 0,
      zIndex: 1000,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderBottom: '1px solid var(--color-border)',
      transition: 'left 0.3s ease'
    }}>
      {!hideHamburger && (
        <button 
          onClick={onHamburger} 
          style={{ 
            marginRight: 'var(--spacing-md)', 
            color: 'var(--color-primary)',
            background: 'var(--color-background)',
            border: 'none',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          className="hover-scale"
        >
          <Menu size={24} strokeWidth={2.5} />
        </button>
      )}
      
      <div style={{ 
        flex: 1, 
        fontWeight: 700, 
        fontSize: '1rem', 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        marginRight: '8px',
        maxWidth: '120px' // Limit name on mobile
      }}>
        {businessName}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--color-surface)', padding: '4px 10px',
            borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'var(--color-primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 800
            }}>
              {getInitials(user.username)}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {user.username}
            </span>
          </div>
        )}

        {isInstallable && (
          <button 
            onClick={handleInstallClick}
            style={{
              padding: '6px 10px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #0056b3))',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: 'none',
              textTransform: 'uppercase'
            }}
          >
            {t('pwa_install_short') || 'Install'}
          </button>
        )}
        
        <button 
          id="btn-language-toggle"
          onClick={toggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 10px',
            background: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-pill, 20px)',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: 'var(--color-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}
          className="hover-scale"
        >
          {lang === 'en' ? 'KN' : 'EN'}
        </button>

        <ThemeToggle />
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme === 'light' ? '#FEF3C7' : '#334155',
        color: theme === 'light' ? '#D97706' : '#FCD34D',
        border: 'none',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      className="hover-scale"
    >
      {theme === 'light' ? <Sun size={20} fill="currentColor" /> : <Moon size={20} fill="currentColor" />}
    </button>
  );
}
