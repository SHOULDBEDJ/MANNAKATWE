import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BookingsList from './pages/Bookings/BookingsList.jsx';
import BookingForm from './pages/Bookings/BookingForm.jsx';
import BookingDetail from './pages/Bookings/BookingDetail.jsx';
import Invoice from './pages/Bookings/Invoice.jsx';
import ExpensesList from './pages/Expenses/ExpensesList.jsx';
import ExpenseForm from './pages/Expenses/ExpenseForm.jsx';
import AlbumsList from './pages/Gallery/AlbumsList.jsx';
import AlbumDetail from './pages/Gallery/AlbumDetail.jsx';
import Profile from './pages/Profile.jsx';
import SettingsHome from './pages/Settings/SettingsHome.jsx';
import CustomerTypes from './pages/Settings/CustomerTypes.jsx';
import FunctionTypes from './pages/Settings/FunctionTypes.jsx';
import ExpenseTypes from './pages/Settings/ExpenseTypes.jsx';
import UpiIds from './pages/Settings/UpiIds.jsx';
import KpiConfig from './pages/Settings/KpiConfig.jsx';
import CustomersManagement from './pages/Settings/CustomersManagement.jsx';
import DataManagement from './pages/Settings/DataManagement.jsx';
import CustomerHistory from './pages/History/CustomerHistory.jsx';

import { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  const ProtectedRoute = ({ children, permission }) => {
    if (user.permissions === 'all') return children;
    if (user.permissions.includes(permission)) return children;
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/bookings/*" element={
            <ProtectedRoute permission="bookings">
              <Routes>
                <Route path="/" element={<BookingsList />} />
                <Route path="new" element={<BookingForm />} />
                <Route path=":id" element={<BookingDetail />} />
                <Route path=":id/edit" element={<BookingForm />} />
                <Route path=":id/invoice" element={<Invoice />} />
              </Routes>
            </ProtectedRoute>
          } />

          <Route path="/expenses/*" element={
            <ProtectedRoute permission="expenses">
              <Routes>
                <Route path="/" element={<ExpensesList />} />
                <Route path="new" element={<ExpenseForm />} />
                <Route path=":id/edit" element={<ExpenseForm />} />
              </Routes>
            </ProtectedRoute>
          } />

          <Route path="/gallery/*" element={
            <ProtectedRoute permission="gallery">
              <Routes>
                <Route path="/" element={<AlbumsList />} />
                <Route path=":id" element={<AlbumDetail />} />
              </Routes>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />

          <Route path="/settings/*" element={
            <ProtectedRoute permission="settings">
              <Routes>
                <Route path="/" element={<SettingsHome />} />
                <Route path="customer-types" element={<CustomerTypes />} />
                <Route path="function-types" element={<FunctionTypes />} />
                <Route path="expense-types" element={<ExpenseTypes />} />
                <Route path="upi-ids" element={<UpiIds />} />
                <Route path="kpi-config" element={<KpiConfig />} />
                <Route path="customers" element={<CustomersManagement />} />
                <Route path="data" element={<DataManagement />} />
              </Routes>
            </ProtectedRoute>
          } />

          <Route path="/customers-history" element={
            <ProtectedRoute permission="history">
              <CustomerHistory />
            </ProtectedRoute>
          } />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
