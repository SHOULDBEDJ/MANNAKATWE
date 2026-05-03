import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { getFunctionTypes, createFunctionType, updateFunctionType, deleteFunctionType } from '../../api/functionTypes.js';
import toast from 'react-hot-toast';

export default function FunctionTypes() {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchTypes = async () => {
    try {
      const res = await getFunctionTypes();
      setTypes(res.data);
    } catch (err) {
      toast.error('Failed to load function types');
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
      await createFunctionType({ name: newName.trim() });
      toast.success('Added successfully');
      setNewName('');
      setIsAdding(false);
      fetchTypes();
    } catch (err) {
      toast.error('Failed to add type');
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await updateFunctionType(id, { name: editName.trim() });
      toast.success('Updated successfully');
      setEditingId(null);
      fetchTypes();
    } catch (err) {
      toast.error('Failed to update type');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this function type?')) return;
    try {
      await deleteFunctionType(id);
      toast.success('Deleted successfully');
      fetchTypes();
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Cannot delete: used in existing bookings.');
      } else {
        toast.error('Failed to delete');
      }
    }
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ paddingBottom: 'var(--spacing-xl)', background: 'var(--color-background)', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/settings')} style={{ marginRight: 'var(--spacing-md)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.25rem', fontWeight: 600 }}>Function Types</h1>
        <button onClick={() => setIsAdding(true)} style={{ color: 'var(--color-primary)' }}>
          <Plus size={24} />
        </button>
      </div>

      <div style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        
        {isAdding && (
          <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <input 
              type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter function type" autoFocus
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

        {types.length === 0 && !isAdding ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>No function types found.</div>
        ) : (
          types.map(t => (
            <div key={t.id} style={{ background: 'var(--color-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
              {editingId === t.id ? (
                <>
                  <input 
                    type="text" value={editName} onChange={e => setEditName(e.target.value)} autoFocus
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
                    <button onClick={() => { setEditingId(t.id); setEditName(t.name); }} style={{ color: 'var(--color-text-secondary)' }}><Pencil size={20} /></button>
                    <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--color-error)' }}><Trash2 size={20} /></button>
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
