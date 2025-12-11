'use client';

/**
 * Video Embed Component
 * 
 * Lazy-loading YouTube video embed with thumbnail preview.
 * Improves page performance by only loading the iframe when clicked.
 * 
 * @module components/VideoEmbed
 */

import { useState } from 'react';
import Image from 'next/image';
import styles from './VideoEmbed.module.css';

// Icons
const Icons = {
  play: ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
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

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url 
 * @returns {string|null}
 */
function extractYouTubeId(url) {
  if (!url) return null;
  
  // Already just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Get YouTube thumbnail URL
 * @param {string} videoId 
 * @param {'default'|'hq'|'mq'|'sd'|'maxres'} quality 
 * @returns {string}
 */
function getYouTubeThumbnail(videoId, quality = 'hq') {
  const qualityMap = {
    default: 'default',
    mq: 'mqdefault',
    hq: 'hqdefault',
    sd: 'sddefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Video Embed Component
 * 
 * @param {Object} props
 * @param {string} props.videoId - YouTube video ID or URL
 * @param {string} [props.title] - Video title for accessibility
 * @param {string} [props.channelName] - Channel name to display
 * @param {'16:9'|'4:3'} [props.aspectRatio='16:9'] - Video aspect ratio
 * @param {boolean} [props.autoplay=true] - Autoplay when loaded
 * @param {string} [props.className] - Additional CSS class
 */
export default function VideoEmbed({
  videoId,
  title = 'Video',
  channelName,
  aspectRatio = '16:9',
  autoplay = true,
  className = '',
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const id = extractYouTubeId(videoId);
  
  if (!id) {
    return (
      <div className={`${styles.error} ${className}`}>
        <p>Invalid video URL</p>
      </div>
    );
  }

  const thumbnailUrl = getYouTubeThumbnail(id, 'hq');
  const embedUrl = `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&rel=0`;

  return (
    <div 
      className={`${styles.container} ${className}`}
      data-aspect={aspectRatio}
    >
      {!isLoaded ? (
        <button 
          className={styles.thumbnail}
          onClick={() => setIsLoaded(true)}
          aria-label={`Play video: ${title}`}
        >
          <Image
            src={thumbnailUrl}
            alt={`Thumbnail for ${title}`}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className={styles.thumbnailImage}
          />
          <div className={styles.playButton}>
            <Icons.play size={48} />
          </div>
          {channelName && (
            <div className={styles.channelBadge}>
              {channelName}
            </div>
          )}
        </button>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          className={styles.iframe}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}

/**
 * Video Grid - Display multiple videos
 * 
 * @param {Object} props
 * @param {Array<{videoId: string, title: string, channelName?: string}>} props.videos
 * @param {string} [props.className]
 */
export function VideoGrid({ videos, className = '' }) {
  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.grid} ${className}`}>
      {videos.map((video, index) => (
        <VideoEmbed
          key={video.videoId || index}
          videoId={video.videoId}
          title={video.title}
          channelName={video.channelName}
        />
      ))}
    </div>
  );
}

/**
 * Video Card - Compact video with metadata
 */
export function VideoCard({
  videoId,
  title,
  channelName,
  duration,
  className = '',
}) {
  const id = extractYouTubeId(videoId);
  const thumbnailUrl = id ? getYouTubeThumbnail(id, 'mq') : '';
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;

  return (
    <a 
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.card} ${className}`}
    >
      <div className={styles.cardThumbnail}>
        {thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt={`Thumbnail for ${title}`}
            fill
            sizes="200px"
            className={styles.cardImage}
          />
        )}
        <div className={styles.cardPlayOverlay}>
          <Icons.play size={32} />
        </div>
        {duration && (
          <span className={styles.cardDuration}>{duration}</span>
        )}
      </div>
      <div className={styles.cardContent}>
        <h4 className={styles.cardTitle}>{title}</h4>
        {channelName && (
          <span className={styles.cardChannel}>{channelName}</span>
        )}
      </div>
      <Icons.externalLink size={14} className={styles.cardExternal} />
    </a>
  );
}
