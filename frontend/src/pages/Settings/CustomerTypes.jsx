import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { getCustomerTypes, createCustomerType, updateCustomerType, deleteCustomerType } from '../../api/customerTypes.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import toast from 'react-hot-toast';

export default function CustomerTypes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchTypes = async () => {
    try {
      const response = await getCustomerTypes();
      setTypes(response.data);
    } catch (error) {
      toast.error('Failed to fetch customer types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return toast.error(t('name_required') || 'Name is required');
    try {
      await createCustomerType({ name: newName });
      toast.success('Customer type added');
      setNewName('');
      setIsAdding(false);
      fetchTypes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add');
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return toast.error(t('name_required') || 'Name is required');
    try {
      await updateCustomerType(id, { name: editName });
      toast.success('Customer type updated');
      setEditingId(null);
      fetchTypes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('are_you_sure'))) return;
    try {
      await deleteCustomerType(id);
      toast.success('Customer type deleted');
      fetchTypes();
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to delete';
      toast.error(msg, {
        duration: msg.includes('assigned') ? 5000 : 3000,
        style: { border: '1px solid var(--color-error)' }
      });
    }
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
        <h1 style={{ flex: 1, fontSize: '1.25rem', fontWeight: 600 }}>{t('customer_type')}</h1>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setNewName('');
          }}
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
          {isAdding ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      <div style={{ padding: 'var(--spacing-md)' }}>
        {/* Inline Add Row */}
        {isAdding && (
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-md)',
            background: 'var(--color-surface)',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('customer_type')}
              style={{
                flex: 1,
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem'
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                background: 'var(--color-success)',
                color: 'white',
                padding: '0 var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600
              }}
            >
              {t('save')}
            </button>
          </div>
        )}

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
              Loading...
            </div>
          ) : types.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
              No customer types found.
            </div>
          ) : (
            types.map((type) => (
              <div
                key={type.id}
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
                {editingId === type.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: 'var(--spacing-sm)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '1rem'
                      }}
                    />
                    <button onClick={() => handleUpdate(type.id)} style={{ color: 'var(--color-success)' }}>
                      <Save size={20} />
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ color: 'var(--color-text-secondary)' }}>
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontWeight: 500 }}>{type.name}</span>
                    <button
                      onClick={() => {
                        setEditingId(type.id);
                        setEditName(type.name);
                      }}
                      style={{ color: 'var(--color-text-secondary)', padding: 'var(--spacing-xs)' }}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
                      style={{ color: 'var(--color-error)', padding: 'var(--spacing-xs)' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
