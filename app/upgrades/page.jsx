import { redirect } from 'next/navigation';

// Redirect /upgrades to /performance (Performance HUB)
// This page is deprecated - upgrade planning is now part of the Performance HUB

export const metadata = {
  title: 'Redirecting to Performance HUB',
  description: 'Upgrade planning is now part of the Performance HUB.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function UpgradesRedirect() {
  redirect('/performance');
}
