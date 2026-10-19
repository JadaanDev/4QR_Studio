import React, { useState } from 'react';
import { Settings, Copy, Check, Terminal, Database, HelpCircle, Sparkles, Code2 } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          WordPress Plugin Settings & Embeds
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure redirect rules, manage shortcodes, and view database integration details.
        </p>
      </div>

      {/* Environment Status Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          Environment Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase">Mode</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5 block">
              {isWp ? 'WordPress Admin Mode' : 'Standalone / Vite Preview Mode'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase">Shortlink Prefix</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5 block">/q/{"{slug}"}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-semibold block uppercase">Site URL</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5 block truncate">{siteUrl}</span>
          </div>
        </div>
      </div>

      {/* WordPress Shortcodes */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            Frontend Embedding Shortcodes
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Paste these shortcodes into any WordPress page, post, or block editor to embed the QR tools.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-mono text-sm font-bold text-slate-900">[qr_generator]</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Embeds the interactive QR code designer on any frontend page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('[qr_generator]', 'gen')}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
            >
              {copiedKey === 'gen' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'gen' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-mono text-sm font-bold text-slate-900">[qr_analytics]</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Embeds the scan analytics dashboard for logged-in members or admins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('[qr_analytics]', 'ana')}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
            >
              {copiedKey === 'ana' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'ana' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Build & Deploy Instructions */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          Building for WordPress Production
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The Vite compiler outputs minified, optimized production bundles straight into the WordPress plugin's <code className="text-blue-300 font-mono">dist/assets</code> directory.
        </p>
        <div className="p-3 bg-black/40 rounded-xl font-mono text-xs text-emerald-400 border border-white/10">
          npm run build
        </div>
        <p className="text-[11px] text-slate-400">
          Once built, copy or keep the <code className="text-white">qr-wp-plugin</code> folder inside your WordPress <code className="text-white">wp-content/plugins/</code> directory and activate it from WP-Admin Plugins menu!
        </p>
      </div>
    </div>
  );
};
