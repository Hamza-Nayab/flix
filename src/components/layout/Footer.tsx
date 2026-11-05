import React from 'react';
import Link from 'next/link';
import { PlayCircle, ShieldCheck, Heart } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/siteConfig';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const siteName = SITE_CONFIG.SITE_NAME;

  // Render stylized 2-tone logo text
  const midPoint = Math.ceil(siteName.length / 2);
  const part1 = siteName.slice(0, midPoint);
  const part2 = siteName.slice(midPoint);

  return (
    <footer className="border-t border-white/5 bg-[#050507] text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${SITE_CONFIG.PRIMARY_COLOR}, #09090b)`,
                  boxShadow: `0 0 15px ${SITE_CONFIG.PRIMARY_COLOR}66`,
                }}
              >
                <PlayCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                {part1}
                <span style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>{part2}</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Stream the latest movies, global TV series, anime, and Korean dramas in stunning full HD. Experience zero buffer streaming, rich curated collections, and instant multi-server playback.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">
                  Movies Catalog
                </Link>
              </li>
              <li>
                <Link href="/tv" className="hover:text-white transition-colors">
                  TV Series
                </Link>
              </li>
              <li>
                <Link href="/anime" className="hover:text-white transition-colors">
                  Anime Hub
                </Link>
              </li>
              <li>
                <Link href="/kdramas" className="hover:text-white transition-colors">
                  K-Dramas & Asian
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Trust */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Legal & DMCA</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                <span>DMCA Compliant</span>
              </li>
              <li className="text-[11px] text-slate-500 leading-normal">
                This site does not store files on any server. All contents are provided by non-affiliated third parties.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {currentYear} {siteName}. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <span>Crafted with</span>
            <Heart
              className="w-3.5 h-3.5"
              style={{ color: SITE_CONFIG.PRIMARY_COLOR, fill: SITE_CONFIG.PRIMARY_COLOR }}
            />
            <span>for cinema & drama fans</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
