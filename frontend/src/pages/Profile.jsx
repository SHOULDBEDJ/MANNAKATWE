import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext.jsx';
import { getProfile, updateProfile } from '../api/profile.js';
import { Camera, Save, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Profile({ onLogout }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    phone: '',
    alt_phone: '',
    address: '',
    photo_url: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.data) {
        setFormData({
          business_name: res.data.business_name || '',
          phone: res.data.phone || '',
          alt_phone: res.data.alt_phone || '',
          address: res.data.address || '',
          photo_url: res.data.photo_url || ''
        });
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await axios.post('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, photo_url: res.data.url });
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.business_name || !formData.phone) {
      return toast.error('Business Name and Phone are required');
    }

    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile saved successfully');
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'SS';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px' }}>Loading...</div>;

  return (
    <div className="container" style={{ paddingBottom: '100px', background: 'var(--color-background)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('profile')}</h1>
      </div>

      <form onSubmit={handleSave} style={{ padding: 'var(--spacing-md)', display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }}>
        
        {/* Photo Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 700, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            {formData.photo_url ? (
              <img src={formData.photo_url} alt="Business" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(formData.business_name)
            )}
            <label style={{ position: 'absolute', bottom: 0, right: 0, left: 0, height: '30%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={16} color="white" />
              <input id="input-profile-photo" type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t('business_logo')}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {/* Fields */}
          <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('business_name')} *</label>
              <input 
                type="text" value={formData.business_name} 
                onChange={e => setFormData({...formData, business_name: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('primary_phone')} *</label>
                <input 
                  type="tel" value={formData.phone} 
                  onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('alternate_phone')}</label>
                <input 
                  type="tel" value={formData.alt_phone} 
                  onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                  onChange={e => setFormData({...formData, alt_phone: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('address')}</label>
              <textarea 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})}
                rows={3}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', resize: 'vertical' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--shadow-md)' }}
          >
            <Save size={20} />
            {saving ? t('saving') : t('save_profile')}
          </button>
        </div>
      </form>

      {/* Logout Section */}
      <div style={{ padding: 'var(--spacing-md)', marginTop: '24px' }}>
        <button 
          onClick={onLogout}
          style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-error)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--color-error)', boxShadow: 'var(--shadow-sm)' }}
        >
          <LogOut size={20} />
          {t('logout') || 'Logout'}
        </button>
      </div>
    </div>
  );
}
