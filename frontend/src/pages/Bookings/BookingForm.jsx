import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { ArrowLeft, Mic, Search, Camera, Upload, X, Check, Save, Plus } from 'lucide-react';
import { getBooking, createBooking, updateBooking, uploadPhotos, deletePhoto } from '../../api/bookings.js';
import { getCustomers } from '../../api/customers.js';
import { getFunctionTypes } from '../../api/functionTypes.js';
import { getCustomerTypes } from '../../api/customerTypes.js';
import { getUpiIds } from '../../api/upiIds.js';
import { getProfile } from '../../api/profile.js';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import VoiceRecorder from '../../components/common/VoiceRecorder.jsx';
import { getVoiceNotes, addVoiceNote, deleteVoiceNote } from '../../api/voiceNotes.js';
import { Volume2, Play, Pause, Trash2 } from 'lucide-react';

export default function BookingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useTranslation();

  // Reference Data
  const [functionTypes, setFunctionTypes] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [upiIds, setUpiIds] = useState([]);
  const [profile, setProfile] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    customer_name: '', phone: '', place: '', booking_date: new Date().toISOString().split('T')[0],
    delivery_date: '', delivery_time: '', return_date: '', return_time: '',
    function_type_id: '', customer_type_id: '', total_amount: '',
    discount_amount: '', partial_amount: '', payment_method: '', payment_status: 'Pending',
    booking_status: 'Confirmed', notes: ''
  });
  
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]); // File objects
  const [loading, setLoading] = useState(isEdit);
  const [customerStatus, setCustomerStatus] = useState(null); // 'exists' | 'new' | null
  
  // Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // QR
  const [selectedUpi, setSelectedUpi] = useState('');
  const [showQr, setShowQr] = useState(false);

  // Audio
  const [isListeningName, setIsListeningName] = useState(false);
  const [isListeningPlace, setIsListeningPlace] = useState(false);

  // Crop UI
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const canvasRef = useRef(null);
  
  // Voice Notes
  const [existingVoiceNotes, setExistingVoiceNotes] = useState([]);
  const [pendingVoiceNotes, setPendingVoiceNotes] = useState([]); // Array of Blobs
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [playingNoteId, setPlayingNoteId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getFunctionTypes().then(res => setFunctionTypes(res.data)).catch(() => {}),
      getCustomerTypes().then(res => setCustomerTypes(res.data)).catch(() => {}),
      getUpiIds().then(res => setUpiIds(res.data)).catch(() => {}),
      getProfile().then(res => setProfile(res.data)).catch(() => {})
    ]);

    if (isEdit) {
      Promise.all([
        getBooking(id),
        getVoiceNotes(id)
      ]).then(([bookingRes, voiceRes]) => {
        const data = bookingRes.data;
        const mappedData = { ...data };
        ['total_amount', 'discount_amount', 'partial_amount'].forEach(k => {
          mappedData[k] = data[k] !== null ? data[k] : '';
        });
        setFormData(mappedData);
        setExistingPhotos(data.photos || []);
        setExistingVoiceNotes(voiceRes.data || []);
      }).catch(() => toast.error('Failed to load booking'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  // Derived State
  const subTotal = Math.max(
    (Number(formData.total_amount) || 0) - 
    (Number(formData.discount_amount) || 0) - 
    (Number(formData.partial_amount) || 0),
    0
  );
  const subTotalDisplay = formData.total_amount === '' ? '' : subTotal;


  // Phone check
  useEffect(() => {
    if (formData.phone.length === 10) {
      getCustomers({ phone: formData.phone }).then(res => {
        if (res.data.length > 0) {
          const c = res.data[0];
          setFormData(prev => ({
            ...prev,
            customer_name: prev.customer_name || c.name,
            place: prev.place || c.address || '',
            customer_type_id: prev.customer_type_id || c.type_id || ''
          }));
          setCustomerStatus('exists');
        } else {
          setCustomerStatus('new');
        }
      }).catch(() => {});
    } else {
      setCustomerStatus(null);
    }
  }, [formData.phone]);

  // Name suggestions
  useEffect(() => {
    if (formData.customer_name.length >= 2 && !isEdit) {
      const timer = setTimeout(() => {
        getCustomers({ search: formData.customer_name }).then(res => {
          setSuggestions(res.data);
          setShowSuggestions(true);
        }).catch(() => {});
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowSuggestions(false);
    }
  }, [formData.customer_name, isEdit]);

  const handleSuggestionSelect = (c) => {
    setFormData(prev => ({
      ...prev,
      customer_name: c.name,
      phone: c.phone,
      place: c.address || '',
      customer_type_id: c.type_id || ''
    }));
    setShowSuggestions(false);
  };

  const handlePhoneChange = (e) => {
    // handled by onInput but keeping this for state sync
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: val });
  };

  const toggleSpeech = (field) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return toast.error('Speech recognition not supported in this browser');
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // or kn-IN based on LanguageContext
    
    recognition.onstart = () => {
      if (field === 'name') setIsListeningName(true);
      if (field === 'place') setIsListeningPlace(true);
    };
    
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setFormData(prev => ({ ...prev, [field === 'name' ? 'customer_name' : 'place']: transcript }));
    };
    
    recognition.onend = () => {
      setIsListeningName(false);
      setIsListeningPlace(false);
    };
    
    recognition.start();
  };

  const handlePhotosSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos(prev => [...prev, ...files].slice(0, 10)); // max 10
  };

  const removeNewPhoto = (idx) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingPhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await deletePhoto(id, photoId);
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success('Photo deleted');
    } catch (err) {
      toast.error('Failed to delete photo');
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('upi-qr-code');
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'QR_Code.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleSave = async (status) => {
    if (status === 'Confirmed') {
      if (formData.phone.length !== 10) {
        document.getElementById('input-booking-phone')?.focus();
        return toast.error(t('phone_length_error'));
      }
      if (!formData.customer_name) return toast.error(t('name_required'));
      if (!formData.total_amount) return toast.error(t('amount_required'));
      if (!formData.delivery_date) return toast.error(t('delivery_date_required'));
    }

    const numericFields = ['total_amount', 'discount_amount', 'partial_amount'];
    const processedData = { ...formData };
    numericFields.forEach(field => {
      processedData[field] = formData[field] === '' ? null : Number(formData[field]);
    });

    // Subtotal calculation for internal use if discount is null/empty
    const discount = processedData.discount_amount || 0;
    const total = processedData.total_amount || 0;
    const calcSubTotal = total - discount;

    const payload = { 
      ...processedData, 
      booking_status: status, 
      sub_total: subTotalDisplay === '' ? null : subTotalDisplay
    };

    try {
      let savedId = id;
      if (isEdit) {
        await updateBooking(id, payload);
        toast.success(t('booking_updated') || 'Booking updated');
      } else {
        const res = await createBooking(payload);
        savedId = res.data.id;
        toast.success(t('booking_created') || 'Booking created');
      }

      if (newPhotos.length > 0) {
        await uploadPhotos(savedId, newPhotos);
      }

      if (pendingVoiceNotes.length > 0) {
        await Promise.all(pendingVoiceNotes.map(blob => addVoiceNote(savedId, blob)));
      }

      navigate(`/bookings/${savedId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || t('failed_to_save') || 'Failed to save');
    }
  };

  const handleSaveVoiceNote = async (blob) => {
    if (isEdit) {
      try {
        await addVoiceNote(id, blob);
        toast.success('Voice note saved');
        setShowVoiceRecorder(false);
        getVoiceNotes(id).then(res => setExistingVoiceNotes(res.data || []));
      } catch (err) {
        toast.error('Failed to save voice note');
      }
    } else {
      setPendingVoiceNotes(prev => [...prev, blob]);
      setShowVoiceRecorder(false);
      toast.success('Voice note added to booking');
    }
  };

  const handleDeleteVoiceNote = async (noteId, isPending = false) => {
    if (isPending) {
      setPendingVoiceNotes(prev => prev.filter((_, i) => i !== noteId));
      return;
    }

    if (!window.confirm('Delete this voice note?')) return;
    try {
      await deleteVoiceNote(id, noteId);
      toast.success('Voice note deleted');
      getVoiceNotes(id).then(res => setExistingVoiceNotes(res.data || []));
    } catch (err) {
      toast.error('Failed to delete voice note');
    }
  };

  const togglePlayNote = (note, isBlob = false) => {
    let url = isBlob ? URL.createObjectURL(note) : `${import.meta.env.VITE_API_URL}${note.file_url}`;
    const uniqueId = isBlob ? `pending-${pendingVoiceNotes.indexOf(note)}` : note.id;

    if (playingNoteId === uniqueId) {
      audioRef.current.pause();
      setPlayingNoteId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(url);
      audioRef.current.play();
      setPlayingNoteId(uniqueId);
      audioRef.current.onended = () => setPlayingNoteId(null);
    }
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center' }}>{t('loading')}</div>;

  if (isEdit && formData.booking_status === 'Completed') {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        {t('booking_readonly_completed')} <br/><br/>
        <button onClick={() => navigate(-1)} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t('go_back')}</button>
      </div>
    );
  }

  return (
    <>
      <div className="container" style={{ paddingBottom: '100px', background: 'var(--color-background)', minHeight: '100vh' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '12px var(--spacing-md)',
          background: 'var(--glass-bg)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--glass-border)',
          position: 'sticky', top: 0, zIndex: 1100,
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <button 
              onClick={() => navigate(-1)} 
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
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {isEdit ? t('edit_booking') : t('new_booking')}
            </h1>
          </div>
          
          <button 
            onClick={() => handleSave('Confirmed')}
            style={{ 
              padding: '8px 20px', borderRadius: '10px', 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', 
              color: 'white', fontWeight: 700, fontSize: '0.9rem',
              border: 'none', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
            className="hover-scale"
          >
            {t('save')}
          </button>
        </div>

        <div style={{ padding: 'var(--spacing-md)', display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)' }} className="lg-grid-cols-2">
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            
            {/* Date Display */}
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
              {t('delivery_date')}: {formData.booking_date}
            </div>

            {/* Form Fields */}
            <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              {/* Phone */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('phone_number')} *</label>
                <input 
                  id="input-booking-phone"
                  type="tel" 
                  inputMode="numeric" 
                  maxLength={10}
                  value={formData.phone} 
                  onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                  onChange={handlePhoneChange}
                  placeholder={t('enter_phone')}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${formData.phone.length > 0 && formData.phone.length < 10 ? 'var(--color-error)' : 'var(--color-border)'}` }}
                />
                {customerStatus === 'exists' && <div style={{ color: 'var(--color-success)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>{t('customer_exists')}</div>}
                {customerStatus === 'new' && <div style={{ color: 'var(--color-warning)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>{t('no_customer')}</div>}
                {formData.phone.length > 0 && formData.phone.length < 10 && <div id="error-phone-length" style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px' }}>{t('phone_length_error')}</div>}
              </div>

              {/* Name */}
              <div style={{ marginBottom: 'var(--spacing-md)', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('customer_name')} *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    id="input-booking-name"
                    type="text" value={formData.customer_name} 
                    onChange={e => setFormData({...formData, customer_name: e.target.value})}
                    placeholder=""
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                  <button 
                    id="btn-voice-name"
                    type="button"
                    onClick={(e) => { e.preventDefault(); toggleSpeech('name'); }} 
                    style={{ 
                      background: isListeningName ? 'var(--color-error)' : 'var(--color-background)',
                      color: isListeningName ? 'white' : 'var(--color-text)',
                      padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                      animation: isListeningName ? 'pulse 1.5s infinite' : 'none'
                    }}
                  >
                    <Mic size={20} />
                  </button>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', zIndex: 20, maxHeight: '150px', overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
                    {suggestions.map(s => (
                      <div key={s.id} onClick={() => handleSuggestionSelect(s)} style={{ padding: '10px', borderBottom: '1px solid var(--color-background)', cursor: 'pointer' }}>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{s.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Place */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('place')}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    id="input-booking-place"
                    type="text" value={formData.place} 
                    onChange={e => setFormData({...formData, place: e.target.value})}
                    placeholder=""
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  />
                  <button 
                    id="btn-voice-place"
                    type="button"
                    onClick={(e) => { e.preventDefault(); toggleSpeech('place'); }} 
                    style={{ 
                      background: isListeningPlace ? 'var(--color-error)' : 'var(--color-background)',
                      color: isListeningPlace ? 'white' : 'var(--color-text)',
                      padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                      animation: isListeningPlace ? 'pulse 1.5s infinite' : 'none'
                    }}
                  >
                    <Mic size={20} />
                  </button>
                </div>
              </div>

              {/* Delivery Date/Time */}
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('delivery_date')} *</label>
                  <input 
                    id="input-booking-delivery-date"
                    type="date" value={formData.delivery_date} onChange={e => setFormData({...formData, delivery_date: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('delivery_time')}</label>
                  <input 
                    id="input-booking-delivery-time"
                    type="time" value={formData.delivery_time} onChange={e => setFormData({...formData, delivery_time: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} 
                  />
                </div>
              </div>

              {/* Return Date/Time */}
              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-secondary)' }}>{t('return_date')} & {t('return_time')}</div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>{t('return_date')}</label>
                    <input 
                      id="input-booking-return-date"
                      type="date" value={formData.return_date} onChange={e => setFormData({...formData, return_date: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>{t('return_time')}</label>
                    <input 
                      id="input-booking-return-time"
                      type="time" value={formData.return_time} onChange={e => setFormData({...formData, return_time: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} 
                    />
                  </div>
                </div>
              </div>

              {/* Voice Notes Section */}
              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    <Volume2 size={18} /> {t('voice_notes')}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> {t('add')}
                  </button>
                </div>

                {showVoiceRecorder && (
                  <div style={{ marginBottom: '12px' }}>
                    <VoiceRecorder onSave={handleSaveVoiceNote} onCancel={() => setShowVoiceRecorder(false)} />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Existing Notes */}
                  {existingVoiceNotes.map(note => (
                    <div key={note.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                          type="button"
                          onClick={() => togglePlayNote(note)}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', background: playingNoteId === note.id ? 'var(--color-primary)' : 'var(--color-surface)', color: playingNoteId === note.id ? 'white' : 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}
                        >
                          {playingNoteId === note.id ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '1px' }} />}
                        </button>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Note {new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <button type="button" onClick={() => handleDeleteVoiceNote(note.id)} style={{ color: 'var(--color-error)' }}><Trash2 size={16} /></button>
                    </div>
                  ))}

                  {/* Pending Notes */}
                  {pendingVoiceNotes.map((blob, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                          type="button"
                          onClick={() => togglePlayNote(blob, true)}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', background: playingNoteId === `pending-${idx}` ? 'var(--color-primary)' : 'var(--color-surface)', color: playingNoteId === `pending-${idx}` ? 'white' : 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}
                        >
                          {playingNoteId === `pending-${idx}` ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '1px' }} />}
                        </button>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>New Recording</span>
                      </div>
                      <button type="button" onClick={() => handleDeleteVoiceNote(idx, true)} style={{ color: 'var(--color-error)' }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dropdowns */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('function_type')}</label>
                <select id="select-function-type" value={formData.function_type_id} onChange={e => setFormData({...formData, function_type_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'white' }}>
                  <option value="">{t('select_function_type')}</option>
                  {functionTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('customer_type')}</label>
                <select id="select-customer-type" value={formData.customer_type_id} onChange={e => setFormData({...formData, customer_type_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'white' }}>
                  <option value="">{t('select_customer_type')}</option>
                  {customerTypes.map(f => <option key={f.id} value={f.id}>{t(f.name.toLowerCase().replace(/ /g, '_')) || f.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {/* Financials */}
            <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 'var(--spacing-md)', 
                marginBottom: 'var(--spacing-md)' 
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('total_amount')} *</label>
                  <input 
                    id="input-booking-total"
                    type="number" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} placeholder={t('enter_amount')} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('discount_amount')}</label>
                  <input 
                    id="input-booking-discount"
                    type="number" value={formData.discount_amount} onChange={e => setFormData({...formData, discount_amount: e.target.value})} placeholder={t('enter_amount')} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('partial_amount')}</label>
                  <input 
                    id="input-booking-partial"
                    type="number" value={formData.partial_amount} onChange={e => setFormData({...formData, partial_amount: e.target.value})} placeholder={t('enter_amount')} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                </div>
              </div>
              <div style={{ background: 'var(--color-background)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>{t('sub_total')}:</span>
                <span>{subTotalDisplay !== '' ? `₹${subTotalDisplay}` : '—'}</span>
              </div>
            </div>

            {/* Payment & Notes */}
            <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>{t('payment_method')}</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
                {['Cash', 'UPI'].map(m => (
                  <button
                    id={`btn-payment-method-${m.toLowerCase()}`}
                    type="button"
                    key={m} onClick={(e) => { e.preventDefault(); setFormData({...formData, payment_method: m}); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${formData.payment_method === m ? 'var(--color-primary)' : 'var(--color-border)'}`, background: formData.payment_method === m ? 'var(--color-primary)' : 'transparent', color: formData.payment_method === m ? 'white' : 'var(--color-text)', fontWeight: 600 }}
                  >
                    {t(m.toLowerCase())}
                  </button>
                ))}
              </div>

              {formData.payment_method === 'UPI' && (
                <div style={{ background: 'var(--color-background)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-md)' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('upi_ids')}</label>
                  <select id="select-upi-id" value={selectedUpi} onChange={e => { setSelectedUpi(e.target.value); setShowQr(false); }} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '8px', background: 'white' }}>
                    <option value="">{t('upi_ids')}</option>
                    {upiIds.map(u => <option key={u.id} value={u.upi_id}>{u.label} ({u.upi_id})</option>)}
                  </select>
                  {selectedUpi && (
                    <button id="btn-generate-qr" type="button" onClick={(e) => { e.preventDefault(); setShowQr(true); }} style={{ width: '100%', padding: '10px', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>{t('generate_qr')}</button>
                  )}
                  {showQr && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '8px' }}>{t('total_amount')}: ₹{subTotalDisplay !== '' ? subTotalDisplay : 0}</div>
                      <QRCodeCanvas 
                        id="upi-qr-code"
                        value={`upi://pay?pa=${selectedUpi}&am=${subTotalDisplay !== '' ? subTotalDisplay : 0}&cu=INR`}
                        size={200}
                      />
                      <button id="btn-download-qr" type="button" onClick={(e) => { e.preventDefault(); downloadQR(); }} style={{ marginTop: '12px', padding: '8px 16px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>{t('download_qr')}</button>
                    </div>
                  )}
                </div>
              )}

              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>{t('payment_status')}</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
                {['Pending', 'Paid'].map(m => (
                  <button
                    id={`btn-payment-status-${m.toLowerCase()}`}
                    type="button"
                    key={m} onClick={(e) => { e.preventDefault(); setFormData({...formData, payment_status: m}); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: `1px solid ${formData.payment_status === m ? (m === 'Paid' ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-border)'}`, background: formData.payment_status === m ? (m === 'Paid' ? 'var(--color-success)' : 'var(--color-error)') : 'transparent', color: formData.payment_status === m ? 'white' : 'var(--color-text)', fontWeight: 600 }}
                  >
                    {t(m.toLowerCase())}
                  </button>
                ))}
              </div>

              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('notes')}</label>
              <textarea id="input-booking-notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', resize: 'vertical' }} />
            </div>

            {/* Photos */}
            <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>{t('photos')}</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <label style={{ flex: 1, background: 'var(--color-background)', border: '1px dashed var(--color-primary)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 500 }}>
                  <Upload size={20} style={{ display: 'block', margin: '0 auto 4px' }} />
                  {t('upload_photos')}
                  <input id="input-booking-photos-upload" type="file" accept="image/*" multiple onChange={handlePhotosSelect} style={{ display: 'none' }} />
                </label>
                <label style={{ flex: 1, background: 'var(--color-background)', border: '1px dashed var(--color-primary)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 500 }}>
                  <Camera size={20} style={{ display: 'block', margin: '0 auto 4px' }} />
                  {t('camera')}
                  <input id="input-booking-photos-camera" type="file" accept="image/*" capture="environment" onChange={handlePhotosSelect} style={{ display: 'none' }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {existingPhotos.map(p => (
                  <div key={p.id} style={{ aspectRatio: '1', position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    <img src={p.file_url} alt="existing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={(e) => { e.preventDefault(); removeExistingPhoto(p.id); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,0,0,0.8)', color: 'white', borderRadius: '50%', padding: '4px' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {newPhotos.map((f, i) => (
                  <div key={i} style={{ aspectRatio: '1', position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    <img src={URL.createObjectURL(f)} alt="new" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={(e) => { e.preventDefault(); removeNewPhoto(i); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,0,0,0.8)', color: 'white', borderRadius: '50%', padding: '4px' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div style={{ 
          position: 'fixed', 
          bottom: 'var(--nav-height)', 
          left: 0, 
          right: 0, 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid var(--color-border)', 
          padding: 'var(--spacing-md)', 
          display: 'flex', 
          gap: 'var(--spacing-sm)', 
          zIndex: 1100,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}>
          <button 
            id="btn-save-booking"
            type="button"
            onClick={() => handleSave('Confirmed')}
            style={{ 
              flex: 1, 
              padding: 'var(--spacing-md)', 
              borderRadius: 'var(--radius-md)', 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', 
              color: 'white', 
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '0.5px',
              boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)',
              border: 'none'
            }}
            className="hover-scale"
          >
            {isEdit ? t('update') : t('save_booking')}
          </button>
        </div>
      </div>
    </>
  );
}
