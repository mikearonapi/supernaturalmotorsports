'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './SignUpModal.module.css';

/**
 * Icons for the modal
 */
const Icons = {
  x: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  heart: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  barChart: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  wrench: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  save: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  bot: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/>
      <line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/**
 * Features list for the sign-up modal
 */
const GARAGE_FEATURES = [
  {
    icon: Icons.heart,
    title: 'Save Favorites',
    description: 'Keep track of cars you love',
  },
  {
    icon: Icons.barChart,
    title: 'Compare Side-by-Side',
    description: 'Compare up to 4 cars at once',
  },
  {
    icon: Icons.save,
    title: 'Save Your Builds',
    description: 'Store Performance HUB configurations',
  },
  {
    icon: Icons.bot,
    title: 'AI Mechanic',
    description: 'Get personalized advice for your car',
  },
];

/**
 * SignUpModal Component
 * Modal for prompting users to sign up for gated garage features
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal should close
 * @param {string} props.feature - Which feature triggered the modal (for messaging)
 * @param {string} props.variant - 'modal' or 'drawer'
 */
export default function SignUpModal({ 
  isOpen, 
  onClose, 
  feature = 'this feature',
  variant = 'modal'
}) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call - in production, this would submit to your backend
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
      
      // Close modal after success message
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setEmail('');
      }, 2000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const containerClass = variant === 'drawer' 
    ? `${styles.container} ${styles.drawerContainer}`
    : styles.container;

  const modalClass = variant === 'drawer'
    ? `${styles.modal} ${styles.drawer}`
    : styles.modal;

  return (
    <div className={containerClass} onClick={handleBackdropClick}>
      <div className={modalClass} role="dialog" aria-modal="true" aria-labelledby="signup-title">
        {/* Close Button */}
        <button 
          className={styles.closeButton} 
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icons.x size={20} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Icons.wrench size={28} />
          </div>
          <h2 id="signup-title" className={styles.title}>
            Unlock Your Garage
          </h2>
          <p className={styles.subtitle}>
            Sign up to access {feature} and all premium garage features.
          </p>
        </div>

        {/* Features List */}
        <div className={styles.features}>
          {GARAGE_FEATURES.map((feat, index) => {
            const IconComponent = feat.icon;
            return (
              <div key={index} className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <IconComponent size={18} />
                </div>
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>{feat.title}</span>
                  <span className={styles.featureDesc}>{feat.description}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sign Up Form */}
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
                aria-label="Email address"
              />
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className={styles.spinner}></span>
                ) : (
                  'Get Early Access'
                )}
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <p className={styles.disclaimer}>
              We&apos;ll notify you when Garage features launch. No spam, ever.
            </p>
          </form>
        ) : (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>
              <Icons.check size={24} />
            </div>
            <p>You&apos;re on the list! We&apos;ll be in touch soon.</p>
          </div>
        )}

        {/* Footer Links */}
        <div className={styles.footer}>
          <button 
            className={styles.skipButton} 
            onClick={onClose}
          >
            Continue browsing without signing up
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage sign-up modal state
 */
export function useSignUpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState('');

  const openModal = useCallback((featureName = 'this feature') => {
    setFeature(featureName);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    feature,
    openModal,
    closeModal,
  };
}
