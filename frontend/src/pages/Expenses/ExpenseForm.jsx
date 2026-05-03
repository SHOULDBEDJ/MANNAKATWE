import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { ArrowLeft, Camera, Upload, X, Trash2 } from 'lucide-react';
import { getExpense, createExpense, updateExpense, deleteExpense, uploadExpensePhoto } from '../../api/expenses.js';
import { getExpenseTypes } from '../../api/expenseTypes.js';
import { getBookings } from '../../api/bookings.js';
import toast from 'react-hot-toast';

export default function ExpenseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useTranslation();

  const [expenseTypes, setExpenseTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(isEdit);

  const [formData, setFormData] = useState({
    expense_type_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    expense_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    booking_id: '',
    notes: ''
  });

  const [existingPhoto, setExistingPhoto] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null); // File object

  useEffect(() => {
    Promise.all([
      getExpenseTypes().then(res => setExpenseTypes(res.data)).catch(() => {}),
      getBookings().then(res => setBookings(res.data)).catch(() => {})
    ]).then(() => {
      if (isEdit) {
        getExpense(id).then(res => {
          const d = res.data;
          const dateObj = new Date(d.expense_date);
          setFormData({
            expense_type_id: d.expense_type_id,
            amount: d.amount !== null ? d.amount : '',
            expense_date: dateObj.toISOString().split('T')[0],
            expense_time: dateObj.toTimeString().split(' ')[0].substring(0, 5),
            booking_id: d.booking_id || '',
            notes: d.notes || ''
          });
          setExistingPhoto(d.photo_url || null);
        }).catch(() => toast.error('Failed to load expense'))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [id, isEdit]);

  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhoto(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    if (newPhoto) setNewPhoto(null);
    else if (existingPhoto) setExistingPhoto(null);
    // Note: To fully remove existing photo from DB immediately, we'd need a specific endpoint.
    // For now, removing it from UI just sets it to null, but backend updateExpense doesn't scrub it 
    // unless we delete the expense. We will leave it as is per basic CRUD.
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.expense_type_id || !formData.amount) {
      return toast.error(t('type_amount_required') || 'Type and amount are required');
    }

    const payload = {
      ...formData,
      amount: formData.amount === '' ? null : Number(formData.amount),
      expense_date: `${formData.expense_date}T${formData.expense_time}:00.000Z`,
      booking_id: formData.booking_id || null
    };
    
    // Cleanup pseudo field
    delete payload.expense_time;

    try {
      let savedId = id;
      if (isEdit) {
        await updateExpense(id, payload);
        toast.success(t('expense_updated') || 'Expense updated');
      } else {
        const res = await createExpense(payload);
        savedId = res.data.id;
        toast.success(t('expense_created') || 'Expense created');
      }

      if (newPhoto) {
        await uploadExpensePhoto(savedId, newPhoto);
      }

      navigate('/expenses');
    } catch (err) {
      toast.error(t('failed_to_save') || 'Failed to save expense');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('confirm_delete') || 'Delete this expense?')) return;
    try {
      await deleteExpense(id);
      toast.success(t('expense_deleted') || 'Expense deleted');
      navigate('/expenses');
    } catch (err) {
      toast.error(t('failed_to_delete') || 'Failed to delete expense');
    }
  };

  if (loading) return <div style={{ padding: '24px', textAlign: 'center' }}>{t('loading')}</div>;

  return (
    <div style={{ paddingBottom: '100px', background: 'var(--color-background)', minHeight: '100vh' }}>
      
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
            onClick={() => navigate('/expenses')} 
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
            {isEdit ? t('edit') + ' ' + t('expenses') : t('add') + ' ' + t('expenses')}
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {isEdit && (
            <button id="btn-delete-expense" type="button" onClick={handleDelete} style={{ color: 'var(--color-error)' }} className="hover-scale">
              <Trash2 size={22} />
            </button>
          )}
          <button 
            type="submit"
            form="expense-form"
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
      </div>

      <form id="expense-form" onSubmit={handleSave} style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        
        {/* Core Info */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('expense_types')} *</label>
            {expenseTypes.length === 0 ? (
              <div style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{t('add_types_settings')}</div>
            ) : (
              <select 
                id="select-expense-type"
                value={formData.expense_type_id} 
                onChange={e => setFormData({...formData, expense_type_id: e.target.value})} 
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'white' }}
                required
              >
                <option value="">{t('search')}</option>
                {expenseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('total_amount')} *</label>
            <input 
              id="input-expense-amount"
              type="number" value={formData.amount} 
              onChange={e => setFormData({...formData, amount: e.target.value})} 
              placeholder={t('enter_amount')}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('date')}</label>
              <input id="input-expense-date" type="date" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('time')}</label>
              <input id="input-expense-time" type="time" value={formData.expense_time} onChange={e => setFormData({...formData, expense_time: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('linked_booking')}</label>
            <select 
              id="select-linked-booking"
              value={formData.booking_id} 
              onChange={e => setFormData({...formData, booking_id: e.target.value})} 
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'white' }}
            >
              <option value="">{t('link_booking')}</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.customer_name} — {b.delivery_date}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('notes')}</label>
            <textarea 
              id="input-expense-notes"
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
              rows={3} 
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', resize: 'vertical' }} 
            />
          </div>

        </div>

        {/* Photo Section */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>{t('receipt_photo') || 'Receipt Photo'}</label>
          
          {(!newPhoto && !existingPhoto) ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{ flex: 1, background: 'var(--color-background)', border: '1px dashed var(--color-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 500 }}>
                <Upload size={24} style={{ display: 'block', margin: '0 auto 8px' }} />
                {t('upload_photos')}
                <input id="input-expense-photo-upload" type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>
              <label style={{ flex: 1, background: 'var(--color-background)', border: '1px dashed var(--color-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 500 }}>
                <Camera size={24} style={{ display: 'block', margin: '0 auto 8px' }} />
                {t('camera')}
                <input id="input-expense-photo-camera" type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', maxWidth: '200px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <img 
                src={newPhoto ? URL.createObjectURL(newPhoto) : existingPhoto} 
                alt="Receipt" 
                style={{ width: '100%', display: 'block' }} 
              />
              <button 
                id="btn-remove-photo"
                type="button"
                onClick={removePhoto} 
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,0,0,0.8)', color: 'white', borderRadius: '50%', padding: '6px' }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: 'var(--spacing-md)', display: 'flex', zIndex: 50 }}>
          <button 
            id="btn-save-expense"
            type="submit"
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontWeight: 600, fontSize: '1rem' }}
          >
            {isEdit ? t('update') : t('save')}
          </button>
        </div>

      </form>
    </div>
  );
}
