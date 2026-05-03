import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { getExpenseTypes, createExpenseType, updateExpenseType, deleteExpenseType } from '../../api/expenseTypes.js';
import { useTranslation } from '../../context/LanguageContext.jsx';
import toast from 'react-hot-toast';

export default function ExpenseTypes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchTypes = async () => {
    try {
      const res = await getExpenseTypes();
      setTypes(res.data);
    } catch (err) {
      toast.error(t('failed_to_load') || 'Failed to load expense types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await createExpenseType({ name: newName.trim() });
      toast.success(t('save_success') || 'Added successfully');
      setNewName('');
      setIsAdding(false);
      fetchTypes();
    } catch (err) {
      toast.error(t('failed_to_save') || 'Failed to add type');
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await updateExpenseType(id, { name: editName.trim() });
      toast.success(t('update_success') || 'Updated successfully');
      setEditingId(null);
      fetchTypes();
    } catch (err) {
      toast.error(t('failed_to_save') || 'Failed to update type');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete') || 'Delete this expense type?')) return;
    try {
      await deleteExpenseType(id);
      toast.success(t('delete_success') || 'Deleted successfully');
      fetchTypes();
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Type is used in existing expenses.');
      } else {
        toast.error('Failed to delete');
      }
    }
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center' }}>{t('loading')}</div>;

  return (
    <div style={{ paddingBottom: 'var(--spacing-xl)', background: 'var(--color-background)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: 'var(--spacing-md)',
        background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <button onClick={() => navigate('/settings')} style={{ marginRight: 'var(--spacing-md)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.25rem', fontWeight: 600 }}>{t('expense_types')}</h1>
        <button onClick={() => setIsAdding(true)} style={{ color: 'var(--color-primary)' }}>
          <Plus size={24} />
        </button>
      </div>

      <div style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        
        {/* Add Row */}
        {isAdding && (
          <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="Enter type name"
              autoFocus
              style={{ flex: 1, padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
            />
            <button onClick={handleAdd} style={{ color: 'white', background: 'var(--color-success)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              <Check size={20} />
            </button>
            <button onClick={() => { setIsAdding(false); setNewName(''); }} style={{ color: 'var(--color-text-secondary)', padding: '8px' }}>
              <X size={20} />
            </button>
          </div>
        )}

        {/* List */}
        {types.length === 0 && !isAdding ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>{t('no_expense_types') || 'No expense types found.'}</div>
        ) : (
          types.map(t => (
            <div key={t.id} style={{ background: 'var(--color-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
              {editingId === t.id ? (
                <>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    style={{ flex: 1, padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginRight: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleUpdate(t.id)} style={{ color: 'var(--color-success)' }}><Check size={20} /></button>
                    <button onClick={() => setEditingId(null)} style={{ color: 'var(--color-text-secondary)' }}><X size={20} /></button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 500, fontSize: '1rem' }}>{t.name}</span>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                      onClick={() => { setEditingId(t.id); setEditName(t.name); }} 
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <Pencil size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id)} 
                      style={{ color: 'var(--color-error)' }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
