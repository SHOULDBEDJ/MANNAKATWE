import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { getBookings, deleteBooking } from '../../api/bookings.js';
import { Eye, Pencil, Trash2, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  const currentStatus = searchParams.get('status') || 'All';

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (currentStatus !== 'All') params.status = currentStatus;
      if (searchTerm) params.search = searchTerm;
      
      // Preserve other filters if accessed from Dashboard
      const payment = searchParams.get('payment');
      const date = searchParams.get('date');
      const filter = searchParams.get('filter');
      
      if (payment) params.payment = payment;
      if (date) params.date = date;
      if (filter) params.filter = filter;

      const res = await getBookings(params);
      setBookings(res.data || []);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (searchTerm) newParams.set('search', searchTerm);
      else newParams.delete('search');
      setSearchParams(newParams, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParams, setSearchParams]);

  useEffect(() => {
    fetchBookings();
  }, [searchParams]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('are_you_sure'))) return;
    try {
      await deleteBooking(id);
      toast.success('Booking deleted');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const formatCurrency = (amount) => amount === null || amount === undefined || amount === '' ? '—' : `₹${Number(amount).toLocaleString('en-IN')}`;

  const renderBadge = (type, status) => {
    let color = 'var(--color-text-secondary)';
    if (type === 'booking') {
      if (status === 'Draft') color = 'var(--color-draft)';
      else if (status === 'Confirmed') color = 'var(--color-confirmed)';
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
        {t(status?.toLowerCase()) || status}
      </span>
    );
  };

  const statuses = ['All', 'Confirmed', 'Delivered', 'Completed'];

  return (
    <div className="container" style={{ paddingBottom: 'calc(var(--nav-height) + var(--spacing-xl))' }}>
      
      {/* Sticky Header with Filters and Search */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: 'var(--color-background)',
        zIndex: 10,
        padding: 'var(--spacing-md)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {t('bookings')}
          </h1>

          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-secondary)' }} />
            <input 
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                background: 'var(--color-surface)'
              }}
            />
          </div>
        </div>

        {/* Horizontal scrollable status tabs */}
        <div style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          gap: 'var(--spacing-sm)', 
          paddingBottom: '4px',
          scrollbarWidth: 'none' /* Firefox */
        }}>
          {statuses.map(s => {
            const isActive = currentStatus === s;
            return (
              <button
                key={s}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  if (s === 'All') newParams.delete('status');
                  else newParams.set('status', s);
                  setSearchParams(newParams);
                }}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isActive ? 'white' : 'var(--color-text-secondary)',
                  border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  transition: 'all 0.2s ease'
                }}
              >
                {t(s.toLowerCase())}
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: 'var(--spacing-md)' }} className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>Loading...</div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>No bookings found</div>
        ) : (
          bookings.map(booking => (
            <div 
              key={booking.id}
              style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)' }}>{booking.customer_name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{booking.phone}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatCurrency(booking.total_amount)}
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                {booking.delivery_date} {booking.delivery_time ? `at ${booking.delivery_time}` : ''}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {renderBadge('booking', booking.booking_status)}
                  {renderBadge('payment', booking.payment_status)}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => navigate(`/bookings/${booking.id}`)} style={{ color: 'var(--color-info)' }}>
                    <Eye size={20} />
                  </button>
                  
                  {booking.booking_status !== 'Completed' && (
                    <>
                      <button onClick={() => navigate(`/bookings/${booking.id}/edit`)} style={{ color: 'var(--color-text-secondary)' }}>
                        <Pencil size={20} />
                      </button>
                      <button onClick={() => handleDelete(booking.id)} style={{ color: 'var(--color-error)' }}>
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/bookings/new')}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-height) + var(--spacing-lg))',
          right: 'var(--spacing-lg)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50
        }}
      >
        <Plus size={28} />
      </button>

    </div>
  );
}
