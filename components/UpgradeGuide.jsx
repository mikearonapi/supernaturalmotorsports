'use client';

import { useState, useMemo } from 'react';
import styles from './UpgradeGuide.module.css';
import { upgradeCategories, upgradeDetails, getAllUpgradesGrouped } from '@/data/upgradeEducation.js';

// Icons - comprehensive set for all upgrade categories
const Icons = {
  bolt: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  sound: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  ),
  brake: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  tire: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  thermometer: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  wind: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
  ),
  chip: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
    </svg>
  ),
  turbo: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
      <path d="M12 6v6l4 2"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  gears: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  shield: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  feather: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
      <line x1="16" y1="8" x2="2" y2="22"/>
      <line x1="17.5" y1="15" x2="9" y2="15"/>
    </svg>
  ),
  engine: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="10" rx="2"/>
      <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
      <path d="M9 12h6"/>
      <path d="M12 12v3"/>
    </svg>
  ),
  chevronRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  dollar: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  clock: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  wrench: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  close: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// Icon map for category icons
const iconMap = {
  bolt: Icons.bolt,
  sound: Icons.sound,
  car: Icons.car,
  brake: Icons.brake,
  tire: Icons.tire,
  thermometer: Icons.thermometer,
  wind: Icons.wind,
  chip: Icons.chip,
  turbo: Icons.turbo,
  gears: Icons.gears,
  shield: Icons.shield,
  feather: Icons.feather,
  engine: Icons.engine,
};

/**
 * Single upgrade card in the list
 */
function UpgradeCard({ upgrade, onClick }) {
  return (
    <button className={styles.upgradeCard} onClick={() => onClick(upgrade)}>
      <div className={styles.cardHeader}>
        <h4 className={styles.cardTitle}>{upgrade.name}</h4>
        <span className={styles.cardCost}>{upgrade.cost.range}</span>
      </div>
      <p className={styles.cardDescription}>{upgrade.shortDescription}</p>
      <div className={styles.cardMeta}>
        <span className={styles.cardDifficulty}>
          <Icons.wrench size={12} />
          {upgrade.difficulty}
        </span>
        <span className={styles.cardArrow}>
          Learn more <Icons.chevronRight size={14} />
        </span>
      </div>
    </button>
  );
}

/**
 * Detailed upgrade modal/panel
 */
function UpgradeDetail({ upgrade, onClose }) {
  if (!upgrade) return null;

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailPanel} onClick={e => e.stopPropagation()}>
        <button className={styles.detailClose} onClick={onClose}>
          <Icons.close size={24} />
        </button>

        <div className={styles.detailHeader}>
          <h2 className={styles.detailTitle}>{upgrade.name}</h2>
          <div className={styles.detailMeta}>
            <span className={styles.detailCost}>
              <Icons.dollar size={16} />
              {upgrade.cost.range}
            </span>
            <span className={styles.detailDifficulty}>
              <Icons.wrench size={16} />
              {upgrade.difficulty}
            </span>
            {upgrade.installTime && (
              <span className={styles.detailTime}>
                <Icons.clock size={16} />
                {upgrade.installTime}
              </span>
            )}
          </div>
        </div>

        <div className={styles.detailBody}>
          {/* What It Is */}
          <section className={styles.detailSection}>
            <h3>What It Is</h3>
            <p>{upgrade.fullDescription}</p>
          </section>

          {/* How It Works */}
          {upgrade.howItWorks && (
            <section className={styles.detailSection}>
              <h3>How It Works</h3>
              <p>{upgrade.howItWorks}</p>
            </section>
          )}

          {/* Expected Gains */}
          <section className={styles.detailSection}>
            <h3>Expected Gains</h3>
            <div className={styles.gainsGrid}>
              {upgrade.expectedGains.hp && (
                <div className={styles.gainItem}>
                  <span className={styles.gainLabel}>Power</span>
                  <span className={styles.gainValue}>{upgrade.expectedGains.hp}</span>
                </div>
              )}
              {upgrade.expectedGains.torque && (
                <div className={styles.gainItem}>
                  <span className={styles.gainLabel}>Torque</span>
                  <span className={styles.gainValue}>{upgrade.expectedGains.torque}</span>
                </div>
              )}
              {upgrade.expectedGains.handling && (
                <div className={styles.gainItem}>
                  <span className={styles.gainLabel}>Handling</span>
                  <span className={styles.gainValue}>{upgrade.expectedGains.handling}</span>
                </div>
              )}
              {upgrade.expectedGains.grip && (
                <div className={styles.gainItem}>
                  <span className={styles.gainLabel}>Grip</span>
                  <span className={styles.gainValue}>{upgrade.expectedGains.grip}</span>
                </div>
              )}
              {upgrade.expectedGains.stopping && (
                <div className={styles.gainItem}>
                  <span className={styles.gainLabel}>Stopping</span>
                  <span className={styles.gainValue}>{upgrade.expectedGains.stopping}</span>
                </div>
              )}
            </div>
            {upgrade.expectedGains.note && (
              <p className={styles.gainNote}>{upgrade.expectedGains.note}</p>
            )}
          </section>

          {/* Pros & Cons */}
          <section className={styles.detailSection}>
            <div className={styles.prosConsGrid}>
              <div className={styles.prosColumn}>
                <h4><Icons.check size={16} /> Pros</h4>
                <ul>
                  {upgrade.pros.map((pro, i) => (
                    <li key={i}>{pro}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.consColumn}>
                <h4><Icons.x size={16} /> Cons</h4>
                <ul>
                  {upgrade.cons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Best For */}
          <section className={styles.detailSection}>
            <h3>Best For</h3>
            <div className={styles.tagList}>
              {upgrade.bestFor.map((item, i) => (
                <span key={i} className={styles.tag}>{item}</span>
              ))}
            </div>
          </section>

          {/* Works Well With */}
          {upgrade.worksWellWith && (
            <section className={styles.detailSection}>
              <h3>Works Well With</h3>
              <div className={styles.tagList}>
                {upgrade.worksWellWith.map((item, i) => (
                  <span key={i} className={styles.tagSecondary}>{item}</span>
                ))}
              </div>
            </section>
          )}

          {/* Considerations */}
          {upgrade.considerations && (
            <section className={styles.detailSection}>
              <h3>Important Considerations</h3>
              <p className={styles.considerations}>{upgrade.considerations}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Upgrade Guide component
 */
export default function UpgradeGuide() {
  const [selectedCategory, setSelectedCategory] = useState('power');
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);

  const groupedUpgrades = useMemo(() => getAllUpgradesGrouped(), []);
  const currentCategory = groupedUpgrades[selectedCategory];

  return (
    <div className={styles.guide}>
      {/* Header */}
      <div className={styles.guideHeader}>
        <h2 className={styles.guideTitle}>Upgrade Encyclopedia</h2>
        <p className={styles.guideSubtitle}>
          Learn about common performance modifications, what they do, and whether they're right for your build.
        </p>
      </div>

      {/* Category Tabs */}
      <div className={styles.categoryTabs}>
        {Object.values(upgradeCategories).map(cat => {
          const IconComponent = iconMap[cat.icon] || Icons.bolt;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              className={`${styles.categoryTab} ${isActive ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <span className={styles.tabIcon}>
                <IconComponent size={18} />
              </span>
              <span className={styles.tabLabel}>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Category Content */}
      <div className={styles.categoryContent}>
        <div className={styles.categoryHeader}>
          <h3 className={styles.categoryTitle}>{currentCategory.name}</h3>
          <p className={styles.categoryDescription}>{currentCategory.description}</p>
        </div>

        <div className={styles.upgradesGrid}>
          {currentCategory.upgrades.map(upgrade => (
            <UpgradeCard
              key={upgrade.key}
              upgrade={upgrade}
              onClick={setSelectedUpgrade}
            />
          ))}
        </div>

        {currentCategory.upgrades.length === 0 && (
          <div className={styles.emptyState}>
            <p>No upgrades in this category yet. Check back soon!</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedUpgrade && (
        <UpgradeDetail
          upgrade={selectedUpgrade}
          onClose={() => setSelectedUpgrade(null)}
        />
      )}
    </div>
  );
}

