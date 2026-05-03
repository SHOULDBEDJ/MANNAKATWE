import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, CalendarCheck, Receipt, Images, User, Settings, ChevronDown, History } from 'lucide-react';
import { getProfile } from '../../api/profile.js';
import { getCustomerTypes } from '../../api/customerTypes.js';
import { useTranslation } from '../../context/LanguageContext.jsx';

export default function SideDrawer({ open, onClose, isPersistent, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, toggle, t } = useTranslation();
  
  const [profile, setProfile] = useState({});
  const [customerTypes, setCustomerTypes] = useState([]);
  const [bookingsExpanded, setBookingsExpanded] = useState(false);

  useEffect(() => {
    if (open) {
      getProfile().then(res => setProfile(res.data || {})).catch(() => {});
      // Prevent background scroll on mobile when drawer is open
      if (!isPersistent) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, isPersistent]);

  const handleBookingsExpand = async (e) => {
    e.stopPropagation();
    if (!bookingsExpanded && customerTypes.length === 0) {
      try {
        const res = await getCustomerTypes();
        setCustomerTypes(res.data);
      } catch (error) {
        console.error(error);
      }
    }
    setBookingsExpanded(!bookingsExpanded);
  };

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { id: 'bookings', label: t('bookings'), icon: <CalendarCheck size={20} />, path: '/bookings', expandable: true },
    { id: 'expenses', label: t('expenses'), icon: <Receipt size={20} />, path: '/expenses' },
    { id: 'gallery', label: t('gallery'), icon: <Images size={20} />, path: '/gallery' },
    { id: 'history', label: t('customer_history') || 'Customer History', icon: <History size={20} />, path: '/customers-history' },
    { id: 'profile', label: t('profile'), icon: <User size={20} />, path: '/profile' },
    { id: 'settings', label: t('settings'), icon: <Settings size={20} />, path: '/settings' },
  ].filter(item => {
    if (item.id === 'profile') return true;
    if (user?.permissions === 'all') return true;
    return user?.permissions?.includes(item.id);
  });

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  const getInitials = (name) => {
    if (!name) return 'SS';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Backdrop */}
      {!isPersistent && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 200,
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none',
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        width: isPersistent ? '320px' : '280px',
        background: 'var(--color-surface)',
        zIndex: 201,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isPersistent ? 'none' : 'var(--shadow-lg)',
        borderRight: isPersistent ? '1px solid var(--color-border)' : 'none',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ 
          padding: 'var(--spacing-lg)', 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', 
          color: 'white', 
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative circle */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />
          
          {!isPersistent && (
            <button onClick={onClose} style={{ position: 'absolute', top: 'var(--spacing-md)', right: 'var(--spacing-md)', color: 'white', zIndex: 10 }}>
              <X size={24} />
            </button>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'var(--spacing-md)', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--color-surface)',
              padding: '2px',
              boxShadow: 'var(--shadow-md)',
              marginBottom: 'var(--spacing-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <div style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.5rem' }}>{getInitials(profile.business_name)}</div>
              )}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {profile.business_name || 'Shiva Shakti Shamiyana'}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>{profile.phone}</div>
          </div>
        </div>

        {/* Language Toggle */}
        <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={toggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 16px',
              background: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.875rem'
            }}
          >
            <span style={{ fontWeight: lang === 'en' ? 700 : 400, color: lang === 'en' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>EN</span>
            <span style={{ margin: '0 8px', color: 'var(--color-text-secondary)' }}>|</span>
            <span style={{ fontWeight: lang === 'kn' ? 700 : 400, color: lang === 'kn' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>ಕನ್ನಡ</span>
          </button>
        </div>

        {/* Nav Items */}
        <div style={{ padding: 'var(--spacing-sm)', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <div key={item.id}>
                <div 
                  onClick={() => handleNav(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--spacing-md)',
                    margin: 'var(--spacing-xs) 0',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--color-text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ marginRight: 'var(--spacing-md)', display: 'flex' }}>
                    {item.icon}
                  </div>
                  <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
                  
                  {item.expandable && (
                    <div 
                      onClick={handleBookingsExpand}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? 'white' : 'var(--color-text-secondary)',
                        transform: bookingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: '6px',
                        borderRadius: '50%',
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
                        cursor: 'pointer'
                      }}
                      className="hover-scale"
                    >
                      <ChevronDown size={18} strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                {/* Expanded Bookings Sub-items */}
                {item.expandable && bookingsExpanded && (
                  <div style={{ paddingLeft: '48px', marginBottom: 'var(--spacing-sm)' }}>
                    {customerTypes.map(type => (
                      <div 
                        key={type.id}
                        onClick={() => handleNav(`/bookings?type=${type.id}`)}
                        style={{
                          padding: 'var(--spacing-sm) 0',
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        {type.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
