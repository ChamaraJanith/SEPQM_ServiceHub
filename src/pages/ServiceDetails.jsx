import { useParams, Link, useNavigate } from 'react-router-dom';
import { services } from '../data/services';

function ServiceDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const service = services.find(s => s.slug === slug);

  if (!service) {
    return <div className="page-container glass"><h2 style={{color: 'white', textAlign: 'center'}}>Service not found</h2></div>;
  }

  const handleBookNow = () => {
    navigate(`/book?service=${slug}`);
  };

  return (
    <div className="page-container glass">
      <Link to="/" data-testid="back-home-link" className="back-link">
        &larr; Back to Home
      </Link>
      
      <h1>{service.name}</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#d1d5db', lineHeight: '1.8' }}>
        {service.description}
      </p>
      
      <div className="price-box">
        <strong style={{ color: '#ffffff' }}>Approximate Price Range: </strong> 
        <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{service.priceRange}</span>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button data-testid="book-now-button" onClick={handleBookNow} className="premium-btn">
          Book Now
        </button>
      </div>
    </div>
  );
}

export default ServiceDetails;
