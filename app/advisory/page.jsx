import { redirect } from 'next/navigation';

// Redirect /advisory to /car-finder
// This ensures old links and bookmarks continue to work

export const metadata = {
  title: 'Redirecting to Car Finder',
  description: 'Redirecting to the Sports Car Finder tool.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function AdvisoryRedirect() {
  redirect('/car-finder');
}
