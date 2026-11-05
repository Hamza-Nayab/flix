import { ImageResponse } from 'next/og';
import { SITE_CONFIG } from '@/lib/siteConfig';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Dynamic Favicon Generator matching the tenant brand & primary color
export default function Icon() {
  const primaryColor = SITE_CONFIG.PRIMARY_COLOR;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${primaryColor}, #09090b)`,
          borderRadius: '8px',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" fill="#ffffff" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
