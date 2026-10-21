import React from 'react';
import { Settings, Database, Link2, Info } from 'lucide-react';
import { api } from '../../api/client';

export const PluginSettings: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-6">
    <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Settings className="w-6 h-6 text-[#22d3ee]" />Settings & Help</h1>
    <p className="text-sm text-[#9fa0aa]">4QR Studio 1.1.0 runs inside your WordPress admin dashboard.</p>
    <section className="bg-[#0b0c0e] rounded-2xl p-6 border border-[#23252d] space-y-3">
      <h2 className="text-lg font-bold text-white flex items-center gap-2"><Database className="w-5 h-5" />Environment</h2>
      <p className="text-sm text-[#9fa0aa]">{api.isWordPress() ? 'WordPress admin: codes and scans are stored in your site database.' : 'Development preview: sample codes are stored in this browser only. Public redirects require WordPress.'}</p>
      <p className="text-sm text-[#22d3ee] break-all">Site: {api.getSiteUrl()}</p>
    </section>
    <section className="bg-[#0b0c0e] rounded-2xl p-6 border border-[#23252d] space-y-3">
      <h2 className="text-lg font-bold text-white flex items-center gap-2"><Link2 className="w-5 h-5" />Editing your QR Code Link</h2>
      <ol className="list-decimal pl-5 space-y-2 text-sm text-[#9fa0aa]">
        <li>Open a code in My Codes, then edit the QR Code Link suffix in the designer.</li>
        <li>Use 1–64 letters, numbers, hyphens or underscores. Each link must be unique.</li>
        <li>Save, then download the updated QR. A renamed link replaces the previous link.</li>
      </ol>
      <p className="text-sm text-amber-200">For QRs already in print, edit Destination URL only. This keeps the existing QR working.</p>
    </section>
    <section className="bg-[#0b0c0e] rounded-2xl p-6 border border-[#23252d] space-y-3">
      <h2 className="text-lg font-bold text-white flex items-center gap-2"><Info className="w-5 h-5" />Access & Analytics</h2>
      <p className="text-sm text-[#9fa0aa]">Users who can edit posts can manage all codes and analytics. Public visitors can follow saved QR links without signing in.</p>
      <p className="text-sm text-[#9fa0aa]">Dynamic mode records visits before redirecting. Direct mode embeds the destination and bypasses tracking. Analytics refreshes when opened or when you click Refresh; CSV includes up to 50 recent visits.</p>
    </section>
  </div>
);
