import React, { useState } from 'react';
import { login } from '../api/auth.js';
import toast from 'react-hot-toast';
import { Lock, User, LogIn } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Please enter both username and password');
    
    setLoading(true);
    try {
      const res = await login(username, password);
      localStorage.setItem('user', JSON.stringify(res.data));
      onLoginSuccess(res.data);
      toast.success(`Welcome back, ${res.data.username}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '400px', background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center'
      }}>
        <div style={{ 
          width: '70px', height: '70px', background: 'var(--color-primary)',
          borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', color: 'white', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)'
        }}>
          <Lock size={35} />
        </div>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', color: '#1f2937' }}>Login</h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>Enter your credentials to continue</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="manna123"
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none' }}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', padding: '14px', borderRadius: '12px', 
              background: 'var(--color-primary)', color: 'white', fontWeight: 700,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1
            }}
            className="hover-scale"
          >
            {loading ? 'Logging in...' : <><LogIn size={20} /> Sign In</>}
          </button>
        </form>
      </div>
    </div>
  );
}
