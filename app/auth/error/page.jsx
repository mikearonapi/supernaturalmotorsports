'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'An unknown error occurred';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--color-gray-50)',
    }}>
      <div style={{
        maxWidth: '400px',
        padding: '2rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'var(--color-error-light)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--color-gray-900)',
          marginBottom: '0.5rem',
        }}>
          Authentication Error
        </h1>
        
        <p style={{
          color: 'var(--color-gray-600)',
          marginBottom: '1.5rem',
          lineHeight: '1.5',
        }}>
          {error}
        </p>
        
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link
            href="/garage"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--sn-primary)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}
          >
            Try Again
          </Link>
          <Link
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--color-gray-100)',
              color: 'var(--color-gray-700)',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.9rem',
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
