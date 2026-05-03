import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { backupData, restoreData, deleteAllData } from '../../api/settings.js';
import { ArrowLeft, Download, Upload, Trash2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DataManagement() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [showModal, setShowModal] = useState(null); // 'restore' or 'delete'
  const [confirmText, setConfirmText] = useState('');
  const [restoreFile, setRestoreFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    try {
      const res = await backupData();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sss-backup-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      toast.success('Backup downloaded');
    } catch (err) {
      toast.error('Backup failed');
    }
  };

  const handleRestore = async () => {
    if (confirmText !== 'DELETE') return toast.error('Please type DELETE to confirm');
    if (!restoreFile) return toast.error('Select a backup file first');

    setLoading(true);
    try {
      await restoreData(restoreFile);
      toast.success('Data restored successfully');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Restore failed');
    } finally {
      setLoading(false);
      setShowModal(null);
    }
  };

  const handleDeleteAll = async () => {
    if (confirmText !== 'DELETE') return toast.error('Please type DELETE to confirm');

    setLoading(true);
    try {
      await deleteAllData();
      toast.success('All data wiped');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Deletion failed');
    } finally {
      setLoading(false);
      setShowModal(null);
    }
  };

  const openModal = (type, file = null) => {
    setShowModal(type);
    setRestoreFile(file);
    setConfirmText('');
  };

  return (
    <div style={{ paddingBottom: '100px', background: 'var(--color-background)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/settings')} style={{ marginRight: 'var(--spacing-md)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.125rem', fontWeight: 600 }}>{t('data_management')}</h1>
      </div>

      <div style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        
        {/* Backup */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>{t('backup')}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Download a ZIP file containing all your bookings, customers, expenses, and photos.
          </p>
          <button 
            onClick={handleBackup}
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Download size={20} /> {t('backup')}
          </button>
        </div>

        {/* Restore */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>{t('restore')}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Restore your app from a previous backup. This will <strong style={{ color: 'var(--color-error)' }}>overwrite</strong> all current data.
          </p>
          <label style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-primary)', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
            <Upload size={20} /> {t('restore')}
            <input 
              type="file" accept=".zip" 
              onChange={(e) => {
                if (e.target.files[0]) openModal('restore', e.target.files[0]);
              }} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {/* Danger Zone */}
        <div style={{ background: 'rgba(255,0,0,0.05)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-error)' }}>{t('danger_zone') || 'Danger Zone'}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Delete all bookings, customers, expenses, and media files. This action is irreversible.
          </p>
          <button 
            onClick={() => openModal('delete')}
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--color-error)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Trash2 size={20} /> {t('delete_all_data')}
          </button>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)' }}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
                <AlertTriangle size={24} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('are_you_sure')}</h2>
              </div>
              <button onClick={() => setShowModal(null)}><X size={24} /></button>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              {showModal === 'restore' 
                ? 'This will delete ALL current data and replace it with the backup. This cannot be undone.'
                : 'This will permanently wipe ALL records and files from the application. This cannot be undone.'
              }
            </p>
            
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
              {t('type_delete') || 'Type DELETE to confirm'}:
            </label>
            <input 
              type="text" 
              value={confirmText} 
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '24px' }}
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowModal(null)} style={{ flex: 1, padding: '12px', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>{t('cancel')}</button>
              <button 
                onClick={showModal === 'restore' ? handleRestore : handleDeleteAll}
                disabled={confirmText !== 'DELETE' || loading}
                style={{ flex: 1, padding: '12px', background: 'var(--color-error)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 700, opacity: confirmText === 'DELETE' ? 1 : 0.5 }}
              >
                {loading ? t('saving') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
