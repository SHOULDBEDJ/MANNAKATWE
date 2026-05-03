import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext.jsx';
import { getProfile, updateProfile } from '../api/profile.js';
import { Camera, Save, User, Plus, Trash2, Edit2, Shield, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users.js';

export default function Profile({ user, onLogout }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // User Management
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({ username: '', password: '', permissions: [] });

  const modules = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'bookings', name: 'Bookings' },
    { id: 'customers', name: 'Customers' },
    { id: 'expenses', name: 'Expenses' },
    { id: 'gallery', name: 'Gallery' },
    { id: 'history', name: 'History' },
    { id: 'settings', name: 'Settings' }
  ];

  useEffect(() => {
    fetchProfile();
    if (user?.permissions === 'all') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.data.id) {
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
      // Refresh to update TopBar if needed (or use context)
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

      <form onSubmit={handleSave} style={{ padding: 'var(--spacing-md)', display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }} className="md-grid-cols-2 lg-grid-cols-3">
        
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }} className="md-col-span-1 lg-col-span-2">
          {/* Fields */}
          <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('business_name')} *</label>
              <input 
                id="input-business-name"
                type="text" value={formData.business_name} 
                onChange={e => setFormData({...formData, business_name: e.target.value})}
                placeholder="e.g. Shiva Shakti Shamiyana"
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('primary_phone')} *</label>
                <input 
                  id="input-business-phone"
                  type="tel" value={formData.phone} 
                  onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="10-digit number"
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('alternate_phone')}</label>
                <input 
                  id="input-business-alt-phone"
                  type="tel" value={formData.alt_phone} 
                  onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                  onChange={e => setFormData({...formData, alt_phone: e.target.value})}
                  placeholder="Optional"
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{t('address')}</label>
              <textarea 
                id="input-business-address"
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})}
                rows={3}
                placeholder="Business location..."
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Save Button */}
          <button 
            id="btn-save-profile"
            type="submit" 
            disabled={saving}
            style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--shadow-md)' }}
          >
            <Save size={20} />
            {saving ? t('saving') : t('save_profile')}
          </button>
        </div>
      </form>

      {/* User Management Section (Only for Super Admins) */}
      {user?.permissions === 'all' && (
        <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)', marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="var(--color-primary)" /> {t('user_management') || 'User Management'}
            </h2>
            <button 
              onClick={() => { setEditingUser(null); setUserFormData({ username: '', password: '', permissions: [] }); setShowUserModal(true); }}
              style={{ padding: '6px 12px', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> {t('add_user') || 'Add User'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }} className="md-grid-cols-2">
            {users.map(u => (
              <div key={u.id} style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{u.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    {u.permissions === 'all' ? 'Super Admin' : `Access: ${u.permissions.join(', ') || 'None'}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => { setEditingUser(u); setUserFormData({ username: u.username, password: '', permissions: u.permissions === 'all' ? modules.map(m => m.id) : u.permissions }); setShowUserModal(true); }}
                    style={{ padding: '8px', color: 'var(--color-primary)', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: 'none' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  {u.username !== 'manna123' && (
                    <button 
                      onClick={async () => { if(window.confirm('Delete user?')) { await deleteUser(u.id); fetchUsers(); toast.success('User deleted'); } }}
                      style={{ padding: '8px', color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: 'none' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* User Modal */}
      {showUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>Username</label>
                <input 
                  type="text" value={userFormData.username}
                  onChange={e => setUserFormData({...userFormData, username: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                  disabled={editingUser?.username === 'manna123'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>Password {editingUser && '(Leave blank to keep same)'}</label>
                <input 
                  type="password" value={userFormData.password}
                  onChange={e => setUserFormData({...userFormData, password: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>Module Permissions</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {modules.map(m => (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={userFormData.permissions.includes(m.id)}
                        onChange={(e) => {
                          const newPerms = e.target.checked 
                            ? [...userFormData.permissions, m.id]
                            : userFormData.permissions.filter(p => p !== m.id);
                          setUserFormData({...userFormData, permissions: newPerms});
                        }}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                        disabled={editingUser?.username === 'manna123'}
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  onClick={() => setShowUserModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f3f4f6', border: 'none', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      if (editingUser) {
                        await updateUser(editingUser.id, userFormData);
                        toast.success('User updated');
                      } else {
                        await createUser(userFormData);
                        toast.success('User created');
                      }
                      fetchUsers();
                      setShowUserModal(false);
                    } catch (err) {
                      toast.error('Failed to save user');
                    }
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 700 }}
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
