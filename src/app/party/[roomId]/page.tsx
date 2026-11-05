import React from 'react';
import type { Metadata } from 'next';
import WatchPartyClientWrapper from '@/components/party/WatchPartyClientWrapper';

interface PartyPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: PartyPageProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Watch Together (Room ${roomId}) - RoseFlix`,
    description: 'Join a temporary synchronized watch party session on RoseFlix. No login required.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PartyRoomPage({ params }: PartyPageProps) {
  const { roomId } = await params;

  return <WatchPartyClientWrapper roomId={roomId} />;
}
