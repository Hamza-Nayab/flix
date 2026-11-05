import React from 'react';

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Reusable JSON-LD Structured Data Injector for Google Rich Snippets
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
