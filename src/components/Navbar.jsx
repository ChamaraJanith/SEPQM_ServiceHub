import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(20, 20, 20, 0.6)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 10 }}>
      <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', textDecoration: 'none' }}>
        ServiceHub
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {user ? (
          <>
            {user.email === 'admin@gmail.com' && (
              <Link to="/admin-dashboard" className="premium-btn" style={{ padding: '0.6rem 1.2rem', fontSize: '1rem', textDecoration: 'none', background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' }}>
                Admin Dashboard
              </Link>
            )}
            <span style={{ color: '#00ffcc' }}>Welcome, {user.name}</span>
            <button onClick={handleLogout} className="premium-btn" style={{ padding: '0.6rem 1.2rem', fontSize: '1rem', background: '#ff4757', boxShadow: 'none' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
            <Link to="/register" className="premium-btn" style={{ padding: '0.6rem 1.2rem', fontSize: '1rem', textDecoration: 'none', display: 'inline-block' }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
