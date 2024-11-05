import React from 'react';
import './index.css';

const TermsAndConditions = () => {
  return (
    <div 
      className="terms-and-conditions" 
      style={{
        backgroundColor: '#0072BC', 
        padding: '140px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        maxWidth: '3000px',
        margin: '0 auto',
        color: '#fff' 
      }}
    >
      <h1
        className="main-title"
        style={{
          marginBottom: '40px',
          textAlign: 'center',
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#fff' 
        }}
      >
        THE STI VISION-MISSION
      </h1>

      <div className="content" style={{ lineHeight: '1.6' }}>
        <div className="vision" style={{ marginBottom: '30px', backgroundColor: '#ffffff', color: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
          <h2
            className="section-title"
            style={{
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '1.75rem',
              marginBottom: '10px',
              color: '#000000'
            }}
          >
            Vision
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>
            To be the leader in innovative and relevant education that nurtures individuals to become competent and responsible members of society.
          </p>
        </div>
        <div className="mission" style={{ marginBottom: '30px', backgroundColor: '#ffffff', color: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
          <h2
            className="section-title"
            style={{
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '1.75rem',
              marginBottom: '10px',
              color: '#000000'
            }}
          >
            Mission
          </h2>
          <p style={{ fontSize: '1.1rem', textAlign: 'center', marginBottom: '10px' }}>
            We are an institution committed to providing knowledge through the development and delivery of superior learning systems.
          </p>
          <p style={{ fontSize: '1.1rem', textAlign: 'center', marginBottom: '10px' }}>
            We strive to provide optimum value to all our stakeholders — our students, our faculty members, our employees, our partners, our shareholders, and our community.
          </p>
          <p style={{ fontSize: '1.1rem', textAlign: 'center' }}>
            We will pursue this mission with utmost integrity, dedication, transparency, and creativity.
          </p>
        </div>

        <div className="core-values" style={{ backgroundColor: '#ffffff', color: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
          <h2
            className="section-title"
            style={{
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '1.75rem',
              marginBottom: '10px',
              color: '#000000'
            }}
          >
            Our Core Values
          </h2>
          <ul style={{ listStyleType: 'none', padding: '0', textAlign: 'center', fontSize: '1.1rem' }}>
            <li style={{ marginBottom: '10px' }}>Faith in God</li>
            <li style={{ marginBottom: '10px' }}>Love for Country</li>
            <li style={{ marginBottom: '10px' }}>Academic Excellence</li>
            <li>Empowerment</li>
          </ul>
        </div>
      </div>

      <div className="checkbox-container" style={{ marginTop: '30px', textAlign: 'center' }}>
        <label style={{ fontSize: '1rem', color: '#ffffff' }}>
          <span>
            <a href="/privacy-notice" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#ffffff' }}>
              Privacy Notice
            </a>
          </span>
        </label>
      </div>
    </div>
  );
};

export default TermsAndConditions;
