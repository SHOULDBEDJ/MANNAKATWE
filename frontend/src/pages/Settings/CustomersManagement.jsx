import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../api/customers.js';
import { getCustomerTypes } from '../../api/customerTypes.js';
import { ArrowLeft, Search, Plus, Pencil, Trash2, User, Phone, Tag, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersManagement() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [customers, setCustomers] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [formData, setFormData] = useState({ name: '', phone: '', customer_type_id: '' });

  useEffect(() => {
    fetchTypes();
    fetchCustomers();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await getCustomerTypes();
      setTypes(res.data);
    } catch (err) {}
  };

  const fetchCustomers = async (s = search, tId = selectedType) => {
    setLoading(true);
    try {
      const res = await getCustomers({ search: s, type: tId });
      setCustomers(res.data);
    } catch (err) {
      toast.error(t('failed_to_load') || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchCustomers(val, selectedType);
  };

  const handleFilter = (e) => {
    const val = e.target.value;
    setSelectedType(val);
    fetchCustomers(search, val);
  };

  const openModal = (type, cust = null) => {
    setModalType(type);
    setFormData(cust ? { name: cust.name, phone: cust.phone, customer_type_id: cust.customer_type_id, id: cust.id } : { name: '', phone: '', customer_type_id: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return toast.error('Name and Phone required');

    try {
      if (modalType === 'add') {
        await createCustomer(formData);
        toast.success(t('save_success') || 'Customer added');
      } else {
        await updateCustomer(formData.id, formData);
        toast.success(t('update_success') || 'Customer updated');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to save customer');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete') || 'Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      toast.success(t('delete_success') || 'Customer deleted');
      fetchCustomers();
    } catch (err) {
      toast.error(t('failed_to_delete') || 'Delete failed');
    }
  };

  return (
    <div style={{ paddingBottom: '100px', background: 'var(--color-background)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/settings')} style={{ marginRight: 'var(--spacing-md)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.125rem', fontWeight: 600 }}>{t('customers')}</h1>
        <button onClick={() => openModal('add')} style={{ color: 'var(--color-primary)' }}>
          <Plus size={24} />
        </button>
      </div>

      <div style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 2, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input 
              type="text" value={search} onChange={handleSearch} placeholder={t('search')}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <Filter size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <select 
              value={selectedType} onChange={handleFilter}
              style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'white' }}
            >
              <option value="">{t('all')}</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>{t('loading')}</div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>{t('no_customers') || 'No customers found.'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customers.map(cust => (
              <div key={cust.id} style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                  <User size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{cust.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> {cust.phone}
                    {cust.customer_type_name && (
                      <span style={{ marginLeft: '8px', padding: '1px 6px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', fontSize: '0.7rem' }}>
                        {cust.customer_type_name}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => openModal('edit', cust)} style={{ color: 'var(--color-text-secondary)' }}><Pencil size={18} /></button>
                  <button onClick={() => handleDelete(cust.id)} style={{ color: 'var(--color-error)' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)' }}>
          <form onSubmit={handleSave} style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
              {modalType === 'add' ? t('add') + ' ' + t('customers') : t('edit') + ' ' + t('customers')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('customer_name')} *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t('customer_name')} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{t('phone_number')} *</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder={t('phone_number')} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>Type</label>
                <select value={formData.customer_type_id} onChange={e => setFormData({...formData, customer_type_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'white' }}>
                  <option value="">{t('customer_types')}</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>{t('cancel')}</button>
              <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>{t('save')}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
