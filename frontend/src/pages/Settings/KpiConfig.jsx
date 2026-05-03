import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { getKpiConfig, updateKpiConfig } from '../../api/settings.js';
import { ArrowLeft, GripVertical, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KpiConfig() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await getKpiConfig();
      setConfigs(res.data);
    } catch (err) {
      toast.error(t('failed_to_load') || 'Failed to load KPI config');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, is_visible: c.is_visible ? 0 : 1 } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Re-assign display_order based on current list order
      const payload = configs.map((c, index) => ({
        id: c.id,
        is_visible: c.is_visible,
        display_order: index + 1
      }));
      await updateKpiConfig(payload);
      toast.success(t('update_success') || 'Configuration saved');
      navigate('/settings');
    } catch (err) {
      toast.error(t('failed_to_save') || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('index', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    const sourceIndex = e.dataTransfer.getData('index');
    const newConfigs = [...configs];
    const [movedItem] = newConfigs.splice(sourceIndex, 1);
    newConfigs.splice(targetIndex, 0, movedItem);
    setConfigs(newConfigs);
  };

  const kpiLabels = {
    total_bookings: t('total_bookings'),
    todays_deliveries: t('todays_deliveries'),
    upcoming_deliveries: t('upcoming_deliveries'),
    pending_payments: t('pending_payments'),
    total_revenue: t('total_revenue'),
    pending_amount: t('pending_amount'),
    total_expenses: t('total_expenses'),
    monthly_revenue: t('monthly_revenue'),
    monthly_expenses: t('monthly_expenses')
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px' }}>{t('loading')}</div>;

  return (
    <div style={{ paddingBottom: '100px', background: 'var(--color-background)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/settings')} style={{ marginRight: 'var(--spacing-md)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.125rem', fontWeight: 600 }}>{t('kpi_config') || 'KPI Configuration'}</h1>
        <button onClick={handleSave} disabled={saving} style={{ color: 'var(--color-primary)' }}>
          <Save size={24} />
        </button>
      </div>

      <div style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
          {t('kpi_config_desc') || 'Drag to reorder KPI cards on the dashboard. Use the eye icon to show or hide cards.'}
        </p>

        {configs.map((config, index) => (
          <div 
            key={config.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            style={{ 
              display: 'flex', alignItems: 'center', padding: '12px', background: 'var(--color-surface)', 
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', 
              boxShadow: 'var(--shadow-sm)', cursor: 'move'
            }}
          >
            <GripVertical size={20} color="var(--color-text-secondary)" style={{ marginRight: '12px' }} />
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: config.is_visible ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                {t(config.kpi_key) || kpiLabels[config.kpi_key] || config.kpi_key}
              </div>
            </div>

            <button 
              onClick={() => handleToggle(config.id)}
              style={{ padding: '8px', color: config.is_visible ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
            >
              {config.is_visible ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        ))}
      </div>

      <div style={{ padding: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
        <button 
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {saving ? t('saving') : t('save')}
        </button>
      </div>

    </div>
  );
}
