import { ImageResponse } from 'next/og';
import { SITE_CONFIG } from '@/lib/siteConfig';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: '40px',
        }}
      >
        <svg
          width="110"
          height="110"
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
