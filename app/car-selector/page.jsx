import Image from 'next/image';
import SportsCarComparison from '@/components/SportsCarComparison';
import Button from '@/components/Button';
import ScoringInfo from '@/components/ScoringInfo';
import styles from './page.module.css';

// Hero image - Canyon road conveys "finding YOUR lane/path"
const heroImageUrl = '/images/pages/canyon-road.png';

// Icon
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

export const metadata = {
  title: 'Sports Car Selector | Compare ~100 Performance Vehicles',
  description: 'Select your perfect sports car with our intelligent comparison tool. Compare ~100 vehicles from $12K-$100K based on sound, track capability, reliability, daily comfort, and value. Real owner insights included.',
  keywords: ['sports car selector', 'car comparison', 'track cars', 'sports car buying guide', 'Porsche comparison', 'BMW M comparison', 'Corvette comparison', 'best sports car under 100k', 'muscle cars', 'import tuners', 'drift cars'],
  openGraph: {
    title: 'Sports Car Selector | Compare ~100 Performance Vehicles',
    description: 'Select your perfect sports car. Compare ~100 vehicles based on what matters most to you.',
    url: '/car-selector',
    type: 'website',
  },
  twitter: {
    title: 'Sports Car Selector | Compare ~100 Performance Vehicles',
    description: 'Select your perfect sports car. Compare ~100 vehicles from $12K-$100K.',
  },
  alternates: {
    canonical: '/car-selector',
  },
};

export default function CarSelector() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Sports cars at a weekend meetup"
            fill
            priority
            quality={85}
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>Car Selector</span>
            <h1 className={styles.title}>
              Own Your<br />
              <span className={styles.titleAccent}>Lane</span>
            </h1>
            <p className={styles.subtitle}>
              Find the car that fits your goals—not someone else&apos;s Instagram. 
              Tell us what actually matters to you, and we&apos;ll match you with 
              the right car. Real ownership insights from drivers who walk the walk.
            </p>
            <Button href="#selector" variant="secondary" size="lg" icon={<SearchIcon />}>
              Start the Selector
            </Button>
          </div>
        </div>
      </section>

      {/* Scoring Methodology */}
      <section className={styles.scoringSection}>
        <div className={styles.container}>
          <ScoringInfo variant="advisory" />
        </div>
      </section>

      {/* Sports Car Selector Tool */}
      <section id="selector" className={styles.tool}>
        <SportsCarComparison />
      </section>

      {/* Post-Selector CTA */}
      <section className={styles.postCta}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Found Your Match?</h2>
              <p className={styles.ctaSubtitle}>
                Now plan your path forward. Use our Performance HUB to explore 
                upgrade options, or dive into Education to understand how modifications 
                work as a connected system. Build with knowledge, not guesswork.
              </p>
              <div className={styles.ctaButtons}>
                <Button href="/performance" variant="primary" size="lg">
                  Explore Upgrades
                </Button>
                <Button href="/education" variant="outlineLight" size="lg">
                  Learn the Fundamentals
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

