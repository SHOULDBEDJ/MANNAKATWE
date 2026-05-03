import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { getCustomerHistory, getCustomerBookings } from '../../api/history.js';
import { Search, Eye, History, X, Grid, List, Calendar, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerHistory() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  
  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [viewHistory, setViewHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useState(localStorage.getItem('historyViewMode') || 'grid');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (search = '', date = '') => {
    setLoading(true);
    try {
      const res = await getCustomerHistory({ search, date });
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(searchTerm, searchDate);
  };

  const openDetails = (cust) => {
    setSelectedCustomer(cust);
    setViewHistory(false);
  };

  const openHistory = async (cust) => {
    setSelectedCustomer(cust);
    setViewHistory(true);
    setHistoryLoading(true);
    try {
      const res = await getCustomerBookings(cust.id);
      setHistoryData(res.data || { bookings: [] });
    } catch (error) {
      toast.error('Failed to fetch booking history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'table' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('historyViewMode', newMode);
  };

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('customer_history') || 'Customer History'}</h1>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ 
        display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xl)', 
        flexWrap: 'wrap', background: 'var(--color-surface)', padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ flex: 2, position: 'relative', minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
          <input 
            type="text" 
            placeholder={t('search_placeholder') || 'Name, Phone or ID...'} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-background)' }}
          />
        </div>
        <div style={{ flex: 1, position: 'relative', minWidth: '150px' }}>
          <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
          <input 
            type="date" 
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-background)' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 24px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: 'white', fontWeight: 600, border: 'none' }}>
          {t('search')}
        </button>
      </form>

      {/* Customers Grid */}
      {loading ? (
        <div className="text-center" style={{ padding: '40px' }}>{t('loading')}</div>
      ) : (
        <div className="grid-auto-fill">
          {customers.map(cust => (
            <div key={cust.id} className="card hover-scale" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '12px', 
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700
                }}>
                  {cust.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cust.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{cust.customer_uid || 'No ID'}</div>
                </div>
              </div>
              
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Phone size={14} /> {cust.phone}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button 
                  onClick={() => openDetails(cust)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-background)', border: '1px solid var(--color-border)', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <Eye size={16} /> {t('details')}
                </button>
                <button 
                  onClick={() => openHistory(cust)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <History size={16} /> {t('history')}
                </button>
              </div>
            </div>
          ))}
          {customers.length === 0 && <div className="text-center" style={{ gridColumn: '1/-1', padding: '40px', color: 'var(--color-text-secondary)' }}>{t('no_customers_found') || 'No customers found'}</div>}
        </div>
      )}

      {/* Details/History Modal */}
      {selectedCustomer && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-md)'
        }}>
          <div style={{ 
            background: 'var(--color-surface)', width: '100%', maxWidth: '900px', 
            maxHeight: '90vh', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{viewHistory ? t('booking_history') : t('customer_details')}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>{selectedCustomer.customer_uid}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {viewHistory && (
                  <button onClick={toggleViewMode} style={{ padding: '8px', borderRadius: '8px', background: 'var(--color-background)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
                    {viewMode === 'grid' ? t('table_view') : t('grid_view')}
                  </button>
                )}
                <button onClick={() => setSelectedCustomer(null)} style={{ padding: '8px', borderRadius: '50%', background: 'var(--color-background)', border: 'none' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 'var(--spacing-lg)', overflowY: 'auto', flex: 1 }}>
              {!viewHistory ? (
                /* Customer Details View */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                  <DetailItem label={t('name')} value={selectedCustomer.name} icon={<User size={18}/>} />
                  <DetailItem label={t('phone')} value={selectedCustomer.phone} icon={<Phone size={18}/>} />
                  {selectedCustomer.alt_phone && <DetailItem label={t('alt_phone')} value={selectedCustomer.alt_phone} icon={<Phone size={18}/>} />}
                  <DetailItem label={t('address')} value={selectedCustomer.address || t('not_set')} />
                  <DetailItem label={t('notes')} value={selectedCustomer.notes || t('no_notes')} fullWidth />
                </div>
              ) : (
                /* Booking History View */
                historyLoading ? (
                  <div className="text-center" style={{ padding: '40px' }}>{t('loading')}</div>
                ) : (
                  historyData?.bookings.length > 0 ? (
                    viewMode === 'grid' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
                        {historyData.bookings.map(booking => (
                          <div key={booking.id} className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>{booking.booking_uid}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'var(--color-background)' }}>{booking.booking_status}</span>
                            </div>
                            <div style={{ fontWeight: 700, marginBottom: '4px' }}>{booking.place || 'N/A'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>{new Date(booking.delivery_date).toLocaleDateString()}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '1rem', fontWeight: 800 }}>₹{Number(booking.total_amount).toLocaleString()}</div>
                              <button onClick={() => window.open(`/bookings/${booking.id}`, '_blank')} style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-background)', border: '1px solid var(--color-border)' }}>{t('view')}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                          <thead>
                            <tr style={{ textAlign: 'left', background: 'var(--color-background)' }}>
                              <th style={{ padding: '12px', fontSize: '0.8rem' }}>{t('booking_id') || 'Booking ID'}</th>
                              <th style={{ padding: '12px', fontSize: '0.8rem' }}>{t('date')}</th>
                              <th style={{ padding: '12px', fontSize: '0.8rem' }}>{t('place')}</th>
                              <th style={{ padding: '12px', fontSize: '0.8rem' }}>{t('amount')}</th>
                              <th style={{ padding: '12px', fontSize: '0.8rem' }}>{t('status')}</th>
                              <th style={{ padding: '12px', fontSize: '0.8rem' }}>{t('actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyData.bookings.map(booking => (
                              <tr key={booking.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{booking.booking_uid}</td>
                                <td style={{ padding: '12px', fontSize: '0.875rem' }}>{new Date(booking.delivery_date).toLocaleDateString()}</td>
                                <td style={{ padding: '12px', fontSize: '0.875rem' }}>{booking.place || 'N/A'}</td>
                                <td style={{ padding: '12px', fontWeight: 700 }}>₹{Number(booking.total_amount).toLocaleString()}</td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'var(--color-background)' }}>{booking.booking_status}</span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <button onClick={() => window.open(`/bookings/${booking.id}`, '_blank')} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}><Eye size={18}/></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className="text-center" style={{ padding: '40px', color: 'var(--color-text-secondary)' }}>{t('no_bookings_found') || 'No bookings found'}</div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, icon, fullWidth }) {
  return (
    <div style={{ gridColumn: fullWidth ? '1/-1' : 'span 1' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600 }}>
        {icon}
        {value}
      </div>
    </div>
  );
}
