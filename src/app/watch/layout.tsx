import React from 'react';
import TabInterceptor from '@/components/player/TabInterceptor';

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TabInterceptor />
      {children}
    </>
  );
}

