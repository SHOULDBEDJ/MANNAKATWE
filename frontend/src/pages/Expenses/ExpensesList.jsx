import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { getExpenses, deleteExpense } from '../../api/expenses.js';
import { Plus, Trash2, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExpensesList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      const res = await getExpenses();
      setExpenses(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t('are_you_sure'))) return;
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const formatCurrency = (amount) => amount === null || amount === undefined || amount === '' ? '—' : `₹${Number(amount).toLocaleString('en-IN')}`;

  return (
    <div className="container" style={{ paddingBottom: 'calc(var(--nav-height) + var(--spacing-xl))', minHeight: '100vh', background: 'var(--color-background)' }}>
      
      {/* Header */}
      <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('expenses')}</h1>
      </div>

      <div style={{ padding: 'var(--spacing-md)' }}>
        
        {/* Summary Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', 
          color: 'white', 
          padding: 'var(--spacing-lg)', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: 'var(--spacing-md)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          boxShadow: '0 12px 20px -5px rgba(139, 92, 246, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '4px', opacity: 0.9, position: 'relative', zIndex: 1 }}>{t('total_expenses')}</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>{formatCurrency(total)}</span>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>Loading...</div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>No expenses found</div>
        ) : (
          <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3">
            {expenses.map(expense => (
              <div 
                key={expense.id}
                onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                style={{ background: 'var(--color-surface)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--color-border)' }}
              >
                <div style={{ background: 'var(--color-background)', padding: '10px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                  <Receipt size={24} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{expense.expense_type_name || 'Unknown Type'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {new Date(expense.expense_date).toLocaleDateString()} 
                    {expense.linked_booking_name && ` • ${expense.linked_booking_name}`}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-error)' }}>
                    {formatCurrency(expense.amount)}
                  </div>
                  <button onClick={(e) => handleDelete(e, expense.id)} style={{ color: 'var(--color-text-secondary)', padding: '4px' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/expenses/new')}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-height) + var(--spacing-lg))',
          right: 'var(--spacing-lg)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50
        }}
      >
        <Plus size={28} />
      </button>

    </div>
  );
}
