import { useEffect } from 'react';
import ColorThief from 'color-thief-browser';
import { usePlayerStore } from '../store/playerStore';

function hashColor(str: string): string {
  const h = str.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${h}, 55%, 55%)`;
}

export function useAccentColor() {
  const thumbnail = usePlayerStore(s => s.track?.thumbnail);
  const videoId = usePlayerStore(s => s.track?.videoId);
  const setAccentColor = usePlayerStore(s => s.setAccentColor);

  useEffect(() => {
    if (!thumbnail) return;

    // Try to extract real color — will fail silently if CORS blocks canvas read
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const rgb = new ColorThief().getColor(img);
        if (rgb) {
          const color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
          setAccentColor(color);
          document.documentElement.style.setProperty('--acc', color);
          return;
        }
      } catch { /* CORS blocked — use hash fallback */ }

      const color = hashColor(videoId ?? thumbnail);
      setAccentColor(color);
      document.documentElement.style.setProperty('--acc', color);
    };

    img.onerror = () => {
      const color = hashColor(videoId ?? thumbnail);
      setAccentColor(color);
      document.documentElement.style.setProperty('--acc', color);
    };

    img.src = thumbnail;
  }, [thumbnail, videoId, setAccentColor]);
}