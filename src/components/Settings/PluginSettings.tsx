import React, { useState } from 'react';
import { Settings, Copy, Check, Terminal, Database, HelpCircle, Sparkles, Code2, Maximize2 } from 'lucide-react';
import { api } from '../../api/client';

export const PluginSettings: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const siteUrl = api.getSiteUrl();
  const isWp = api.isWordPress();

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#22d3ee]" />
          WordPress Plugin Settings & Embeds
        </h1>
        <p className="text-sm text-[#9fa0aa] mt-1">
          Configure redirect rules, manage shortcodes, and view database integration details.
        </p>
      </div>

      {/* Environment Status Card */}
      <div className="bg-[#0b0c0e] rounded-2xl p-6 border border-[#23252d] shadow-xs">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Environment Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#101115] rounded-xl border border-[#23252d]">
            <span className="text-[#9fa0aa] font-semibold block uppercase">Mode</span>
            <span className="text-white font-bold text-sm mt-0.5 block">
              {isWp ? 'WordPress Admin Mode' : 'Standalone / Vite Preview Mode'}
            </span>
          </div>
          <div className="p-3 bg-[#101115] rounded-xl border border-[#23252d]">
            <span className="text-[#9fa0aa] font-semibold block uppercase">Shortlink Prefix</span>
            <span className="text-[#22d3ee] font-bold text-sm mt-0.5 block">/q/{"{slug}"}</span>
          </div>
          <div className="p-3 bg-[#101115] rounded-xl border border-[#23252d]">
            <span className="text-[#9fa0aa] font-semibold block uppercase">Site URL</span>
            <span className="text-white font-bold text-sm mt-0.5 block truncate">{siteUrl}</span>
          </div>
        </div>
      </div>

      {/* WordPress Shortcodes with Takeover Information */}
      <div className="bg-[#0b0c0e] rounded-2xl p-6 border border-[#23252d] shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#22d3ee]" />
            Frontend Embedding Shortcodes (Full-Page Takeover)
          </h3>
          <p className="text-xs text-[#9fa0aa] mt-1">
            Shortcodes automatically take over the full viewport, bypassing theme headers, footers, and margins for an immersive app experience.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-[#101115] rounded-xl border border-[#23252d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#22d3ee]">[qr_generator]</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full font-semibold">
                  Full Page Takeover
                </span>
              </div>
              <p className="text-xs text-[#9fa0aa] mt-0.5">
                Embeds the visual QR Designer. Takes over the whole page (or use <code className="text-slate-300">takeover="false"</code> for inline).
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('[qr_generator]', 'gen')}
              className="px-3 py-1.5 bg-[#16171c] hover:bg-[#23252d] border border-[#23252d] rounded-lg text-xs font-semibold text-[#ccccd2] hover:text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
            >
              {copiedKey === 'gen' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'gen' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="p-4 bg-[#101115] rounded-xl border border-[#23252d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#22d3ee]">[qr_analytics]</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full font-semibold">
                  Full Page Takeover
                </span>
              </div>
              <p className="text-xs text-[#9fa0aa] mt-0.5">
                Embeds the Scan Analytics Dashboard directly on any frontend page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('[qr_analytics]', 'ana')}
              className="px-3 py-1.5 bg-[#16171c] hover:bg-[#23252d] border border-[#23252d] rounded-lg text-xs font-semibold text-[#ccccd2] hover:text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
            >
              {copiedKey === 'ana' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'ana' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Build & Deploy Instructions */}
      <div className="bg-[#0b0c0e] text-white rounded-2xl p-6 border border-[#23252d] shadow-sm space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#22d3ee]" />
          Building for WordPress Production
        </h3>
        <p className="text-xs text-[#9fa0aa] leading-relaxed">
          The Vite compiler compiles minified, optimized production bundles straight into the plugin's <code className="text-[#22d3ee] font-mono">dist/assets</code> directory.
        </p>
        <div className="p-3 bg-[#060708] rounded-xl font-mono text-xs text-emerald-400 border border-[#23252d]">
          python make_zip.py --rebuild
        </div>
        <p className="text-[11px] text-[#6f707f]">
          This runs Vite build and produces <code className="text-white">qr-wp-plugin.zip</code> with all offline assets, ready to upload directly to WordPress.
        </p>
      </div>
    </div>
  );
};
