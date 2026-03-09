import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      // Strip any character that is not a letter, number, '@', or '.'
      const filteredValue = value.replace(/[^a-zA-Z0-9@.]/g, '');
      setFormData({ ...formData, [name]: filteredValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validate = () => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) return 'Please enter a valid email address.';
    if (!formData.password) return 'Password is required.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim(), password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container glass" style={{ maxWidth: '500px', margin: '6rem auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Welcome Back</h1>
      
      {error && <div className="error-message" style={{ textAlign: 'center', marginBottom: '1rem', background: 'rgba(255,71,87,0.1)', padding: '1rem', borderRadius: '8px' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <button type="submit" className="premium-btn" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '2rem', color: '#9ca3af' }}>
        Don't have an account? <Link to="/register" style={{ color: '#00ffcc', textDecoration: 'none' }}>Register here</Link>
      </p>
    </div>
  );
}

export default Login;
