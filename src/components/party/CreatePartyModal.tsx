'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Users, X, Sparkles, Loader2, Link2, ShieldAlert } from 'lucide-react';
import { PartyMedia } from '@/lib/partyStore';
import { getTMDBImageUrl } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface CreatePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: PartyMedia;
}

export default function CreatePartyModal({ isOpen, onClose, media }: CreatePartyModalProps) {
  const router = useRouter();
  const [hostName, setHostName] = useState('Host');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media,
          hostName: hostName.trim() || 'Host',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create watch party');
      }

      const data = await res.json();
      if (data.success && data.roomId && data.hostToken) {
        // Store host token in sessionStorage so host identity is recognized
        sessionStorage.setItem(`roseflix_party_host_${data.roomId}`, data.hostToken);
        sessionStorage.setItem(`roseflix_party_name`, hostName.trim() || 'Host');

        onClose();
        router.push(`/party/${data.roomId}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong creating the room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#0e0e13] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-7 z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
                color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
              }}
            >
              <Users className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Watch Together</h3>
              <p className="text-xs" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>Generate a temporary sync room</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Card */}
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#14141c] border border-white/5">
          <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-800">
            {media.backdropPath && (
              <Image
                src={getTMDBImageUrl(media.backdropPath, 'w300')}
                alt={media.title}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>
              {media.type === 'movie' ? 'Movie' : `Season ${media.season} Episode ${media.episode}`}
            </span>
            <h4 className="text-sm font-semibold text-white truncate">{media.title}</h4>
            <p className="text-xs text-slate-400 mt-0.5">Stream ready on fast servers</p>
          </div>
        </div>

        {/* Input Name */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Your Nickname (No login required)
          </label>
          <input
            type="text"
            value={hostName}
            maxLength={25}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="e.g. Alex, CinemaFan"
            className="w-full px-4 py-3 rounded-xl bg-[#14141c] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none transition-colors"
            style={{ outlineColor: SITE_CONFIG.PRIMARY_COLOR }}
          />
        </div>

        {/* Temporary Room Rule Notice */}
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl bg-[#191116] text-xs text-slate-300 border"
          style={{ borderColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.3)` }}
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
          <p className="leading-relaxed">
            <strong className="text-white">Host Session Rule:</strong> This link is temporary and requires zero login. When you (the creator) leave the party or close the page, the room automatically expires for all friends.
          </p>
        </div>

        {error && (
          <p className="text-xs bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 text-red-400">
            {error}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
              boxShadow: `0 0 20px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
            }}
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Room...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Create Temporary Room Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
