import { Link } from 'react-router-dom';
import { services } from '../data/services';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';

function ServicesList() {
  return (
    <div className="landing-page">
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <Sphere args={[1.5, 64, 64]} position={[-3, 1, -2]}>
              <MeshDistortMaterial color="#4f46e5" distort={0.6} speed={2} roughness={0.2} metalness={0.8} />
            </Sphere>
          </Float>

          <Float speed={3} rotationIntensity={2} floatIntensity={1.5}>
            <Sphere args={[0.5, 32, 32]} position={[2.5, 2.5, -2]}>
              <MeshDistortMaterial color="#ff007a" distort={0.4} speed={3} roughness={0.1} metalness={0.9} />
            </Sphere>
          </Float>
          
          <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
            <Sphere args={[1, 32, 32]} position={[3, -2, -5]}>
              <MeshDistortMaterial color="#00ffcc" distort={0.5} speed={1.5} roughness={0.3} metalness={0.7} />
            </Sphere>
          </Float>

          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.3} enablePan={false} />
        </Canvas>
      </div>

      <div className="content-container">
        <div className="hero-section">
          <h1 className="hero-title">Elevate Your Lifestyle</h1>
          <p className="hero-subtitle">Premium services delivered to your doorstep</p>
        </div>

        <div className="services-section">
          <h2 className="section-title">Our Services</h2>
          <div data-testid="service-list" className="service-list">
            {services.map((service) => (
              <div key={service.id} data-testid={`service-card-${service.slug}`} className="service-card glass">
                <h2>{service.name}</h2>
                <p>{service.description}</p>
                <Link to={`/services/${service.slug}`} className="view-details-link">
                  <button data-testid={`view-details-${service.slug}`} className="premium-btn">
                    View Details
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServicesList;
