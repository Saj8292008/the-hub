/**
 * Lazy Loading Image Component
 * Optimized image loading with intersection observer
 */

import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3C/svg%3E',
  threshold = 0.1,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      className={`${className} ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-300`}
      width={width}
      height={height}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      style={
        hasError
          ? { background: '#374151' }
          : {}
      }
    />
  );
}

/**
 * Responsive Image Component with srcset
 */
interface ResponsiveImageProps extends LazyImageProps {
  srcSet?: string;
  sizes?: string;
}

export function ResponsiveImage({
  src,
  srcSet,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  alt,
  className = '',
  width,
  height,
  onLoad,
  onError
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <picture>
      {/* WebP version if available */}
      {srcSet && (
        <source
          srcSet={srcSet.replace(/\.(jpg|jpeg|png)/gi, '.webp')}
          type="image/webp"
          sizes={sizes}
        />
      )}

      {/* Fallback */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={`${className} ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        style={
          hasError
            ? { background: '#374151' }
            : {}
        }
      />
    </picture>
  );
}

/**
 * Image with blur-up placeholder
 */
interface BlurImageProps extends LazyImageProps {
  blurDataURL?: string;
}

export function BlurImage({
  src,
  alt,
  className = '',
  width,
  height,
  blurDataURL,
  onLoad,
  onError
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      {/* Blur placeholder */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full scale-110 blur-2xl"
          aria-hidden="true"
        />
      )}

      {/* Actual image */}
      <LazyImage
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={onError}
      />
    </div>
  );
}
