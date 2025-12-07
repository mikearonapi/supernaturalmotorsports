'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { fetchCars } from '@/lib/carsClient.js';
import { carData as localCarData, tierConfig } from '@/data/cars.js';
import PerformanceHub from '@/components/PerformanceHub';
import LoadingSpinner from '@/components/LoadingSpinner';
import CarImage from '@/components/CarImage';
import UpgradeGuide from '@/components/UpgradeGuide';
import Button from '@/components/Button';

// Blob URL for hero image
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const heroImageUrl = `${BLOB_BASE}/pages/performance/hero.webp`;

// Icons
const Icons = {
  gauge: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  ),
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  book: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
};

/**
 * Inner component that uses useSearchParams
 * Must be wrapped in Suspense
 */
function PerformanceContent() {
  const searchParams = useSearchParams();
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCarSlug, setSelectedCarSlug] = useState(searchParams.get('car') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'build'); // 'build' or 'learn'

  // Load cars
  useEffect(() => {
    async function loadCars() {
      try {
        setIsLoading(true);
        const fetchedCars = await fetchCars();
        setCars(fetchedCars.length > 0 ? fetchedCars : localCarData);
      } catch (err) {
        console.error('[Performance] Error loading cars:', err);
        setCars(localCarData);
      } finally {
        setIsLoading(false);
      }
    }
    loadCars();
  }, []);

  // Update URL when car is selected or tab changes
  useEffect(() => {
    if (selectedCarSlug) {
      window.history.pushState({}, '', `/performance?car=${selectedCarSlug}`);
    } else if (activeTab === 'learn') {
      window.history.pushState({}, '', '/performance?tab=learn');
    } else {
      window.history.pushState({}, '', '/performance');
    }
  }, [selectedCarSlug, activeTab]);

  // Filter cars based on search and tier
  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const matchesSearch = searchTerm === '' || 
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = filterTier === 'all' || car.tier === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [cars, searchTerm, filterTier]);

  // Get the selected car
  const selectedCar = useMemo(() => {
    return cars.find(car => car.slug === selectedCarSlug);
  }, [cars, selectedCarSlug]);

  // Group cars by tier for display
  const carsByTier = useMemo(() => {
    const grouped = {};
    filteredCars.forEach(car => {
      const tier = car.tier || 'other';
      if (!grouped[tier]) {
        grouped[tier] = [];
      }
      grouped[tier].push(car);
    });
    return grouped;
  }, [filteredCars]);

  const tierOrder = ['premium', 'upper-mid', 'mid', 'budget'];

  // If a car is selected, show the Performance HUB
  if (selectedCar) {
    return (
      <div className={styles.page}>
        {/* Back to Selection */}
        <div className={styles.backBar}>
          <div className={styles.container}>
            <button 
              onClick={() => setSelectedCarSlug('')}
              className={styles.backButton}
            >
              ← Select Different Car
            </button>
            <span className={styles.selectedCarName}>
              {selectedCar.name}
            </span>
          </div>
        </div>
        
        {/* Performance HUB */}
        <div className={styles.hubWrapper}>
          <PerformanceHub car={selectedCar} />
        </div>
      </div>
    );
  }

  // Car selection view
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Performance car on track"
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
            <span className={styles.badge}>Performance HUB</span>
            <h1 className={styles.title}>
              Maximize Your<br />
              <span className={styles.titleAccent}>Performance</span>
            </h1>
            <p className={styles.subtitle}>
              Learn about upgrades, see how they transform your car&apos;s capabilities, 
              and build a personalized modification plan. From cold air intakes to 
              full track builds—we help you spend smarter and drive faster.
            </p>
            
            {/* Mode Tabs */}
            <div className={styles.modeTabs}>
              <button
                className={`${styles.modeTab} ${activeTab === 'build' ? styles.active : ''}`}
                onClick={() => setActiveTab('build')}
              >
                <Icons.wrench size={18} />
                Plan Your Build
              </button>
              <button
                className={`${styles.modeTab} ${activeTab === 'learn' ? styles.active : ''}`}
                onClick={() => setActiveTab('learn')}
              >
                <Icons.book size={18} />
                Learn About Upgrades
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Learn About Upgrades Tab */}
      {activeTab === 'learn' && (
        <section className={styles.learnSection}>
          <div className={styles.container}>
            <UpgradeGuide />
          </div>
        </section>
      )}

      {/* Car Selection - only show in build tab */}
      {activeTab === 'build' && (
        <section className={styles.selection}>
          <div className={styles.container}>
          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Icons.search size={18} />
              <input
                type="text"
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.tierFilter}>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className={styles.tierSelect}
              >
                <option value="all">All Tiers</option>
                {tierOrder.map(tier => (
                  <option key={tier} value={tier}>
                    {tierConfig[tier]?.label || tier}
                  </option>
                ))}
              </select>
              <Icons.chevronDown size={16} />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading vehicles...</p>
            </div>
          )}

          {/* Car Grid */}
          {!isLoading && filteredCars.length === 0 && (
            <div className={styles.emptyState}>
              <Icons.car size={48} />
              <p>No cars match your search. Try adjusting your filters.</p>
            </div>
          )}

          {!isLoading && filteredCars.length > 0 && (
            <div className={styles.carSections}>
              {tierOrder.map(tier => {
                const tierCars = carsByTier[tier];
                if (!tierCars || tierCars.length === 0) return null;
                
                return (
                  <div key={tier} className={styles.tierSection}>
                    <h3 className={styles.tierTitle}>
                      {tierConfig[tier]?.label || tier}
                      <span className={styles.tierCount}>{tierCars.length}</span>
                    </h3>
                    <div className={styles.carGrid}>
                      {tierCars.map(car => (
                        <button
                          key={car.slug}
                          onClick={() => setSelectedCarSlug(car.slug)}
                          className={styles.carCard}
                        >
                          <div className={styles.carCardImage}>
                            <CarImage car={car} variant="thumbnail" showName={false} />
                          </div>
                          <div className={styles.carCardInfo}>
                            <span className={styles.carCardName}>{car.name}</span>
                            <span className={styles.carCardMeta}>
                              {car.hp} hp • {car.category}
                            </span>
                          </div>
                          <span className={styles.carCardPrice}>{car.priceRange}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Build?</h2>
            <p className={styles.ctaSubtitle}>
              Our team turns your upgrade plan into reality. From bolt-ons to full builds, 
              we handle the installation and validate the results with professional track testing.
            </p>
            <div className={styles.ctaButtons}>
              <Button href="/services" variant="secondary" size="lg">
                Get It Built
              </Button>
              <Button href="/car-finder" variant="outlineLight" size="lg">
                Find Your Car First
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Loading fallback for Suspense
 */
function PerformanceLoading() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Performance car on track"
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
            <span className={styles.badge}>Performance HUB</span>
            <h1 className={styles.title}>
              Maximize Your<br />
              <span className={styles.titleAccent}>Performance</span>
            </h1>
          </div>
        </div>
      </section>
      <div className={styles.loadingState}>
        <LoadingSpinner size="large" />
        <p>Loading Performance HUB...</p>
      </div>
    </div>
  );
}

/**
 * Main page export - wraps content in Suspense for useSearchParams
 */
export default function Performance() {
  return (
    <Suspense fallback={<PerformanceLoading />}>
      <PerformanceContent />
    </Suspense>
  );
}
