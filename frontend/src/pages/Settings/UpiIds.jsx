import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, X } from 'lucide-react';
import { getUpiIds, createUpiId, updateUpiId, deleteUpiId } from '../../api/upiIds.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import toast from 'react-hot-toast';

export default function UpiIds() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [upiIds, setUpiIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ label: '', upi_id: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchUpiIds = async () => {
    try {
      const response = await getUpiIds();
      setUpiIds(response.data);
    } catch (error) {
      toast.error(t('failed_to_load') || 'Failed to fetch UPI IDs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpiIds();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.upi_id.trim()) {
      return toast.error(t('all_fields_required') || 'All fields are required');
    }

    try {
      if (editingId) {
        await updateUpiId(editingId, formData);
        toast.success(t('update_success') || 'UPI ID updated');
      } else {
        await createUpiId(formData);
        toast.success(t('save_success') || 'UPI ID added');
      }
      setIsModalOpen(false);
      setFormData({ label: '', upi_id: '' });
      setEditingId(null);
      fetchUpiIds();
    } catch (error) {
      toast.error(error.response?.data?.error || t('failed_to_save') || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('are_you_sure'))) return;
    try {
      await deleteUpiId(id);
      toast.success(t('delete_success') || 'UPI ID deleted');
      fetchUpiIds();
    } catch (error) {
      toast.error(t('failed_to_delete') || 'Failed to delete');
    }
  };

  const openModal = (id = null, data = { label: '', upi_id: '' }) => {
    setEditingId(id);
    setFormData(data);
    setIsModalOpen(true);
  };

  return (
    <div style={{ paddingBottom: 'var(--spacing-xl)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--spacing-md)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button onClick={() => navigate('/settings')} style={{ marginRight: 'var(--spacing-md)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.25rem', fontWeight: 600 }}>{t('upi_ids') || 'UPI IDs'}</h1>
        <button
          onClick={() => openModal()}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Plus size={20} />
        </button>
      </div>

      <div style={{ padding: 'var(--spacing-md)' }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
              {t('loading')}
            </div>
          ) : upiIds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
              {t('no_upi_ids') || 'No UPI IDs found.'}
            </div>
          ) : (
            upiIds.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--spacing-md)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                  gap: 'var(--spacing-sm)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{item.upi_id}</div>
                </div>
                <button
                  onClick={() => openModal(item.id, { label: item.label, upi_id: item.upi_id })}
                  style={{ color: 'var(--color-text-secondary)', padding: 'var(--spacing-xs)' }}
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ color: 'var(--color-error)', padding: 'var(--spacing-xs)' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-md)',
          zIndex: 100
        }}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '400px',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {editingId ? t('edit') + ' ' + t('upi_ids') : t('add') + ' ' + t('upi_ids')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--color-text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  {t('label') || 'Label'}
                </label>
                <input
                  id="input-upi-label"
                  required
                  placeholder="e.g. Main Account"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  {t('upi_id') || 'UPI ID'}
                </label>
                <input
                  id="input-upi-address"
                  required
                  placeholder="e.g. business@okaxis"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontWeight: 500
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
