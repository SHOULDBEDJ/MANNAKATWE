import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { Users, ChevronRight, CreditCard, Tag, Receipt, UserCheck, BarChart2, Database } from 'lucide-react';

export default function SettingsHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const menuItems = [
    {
      id: 'customer-types',
      label: t('customer_type') || 'Customer Types',
      icon: <Users size={20} />,
      path: '/settings/customer-types'
    },
    {
      id: 'upi-ids',
      label: t('upi_ids') || 'UPI IDs',
      icon: <CreditCard size={20} />,
      path: '/settings/upi-ids'
    },
    {
      id: 'function-types',
      label: t('function_types') || 'Function Types',
      icon: <Tag size={20} />,
      path: '/settings/function-types'
    },
    {
      id: 'expense-types',
      label: t('expense_types') || 'Expense Types',
      icon: <Receipt size={20} />,
      path: '/settings/expense-types'
    },
    {
      id: 'customers',
      label: t('customers') || 'Customers',
      icon: <UserCheck size={20} />,
      path: '/settings/customers'
    },
    {
      id: 'kpi-config',
      label: t('kpi_cards') || 'KPI Cards',
      icon: <BarChart2 size={20} />,
      path: '/settings/kpi-config'
    },
    {
      id: 'data-management',
      label: t('data_management') || 'Data Management',
      icon: <Database size={20} />,
      path: '/settings/data'
    }
  ];

  return (
    <div style={{ padding: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--spacing-md)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              border: '1px solid var(--color-border)'
            }}
          >
            <div style={{
              marginRight: 'var(--spacing-md)',
              color: 'var(--color-primary)',
              display: 'flex'
            }}>
              {item.icon}
            </div>
            <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
            <ChevronRight size={20} color="var(--color-text-secondary)" />
          </div>
        ))}
      </div>
    </div>
  );
}
