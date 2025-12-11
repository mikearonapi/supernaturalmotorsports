'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';

// Icons
const Icons = {
  user: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  mail: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  settings: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  calendar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  creditCard: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  crown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
  ),
  shield: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  bell: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  trash: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  externalLink: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
};

// Subscription plans configuration
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Browse car catalog',
      'Use car selector',
      'View performance specs',
      'Read education content',
      'Save up to 5 favorites',
    ],
    limits: {
      favorites: 5,
      builds: 0,
      compare: 2,
    },
  },
  enthusiast: {
    id: 'enthusiast',
    name: 'Enthusiast',
    price: 9.99,
    features: [
      'Everything in Free',
      'Unlimited favorites',
      'Save up to 10 builds',
      'Compare up to 5 cars',
      'AI Mechanic assistant',
      'Priority support',
    ],
    limits: {
      favorites: -1,
      builds: 10,
      compare: 5,
    },
    popular: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    features: [
      'Everything in Enthusiast',
      'Unlimited saved builds',
      'Unlimited comparisons',
      'VIN decoder access',
      'Maintenance tracking',
      'Export data',
      'Early access to new features',
    ],
    limits: {
      favorites: -1,
      builds: -1,
      compare: -1,
    },
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const { count: favoritesCount } = useFavorites();
  const { builds } = useSavedBuilds();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    maintenance: true,
    newsletter: false,
  });

  // Current plan (mock - would come from backend)
  const currentPlan = profile?.subscription_tier || 'free';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/garage');
    }
  }, [isLoading, isAuthenticated, router]);

  // Initialize display name from profile
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    } else if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
    }
  }, [profile, user]);

  // Handle profile update
  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    const { error } = await updateProfile({ display_name: displayName.trim() });
    
    setIsSaving(false);
    
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Not authenticated (should redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = (displayName || user?.email || 'U').charAt(0).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Icons.user },
    { id: 'subscription', label: 'Subscription', icon: Icons.crown },
    { id: 'billing', label: 'Billing', icon: Icons.creditCard },
    { id: 'notifications', label: 'Notifications', icon: Icons.bell },
    { id: 'security', label: 'Security', icon: Icons.shield },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back Link */}
        <Link href="/garage" className={styles.backLink}>
          <Icons.arrowLeft size={18} />
          Back to Garage
        </Link>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.avatar}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName || 'Profile'}
                width={80}
                height={80}
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarInitials}>{initials}</span>
            )}
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{displayName || 'Your Account'}</h1>
            <p className={styles.email}>
              <Icons.mail size={16} />
              {user.email}
            </p>
            <div className={styles.headerMeta}>
              <span className={styles.memberSince}>
                <Icons.calendar size={14} />
                Member since {memberSince}
              </span>
              <span className={styles.planBadge} data-plan={currentPlan}>
                <Icons.crown size={14} />
                {PLANS[currentPlan]?.name || 'Free'} Plan
              </span>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <Icons.heart size={24} />
            <div className={styles.statValue}>{favoritesCount}</div>
            <div className={styles.statLabel}>Favorites</div>
          </div>
          <div className={styles.statCard}>
            <Icons.wrench size={24} />
            <div className={styles.statValue}>{builds.length}</div>
            <div className={styles.statLabel}>Saved Builds</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <nav className={styles.tabs}>
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <TabIcon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icons.user size={20} />
                Profile Information
              </h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="displayName" className={styles.label}>
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  className={styles.input}
                  disabled
                />
                <p className={styles.inputHint}>
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className={styles.saveButton}
              >
                {saveSuccess ? (
                  <>
                    <Icons.check size={18} />
                    Saved!
                  </>
                ) : isSaving ? (
                  'Saving...'
                ) : (
                  'Save Changes'
                )}
              </button>
            </section>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icons.crown size={20} />
                Subscription Plans
              </h2>
              
              <p className={styles.sectionDescription}>
                Choose the plan that fits your automotive journey. Upgrade anytime to unlock more features.
              </p>

              <div className={styles.plansGrid}>
                {Object.values(PLANS).map(plan => (
                  <div 
                    key={plan.id} 
                    className={`${styles.planCard} ${currentPlan === plan.id ? styles.planCardCurrent : ''} ${plan.popular ? styles.planCardPopular : ''}`}
                  >
                    {plan.popular && <span className={styles.popularBadge}>Most Popular</span>}
                    {currentPlan === plan.id && <span className={styles.currentBadge}>Current Plan</span>}
                    
                    <h3 className={styles.planName}>{plan.name}</h3>
                    <div className={styles.planPrice}>
                      <span className={styles.planAmount}>${plan.price}</span>
                      {plan.price > 0 && <span className={styles.planPeriod}>/month</span>}
                    </div>
                    
                    <ul className={styles.planFeatures}>
                      {plan.features.map((feature, i) => (
                        <li key={i}>
                          <Icons.check size={16} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {currentPlan === plan.id ? (
                      <button className={styles.planButtonCurrent} disabled>
                        Current Plan
                      </button>
                    ) : plan.price > PLANS[currentPlan]?.price ? (
                      <button className={styles.planButtonUpgrade}>
                        Upgrade to {plan.name}
                      </button>
                    ) : (
                      <button className={styles.planButtonDowngrade}>
                        Downgrade
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icons.creditCard size={20} />
                Billing & Payment
              </h2>

              {currentPlan === 'free' ? (
                <div className={styles.emptyState}>
                  <Icons.creditCard size={48} />
                  <h3>No Payment Method</h3>
                  <p>You&apos;re on the free plan. Upgrade to add a payment method and unlock premium features.</p>
                  <button 
                    className={styles.upgradeButton}
                    onClick={() => setActiveTab('subscription')}
                  >
                    View Plans
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.billingCard}>
                    <div className={styles.billingInfo}>
                      <h3>Payment Method</h3>
                      <p className={styles.cardDisplay}>
                        <Icons.creditCard size={20} />
                        •••• •••• •••• 4242
                      </p>
                      <p className={styles.cardExpiry}>Expires 12/2025</p>
                    </div>
                    <button className={styles.updateButton}>
                      Update
                    </button>
                  </div>

                  <div className={styles.billingCard}>
                    <div className={styles.billingInfo}>
                      <h3>Next Billing Date</h3>
                      <p className={styles.billingDate}>January 1, 2026</p>
                      <p className={styles.billingAmount}>${PLANS[currentPlan]?.price}/month</p>
                    </div>
                  </div>

                  <div className={styles.billingHistory}>
                    <h3>Billing History</h3>
                    <div className={styles.invoiceList}>
                      <div className={styles.invoiceItem}>
                        <span className={styles.invoiceDate}>Dec 1, 2025</span>
                        <span className={styles.invoiceAmount}>${PLANS[currentPlan]?.price}</span>
                        <span className={styles.invoiceStatus}>Paid</span>
                        <button className={styles.invoiceLink}>
                          <Icons.externalLink size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icons.bell size={20} />
                Notification Preferences
              </h2>

              <div className={styles.notificationSettings}>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <h4>Email Notifications</h4>
                    <p>Receive updates about your garage activity</p>
                  </div>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={notifications.email}
                      onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <h4>Maintenance Reminders</h4>
                    <p>Get notified about upcoming maintenance for your vehicles</p>
                  </div>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={notifications.maintenance}
                      onChange={(e) => setNotifications({...notifications, maintenance: e.target.checked})}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <h4>Newsletter</h4>
                    <p>Receive our monthly newsletter with car news and tips</p>
                  </div>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={notifications.newsletter}
                      onChange={(e) => setNotifications({...notifications, newsletter: e.target.checked})}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icons.shield size={20} />
                Security & Privacy
              </h2>

              <div className={styles.securityItem}>
                <div className={styles.securityInfo}>
                  <h4>Connected Accounts</h4>
                  <p>Manage your social login connections</p>
                </div>
                <div className={styles.connectedAccounts}>
                  {user?.app_metadata?.provider === 'google' && (
                    <div className={styles.connectedAccount}>
                      <span>Google</span>
                      <span className={styles.connectedBadge}>Connected</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.securityItem}>
                <div className={styles.securityInfo}>
                  <h4>Export Data</h4>
                  <p>Download all your data including favorites, builds, and settings</p>
                </div>
                <button className={styles.secondaryButton}>
                  Export Data
                </button>
              </div>

              <div className={styles.dangerZone}>
                <h3>Danger Zone</h3>
                <div className={styles.dangerActions}>
                  <button onClick={handleSignOut} className={styles.signOutButton}>
                    <Icons.logout size={18} />
                    Sign Out
                  </button>
                  <button className={styles.deleteButton}>
                    <Icons.trash size={18} />
                    Delete Account
                  </button>
                </div>
                <p className={styles.dangerNote}>
                  Account deletion is permanent and cannot be undone.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
