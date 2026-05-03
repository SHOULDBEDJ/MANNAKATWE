import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { ArrowLeft, Pencil, MessageCircle, Download, X, Share2, CheckSquare, Square, Plus, Trash2, CreditCard } from 'lucide-react';
import { 
  getBooking, 
  updateBookingStatus, 
  updatePaymentStatus, 
  updateReturnStatus,
  getBookingInstallments, 
  addBookingInstallment,
  deleteBookingInstallment,
  deletePhoto 
} from '../../api/bookings.js';
import { getUpiIds } from '../../api/upiIds.js';
import { getProfile } from '../../api/profile.js';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import VoiceRecorder from '../../components/common/VoiceRecorder.jsx';
import { getVoiceNotes, addVoiceNote, deleteVoiceNote } from '../../api/voiceNotes.js';
import { Mic, Play, Pause, Volume2 } from 'lucide-react';

export default function BookingDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals & Sheets
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [playingNoteId, setPlayingNoteId] = useState(null);
  const audioRef = useRef(null);
  
  // Installments State
  const [installments, setInstallments] = useState([]);
  const [instStats, setInstStats] = useState({ total_paid: 0, pending_balance: 0 });
  const [upiIds, setUpiIds] = useState([]);
  const [profile, setProfile] = useState({});
  const [newInst, setNewInst] = useState({
    amount: '',
    payment_method: 'Cash',
    upi_id: '',
    paid_at: new Date().toISOString().slice(0, 16),
    notes: ''
  });
  const [showInstQr, setShowInstQr] = useState(false);

  // Selection logic for photos
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  
  const [damageInfo, setDamageInfo] = useState({
    damage_amount: '',
    damage_notes: ''
  });

  const [pendingBalance, setPendingBalance] = useState(0);

  const fetchData = async () => {
    try {
      const [bookingRes, instRes, upiRes, profileRes, voiceRes] = await Promise.all([
        getBooking(id),
        getBookingInstallments(id),
        getUpiIds(),
        getProfile(),
        getVoiceNotes(id)
      ]);
      setBooking(bookingRes.data);
      setDamageInfo({
        damage_amount: bookingRes.data.damage_amount || '',
        damage_notes: bookingRes.data.damage_notes || ''
      });
      setInstallments(instRes.data.installments || []);
      setInstStats({
        total_paid: instRes.data.total_paid,
        pending_balance: instRes.data.pending_balance
      });
      setUpiIds(upiRes.data || []);
      setProfile(profileRes.data || {});
      setVoiceNotes(voiceRes.data || []);
    } catch (err) {
      toast.error('Failed to load data');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'Completed') {
      setPendingBalance(instStats.pending_balance);
      setShowStatusMenu(false);
      setShowCompletionModal(true);
    } else {
      try {
        await updateBookingStatus(id, { booking_status: newStatus });
        toast.success(`Status updated to ${newStatus}`);
        fetchData();
        setShowStatusMenu(false);
      } catch (err) {
        toast.error('Update failed');
      }
    }
  };

  const handleComplete = async (markPaid) => {
    try {
      if (markPaid) {
        await updatePaymentStatus(id, { payment_status: 'Paid' });
      }
      await updateBookingStatus(id, { booking_status: 'Completed' });
      toast.success('Booking marked as Completed');
      fetchData();
      setShowCompletionModal(false);
    } catch (err) {
      toast.error('Completion failed');
    }
  };

  const handlePaymentStatusChange = async (newStatus) => {
    try {
      await updatePaymentStatus(id, { payment_status: newStatus });
      toast.success(`Payment updated to ${newStatus}`);
      fetchData();
      setShowPaymentMenu(false);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleReturnStatus = async (isReturned) => {
    try {
      await updateReturnStatus(id, { 
        is_returned: isReturned,
        damage_amount: damageInfo.damage_amount === '' ? 0 : Number(damageInfo.damage_amount),
        damage_notes: damageInfo.damage_notes
      });
      toast.success(isReturned ? 'Marked as Returned' : 'Return status updated');
      fetchData();
      setShowReturnModal(false);
    } catch (err) {
      toast.error('Failed to update return status');
    }
  };

  const handleAddInstallment = async () => {
    if (!newInst.amount || Number(newInst.amount) <= 0) return toast.error('Enter a valid amount');
    if (Number(newInst.amount) > instStats.pending_balance) return toast.error('Amount exceeds pending balance');
    if (newInst.payment_method === 'UPI' && !newInst.upi_id) return toast.error('Select a UPI ID');

    const processedInst = { ...newInst };
    processedInst.amount = newInst.amount === '' ? null : Number(newInst.amount);

    try {
      const res = await addBookingInstallment(id, processedInst);
      if (res.data.paymentStatusUpdated) {
        toast.success('Full amount received. Payment marked as Paid.');
      } else {
        toast.success('Installment saved.');
      }
      setShowInstallmentModal(false);
      setNewInst({
        amount: '',
        payment_method: 'Cash',
        upi_id: '',
        paid_at: new Date().toISOString().slice(0, 16),
        notes: ''
      });
      setShowInstQr(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save installment');
    }
  };

  const handleDeleteInstallment = async (instId) => {
    if (!window.confirm('Delete this installment?')) return;
    try {
      await deleteBookingInstallment(id, instId);
      toast.success('Installment deleted');
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handlePhotoDelete = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await deletePhoto(id, photoId);
      toast.success('Photo deleted');
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = url.split('/').pop() || 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleSharePhotos = async () => {
    if (selectedPhotos.length === 0) return toast.error('Select photos first');
    
    try {
      const files = await Promise.all(selectedPhotos.map(async (photo) => {
        const response = await fetch(photo.file_url);
        const blob = await response.blob();
        return new File([blob], photo.file_url.split('/').pop(), { type: blob.type });
      }));

      if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: 'Booking Photos' });
      } else {
        toast.success('Web Share not supported. Opening WhatsApp...');
        window.open(`https://wa.me/${booking.phone}`, '_blank');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        window.open(`https://wa.me/${booking.phone}`, '_blank');
      }
    } finally {
      setIsSelectingPhotos(false);
      setSelectedPhotos([]);
    }
  };

  const handleSaveVoiceNote = async (blob) => {
    try {
      await addVoiceNote(id, blob);
      toast.success('Voice note saved');
      setShowVoiceRecorder(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save voice note');
    }
  };

  const handleDeleteVoiceNote = async (noteId) => {
    if (!window.confirm('Delete this voice note?')) return;
    try {
      await deleteVoiceNote(id, noteId);
      toast.success('Voice note deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete voice note');
    }
  };

  const togglePlayNote = (note) => {
    const fullUrl = `${import.meta.env.VITE_API_URL}${note.file_url}`;
    if (playingNoteId === note.id) {
      audioRef.current.pause();
      setPlayingNoteId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(fullUrl);
      audioRef.current.play();
      setPlayingNoteId(note.id);
      audioRef.current.onended = () => setPlayingNoteId(null);
    }
  };

  const sendWhatsApp = (type) => {
    let msg = `Shiva Shakti Shamiyana\nCustomer: ${booking.customer_name}\nDelivery: ${booking.delivery_date}\nTotal: ₹${booking.total_amount}\nStatus: ${booking.booking_status}\nPayment: ${booking.payment_status}`;
    
    if (type === 'Confirmation') {
      msg = `Hello ${booking.customer_name},\nYour booking with Shiva Shakti Shamiyana is confirmed for ${booking.delivery_date}.`;
    } else if (type === 'Reminder') {
      msg = `Hello ${booking.customer_name},\nThis is a gentle reminder for your pending payment of ₹${instStats.pending_balance} with Shiva Shakti Shamiyana.`;
    } else if (type === 'Delivery') {
      msg = `Hello ${booking.customer_name},\nYour order is scheduled for delivery on ${booking.delivery_date} at ${booking.delivery_time || 'N/A'}.`;
    }

    window.open(`https://wa.me/${booking.phone}?text=${encodeURIComponent(msg)}`, '_blank');
    setShowWhatsAppMenu(false);
  };

  const downloadInstQR = () => {
    const canvas = document.getElementById('inst-qr-code');
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `Installment_QR_${newInst.amount}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  const formatC = (val) => val === null || val === undefined || val === '' ? '—' : `₹${Number(val).toLocaleString('en-IN')}`;
  const formatV = (val) => val === null || val === undefined || val === '' ? '—' : val;

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
      <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', fontWeight: 600, color: 'white', background: color }}>
        {t(status?.toLowerCase())}
      </span>
    );
  };

  if (loading || !booking) return <div style={{ padding: '24px', textAlign: 'center' }}>{t('loading')}</div>;

  const isCompleted = booking.booking_status === 'Completed';

  return (
    <div style={{ paddingBottom: 'var(--spacing-xl)', background: 'var(--color-background)', minHeight: '100vh' }}>
      
      {/* Sticky Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px var(--spacing-md)',
        background: 'var(--glass-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'sticky', top: 0, zIndex: 1100,
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button 
            id="btn-back-bookings" 
            onClick={() => navigate('/bookings')} 
            style={{ 
              width: '40px', height: '40px', borderRadius: '12px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)', color: 'var(--color-text)'
            }}
            className="hover-scale"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {booking.customer_name}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button 
            id="btn-view-invoice" 
            onClick={() => navigate(`/bookings/${id}/invoice`)} 
            style={{ 
              width: '38px', height: '38px', borderRadius: '10px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-primary)'
            }}
            className="hover-scale"
          >
            <Download size={20} />
          </button>
          <button 
            id="btn-share-whatsapp" 
            onClick={() => setShowWhatsAppMenu(true)} 
            style={{ 
              width: '38px', height: '38px', borderRadius: '10px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-success)'
            }}
            className="hover-scale"
          >
            <MessageCircle size={20} />
          </button>
          {!isCompleted && (
            <button 
              id="btn-edit-booking" 
              onClick={() => navigate(`/bookings/${id}/edit`)} 
              style={{ 
                width: '38px', height: '38px', borderRadius: '10px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
              className="hover-scale"
            >
              <Pencil size={20} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>

        {/* Status Section */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600 }}>{t('booking_status')}</span>
            {renderBadge('booking', booking.booking_status)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 600 }}>{t('payment_status')}</span>
            {renderBadge('payment', booking.payment_status)}
          </div>

          {!isCompleted && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <button 
                  id="btn-change-status"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
                >
                  {t('change_status')}
                </button>
                {showStatusMenu && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', zIndex: 20, marginTop: '4px', boxShadow: 'var(--shadow-md)' }}>
                    {['Confirmed', 'Delivered', 'Completed'].map(s => (
                      <div 
                        key={s} 
                        id={`btn-status-to-${s.toLowerCase()}`}
                        onClick={() => handleStatusChange(s)}
                        style={{ padding: '12px', borderBottom: '1px solid var(--color-background)', textAlign: 'center', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {t(s.toLowerCase())}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <button 
                  id="btn-change-payment"
                  onClick={() => setShowPaymentMenu(!showPaymentMenu)}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
                >
                  {t('payment')}
                </button>
                {showPaymentMenu && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', zIndex: 20, marginTop: '4px', boxShadow: 'var(--shadow-md)' }}>
                    {['Paid', 'Pending'].map(s => (
                      <div 
                        key={s} 
                        id={`btn-payment-to-${s.toLowerCase()}`}
                        onClick={() => handlePaymentStatusChange(s)}
                        style={{ padding: '12px', borderBottom: '1px solid var(--color-background)', textAlign: 'center', fontWeight: 600, cursor: 'pointer', color: s === 'Paid' ? 'var(--color-success)' : 'var(--color-error)' }}
                      >
                        {t(s.toLowerCase())}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Return & Damage Card */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: booking.is_returned ? '2px solid var(--color-success)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('return_status')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {booking.is_returned ? `${t('returned_on')}: ${booking.return_date || 'N/A'}` : t('not_returned')}
              </div>
            </div>
            <button 
              id="btn-return-damage"
              onClick={() => setShowReturnModal(true)}
              style={{ padding: '6px 16px', background: booking.is_returned ? 'var(--color-success)' : 'var(--color-background)', color: booking.is_returned ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
            >
              {booking.is_returned ? t('edit_damage') : t('mark_returned')}
            </button>
          </div>
          {booking.damage_amount > 0 && (
            <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--color-error)' }}>
              <div style={{ fontWeight: 700 }}>{t('damage_amount')}: {formatC(booking.damage_amount)}</div>
              {booking.damage_notes && <div style={{ fontSize: '0.8rem' }}>{booking.damage_notes}</div>}
            </div>
          )}
        </div>
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>{t('bookings')} {t('profile')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('phone_number')}</span>
            <span style={{ fontWeight: 500 }}>{formatV(booking.phone)}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('place')}</span>
            <span style={{ fontWeight: 500 }}>{formatV(booking.place)}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('bookings')} {t('delivery_date')}</span>
            <span style={{ fontWeight: 500 }}>{formatV(booking.booking_date)}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('delivery_date')}</span>
            <span style={{ fontWeight: 500 }}>{formatV(booking.delivery_date)} {booking.delivery_time ? `at ${booking.delivery_time}` : ''}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('return_date')}</span>
            <span style={{ fontWeight: 500 }}>{booking.return_date ? `${booking.return_date} ${booking.return_time || ''}` : '—'}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('notes')}</span>
            <span style={{ fontWeight: 500 }}>{formatV(booking.notes)}</span>
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>{t('monthly_revenue')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('total_amount')}</span>
            <span style={{ fontWeight: 600 }}>{formatC(booking.total_amount)}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('discount_amount')}</span>
            <span style={{ fontWeight: 500 }}>{formatC(booking.discount_amount)}</span>
            
            <span style={{ color: 'var(--color-text-secondary)' }}>{t('partial_amount')}</span>
            <span style={{ fontWeight: 500 }}>{formatC(booking.partial_amount)}</span>
            
            <span style={{ fontWeight: 700, paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>{t('sub_total')}</span>
            <span style={{ fontWeight: 700, paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>{formatC(booking.sub_total)}</span>
          </div>
        </div>

        {/* Installments Section */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{t('installments')}</h3>
            {!isCompleted && instStats.pending_balance > 0 && (
              <button 
                id="btn-add-installment"
                onClick={() => setShowInstallmentModal(true)}
                style={{ fontSize: '0.875rem', background: 'var(--color-primary)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={16} /> {t('add')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('total_paid')}</div>
              <div style={{ fontWeight: 700 }}>{formatC(instStats.total_paid)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('pending_balance')}</div>
              <div style={{ fontWeight: 700, color: instStats.pending_balance > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                {formatC(instStats.pending_balance)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {installments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('no_installments')}</div>
            ) : (
              installments.map(inst => (
                <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{formatC(inst.amount)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(inst.paid_at).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', background: inst.payment_method === 'UPI' ? 'rgba(0,123,255,0.1)' : 'rgba(108,117,125,0.1)', color: inst.payment_method === 'UPI' ? '#007bff' : '#6c757d', fontWeight: 600 }}>
                        {t(inst.payment_method.toLowerCase())}
                      </span>
                      {inst.upi_id && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{inst.upi_id}</span>}
                    </div>
                  </div>
                  {!isCompleted && (
                    <button id={`btn-delete-inst-${inst.id}`} onClick={() => handleDeleteInstallment(inst.id)} style={{ color: 'var(--color-error)', padding: '8px' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Voice Notes Section */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={20} /> {t('voice_notes') || 'Voice Notes'}
            </h3>
            {!isCompleted && (
              <button 
                id="btn-add-voice-note"
                onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                style={{ fontSize: '0.875rem', background: showVoiceRecorder ? 'var(--color-background)' : 'var(--color-primary)', color: showVoiceRecorder ? 'var(--color-text)' : 'white', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 600, border: showVoiceRecorder ? '1px solid var(--color-border)' : 'none' }}
              >
                {showVoiceRecorder ? t('cancel') : <><Plus size={16} /> {t('add')}</>}
              </button>
            )}
          </div>

          {showVoiceRecorder && (
            <div style={{ marginBottom: '16px' }}>
              <VoiceRecorder 
                onSave={handleSaveVoiceNote} 
                onCancel={() => setShowVoiceRecorder(false)} 
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {voiceNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('no_voice_notes') || 'No voice notes found.'}</div>
            ) : (
              voiceNotes.map(note => (
                <div key={note.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <button 
                      onClick={() => togglePlayNote(note)}
                      style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        background: playingNoteId === note.id ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: playingNoteId === note.id ? 'white' : 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)'
                      }}
                      className="hover-scale"
                    >
                      {playingNoteId === note.id ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
                    </button>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Note {new Date(note.created_at).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  {!isCompleted && (
                    <button onClick={() => handleDeleteVoiceNote(note.id)} style={{ color: 'var(--color-error)', padding: '8px' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Photos Section */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{t('photos')}</h3>
            {booking.photos?.length > 0 && (
              <button 
                id="btn-toggle-select-photos"
                onClick={() => { setIsSelectingPhotos(!isSelectingPhotos); setSelectedPhotos([]); }}
                style={{ fontSize: '0.875rem', color: 'var(--color-info)', fontWeight: 600 }}
              >
                {isSelectingPhotos ? t('cancel') : t('share_whatsapp')}
              </button>
            )}
          </div>
          
          {booking.photos?.length === 0 ? (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('no_photos')}</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {booking.photos?.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => {
                      if (isSelectingPhotos) {
                        if (selectedPhotos.includes(p)) setSelectedPhotos(selectedPhotos.filter(x => x.id !== p.id));
                        else setSelectedPhotos([...selectedPhotos, p]);
                      }
                    }}
                    style={{ aspectRatio: '1', position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}
                  >
                    <img src={p.file_url} alt="booking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    
                    {isSelectingPhotos && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: selectedPhotos.includes(p) ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedPhotos.includes(p) ? <CheckSquare color="white" /> : <Square color="white" />}
                      </div>
                    )}

                    {!isSelectingPhotos && (
                      <>
                        <button id={`btn-download-photo-${p.id}`} onClick={(e) => { e.stopPropagation(); handleDownload(p.file_url); }} style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', padding: '4px' }}>
                          <Download size={14} />
                        </button>
                        {!isCompleted && (
                          <button id={`btn-delete-photo-${p.id}`} onClick={(e) => { e.stopPropagation(); handlePhotoDelete(p.id); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,0,0,0.8)', color: 'white', borderRadius: '50%', padding: '4px' }}>
                            <X size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              {isSelectingPhotos && selectedPhotos.length > 0 && (
                <button 
                  id="btn-confirm-share-photos"
                  onClick={handleSharePhotos}
                  style={{ width: '100%', padding: '12px', background: 'var(--color-success)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 600, marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Share2 size={18} /> {t('send_to_whatsapp')}
                </button>
              )}
            </>
          )}
        </div>

      </div>

      {/* Add Installment Modal */}
      {showInstallmentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '500px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: 'var(--spacing-lg)', boxShadow: '0 -4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('add_installment')}</h2>
              <button id="btn-close-inst-modal" onClick={() => { setShowInstallmentModal(false); setShowInstQr(false); }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('amount')} *</label>
                <input 
                  id="input-inst-amount"
                  type="number" 
                  value={newInst.amount}
                  onChange={(e) => {
                    setNewInst({...newInst, amount: e.target.value});
                    setShowInstQr(false);
                  }}
                  placeholder={t('enter_amount')}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${Number(newInst.amount) > instStats.pending_balance ? 'var(--color-error)' : 'var(--color-border)'}` }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t('pending_balance')}: {formatC(instStats.pending_balance)}</span>
                  {Number(newInst.amount) > instStats.pending_balance && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: 600 }}>{t('amount_exceeds_balance')}</span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>{t('payment_method')}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Cash', 'UPI'].map(m => (
                    <button
                      id={`btn-inst-method-${m.toLowerCase()}`}
                      key={m}
                      onClick={() => {
                        setNewInst({...newInst, payment_method: m});
                        setShowInstQr(false);
                      }}
                      style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${newInst.payment_method === m ? 'var(--color-primary)' : 'var(--color-border)'}`, background: newInst.payment_method === m ? 'var(--color-primary)' : 'transparent', color: newInst.payment_method === m ? 'white' : 'var(--color-text)', fontWeight: 600 }}
                    >
                      {t(m.toLowerCase())}
                    </button>
                  ))}
                </div>
              </div>

              {newInst.payment_method === 'UPI' && (
                <div style={{ background: 'var(--color-background)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('upi_ids')}</label>
                  <select 
                    id="select-inst-upi"
                    value={newInst.upi_id}
                    onChange={(e) => {
                      setNewInst({...newInst, upi_id: e.target.value});
                      setShowInstQr(false);
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'white' }}
                  >
                    <option value="">{t('upi_ids')}</option>
                    {upiIds.map(u => <option key={u.id} value={u.upi_id}>{u.label} ({u.upi_id})</option>)}
                  </select>

                  {newInst.upi_id && newInst.amount && Number(newInst.amount) > 0 && !showInstQr && (
                    <button 
                      id="btn-gen-inst-qr"
                      onClick={() => setShowInstQr(true)}
                      style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'var(--color-info)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <CreditCard size={18} /> {t('generate_qr')}
                    </button>
                  )}

                  {showInstQr && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{Number(newInst.amount).toLocaleString('en-IN')}</div>
                      <QRCodeCanvas 
                        id="inst-qr-code"
                        value={`upi://pay?pa=${newInst.upi_id}&am=${newInst.amount}&cu=INR`}
                        size={180}
                      />
                      <button id="btn-download-inst-qr" onClick={downloadInstQR} style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>{t('download_qr')}</button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('date')} & {t('time')}</label>
                <input 
                  id="input-inst-date"
                  type="datetime-local" 
                  value={newInst.paid_at}
                  onChange={(e) => setNewInst({...newInst, paid_at: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('notes')}</label>
                <input 
                  id="input-inst-notes"
                  type="text" 
                  value={newInst.notes}
                  onChange={(e) => setNewInst({...newInst, notes: e.target.value})}
                  placeholder={t('optional_notes')}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button 
                  id="btn-cancel-inst"
                  onClick={() => { setShowInstallmentModal(false); setShowInstQr(false); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-background)', border: '1px solid var(--color-border)', fontWeight: 600 }}
                >
                  {t('cancel')}
                </button>
                <button 
                  id="btn-save-inst"
                  onClick={handleAddInstallment}
                  style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontWeight: 600 }}
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>{t('mark_complete_title')}</h2>
            
            {pendingBalance > 0 ? (
              <>
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {t('pending_balance')} <strong>₹{pendingBalance}</strong>. {t('mark_paid_question')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button id="btn-mark-paid-complete" onClick={() => handleComplete(true)} style={{ padding: '12px', background: 'var(--color-success)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    {t('mark_paid')}
                  </button>
                  <button id="btn-keep-pending-complete" onClick={() => handleComplete(false)} style={{ padding: '12px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    {t('keep_pending')}
                  </button>
                  <button id="btn-cancel-complete" onClick={() => setShowCompletionModal(false)} style={{ padding: '12px', background: 'transparent', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {t('cancel')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {t('are_you_sure')}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button id="btn-cancel-simple-complete" onClick={() => setShowCompletionModal(false)} style={{ flex: 1, padding: '10px', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    {t('cancel')}
                  </button>
                  <button id="btn-confirm-simple-complete" onClick={() => handleComplete(false)} style={{ flex: 1, padding: '10px', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    {t('confirm')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Bottom Sheet */}
      {showWhatsAppMenu && (
        <>
          <div onClick={() => setShowWhatsAppMenu(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: 'var(--spacing-lg)', zIndex: 101, boxShadow: '0 -4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('share_whatsapp')}</h3>
              <button id="btn-close-wa-menu" onClick={() => setShowWhatsAppMenu(false)}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'send_bill', type: 'Bill' },
                { label: 'send_confirmation', type: 'Confirmation' },
                { label: 'send_reminder', type: 'Reminder' },
                { label: 'send_delivery_update', type: 'Delivery' }
              ].map(opt => (
                <button 
                  id={`btn-wa-${opt.type.toLowerCase()}`}
                  key={opt.type}
                  onClick={() => sendWhatsApp(opt.type)}
                  style={{ padding: '16px', background: 'var(--color-background)', borderRadius: 'var(--radius-md)', fontWeight: 600, textAlign: 'left', border: '1px solid var(--color-border)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <MessageCircle size={20} /> {t(opt.label)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Return & Damage Modal */}
      {showReturnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)' }}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('return_damage')}</h2>
              <button id="btn-close-return-modal" onClick={() => setShowReturnModal(false)}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  id="checkbox-is-returned"
                  type="checkbox" 
                  checked={booking.is_returned} 
                  onChange={(e) => handleReturnStatus(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <label style={{ fontWeight: 600 }}>{t('mark_returned')}</label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('damage_amount')}</label>
                <input 
                  id="input-damage-amount"
                  type="number" 
                  value={damageInfo.damage_amount}
                  onChange={(e) => setDamageInfo({...damageInfo, damage_amount: e.target.value})}
                  placeholder={t('enter_amount')}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('damage_notes')}</label>
                <textarea 
                  id="input-damage-notes"
                  value={damageInfo.damage_notes}
                  onChange={(e) => setDamageInfo({...damageInfo, damage_notes: e.target.value})}
                  placeholder={t('optional_notes')}
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button 
                  id="btn-cancel-return"
                  onClick={() => setShowReturnModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-background)', border: '1px solid var(--color-border)', fontWeight: 600 }}
                >
                  {t('cancel')}
                </button>
                <button 
                  id="btn-save-return"
                  onClick={() => handleReturnStatus(booking.is_returned)}
                  style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontWeight: 600 }}
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
