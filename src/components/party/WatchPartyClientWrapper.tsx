'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/siteConfig';

const WatchPartyView = dynamic(() => import('@/components/party/WatchPartyView'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#07070a] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <Loader2
        className="w-10 h-10 animate-spin"
        style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
      />
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white tracking-tight">Connecting to Watch Party...</h2>
        <p className="text-xs text-slate-400">Loading synchronized media room and live chat</p>
      </div>
    </div>
  ),
});

export default function WatchPartyClientWrapper({ roomId }: { roomId: string }) {
  return <WatchPartyView roomId={roomId} />;
}

