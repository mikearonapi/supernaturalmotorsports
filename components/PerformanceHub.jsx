/**
 * Performance HUB Component
 * 
 * Redesigned to show meaningful real-world metrics:
 * - Power: Actual HP with HP gains
 * - Acceleration: 0-60 times with improvement in seconds
 * - Braking: 60-0 distance with feet improvement
 * - Grip: Lateral G with improvement
 * - Plus subjective scores for Comfort, Reliability, Sound
 * 
 * Also shows component breakdown for each upgrade package.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './PerformanceHub.module.css';
import ScoringInfo from './ScoringInfo';
import {
  getPerformanceProfile,
  getScoreComparison,
  getAvailableUpgrades,
  calculateTotalCost,
  getUpgradeSummary,
  performanceCategories,
} from '@/lib/performance.js';
import { upgradeTiers } from '@/data/performanceCategories.js';
import { tierConfig } from '@/data/cars.js';
import CarImage from './CarImage';

// Icons for performance categories
const Icons = {
  tachometer: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  tire: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  brake: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v12"/>
      <path d="M6 12h12"/>
    </svg>
  ),
  flag: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  comfort: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  thermometer: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  sound: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  chevronRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  bolt: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  stopwatch: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/>
      <path d="M9 2h6"/>
      <path d="M12 2v2"/>
    </svg>
  ),
};

// Map icon names to components
const iconMap = {
  tachometer: Icons.tachometer,
  tire: Icons.tire,
  brake: Icons.brake,
  flag: Icons.flag,
  comfort: Icons.comfort,
  thermometer: Icons.thermometer,
  sound: Icons.sound,
};

/**
 * Real Metric Row - Shows actual values like HP, seconds, feet
 */
function RealMetricRow({ icon: IconComponent, label, stockValue, upgradedValue, unit, improvement, improvementPrefix = '+', isLowerBetter = false }) {
  const hasImproved = isLowerBetter ? upgradedValue < stockValue : upgradedValue > stockValue;
  const improvementVal = improvement || Math.abs(upgradedValue - stockValue);
  
  // Calculate percentage for bar (relative to a max)
  const maxValues = {
    hp: 800,
    seconds: 6,
    feet: 130,
    g: 1.3,
  };
  
  let maxValue = 800; // default for HP
  if (unit === 's') maxValue = maxValues.seconds;
  if (unit === 'ft') maxValue = maxValues.feet;
  if (unit === 'g') maxValue = maxValues.g;
  
  // For time/distance (lower is better), invert the percentage
  const stockPercent = isLowerBetter 
    ? ((maxValue - stockValue) / maxValue) * 100 
    : (stockValue / maxValue) * 100;
  const upgradedPercent = isLowerBetter 
    ? ((maxValue - upgradedValue) / maxValue) * 100 
    : (upgradedValue / maxValue) * 100;
  
  return (
    <div className={styles.metricRow}>
      <div className={styles.metricHeader}>
        <div className={styles.metricLabel}>
          <span className={styles.metricIcon}><IconComponent size={18} /></span>
          <span className={styles.metricName}>{label}</span>
        </div>
        <div className={styles.metricValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockValueSmall}>{stockValue}{unit}</span>
              <span className={styles.metricArrow}>→</span>
              <span className={styles.upgradedValue}>{upgradedValue}{unit}</span>
              <span className={styles.metricGain}>
                {improvementPrefix}{improvementVal.toFixed(unit === 'g' ? 2 : unit === 's' ? 1 : 0)}{unit}
              </span>
            </>
          ) : (
            <span className={styles.currentValue}>{stockValue}{unit}</span>
          )}
        </div>
      </div>
      <div className={styles.metricTrack}>
        <div 
          className={styles.metricFillStock}
          style={{ width: `${Math.min(100, stockPercent)}%` }}
        />
        {hasImproved && (
          <div 
            className={styles.metricFillUpgrade}
            style={{ 
              left: `${Math.min(100, stockPercent)}%`,
              width: `${Math.min(100 - stockPercent, upgradedPercent - stockPercent)}%` 
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Score bar component for subjective ratings (1-10 scale)
 */
function ScoreBar({ category, stockScore, upgradedScore, showUpgrade }) {
  const IconComponent = iconMap[category.icon] || Icons.flag;
  const hasImproved = upgradedScore > stockScore;
  const delta = upgradedScore - stockScore;
  
  return (
    <div className={styles.performanceBar}>
      <div className={styles.barHeader}>
        <div className={styles.barLabel}>
          <span className={styles.barIcon}>
            <IconComponent size={18} />
          </span>
          <span className={styles.barName}>{category.shortLabel}</span>
        </div>
        <div className={styles.barScores}>
          {showUpgrade && hasImproved ? (
            <>
              <span className={styles.stockScoreSmall}>{stockScore.toFixed(1)}</span>
              <span className={styles.scoreArrow}>→</span>
              <span className={styles.upgradedScore}>{upgradedScore.toFixed(1)}</span>
              <span className={styles.scoreDelta}>+{delta.toFixed(1)}</span>
            </>
          ) : (
            <span className={styles.currentScore}>{stockScore.toFixed(1)}/10</span>
          )}
        </div>
      </div>
      <div className={styles.barTrack}>
        <div 
          className={styles.barFillStock}
          style={{ width: `${(stockScore / 10) * 100}%` }}
        />
        {showUpgrade && hasImproved && (
          <div 
            className={styles.barFillUpgrade}
            style={{ 
              left: `${(stockScore / 10) * 100}%`,
              width: `${(delta / 10) * 100}%` 
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Component Breakdown - Shows what parts are included in upgrade
 */
function ComponentBreakdown({ selectedUpgrades, showUpgrade }) {
  if (!showUpgrade || selectedUpgrades.length === 0) return null;
  
  // Get main package
  const mainPackage = selectedUpgrades.find(u => u.type === 'package');
  const modules = selectedUpgrades.filter(u => u.type === 'module');
  
  return (
    <div className={styles.componentBreakdown}>
      <h4 className={styles.breakdownTitle}>
        <Icons.wrench size={16} />
        What's Included
      </h4>
      
      {mainPackage && mainPackage.includes && (
        <div className={styles.componentList}>
          {mainPackage.includes.map((item, idx) => (
            <div key={idx} className={styles.componentItem}>
              <Icons.check size={14} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
      
      {modules.length > 0 && (
        <div className={styles.additionalModules}>
          <span className={styles.modulesLabel}>Additional Modules:</span>
          <div className={styles.modulesList}>
            {modules.map(mod => (
              <span key={mod.key} className={styles.moduleBadge}>{mod.name}</span>
            ))}
          </div>
        </div>
      )}
      
      {mainPackage && mainPackage.considerations && (
        <div className={styles.considerations}>
          <span className={styles.considerationsLabel}>Things to Consider:</span>
          <ul className={styles.considerationsList}>
            {mainPackage.considerations.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Main Performance HUB component
 */
export default function PerformanceHub({ car }) {
  const [selectedPackageKey, setSelectedPackageKey] = useState('stock');
  const [expandedModules, setExpandedModules] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  
  // Get available upgrades for this car
  const availableUpgrades = useMemo(() => 
    getAvailableUpgrades(car), 
    [car]
  );
  
  // Determine which upgrades are active
  const activeUpgradeKeys = useMemo(() => {
    if (selectedPackageKey === 'stock') return [];
    if (selectedPackageKey === 'custom') return selectedModules;
    return [selectedPackageKey, ...selectedModules];
  }, [selectedPackageKey, selectedModules]);
  
  // Get performance profile
  const profile = useMemo(() => 
    getPerformanceProfile(car, activeUpgradeKeys),
    [car, activeUpgradeKeys]
  );
  
  // Get score comparison for bars
  const scoreComparison = useMemo(() => 
    getScoreComparison(profile.stockScores, profile.upgradedScores),
    [profile]
  );
  
  // Calculate total cost with brand-specific pricing
  const totalCost = useMemo(() => 
    calculateTotalCost(profile.selectedUpgrades, car),
    [profile.selectedUpgrades, car]
  );
  
  // Get summary text
  const upgradeSummary = useMemo(() => 
    getUpgradeSummary(profile.selectedUpgrades),
    [profile.selectedUpgrades]
  );
  
  const handlePackageSelect = (key) => {
    setSelectedPackageKey(key);
    if (key !== 'custom') {
      setSelectedModules([]);
    }
  };
  
  const handleModuleToggle = (moduleKey) => {
    setSelectedModules(prev => {
      if (prev.includes(moduleKey)) {
        return prev.filter(k => k !== moduleKey);
      }
      return [...prev, moduleKey];
    });
  };
  
  const tierInfo = tierConfig[car.tier] || {};
  const showUpgrade = selectedPackageKey !== 'stock' || selectedModules.length > 0;
  
  // Get the subjective score categories
  const subjectiveCategories = scoreComparison.filter(cat => 
    ['drivability', 'reliabilityHeat', 'soundEmotion'].includes(cat.key)
  );

  return (
    <div className={styles.hub}>
      {/* Left Panel - Car Identity */}
      <div className={styles.carPanel}>
        <Link href="/car-finder" className={styles.backLink}>
          <Icons.arrowLeft size={16} />
          Back to Car Finder
        </Link>
        
        <div className={styles.carImageContainer}>
          <CarImage car={car} variant="card" className={styles.carImage} />
        </div>
        
        <div className={styles.carInfo}>
          <div className={styles.carBadges}>
            <span className={styles.tierBadge}>{tierInfo.label || car.tier}</span>
            <span className={styles.categoryBadge}>{car.category}</span>
          </div>
          <h2 className={styles.carName}>{car.name}</h2>
          <p className={styles.carYears}>{car.years}</p>
          {car.tagline && (
            <p className={styles.carTagline}>{car.tagline}</p>
          )}
        </div>
        
        <div className={styles.specsGrid}>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Engine</span>
            <span className={styles.specValue}>{car.engine}</span>
          </div>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Power</span>
            <span className={styles.specValue}>
              {profile.upgradedMetrics.hp} hp
              {showUpgrade && profile.upgradedMetrics.hp > car.hp && (
                <span className={styles.specGain}>
                  +{profile.upgradedMetrics.hp - car.hp}
                </span>
              )}
            </span>
          </div>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Trans</span>
            <span className={styles.specValue}>{car.trans}</span>
          </div>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Drive</span>
            <span className={styles.specValue}>{car.drivetrain || 'RWD'}</span>
          </div>
          {profile.stockMetrics.zeroToSixty && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>0-60</span>
              <span className={styles.specValue}>
                {profile.upgradedMetrics.zeroToSixty?.toFixed(1)}s
                {showUpgrade && profile.upgradedMetrics.zeroToSixty < profile.stockMetrics.zeroToSixty && (
                  <span className={styles.specGain}>
                    -{(profile.stockMetrics.zeroToSixty - profile.upgradedMetrics.zeroToSixty).toFixed(1)}s
                  </span>
                )}
              </span>
            </div>
          )}
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Price</span>
            <span className={styles.specValue}>{car.priceRange}</span>
          </div>
        </div>
        
        {/* CTAs */}
        <div className={styles.carCtas}>
          <Link href={`/cars/${car.slug}`} className={styles.ctaSecondary}>
            View Full Profile
          </Link>
          <Link 
            href={`/upgrades?car=${car.slug}${selectedPackageKey !== 'stock' ? `&package=${selectedPackageKey}` : ''}`} 
            className={styles.ctaPrimary}
          >
            <Icons.wrench size={16} />
            Learn More
          </Link>
        </div>
      </div>
      
      {/* Right Panel - Performance Dashboard */}
      <div className={styles.dashboardPanel}>
        <div className={styles.dashboardHeader}>
          <h3 className={styles.dashboardTitle}>Performance HUB</h3>
          {showUpgrade && (
            <div className={styles.costBadge} title={totalCost.tierDescription || ''}>
              Est. Investment: {totalCost.display}
              {totalCost.tier !== 'mainstream' && (
                <span className={styles.costTierBadge}>
                  {totalCost.tierLabel}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Package Selector */}
        <div className={styles.packageSelector}>
          <button
            className={`${styles.packagePill} ${selectedPackageKey === 'stock' && selectedModules.length === 0 ? styles.active : ''}`}
            onClick={() => handlePackageSelect('stock')}
          >
            Stock
          </button>
          {availableUpgrades.packages.map(pkg => (
            <button
              key={pkg.key}
              className={`${styles.packagePill} ${styles[pkg.tier]} ${selectedPackageKey === pkg.key ? styles.active : ''}`}
              onClick={() => handlePackageSelect(pkg.key)}
            >
              {pkg.name.replace(' Package', '').replace(' Build', '')}
            </button>
          ))}
        </div>
        
        {/* Package Description */}
        {selectedPackageKey !== 'stock' && (
          <div className={styles.packageInfo}>
            <p className={styles.packageDescription}>{upgradeSummary}</p>
          </div>
        )}
        
        {/* Real Metrics Section */}
        <div className={styles.metricsSection}>
          <h4 className={styles.sectionTitle}>Performance Metrics</h4>
          
          {/* Power (HP) */}
          <RealMetricRow
            icon={Icons.bolt}
            label="Power"
            stockValue={profile.stockMetrics.hp || car.hp}
            upgradedValue={profile.upgradedMetrics.hp}
            unit=" hp"
            isLowerBetter={false}
          />
          
          {/* 0-60 Time */}
          {profile.stockMetrics.zeroToSixty && (
            <RealMetricRow
              icon={Icons.stopwatch}
              label="0-60 mph"
              stockValue={profile.stockMetrics.zeroToSixty}
              upgradedValue={profile.upgradedMetrics.zeroToSixty || profile.stockMetrics.zeroToSixty}
              unit="s"
              improvementPrefix="-"
              isLowerBetter={true}
            />
          )}
          
          {/* Braking Distance */}
          {profile.stockMetrics.braking60To0 && (
            <RealMetricRow
              icon={Icons.brake}
              label="60-0 Braking"
              stockValue={profile.stockMetrics.braking60To0}
              upgradedValue={profile.upgradedMetrics.braking60To0 || profile.stockMetrics.braking60To0}
              unit="ft"
              improvementPrefix="-"
              isLowerBetter={true}
            />
          )}
          
          {/* Lateral G */}
          {profile.stockMetrics.lateralG && (
            <RealMetricRow
              icon={Icons.tire}
              label="Lateral Grip"
              stockValue={profile.stockMetrics.lateralG}
              upgradedValue={profile.upgradedMetrics.lateralG || profile.stockMetrics.lateralG}
              unit="g"
              improvementPrefix="+"
              isLowerBetter={false}
            />
          )}
        </div>
        
        {/* Subjective Scores Section */}
        <div className={styles.scoresSection}>
          <h4 className={styles.sectionTitle}>Experience Scores</h4>
          {subjectiveCategories.map(cat => (
            <ScoreBar
              key={cat.key}
              category={cat}
              stockScore={cat.stockScore}
              upgradedScore={cat.upgradedScore}
              showUpgrade={showUpgrade}
            />
          ))}
        </div>
        
        {/* Component Breakdown */}
        <ComponentBreakdown 
          selectedUpgrades={profile.selectedUpgrades}
          showUpgrade={showUpgrade}
        />
        
        {/* Scoring Info */}
        <div className={styles.scoringInfoWrapper}>
          <ScoringInfo variant="performance" />
        </div>
        
        {/* Module Customization (Expandable) */}
        <div className={styles.modulesSection}>
          <button 
            className={styles.modulesToggle}
            onClick={() => setExpandedModules(!expandedModules)}
          >
            <span>Fine-tune with individual modules</span>
            <span className={`${styles.toggleIcon} ${expandedModules ? styles.expanded : ''}`}>
              <Icons.chevronDown size={16} />
            </span>
          </button>
          
          {expandedModules && (
            <div className={styles.modulesGrid}>
              {Object.entries(availableUpgrades.modulesByCategory).map(([catKey, modules]) => (
                <div key={catKey} className={styles.moduleCategory}>
                  <h4 className={styles.moduleCategoryTitle}>
                    {catKey.charAt(0).toUpperCase() + catKey.slice(1)}
                  </h4>
                  <div className={styles.moduleList}>
                    {modules.map(mod => (
                      <button
                        key={mod.key}
                        className={`${styles.moduleChip} ${selectedModules.includes(mod.key) ? styles.selected : ''}`}
                        onClick={() => handleModuleToggle(mod.key)}
                        title={mod.description}
                      >
                        {selectedModules.includes(mod.key) && (
                          <Icons.check size={12} />
                        )}
                        <span>{mod.name}</span>
                        {mod.metricChanges?.hpGain && (
                          <span className={styles.moduleHpGain}>+{mod.metricChanges.hpGain}hp</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Bottom CTA */}
        <div className={styles.dashboardFooter}>
          <Link href="/services" className={styles.footerLink}>
            About Our Services <Icons.chevronRight size={14} />
          </Link>
          <Link href="/contact" className={styles.footerLink}>
            Have Questions? <Icons.chevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
