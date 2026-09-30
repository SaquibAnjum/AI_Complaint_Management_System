import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    return '/user/dashboard';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'var(--bg-main)',
    }}>
      <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: '40px 30px' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#fee2e2',
          color: '#ef4444',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <ShieldX size={36} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
          Access Forbidden
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: 24 }}>
          You do not have the required permissions to access this administrative page.
        </p>
        <Link to={getHomeRoute()} className="btn btn-primary">
          <Home size={16} /> Return to Your Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
