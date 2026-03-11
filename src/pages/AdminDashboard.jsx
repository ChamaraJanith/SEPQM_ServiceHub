import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const WORKERS = ['Kamal Perera', 'Sunil Jayawardena', 'Nimal Siriwardena', 'Kasun Bandara', 'Chandika de Silva'];

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [editAmountId, setEditAmountId] = useState(null);
  const [tempAmount, setTempAmount] = useState('');
  const [notifyingId, setNotifyingId] = useState(null);

  const fetchAllBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/bookings/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch bookings');
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email === 'admin@gmail.com') {
      fetchAllBookings();
    }
  }, [user]);

  const handleAssignWorker = async (bookingId, workerName) => {
    if (!workerName) return;
    setUpdatingId(bookingId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workerName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to assign worker');
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, assignedWorker: workerName } : b));
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateAmount = async (bookingId) => {
    const amountNum = parseFloat(tempAmount);
    if (isNaN(amountNum)) {
      alert("Please enter a valid number for the amount.");
      return;
    }
    
    setUpdatingId(bookingId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/amount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amountNum })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update amount');
      
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, totalAmount: amountNum } : b));
      setEditAmountId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNotifyUser = async (bookingId) => {
    if (!window.confirm("Send email notification to user with current booking details?")) return;
    
    setNotifyingId(bookingId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/notify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send notification');
      alert("Success: Email notification sent to user!");
    } catch (err) {
      alert(err.message);
    } finally {
      setNotifyingId(null);
    }
  };

  if (user?.email !== 'admin@gmail.com') {
    return <Navigate to="/" />;
  }

  return (
    <div className="page-container glass" style={{ maxWidth: '1200px', margin: '4rem auto' }}>
      <h1>Admin Dashboard</h1>
      <p style={{ marginBottom: '2rem', color: '#9ca3af' }}>Manage service bookings, assign workers, and set pricing.</p>

      {loading ? (
        <p>Loading bookings...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem' }}>Client / Service</th>
                <th style={{ padding: '1rem' }}>Date / Slot</th>
                <th style={{ padding: '1rem' }}>Location</th>
                <th style={{ padding: '1rem' }}>Assigned Worker</th>
                <th style={{ padding: '1rem' }}>Billing (Rs.)</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} data-testid="booking-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{booking.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#00ffcc' }}>{booking.serviceName}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>{booking.date}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{booking.timeSlot}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', maxWidth: '200px' }}>
                    {booking.address}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      data-testid="assign-worker"
                      value={booking.assignedWorker || 'Unassigned'} 
                      onChange={(e) => handleAssignWorker(booking._id, e.target.value)}
                      disabled={updatingId === booking._id}
                      style={{ 
                        padding: '0.4rem', 
                        borderRadius: '6px', 
                        background: 'rgba(0,0,0,0.5)', 
                        color: booking.assignedWorker === 'Unassigned' ? '#ff4757' : '#00ffcc',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="Unassigned">Assign Worker</option>
                      {WORKERS.map(worker => (
                        <option key={worker} value={worker}>{worker}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {editAmountId === booking._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          data-testid="input-amount"
                          type="number" 
                          value={tempAmount} 
                          onChange={(e) => setTempAmount(e.target.value)}
                          style={{ width: '80px', padding: '0.3rem', borderRadius: '4px', border: '1px solid #00ffcc', background: '#000', color: '#fff' }}
                        />
                        <button 
                          data-testid="btn-save-amount"
                          onClick={() => handleUpdateAmount(booking._id)}
                          style={{ background: '#2ed573', border: 'none', borderRadius: '4px', color: '#000', padding: '0.3rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditAmountId(null)}
                          style={{ background: '#ff4757', border: 'none', borderRadius: '4px', color: '#fff', padding: '0.3rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <div 
                        data-testid="amount-display"
                        onClick={() => {
                          setEditAmountId(booking._id);
                          setTempAmount(booking.totalAmount || 0);
                        }}
                        style={{ color: (booking.totalAmount > 0) ? '#ffa502' : '#9ca3af', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Click to edit amount"
                      >
                        Rs. {booking.totalAmount?.toLocaleString() || '0.00'} ✏️
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="premium-btn" 
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', background: '#4f46e5' }}
                        onClick={() => alert(`Client: ${booking.name}\nEmail: ${booking.email}\nNotes: ${booking.notes || 'No notes provided.'}`)}
                      >
                        Details
                      </button>
                      <button 
                        data-testid="btn-notify"
                        className="premium-btn" 
                        style={{ 
                          padding: '0.4rem 0.6rem', 
                          fontSize: '0.8rem', 
                          background: 'linear-gradient(135deg, #00ffcc, #4f46e5)', 
                          color: '#000',
                          opacity: notifyingId === booking._id ? 0.5 : 1 
                        }}
                        onClick={() => handleNotifyUser(booking._id)}
                        disabled={notifyingId === booking._id}
                      >
                        {notifyingId === booking._id ? 'Sending...' : 'Notify User ✉️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
