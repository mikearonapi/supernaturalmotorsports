'use client';

import { useState, useEffect } from 'react';
import styles from './UserStats.module.css';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { fetchUserActivityStats } from '@/lib/userDataService';

/**
 * Icons
 */
const Icons = {
  eye: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  compare: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  trophy: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  zap: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
};

/**
 * Fun achievement badges based on stats
 */
const getAchievements = (stats) => {
  const achievements = [];
  
  if (stats.carsViewed >= 10) {
    achievements.push({ id: 'explorer', label: 'Car Explorer', description: 'Viewed 10+ cars' });
  }
  if (stats.carsViewed >= 50) {
    achievements.push({ id: 'researcher', label: 'Researcher', description: 'Viewed 50+ cars' });
  }
  if (stats.carsFavorited >= 5) {
    achievements.push({ id: 'curator', label: 'Garage Curator', description: 'Favorited 5+ cars' });
  }
  if (stats.comparisons >= 3) {
    achievements.push({ id: 'analyst', label: 'Data Analyst', description: 'Made 3+ comparisons' });
  }
  if (stats.buildsSaved >= 3) {
    achievements.push({ id: 'builder', label: 'Build Master', description: 'Saved 3+ builds' });
  }
  
  return achievements;
};

/**
 * User Stats Component
 * Shows fun engagement metrics and achievements
 */
export default function UserStats({ compact = false }) {
  const { user, isAuthenticated } = useAuth();
  const { count: favoritesCount } = useFavorites();
  const { builds } = useSavedBuilds();
  const [activityStats, setActivityStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch activity stats when authenticated
  useEffect(() => {
    const fetchStats = async () => {
      if (isAuthenticated && user?.id) {
        setIsLoading(true);
        try {
          const { data } = await fetchUserActivityStats(user.id);
          setActivityStats(data);
        } catch (err) {
          console.error('[UserStats] Error fetching stats:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [isAuthenticated, user?.id]);

  // Combine local state with activity stats
  const stats = {
    carsViewed: activityStats?.carsViewed || 0,
    carsFavorited: favoritesCount,
    comparisons: activityStats?.comparisons || 0,
    buildsSaved: builds.length,
  };

  const achievements = getAchievements(stats);

  if (!isAuthenticated) {
    return null;
  }

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <div className={styles.compactStats}>
          <div className={styles.compactStat}>
            <Icons.eye size={16} />
            <span>{stats.carsViewed}</span>
          </div>
          <div className={styles.compactStat}>
            <Icons.heart size={16} />
            <span>{stats.carsFavorited}</span>
          </div>
          <div className={styles.compactStat}>
            <Icons.wrench size={16} />
            <span>{stats.buildsSaved}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <Icons.zap size={20} />
        Your Activity
      </h3>
      
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--stat-color': '#3498db' }}>
            <Icons.eye size={20} />
          </div>
          <div className={styles.statValue}>{stats.carsViewed}</div>
          <div className={styles.statLabel}>Cars Viewed</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--stat-color': '#e74c3c' }}>
            <Icons.heart size={20} />
          </div>
          <div className={styles.statValue}>{stats.carsFavorited}</div>
          <div className={styles.statLabel}>Favorites</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--stat-color': '#2ecc71' }}>
            <Icons.compare size={20} />
          </div>
          <div className={styles.statValue}>{stats.comparisons}</div>
          <div className={styles.statLabel}>Comparisons</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--stat-color': '#9b59b6' }}>
            <Icons.wrench size={20} />
          </div>
          <div className={styles.statValue}>{stats.buildsSaved}</div>
          <div className={styles.statLabel}>Builds Saved</div>
        </div>
      </div>
      
      {/* Achievements */}
      {achievements.length > 0 && (
        <div className={styles.achievements}>
          <h4 className={styles.achievementsTitle}>
            <Icons.trophy size={18} />
            Achievements
          </h4>
          <div className={styles.achievementsList}>
            {achievements.map(achievement => (
              <div key={achievement.id} className={styles.achievementBadge}>
                <span className={styles.achievementLabel}>{achievement.label}</span>
                <span className={styles.achievementDesc}>{achievement.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
