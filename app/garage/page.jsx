'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { carData, tierConfig } from '@/data/cars.js';
import styles from './page.module.css';

// Blob base URL for car images
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const heroImageUrl = `${BLOB_BASE}/pages/home/hero.webp`;

function getCarImageUrl(slug) {
  return `${BLOB_BASE}/cars/${slug}/hero.webp`;
}

// Icons
const Icons = {
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  grid: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  list: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  filter: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  zap: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  gauge: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  volume: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  star: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  arrowRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  x: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// Filter options
const TIERS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'premium', label: 'Premium ($75K+)' },
  { value: 'upper-mid', label: 'Upper-Mid ($45-75K)' },
  { value: 'mid', label: 'Mid ($25-45K)' },
  { value: 'budget', label: 'Entry ($12-25K)' },
];

const CATEGORIES = [
  { value: 'all', label: 'All Layouts' },
  { value: 'Mid-Engine', label: 'Mid-Engine' },
  { value: 'Front-Engine', label: 'Front-Engine' },
  { value: 'Rear-Engine', label: 'Rear-Engine' },
];

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'hp-desc', label: 'Power: High to Low' },
  { value: 'hp-asc', label: 'Power: Low to High' },
  { value: 'zerosixty-asc', label: '0-60: Fastest First' },
  { value: 'zerosixty-desc', label: '0-60: Slowest First' },
  { value: 'torque-desc', label: 'Torque: High to Low' },
  { value: 'sound-desc', label: 'Best Sound' },
  { value: 'track-desc', label: 'Best Track' },
  { value: 'value-desc', label: 'Best Value' },
  { value: 'reliability-desc', label: 'Most Reliable' },
];

// Get unique brands from car data
const BRANDS = ['all', ...new Set(carData.map(car => {
  // Extract brand from car name
  const name = car.name;
  if (name.startsWith('718') || name.startsWith('911') || name.startsWith('Cayman') || name.startsWith('Boxster')) return 'Porsche';
  if (name.startsWith('M2') || name.startsWith('M3') || name.startsWith('M4') || name.startsWith('M5') || name.startsWith('Z4')) return 'BMW';
  if (name.startsWith('Corvette') || name.startsWith('Camaro')) return 'Chevrolet';
  if (name.startsWith('Mustang')) return 'Ford';
  if (name.startsWith('GT-R') || name.startsWith('370Z') || name.startsWith('350Z') || name.includes('Nissan')) return 'Nissan';
  if (name.startsWith('Supra') || name.startsWith('GR86') || name.includes('Toyota')) return 'Toyota';
  if (name.startsWith('BRZ') || name.startsWith('WRX') || name.includes('Subaru')) return 'Subaru';
  if (name.startsWith('S2000') || name.startsWith('NSX') || name.startsWith('Civic Type R') || name.includes('Honda')) return 'Honda';
  if (name.startsWith('Miata') || name.startsWith('MX-5') || name.startsWith('RX-') || name.includes('Mazda')) return 'Mazda';
  if (name.startsWith('Challenger') || name.startsWith('Charger') || name.startsWith('Viper')) return 'Dodge';
  if (name.startsWith('AMG') || name.includes('Mercedes')) return 'Mercedes-AMG';
  if (name.startsWith('RS') || name.startsWith('R8') || name.startsWith('TT') || name.includes('Audi')) return 'Audi';
  if (name.startsWith('Evora') || name.startsWith('Elise') || name.startsWith('Exige') || name.startsWith('Emira')) return 'Lotus';
  if (name.startsWith('Shelby')) return 'Shelby';
  if (name.startsWith('Alfa')) return 'Alfa Romeo';
  if (name.startsWith('Genesis')) return 'Genesis';
  if (name.startsWith('Model')) return 'Tesla';
  return car.brand || name.split(' ')[0];
}))].sort((a, b) => a === 'all' ? -1 : b === 'all' ? 1 : a.localeCompare(b));

// Get tier styling
const getTierClass = (tier) => {
  const tierClasses = {
    premium: styles.tierPremium,
    'upper-mid': styles.tierUpper,
    mid: styles.tierMid,
    budget: styles.tierEntry,
  };
  return tierClasses[tier] || styles.tierMid;
};

// Get score color class
const getScoreClass = (score) => {
  if (score >= 9) return styles.scoreExcellent;
  if (score >= 7) return styles.scoreGood;
  if (score >= 5) return styles.scoreAverage;
  return styles.scorePoor;
};

// Car Card Component
function CarCard({ car, viewMode }) {
  const tier = tierConfig[car.tier] || { label: car.tier };
  
  if (viewMode === 'list') {
    return (
      <Link href={`/cars/${car.slug}`} className={styles.tableRow}>
        <div className={styles.tableCell} data-label="Car">
          <div className={styles.tableCellCar}>
            <div className={styles.tableImageWrapper}>
              <Image
                src={getCarImageUrl(car.slug)}
                alt={car.name}
                fill
                sizes="80px"
                className={styles.tableImage}
              />
            </div>
            <div className={styles.tableCarInfo}>
              <h3 className={styles.tableCarName}>{car.name}</h3>
              <span className={styles.tableCarYears}>{car.years}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.tableCell} data-label="Tier">
          <span className={`${styles.tableTier} ${getTierClass(car.tier)}`}>
            {tier.label}
          </span>
        </div>
        
        <div className={styles.tableCell} data-label="HP">
          <span className={styles.tableCellValue}>{car.hp}</span>
        </div>
        
        <div className={styles.tableCell} data-label="Torque">
          <span className={styles.tableCellValue}>{car.torque || '—'}</span>
        </div>
        
        <div className={styles.tableCell} data-label="0-60">
          <span className={styles.tableCellValue}>{car.zeroToSixty ? `${car.zeroToSixty}s` : '—'}</span>
        </div>
        
        <div className={styles.tableCell} data-label="Sound">
          <span className={`${styles.tableScore} ${getScoreClass(car.sound)}`}>
            {car.sound}
          </span>
        </div>
        
        <div className={styles.tableCell} data-label="Track">
          <span className={`${styles.tableScore} ${getScoreClass(car.track)}`}>
            {car.track}
          </span>
        </div>
        
        <div className={styles.tableCell} data-label="Value">
          <span className={`${styles.tableScore} ${getScoreClass(car.value)}`}>
            {car.value}
          </span>
        </div>
        
        <div className={styles.tableCell} data-label="Reliable">
          <span className={`${styles.tableScore} ${getScoreClass(car.reliability)}`}>
            {car.reliability}
          </span>
        </div>
        
        <div className={styles.tableCell} data-label="Price">
          <span className={styles.tableCellValue}>{car.priceRange}</span>
        </div>
      </Link>
    );
  }
  
  return (
    <Link href={`/cars/${car.slug}`} className={styles.card}>
      <div className={styles.cardImageWrapper}>
        <Image
          src={getCarImageUrl(car.slug)}
          alt={car.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={styles.cardImage}
        />
        <div className={styles.cardOverlay} />
        <span className={`${styles.cardTier} ${getTierClass(car.tier)}`}>
          {tier.label}
        </span>
        <div className={styles.cardQuickStats}>
          <div className={styles.quickStat}>
            <Icons.zap size={14} />
            <span>{car.hp} hp</span>
          </div>
          <div className={styles.quickStat}>
            <span>{car.priceRange}</span>
          </div>
        </div>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardName}>{car.name}</h3>
          <span className={styles.cardYears}>{car.years}</span>
        </div>
        <p className={styles.cardEngine}>{car.engine} • {car.trans}</p>
        <div className={styles.cardScores}>
          <div className={styles.scoreItem} title="Sound Score">
            <span className={styles.scoreLabel}>Sound</span>
            <span className={`${styles.scoreValue} ${getScoreClass(car.sound)}`}>{car.sound}</span>
          </div>
          <div className={styles.scoreItem} title="Track Score">
            <span className={styles.scoreLabel}>Track</span>
            <span className={`${styles.scoreValue} ${getScoreClass(car.track)}`}>{car.track}</span>
          </div>
          <div className={styles.scoreItem} title="Value Score">
            <span className={styles.scoreLabel}>Value</span>
            <span className={`${styles.scoreValue} ${getScoreClass(car.value)}`}>{car.value}</span>
          </div>
          <div className={styles.scoreItem} title="Reliability Score">
            <span className={styles.scoreLabel}>Reliable</span>
            <span className={`${styles.scoreValue} ${getScoreClass(car.reliability)}`}>{car.reliability}</span>
          </div>
        </div>
        <p className={styles.cardHighlight}>{car.highlight}</p>
      </div>
    </Link>
  );
}

export default function GaragePage() {
  // State for filters and view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Get brand from car name (same logic as BRANDS)
  const getCarBrand = (name) => {
    if (name.startsWith('718') || name.startsWith('911') || name.startsWith('Cayman') || name.startsWith('Boxster')) return 'Porsche';
    if (name.startsWith('M2') || name.startsWith('M3') || name.startsWith('M4') || name.startsWith('M5') || name.startsWith('Z4')) return 'BMW';
    if (name.startsWith('Corvette') || name.startsWith('Camaro')) return 'Chevrolet';
    if (name.startsWith('Mustang')) return 'Ford';
    if (name.startsWith('GT-R') || name.startsWith('370Z') || name.startsWith('350Z') || name.includes('Nissan')) return 'Nissan';
    if (name.startsWith('Supra') || name.startsWith('GR86') || name.includes('Toyota')) return 'Toyota';
    if (name.startsWith('BRZ') || name.startsWith('WRX') || name.includes('Subaru')) return 'Subaru';
    if (name.startsWith('S2000') || name.startsWith('NSX') || name.startsWith('Civic Type R') || name.includes('Honda')) return 'Honda';
    if (name.startsWith('Miata') || name.startsWith('MX-5') || name.startsWith('RX-') || name.includes('Mazda')) return 'Mazda';
    if (name.startsWith('Challenger') || name.startsWith('Charger') || name.startsWith('Viper')) return 'Dodge';
    if (name.startsWith('AMG') || name.includes('Mercedes')) return 'Mercedes-AMG';
    if (name.startsWith('RS') || name.startsWith('R8') || name.startsWith('TT') || name.includes('Audi')) return 'Audi';
    if (name.startsWith('Evora') || name.startsWith('Elise') || name.startsWith('Exige') || name.startsWith('Emira')) return 'Lotus';
    if (name.startsWith('Shelby')) return 'Shelby';
    if (name.startsWith('Alfa')) return 'Alfa Romeo';
    if (name.startsWith('Genesis')) return 'Genesis';
    if (name.startsWith('Model')) return 'Tesla';
    return name.split(' ')[0];
  };
  
  // Filter and sort cars
  const filteredCars = useMemo(() => {
    let result = [...carData];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(car => 
        car.name.toLowerCase().includes(query) ||
        car.engine?.toLowerCase().includes(query) ||
        car.highlight?.toLowerCase().includes(query) ||
        car.years?.includes(query)
      );
    }
    
    // Tier filter
    if (selectedTier !== 'all') {
      result = result.filter(car => car.tier === selectedTier);
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(car => car.category === selectedCategory);
    }
    
    // Brand filter
    if (selectedBrand !== 'all') {
      result = result.filter(car => getCarBrand(car.name) === selectedBrand);
    }
    
    // Sort
    const [sortField, sortDir] = sortBy.split('-');
    result.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'price':
          aVal = a.priceAvg || 0;
          bVal = b.priceAvg || 0;
          break;
        case 'hp':
          aVal = a.hp || 0;
          bVal = b.hp || 0;
          break;
        case 'zerosixty':
          // For 0-60 time, lower is better, so we handle nulls specially
          aVal = a.zeroToSixty || 999;
          bVal = b.zeroToSixty || 999;
          break;
        case 'torque':
          aVal = a.torque || 0;
          bVal = b.torque || 0;
          break;
        case 'sound':
          aVal = a.sound || 0;
          bVal = b.sound || 0;
          break;
        case 'track':
          aVal = a.track || 0;
          bVal = b.track || 0;
          break;
        case 'value':
          aVal = a.value || 0;
          bVal = b.value || 0;
          break;
        case 'reliability':
          aVal = a.reliability || 0;
          bVal = b.reliability || 0;
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }
      
      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    return result;
  }, [searchQuery, selectedTier, selectedCategory, selectedBrand, sortBy]);
  
  // Count active filters
  const activeFilterCount = [
    selectedTier !== 'all',
    selectedCategory !== 'all',
    selectedBrand !== 'all',
  ].filter(Boolean).length;
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTier('all');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSortBy('name-asc');
  };
  
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Sports cars in a showroom garage"
            fill
            priority
            quality={85}
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>The Garage</span>
          <h1 className={styles.heroTitle}>
            Explore Our<br />
            <span className={styles.heroAccent}>Collection</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Browse ~{carData.length} sports cars from budget-friendly track toys to premium 
            performance machines. Filter by what matters to you—sound, track capability, 
            value, or just find something that speaks to your soul.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>~{carData.length}</span>
              <span className={styles.heroStatLabel}>Vehicles</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>$12K</span>
              <span className={styles.heroStatLabel}>Starting</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>4</span>
              <span className={styles.heroStatLabel}>Tiers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Controls Section */}
      <section className={styles.controls}>
        <div className={styles.controlsContainer}>
          {/* Top Row: Search + View Toggle */}
          <div className={styles.controlsTopRow}>
            {/* Search Bar */}
            <div className={styles.searchWrapper}>
              <Icons.search size={18} />
              <input
                type="text"
                placeholder="Search by name, engine, or feature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button 
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <Icons.x size={16} />
                </button>
              )}
            </div>
            
            {/* View Toggle & Results Count */}
            <div className={styles.controlsRight}>
              <span className={styles.resultsCount}>
                {filteredCars.length} {filteredCars.length === 1 ? 'car' : 'cars'}
              </span>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewButtonActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Icons.grid size={18} />
                </button>
                <button
                  className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewButtonActive : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="Table view"
                  title="Table view"
                >
                  <Icons.list size={18} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom Row: Filters */}
          <div className={styles.controlsBottomRow}>
            {/* Filter Toggle (Mobile) */}
            <button 
              className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Icons.filter size={18} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className={styles.filterCount}>{activeFilterCount}</span>
              )}
            </button>
            
            {/* Filters Panel */}
            <div className={`${styles.filtersPanel} ${showFilters ? styles.filtersPanelOpen : ''}`}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Price Tier</label>
                <select 
                  value={selectedTier} 
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className={styles.filterSelect}
                >
                  {TIERS.map(tier => (
                    <option key={tier.value} value={tier.value}>{tier.label}</option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Layout</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={styles.filterSelect}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Brand</label>
                <select 
                  value={selectedBrand} 
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className={styles.filterSelect}
                >
                  {BRANDS.map(brand => (
                    <option key={brand} value={brand}>
                      {brand === 'all' ? 'All Brands' : brand}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              {activeFilterCount > 0 && (
                <button className={styles.clearFilters} onClick={clearFilters}>
                  <Icons.x size={16} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Car Grid/List */}
      <section className={styles.carsSection}>
        <div className={styles.carsContainer}>
          {filteredCars.length === 0 ? (
            <div className={styles.emptyState}>
              <Icons.search size={48} />
              <h3>No cars found</h3>
              <p>Try adjusting your filters or search query</p>
              <button className={styles.resetButton} onClick={clearFilters}>
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={styles.carsGrid}>
              {filteredCars.map((car) => (
                <CarCard key={car.slug} car={car} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableHeaderCell}>Car</div>
                  <div className={styles.tableHeaderCell}>Tier</div>
                  <div className={styles.tableHeaderCell}>HP</div>
                  <div className={styles.tableHeaderCell}>Torque</div>
                  <div className={styles.tableHeaderCell}>0-60</div>
                  <div className={styles.tableHeaderCell}>Sound</div>
                  <div className={styles.tableHeaderCell}>Track</div>
                  <div className={styles.tableHeaderCell}>Value</div>
                  <div className={styles.tableHeaderCell}>Reliable</div>
                  <div className={styles.tableHeaderCell}>Price</div>
                </div>
                <div className={styles.tableBody}>
                  {filteredCars.map((car) => (
                    <CarCard key={car.slug} car={car} viewMode={viewMode} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Need Help Choosing?</h2>
            <p className={styles.ctaSubtitle}>
              Our Car Selector tool helps match you with the perfect vehicle based on 
              your priorities—whether that's sound, track capability, value, or daily usability.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/car-selector" className={styles.ctaPrimary}>
                Try the Car Selector
              </Link>
              <Link href="/performance" className={styles.ctaSecondary}>
                Explore Upgrades
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

