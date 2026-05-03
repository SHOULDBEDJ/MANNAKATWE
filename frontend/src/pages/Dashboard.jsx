import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { getKpis, getCalendarBookings, getBookingsByDate, markOverdueDelivered, getRecentBookings } from '../api/dashboard.js';
import { getKpiConfig } from '../api/settings.js';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [kpis, setKpis] = useState(null);
  const [kpiConfig, setKpiConfig] = useState([]);
  const [autoDeliveredCount, setAutoDeliveredCount] = useState(0);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    // Section 1: Auto Status Update
    markOverdueDelivered().then(res => {
      if (res.data && res.data.count > 0) {
        setAutoDeliveredCount(res.data.count);
      }
    }).catch(() => {});

    // Section 3: Fetch KPIs and Config
    Promise.all([
      getKpis(),
      getKpiConfig()
    ]).then(([kpiRes, configRes]) => {
      setKpis(kpiRes.data);
      setKpiConfig(configRes.data);
    }).catch(() => {});
    
    // Section 5: Fetch Recent Bookings
    getRecentBookings().then(res => setRecentBookings(res.data)).catch(() => {});
  }, []); // Static data on mount

  // Section 4: Fetch Calendar Data when month changes
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    getCalendarBookings(year, month)
      .then(res => setCalendarData(res.data || []))
      .catch(() => {});
  }, [currentDate]);

  const handleDateClick = async (dateStr) => {
    setSelectedDate(dateStr);
    try {
      const res = await getBookingsByDate(dateStr);
      setSelectedBookings(res.data || []);
      setIsBoxOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setIsBoxOpen(false);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setIsBoxOpen(false);
  };

  const formatCurrency = (amount) => amount === null || amount === undefined || amount === '' ? '—' : `₹${Number(amount).toLocaleString('en-IN')}`;

  const renderBadge = (type, status) => {
    let color = 'var(--color-text-secondary)';
    if (type === 'booking') {
      if (status === 'Confirmed') color = 'var(--color-confirmed)';
      else if (status === 'Delivered') color = 'var(--color-delivered)';
      else if (status === 'Completed') color = 'var(--color-completed)';
    } else if (type === 'payment') {
      if (status === 'Paid') color = 'var(--color-success)';
      else if (status === 'Pending') color = 'var(--color-error)';
    }

    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: 'var(--radius-lg)',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'white',
        background: color
      }}>
        {t(status.toLowerCase()) || status}
      </span>
    );
  };

  // Calendar generation logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  // Adjust so Monday is first (0), Sunday is last (6)
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  
  const daysArray = Array.from({ length: 42 }, (_, i) => {
    const day = i - startOffset + 1;
    if (day > 0 && day <= daysInMonth) return day;
    return null;
  });

  const monthNames = [
    t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
    t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
  ];

  return (
    <div className="container" style={{ padding: 'var(--spacing-md) 0' }}>
      <div style={{ padding: '0 var(--spacing-md)' }}>
      {/* SECTION 1: Auto Status Update Banner */}
      {autoDeliveredCount > 0 && (
        <div 
          id="banner-auto-delivered"
          onClick={() => navigate('/bookings?status=Delivered')}
          style={{
            background: 'linear-gradient(135deg, var(--color-warning) 0%, #D97706 100%)',
            color: 'white',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <span>{autoDeliveredCount} {t('bookings_marked_delivered')}</span>
          <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
        </div>
      )}

      {/* SECTION 2: Today's Delivery Alert Banner */}
      {kpis?.todays_deliveries > 0 && (
        <div 
          id="banner-todays-deliveries"
          onClick={() => navigate('/bookings?date=today')}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {t('todays_deliveries_alert_prefix') || 'You have'} {kpis.todays_deliveries} {t('todays_deliveries_alert_suffix') || 'delivery/deliveries today! Tap to view.'}
        </div>
      )}

      {/* SECTION 3: KPI Cards Grid */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)' }}>{t('dashboard')}</h2>
      {kpis ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          {(() => {
            const allKpis = [
              { key: 'total_bookings', label: 'total_bookings', path: '/bookings' },
              { key: 'todays_deliveries', label: 'todays_deliveries', path: '/bookings?date=today' },
              { key: 'upcoming_deliveries', label: 'upcoming_deliveries', path: '/bookings?filter=upcoming' },
              { key: 'pending_payments', label: 'pending_payments', path: '/bookings?payment=Pending' },
              { key: 'total_revenue', label: 'total_revenue', path: '/bookings?status=Completed', isCurrency: true },
              { key: 'pending_amount', label: 'pending_amount', path: '/bookings?payment=Pending', isCurrency: true },
              { key: 'total_expenses', label: 'total_expenses', path: '/expenses', isCurrency: true },
              { key: 'monthly_revenue', label: 'monthly_revenue', path: '/bookings?filter=monthly', isCurrency: true },
              { key: 'monthly_expenses', label: 'monthly_expenses', path: '/expenses', isCurrency: true }
            ];

            // If no config yet, show all in default order
            if (kpiConfig.length === 0) {
              return allKpis.map((kpi, idx) => (
                <KpiCard key={idx} kpi={kpi} val={kpis[kpi.key]} navigate={navigate} t={t} formatCurrency={formatCurrency} />
              ));
            }

            // Filter and Sort based on config
            return kpiConfig
              .filter(c => c.is_visible === 1)
              .map(c => {
                const kpi = allKpis.find(k => k.key === c.kpi_key);
                if (!kpi) return null;
                return <KpiCard key={c.id} kpi={kpi} val={kpis[kpi.key]} navigate={navigate} t={t} formatCurrency={formatCurrency} />;
              });
          })()}
        </div>
      ) : (
        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{t('loading_kpis')}</div>
      )}

      {/* SECTION 4: Calendar View */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)' }}>{t('calendar')}</h2>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--spacing-md)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <button id="btn-prev-month" onClick={prevMonth} style={{ padding: 'var(--spacing-xs)' }}><ChevronLeft /></button>
          <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{monthNames[month]} {year}</div>
          <button id="btn-next-month" onClick={nextMonth} style={{ padding: 'var(--spacing-xs)' }}><ChevronRight /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: 'var(--spacing-xs)' }}>
          {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map(d => (
            <div key={d} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {daysArray.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            
            const paddedDay = day.toString().padStart(2, '0');
            const paddedMonthNum = (month + 1).toString().padStart(2, '0');
            const dateStr = `${year}-${paddedMonthNum}-${paddedDay}`;
            
            const hasBooking = calendarData.some(b => b.delivery_date === dateStr);
            const isSelected = selectedDate === dateStr && isBoxOpen;

            return (
              <div 
                key={dateStr}
                id={`calendar-day-${dateStr}`}
                onClick={() => handleDateClick(dateStr)}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  background: isSelected ? 'var(--color-primary)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--color-text)',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{day}</span>
                {hasBooking && (
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: isSelected ? 'white' : 'var(--color-primary)',
                    position: 'absolute',
                    bottom: '4px'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Slide-in Box for Bookings */}
      <div style={{
        overflow: 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        maxHeight: isBoxOpen ? '1000px' : '0px',
        opacity: isBoxOpen ? 1 : 0,
        marginBottom: isBoxOpen ? 'var(--spacing-xl)' : '0'
      }}>
        <div style={{
          background: 'var(--color-background)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('bookings')} {t('search')} {selectedDate}</h3>
            <button id="btn-close-calendar-box" onClick={() => setIsBoxOpen(false)}><X size={20} /></button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {selectedBookings.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--spacing-md)' }}>
                {t('no_bookings_date')}
              </div>
            ) : (
              selectedBookings.map(booking => (
                <div 
                  key={booking.id}
                  id={`btn-calendar-booking-${booking.id}`}
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                  style={{
                    background: 'var(--color-surface)',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{booking.customer_name}</span>
                    <span>{formatCurrency(booking.total_amount)}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {t('time')}: {booking.delivery_time || '—'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {renderBadge('booking', booking.booking_status)}
                    {renderBadge('payment', booking.payment_status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 5: Recent Bookings */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)' }}>{t('recent_bookings')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xl)' }}>
        {recentBookings.length === 0 ? (
          <div style={{ color: 'var(--color-text-secondary)' }}>{t('no_recent_bookings')}</div>
        ) : (
          recentBookings.map(booking => (
            <div 
              key={booking.id}
              id={`btn-recent-booking-${booking.id}`}
              onClick={() => navigate(`/bookings/${booking.id}`)}
              style={{
                background: 'var(--color-surface)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>{booking.customer_name}</span>
                <span>{formatCurrency(booking.total_amount)}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {t('delivery_date')}: {booking.delivery_date || '—'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {renderBadge('booking', booking.booking_status)}
                {renderBadge('payment', booking.payment_status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
}

function KpiCard({ kpi, val, navigate, t, formatCurrency }) {
  return (
    <div
      id={`kpi-card-${kpi.key}`}
      onClick={() => navigate(kpi.path)}
      style={{
        background: 'var(--color-surface)',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'transform 0.1s ease',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
        {t(kpi.label)}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
        {kpi.isCurrency ? formatCurrency(val) : val}
      </div>
    </div>
  );
}
