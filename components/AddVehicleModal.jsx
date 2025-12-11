'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './AddVehicleModal.module.css';

/**
 * Icons
 */
const Icons = {
  x: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  loader: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinIcon}>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
};

/**
 * Add Vehicle Modal
 * Allows users to add a vehicle to their garage via VIN or manual entry
 */
export default function AddVehicleModal({ isOpen, onClose, onAdd }) {
  const [mode, setMode] = useState('vin'); // 'vin' | 'manual'
  const [vin, setVin] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedData, setDecodedData] = useState(null);
  const [error, setError] = useState('');
  
  // Manual entry fields
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [nickname, setNickname] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMode('vin');
      setVin('');
      setDecodedData(null);
      setError('');
      setYear('');
      setMake('');
      setModel('');
      setTrim('');
      setNickname('');
    }
  }, [isOpen]);

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

  // Prevent body scroll
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

  // Decode VIN
  const handleDecodeVin = async () => {
    if (!vin || vin.length < 17) {
      setError('Please enter a valid 17-character VIN');
      return;
    }

    setError('');
    setIsDecoding(true);
    setDecodedData(null);

    try {
      const response = await fetch(`/api/vin/decode?vin=${encodeURIComponent(vin)}`);
      const data = await response.json();

      if (data.success) {
        setDecodedData(data);
        // Auto-fill manual fields
        setYear(data.year?.toString() || '');
        setMake(data.make || '');
        setModel(data.model || '');
        setTrim(data.trim || '');
      } else {
        setError(data.error || 'Failed to decode VIN');
      }
    } catch (err) {
      setError('Failed to decode VIN. Please try again.');
    } finally {
      setIsDecoding(false);
    }
  };

  // Handle VIN input change
  const handleVinChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    setVin(value.slice(0, 17));
    setError('');
    setDecodedData(null);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!year || !make || !model) {
      setError('Year, Make, and Model are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAdd({
        vin: vin || null,
        year: parseInt(year),
        make,
        model,
        trim: trim || null,
        nickname: nickname || null,
        vinDecodeData: decodedData?.raw || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add vehicle');
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

  return (
    <div className={styles.container} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Icons.x size={20} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Icons.car size={28} />
          </div>
          <h2 className={styles.title}>Add Your Vehicle</h2>
          <p className={styles.subtitle}>
            Enter your VIN for automatic details, or add manually
          </p>
        </div>

        {/* Mode Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'vin' ? styles.tabActive : ''}`}
            onClick={() => setMode('vin')}
          >
            VIN Lookup
          </button>
          <button
            className={`${styles.tab} ${mode === 'manual' ? styles.tabActive : ''}`}
            onClick={() => setMode('manual')}
          >
            Manual Entry
          </button>
        </div>

        {/* Error Message */}
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* VIN Input */}
          {mode === 'vin' && (
            <div className={styles.vinSection}>
              <label className={styles.label}>Vehicle Identification Number (VIN)</label>
              <div className={styles.vinInputWrapper}>
                <input
                  type="text"
                  value={vin}
                  onChange={handleVinChange}
                  className={styles.vinInput}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                />
                <button
                  type="button"
                  onClick={handleDecodeVin}
                  className={styles.decodeBtn}
                  disabled={vin.length < 17 || isDecoding}
                >
                  {isDecoding ? <Icons.loader size={18} /> : <Icons.search size={18} />}
                  {isDecoding ? 'Decoding...' : 'Decode'}
                </button>
              </div>
              <p className={styles.vinHint}>
                Find your VIN on your registration, insurance card, or driver&apos;s side dashboard
              </p>

              {/* Decoded Result */}
              {decodedData && (
                <div className={styles.decodedResult}>
                  <div className={styles.decodedHeader}>
                    <Icons.check size={18} />
                    <span>Vehicle Found!</span>
                  </div>
                  <div className={styles.decodedInfo}>
                    <strong>{decodedData.year} {decodedData.make} {decodedData.model}</strong>
                    {decodedData.trim && <span>{decodedData.trim}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Entry Fields */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="year" className={styles.label}>Year *</label>
              <input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={styles.input}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="make" className={styles.label}>Make *</label>
              <input
                id="make"
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className={styles.input}
                placeholder="Porsche"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="model" className={styles.label}>Model *</label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={styles.input}
                placeholder="911 GT3"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="trim" className={styles.label}>Trim</label>
              <input
                id="trim"
                type="text"
                value={trim}
                onChange={(e) => setTrim(e.target.value)}
                className={styles.input}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Nickname */}
          <div className={styles.formGroup}>
            <label htmlFor="nickname" className={styles.label}>Nickname (optional)</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={styles.input}
              placeholder='e.g., "Track Toy", "Daily Driver"'
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || !year || !make || !model}
          >
            {isSubmitting ? 'Adding...' : 'Add Vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
}
