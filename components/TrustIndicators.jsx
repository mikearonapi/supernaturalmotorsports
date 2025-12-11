'use client';

/**
 * Trust Indicators Component
 * 
 * Displays expert sources, testimonials, and credibility indicators
 * to build trust with new visitors.
 * 
 * @module components/TrustIndicators
 */

import { useState } from 'react';
import styles from './TrustIndicators.module.css';

// Expert sources/reviewers we cite
const expertSources = [
  {
    name: 'Throttle House',
    type: 'YouTube',
    focus: 'Track testing & comparisons',
  },
  {
    name: 'SavageGeese',
    type: 'YouTube',
    focus: 'Deep technical analysis',
  },
  {
    name: 'carwow',
    type: 'YouTube',
    focus: 'Performance testing',
  },
  {
    name: 'Doug DeMuro',
    type: 'YouTube',
    focus: 'Quirks & features',
  },
  {
    name: 'The Smoking Tire',
    type: 'YouTube',
    focus: 'Real-world driving',
  },
  {
    name: 'Car and Driver',
    type: 'Magazine',
    focus: 'Instrumented testing',
  },
  {
    name: 'MotorTrend',
    type: 'Magazine',
    focus: 'Comprehensive reviews',
  },
  {
    name: 'Everyday Driver',
    type: 'YouTube',
    focus: 'Enthusiast perspective',
  },
];

// Testimonials / quotes
const testimonials = [
  {
    quote: "Finally, a tool that helps enthusiasts at every budget level find their perfect car.",
    author: "Sports Car Community",
    role: "Feedback",
  },
  {
    quote: "The Performance HUB helped me plan my build without wasting money on mods that don't work together.",
    author: "Mustang Owner",
    role: "User",
  },
  {
    quote: "Love that you celebrate the $3K Miata as much as the $300K GT3. Real enthusiast energy.",
    author: "Reddit r/cars",
    role: "Community",
  },
];

// Icons
const Icons = {
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  quote: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" opacity="0.2">
      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
    </svg>
  ),
  play: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  book: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
};

/**
 * Trust Indicators Component
 * 
 * @param {'compact'|'full'} [variant='compact'] - Display variant
 */
export default function TrustIndicators({ variant = 'compact' }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  if (variant === 'compact') {
    return (
      <section className={styles.compactSection}>
        <div className={styles.container}>
          <div className={styles.compactContent}>
            <div className={styles.trustBadges}>
              <div className={styles.trustBadge}>
                <Icons.check size={16} />
                <span>Expert-Sourced Data</span>
              </div>
              <div className={styles.trustBadge}>
                <Icons.check size={16} />
                <span>Real Owner Insights</span>
              </div>
              <div className={styles.trustBadge}>
                <Icons.check size={16} />
                <span>No Sponsored Content</span>
              </div>
            </div>
            <p className={styles.compactText}>
              Recommendations backed by 200+ expert reviews from sources like {' '}
              <strong>Throttle House</strong>, <strong>SavageGeese</strong>, {' '}
              <strong>Car and Driver</strong>, and more.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Full variant
  return (
    <section className={styles.fullSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Research-Backed Recommendations</h2>
          <p className={styles.subtitle}>
            Our data combines hands-on ownership experience with insights from 
            the most trusted voices in automotive journalism.
          </p>
        </div>

        {/* Expert Sources Grid */}
        <div className={styles.sourcesGrid}>
          {expertSources.map((source, index) => (
            <div key={index} className={styles.sourceCard}>
              <div className={styles.sourceIcon}>
                {source.type === 'YouTube' ? <Icons.play size={16} /> : <Icons.book size={16} />}
              </div>
              <div className={styles.sourceContent}>
                <span className={styles.sourceName}>{source.name}</span>
                <span className={styles.sourceFocus}>{source.focus}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Values */}
        <div className={styles.trustValues}>
          <div className={styles.trustValue}>
            <span className={styles.trustValueNumber}>98+</span>
            <span className={styles.trustValueLabel}>Cars Analyzed</span>
          </div>
          <div className={styles.trustValue}>
            <span className={styles.trustValueNumber}>200+</span>
            <span className={styles.trustValueLabel}>Expert Reviews Cited</span>
          </div>
          <div className={styles.trustValue}>
            <span className={styles.trustValueNumber}>0</span>
            <span className={styles.trustValueLabel}>Sponsored Recommendations</span>
          </div>
        </div>

        {/* Testimonials */}
        <div className={styles.testimonials}>
          <div className={styles.testimonialContent}>
            <Icons.quote size={32} />
            <blockquote className={styles.testimonialQuote}>
              {testimonials[activeTestimonial].quote}
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <span className={styles.authorName}>— {testimonials[activeTestimonial].author}</span>
              <span className={styles.authorRole}>{testimonials[activeTestimonial].role}</span>
            </div>
          </div>
          <div className={styles.testimonialDots}>
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`${styles.testimonialDot} ${index === activeTestimonial ? styles.active : ''}`}
                onClick={() => setActiveTestimonial(index)}
                aria-label={`Show testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
