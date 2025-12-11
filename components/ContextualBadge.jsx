'use client';

/**
 * Contextual Badge Component
 * 
 * Displays a badge indicating whether content is general knowledge,
 * applies to the user's selected car, or doesn't apply.
 * 
 * @module components/ContextualBadge
 */

import { useMemo } from 'react';
import { useSelectedCar } from '@/components/providers/CarSelectionProvider';
import { getContentContext, ContextType } from '@/lib/contentContextualizer';
import styles from './ContextualBadge.module.css';

// Icons
const Icons = {
  info: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

/**
 * @typedef {Object} ContentMetadata
 * @property {string[]} [topics]
 * @property {string[]} [appliesToPowertrainTypes]
 * @property {string[]} [appliesToDrivetrains]
 * @property {string[]} [appliesToCategories]
 * @property {string[]} [appliesToBrands]
 * @property {string[]} [appliesToModels]
 * @property {boolean} [isUniversal]
 */

/**
 * ContextualBadge Component
 * 
 * @param {Object} props
 * @param {ContentMetadata} props.metadata - Content metadata for contextualization
 * @param {string} [props.size='default'] - Badge size: 'small', 'default', 'large'
 * @param {boolean} [props.showMessage=false] - Whether to show the explanatory message
 * @param {string} [props.className] - Additional CSS class
 */
export default function ContextualBadge({ 
  metadata, 
  size = 'default', 
  showMessage = false,
  className = '',
}) {
  const selectedCar = useSelectedCar();
  
  const context = useMemo(() => {
    return getContentContext(metadata, selectedCar);
  }, [metadata, selectedCar]);

  // Get appropriate icon based on context type
  const Icon = useMemo(() => {
    switch (context.type) {
      case ContextType.APPLIES_TO_YOU:
        return Icons.check;
      case ContextType.DOES_NOT_APPLY:
        return Icons.x;
      default:
        return Icons.info;
    }
  }, [context.type]);

  // Get size class
  const sizeClass = {
    small: styles.small,
    default: '',
    large: styles.large,
  }[size] || '';

  // Get variant class
  const variantClass = {
    general: styles.general,
    applies: styles.applies,
    notApplies: styles.notApplies,
  }[context.variant] || styles.general;

  return (
    <div className={`${styles.badgeWrapper} ${className}`}>
      <span className={`${styles.badge} ${variantClass} ${sizeClass}`}>
        <Icon size={size === 'small' ? 12 : size === 'large' ? 16 : 14} />
        <span className={styles.label}>{context.label}</span>
      </span>
      
      {showMessage && context.message && (
        <p className={styles.message}>{context.message}</p>
      )}
    </div>
  );
}

/**
 * Inline variant of the badge - minimal, inline with text
 */
export function ContextualBadgeInline({ metadata, className = '' }) {
  const selectedCar = useSelectedCar();
  
  const context = useMemo(() => {
    return getContentContext(metadata, selectedCar);
  }, [metadata, selectedCar]);

  // Only show if it applies or doesn't apply (skip general)
  if (context.type === ContextType.GENERAL || context.type === ContextType.NO_CAR_SELECTED) {
    return null;
  }

  const variantClass = context.variant === 'applies' ? styles.appliesInline : styles.notAppliesInline;

  return (
    <span className={`${styles.inlineBadge} ${variantClass} ${className}`}>
      {context.type === ContextType.APPLIES_TO_YOU ? (
        <Icons.check size={10} />
      ) : (
        <Icons.x size={10} />
      )}
      <span>{context.type === ContextType.APPLIES_TO_YOU ? 'Relevant' : 'N/A'}</span>
    </span>
  );
}

/**
 * "In Your Case" personalized message block
 */
export function InYourCaseMessage({ metadata, className = '' }) {
  const selectedCar = useSelectedCar();
  
  // Only show if car is selected and content applies
  if (!selectedCar) {
    return null;
  }

  const context = getContentContext(metadata, selectedCar);
  
  // Don't show for non-applicable content
  if (context.type === ContextType.DOES_NOT_APPLY) {
    return null;
  }

  // Generate a basic message if no personalized one
  const carName = selectedCar.name?.length <= 20 
    ? selectedCar.name 
    : selectedCar.name?.split(' ').slice(0, 2).join(' ');

  return (
    <div className={`${styles.inYourCase} ${className}`}>
      <span className={styles.inYourCaseLabel}>
        <Icons.info size={14} />
        For Your {carName}
      </span>
      <p className={styles.inYourCaseText}>
        {context.message || 'This content may be relevant to your vehicle.'}
      </p>
    </div>
  );
}
