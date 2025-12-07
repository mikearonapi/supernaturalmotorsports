'use client';

/**
 * CarCarousel Component
 * 
 * An auto-scrolling carousel showcasing all 35 sports cars.
 * Creates an engaging visual experience as users scroll through the page.
 */

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { carData } from '@/data/cars.js';
import styles from './CarCarousel.module.css';

// Blob base URL for car images
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';

/**
 * Get car hero image URL
 */
function getCarImageUrl(slug) {
  return `${BLOB_BASE}/cars/${slug}/hero.webp`;
}

export default function CarCarousel() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Sort cars by tier for visual variety
  const sortedCars = [...carData].sort((a, b) => {
    const tierOrder = { premium: 0, 'upper-mid': 1, mid: 2, budget: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });
  
  // Duplicate cars for infinite scroll effect
  const displayCars = [...sortedCars, ...sortedCars];
  
  // Auto-scroll animation
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    
    let animationId;
    let scrollSpeed = 0.5; // pixels per frame
    
    const animate = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;
        
        // Reset scroll when we've scrolled through the first set
        const halfWidth = scrollContainer.scrollWidth / 2;
        if (scrollContainer.scrollLeft >= halfWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPaused]);
  
  return (
    <div 
      className={styles.carousel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.scrollContainer} ref={scrollRef}>
        {displayCars.map((car, index) => (
          <Link 
            key={`${car.slug}-${index}`}
            href={`/cars/${car.slug}`}
            className={styles.carCard}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={getCarImageUrl(car.slug)}
                alt={car.name}
                fill
                sizes="280px"
                className={styles.carImage}
                style={{ objectFit: 'cover' }}
              />
              <div className={styles.imageOverlay} />
            </div>
            <div className={styles.carInfo}>
              <span className={styles.carName}>{car.name}</span>
              <span className={styles.carMeta}>{car.priceRange}</span>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Gradient overlays for edge fade effect */}
      <div className={styles.gradientLeft} />
      <div className={styles.gradientRight} />
    </div>
  );
}

