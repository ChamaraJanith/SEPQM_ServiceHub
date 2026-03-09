import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const getPasswordStrength = () => {
    const pw = formData.password;
    if (!pw) return { label: '', color: 'transparent', percent: 0 };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    
    if (score <= 1) return { label: 'Weak', color: '#ff4757', percent: 20 };
    if (score === 2) return { label: 'Fair', color: '#ffa502', percent: 40 };
    if (score === 3) return { label: 'Good', color: '#eccc68', percent: 60 };
    if (score === 4) return { label: 'Strong', color: '#2ed573', percent: 80 };
    return { label: 'Very Strong', color: '#7bed9f', percent: 100 };
  };
  
  const strengthData = getPasswordStrength();
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
    if (!formData.name || formData.name.trim().length < 2) return 'Name must be at least 2 characters long.';
    if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) return 'Name can only contain letters and spaces.';
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) return 'Please enter a valid email address.';
    if (!formData.password || formData.password.length < 6) return 'Password must be at least 6 characters.';
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
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
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
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Account</h1>
      
      {error && <div className="error-message" style={{ textAlign: 'center', marginBottom: '1rem', background: 'rgba(255,71,87,0.1)', padding: '1rem', borderRadius: '8px' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required minLength="2" pattern="[a-zA-Z\s]+" title="Only letters and spaces allowed" />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Password (min 6 chars)</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" />
          {formData.password && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${strengthData.percent}%`, background: strengthData.color, transition: 'all 0.3s ease' }} />
              </div>
              <small style={{ color: strengthData.color, display: 'block', marginTop: '0.4rem', fontWeight: '500' }}>
                {strengthData.label} Password
              </small>
            </div>
          )}
        </div>
        <button type="submit" className="premium-btn" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '2rem', color: '#9ca3af' }}>
        Already have an account? <Link to="/login" style={{ color: '#00ffcc', textDecoration: 'none' }}>Login here</Link>
      </p>
    </div>
  );
}

export default Register;
