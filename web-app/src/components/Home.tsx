import React from 'react';
import { User } from '../types';

interface HomeProps {
  user: User | null;
  onNavigate: (path: string) => void;
}

export function Home({ user, onNavigate }: HomeProps) {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Order Management System</h1>
        <p style={styles.subtitle}>
          A microservices-based application demonstrating modern distributed systems architecture
        </p>
        {!user && (
          <button style={styles.ctaButton} onClick={() => onNavigate('/login')}>
            Get Started
          </button>
        )}
      </div>

      <div style={styles.features}>
        <h2>Architecture Features</h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🔐</span>
            <h3>Secured REST API</h3>
            <p>JWT-based authentication with role-based access control</p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>⚖️</span>
            <h3>Load Balancing</h3>
            <p>NGINX load balancer distributing traffic across API instances</p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>📨</span>
            <h3>Message Broker</h3>
            <p>RabbitMQ for asynchronous service communication</p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>📊</span>
            <h3>Event Streaming</h3>
            <p>Apache Kafka for real-time analytics processing</p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>⚡</span>
            <h3>FaaS</h3>
            <p>Serverless email function triggered by queue messages</p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🔔</span>
            <h3>Real-time Updates</h3>
            <p>WebSocket notifications with Redis scaling</p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🧩</span>
            <h3>Micro-frontends</h3>
            <p>Modular frontend architecture with independent components</p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🐳</span>
            <h3>Containerized</h3>
            <p>Docker containers orchestrated with Docker Compose</p>
          </div>
        </div>
      </div>

      <div style={styles.services}>
        <h2>Microservices</h2>
        <div style={styles.serviceList}>
          <div style={styles.serviceItem}>
            <strong>API Gateway</strong> - REST API, JWT Auth, WebSocket
          </div>
          <div style={styles.serviceItem}>
            <strong>Order Service</strong> - CRUD operations, PostgreSQL
          </div>
          <div style={styles.serviceItem}>
            <strong>Notification Service</strong> - Redis Pub/Sub, Real-time
          </div>
          <div style={styles.serviceItem}>
            <strong>Analytics Service</strong> - Kafka Consumer, Aggregations
          </div>
          <div style={styles.serviceItem}>
            <strong>Email FaaS</strong> - Serverless Email Processing
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  hero: {
    textAlign: 'center',
    padding: '3rem 2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '2rem',
  },
  ctaButton: {
    padding: '1rem 2rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  features: {
    marginBottom: '2rem',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  featureCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  featureIcon: {
    fontSize: '2rem',
  },
  services: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  serviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  serviceItem: {
    padding: '0.75rem 1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
};
