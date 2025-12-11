'use client';

/**
 * Saved Builds Provider
 * 
 * React Context provider for managing saved Performance HUB builds.
 * Requires authentication - builds are stored in Supabase.
 * 
 * @module components/providers/SavedBuildsProvider
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  fetchUserSavedBuilds,
  saveUserBuild,
  updateUserBuild,
  deleteUserBuild,
} from '@/lib/userDataService';

/**
 * @typedef {Object} SavedBuild
 * @property {string} id - Database ID
 * @property {string} carSlug - Car slug
 * @property {string} carName - Car display name
 * @property {string} name - Build name
 * @property {string[]} upgrades - Array of upgrade keys
 * @property {number} totalHpGain - Total HP gained
 * @property {number} totalCostLow - Low estimate cost
 * @property {number} totalCostHigh - High estimate cost
 * @property {number} [finalHp] - Final HP after upgrades
 * @property {string} [notes] - User notes
 * @property {boolean} isFavorite - Whether build is favorited
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} SavedBuildsContextValue
 * @property {SavedBuild[]} builds - Array of saved builds
 * @property {boolean} isLoading - Whether builds are loading
 * @property {boolean} canSave - Whether user can save builds (is authenticated)
 * @property {function(Object): Promise<Object>} saveBuild - Save a new build
 * @property {function(string, Object): Promise<Object>} updateBuild - Update a build
 * @property {function(string): Promise<Object>} deleteBuild - Delete a build
 * @property {function(string): SavedBuild|undefined} getBuildById - Get a build by ID
 * @property {function(string): SavedBuild[]} getBuildsByCarSlug - Get builds for a car
 * @property {function(): void} refreshBuilds - Refresh builds from server
 */

const SavedBuildsContext = createContext(null);

/**
 * Saved Builds Provider Component
 */
export function SavedBuildsProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [builds, setBuilds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch builds from Supabase
   */
  const fetchBuilds = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setBuilds([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await fetchUserSavedBuilds(user.id);
      
      if (error) {
        console.error('[SavedBuildsProvider] Error fetching builds:', error);
        setBuilds([]);
      } else if (data) {
        const transformedBuilds = data.map(build => ({
          id: build.id,
          carSlug: build.car_slug,
          carName: build.car_name,
          name: build.build_name,
          upgrades: build.selected_upgrades || [],
          totalHpGain: build.total_hp_gain || 0,
          totalCostLow: build.total_cost_low || 0,
          totalCostHigh: build.total_cost_high || 0,
          finalHp: build.final_hp,
          notes: build.notes,
          isFavorite: build.is_favorite || false,
          createdAt: build.created_at,
          updatedAt: build.updated_at,
        }));
        
        setBuilds(transformedBuilds);
      }
    } catch (err) {
      console.error('[SavedBuildsProvider] Unexpected error:', err);
      setBuilds([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Fetch builds when auth state changes
  useEffect(() => {
    if (authLoading) return;
    fetchBuilds();
  }, [fetchBuilds, authLoading]);

  /**
   * Save a new build
   */
  const saveBuild = useCallback(async (buildData) => {
    if (!isAuthenticated || !user?.id) {
      return { data: null, error: new Error('Must be signed in to save builds') };
    }

    setIsLoading(true);
    
    const { data, error } = await saveUserBuild(user.id, buildData);
    
    if (!error && data) {
      const newBuild = {
        id: data.id,
        carSlug: data.car_slug,
        carName: data.car_name,
        name: data.build_name,
        upgrades: data.selected_upgrades || [],
        totalHpGain: data.total_hp_gain || 0,
        totalCostLow: data.total_cost_low || 0,
        totalCostHigh: data.total_cost_high || 0,
        finalHp: data.final_hp,
        notes: data.notes,
        isFavorite: data.is_favorite || false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      setBuilds(prev => [newBuild, ...prev]);
    }
    
    setIsLoading(false);
    return { data, error };
  }, [isAuthenticated, user?.id]);

  /**
   * Update an existing build
   */
  const updateBuildHandler = useCallback(async (buildId, updates) => {
    if (!isAuthenticated || !user?.id) {
      return { data: null, error: new Error('Must be signed in') };
    }

    const { data, error } = await updateUserBuild(user.id, buildId, updates);
    
    if (!error && data) {
      setBuilds(prev => prev.map(build => {
        if (build.id === buildId) {
          return {
            ...build,
            name: data.build_name,
            upgrades: data.selected_upgrades || [],
            totalHpGain: data.total_hp_gain || 0,
            totalCostLow: data.total_cost_low || 0,
            totalCostHigh: data.total_cost_high || 0,
            finalHp: data.final_hp,
            notes: data.notes,
            isFavorite: data.is_favorite || false,
            updatedAt: data.updated_at,
          };
        }
        return build;
      }));
    }
    
    return { data, error };
  }, [isAuthenticated, user?.id]);

  /**
   * Delete a build
   */
  const deleteBuildHandler = useCallback(async (buildId) => {
    if (!isAuthenticated || !user?.id) {
      return { error: new Error('Must be signed in') };
    }

    const { error } = await deleteUserBuild(user.id, buildId);
    
    if (!error) {
      setBuilds(prev => prev.filter(build => build.id !== buildId));
    }
    
    return { error };
  }, [isAuthenticated, user?.id]);

  /**
   * Get a build by ID
   */
  const getBuildById = useCallback((buildId) => {
    return builds.find(build => build.id === buildId);
  }, [builds]);

  /**
   * Get builds for a specific car
   */
  const getBuildsByCarSlug = useCallback((carSlug) => {
    return builds.filter(build => build.carSlug === carSlug);
  }, [builds]);

  const value = {
    builds,
    isLoading,
    canSave: isAuthenticated,
    saveBuild,
    updateBuild: updateBuildHandler,
    deleteBuild: deleteBuildHandler,
    getBuildById,
    getBuildsByCarSlug,
    refreshBuilds: fetchBuilds,
  };

  return (
    <SavedBuildsContext.Provider value={value}>
      {children}
    </SavedBuildsContext.Provider>
  );
}

/**
 * Hook to access saved builds context
 * @returns {SavedBuildsContextValue}
 */
export function useSavedBuilds() {
  const context = useContext(SavedBuildsContext);
  
  if (!context) {
    throw new Error('useSavedBuilds must be used within a SavedBuildsProvider');
  }
  
  return context;
}

/**
 * Hook to get builds for a specific car
 * @param {string} carSlug 
 * @returns {SavedBuild[]}
 */
export function useCarBuilds(carSlug) {
  const { getBuildsByCarSlug } = useSavedBuilds();
  return getBuildsByCarSlug(carSlug);
}

/**
 * Hook to get build count
 * @returns {number}
 */
export function useSavedBuildCount() {
  const { builds } = useSavedBuilds();
  return builds.length;
}

export default SavedBuildsProvider;
