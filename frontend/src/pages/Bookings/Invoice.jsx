import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBooking } from '../../api/bookings.js';
import { getProfile } from '../../api/profile.js';
import { getUpiIds } from '../../api/upiIds.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { ArrowLeft, Printer } from 'lucide-react';

export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [booking, setBooking] = useState(null);
  const [profile, setProfile] = useState({});
  const [upiIds, setUpiIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBooking(id),
      getProfile(),
      getUpiIds()
    ]).then(([bRes, pRes, uRes]) => {
      setBooking(bRes.data);
      setProfile(pRes.data || {});
      setUpiIds(uRes.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading || !booking) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('loading')}</div>;

  const items = [];
  const subTotal = (booking.total_amount || 0) - (booking.discount_amount || 0);

  return (
    <div style={{ background: 'white', minHeight: '100vh', padding: '20px' }}>
      
      {/* Header (Hidden on Print) */}
      <div className="no-print" style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #eee' 
      }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <ArrowLeft size={20} /> {t('back')}
        </button>
        <button onClick={() => window.print()} style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', background: '#000', 
          color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 600 
        }}>
          <Printer size={20} /> {t('print_invoice')}
        </button>
      </div>

      {/* Invoice Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '40px', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
        
        {/* Business Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '60px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#7C3AED', marginBottom: '8px' }}>
              {profile.business_name || 'Shiva Shakti Shamiyana'}
            </h1>
            <p style={{ color: '#666', maxWidth: '300px', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {profile.address || 'Address not set'}
            </p>
            <p style={{ fontWeight: 600, marginTop: '8px' }}>Ph: {profile.phone || 'N/A'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#eee', textTransform: 'uppercase', letterSpacing: '4px' }}>{t('invoice') || 'Invoice'}</h2>
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>{t('date')}</div>
              <div style={{ fontWeight: 700 }}>{new Date(booking.booking_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>{t('invoice_no') || 'Invoice No.'}</div>
              <div style={{ fontWeight: 700 }}>#SSS-{booking.id.toString().padStart(4, '0')}</div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>{t('bill_to') || 'Bill To'}</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{booking.customer_name}</h3>
          <p style={{ color: '#666' }}>{booking.phone}</p>
          {booking.place && <p style={{ color: '#666' }}>{booking.place}</p>}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '0.9rem' }}>{t('description') || 'Description'}</th>
              <th style={{ textAlign: 'center', padding: '12px 0', fontSize: '0.9rem', width: '80px' }}>{t('qty')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '16px 0', fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: '16px 0', textAlign: 'center' }}>{item.qty}</td>
              </tr>
            )) : (
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '16px 0', fontWeight: 500 }}>Shamiyana/Rental Services</td>
                <td style={{ padding: '16px 0', textAlign: 'center' }}>1</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Financials */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#888' }}>{t('total_amount')}</span>
              <span style={{ fontWeight: 600 }}>₹{Number(booking.total_amount).toLocaleString('en-IN')}</span>
            </div>
            {booking.delivery_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#888' }}>{t('delivery_amount')}</span>
                <span style={{ fontWeight: 600 }}>₹{Number(booking.delivery_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            {booking.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#888' }}>{t('discount_amount')}</span>
                <span style={{ fontWeight: 600, color: '#22C55E' }}>- ₹{Number(booking.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', 
              marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #000', 
              fontSize: '1.25rem', fontWeight: 900 
            }}>
              <span>{t('sub_total')}</span>
              <span>₹{Number(subTotal).toLocaleString('en-IN')}</span>
            </div>
            {booking.payment_status === 'Paid' && (
              <div style={{ 
                marginTop: '20px', padding: '8px', background: '#22C55E', 
                color: '#fff', textAlign: 'center', fontWeight: 800, 
                borderRadius: '4px', textTransform: 'uppercase' 
              }}>
                {t('paid_full') || 'Paid Full'}
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ marginTop: '80px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>{t('payment_info') || 'Payment Information'}</h4>
          {upiIds.map(u => (
            <p key={u.id} style={{ fontSize: '0.85rem', color: '#666' }}>
              <strong>{u.label}:</strong> {u.upi_id}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '60px', textAlign: 'center', color: '#aaa', fontSize: '0.8rem' }}>
          {t('invoice_footer') || 'Thank you for your business! This is a computer-generated invoice.'}
        </div>

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .invoice-container { box-shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; }
        }
      `}</style>

    </div>
  );
}
