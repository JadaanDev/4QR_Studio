import React, { useState, useEffect } from 'react';
import {
  QrCode,
  BarChart3,
  List,
  Settings,
} from 'lucide-react';
import { QRCodeData } from './types';
import { api, getSiteBaseUrl, buildShortUrl } from './api/client';
import { QRDesigner } from './components/QRDesigner/QRDesigner';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { QRList } from './components/QRList/QRList';
import { PluginSettings } from './components/Settings/PluginSettings';

type ActiveTab = 'designer' | 'analytics' | 'codes' | 'settings';

function createBlankCode(): QRCodeData {
  const siteUrl = getSiteBaseUrl();
  const slug = Math.random().toString(36).substring(2, 8);
  return {
    slug,
    title: 'New QR Code',
    qr_type: 'website',
    target_url: siteUrl ? `${siteUrl}/` : '',
    short_url: buildShortUrl(slug),
    style_config: {
      pattern: 'classy',
      cornerSquare: 'leaf',
      cornerDot: 'teardrop',
      patternColor: '#522b2b',
      bgColor: '#000000',
      isTransparent: true,
      logoUrl: '',
      logoSize: 0.35,
      logoMargin: 6,
    },
  };
}

export const App: React.FC = () => {
  const getInitialTab = (): ActiveTab => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.includes('analytics')) return 'analytics';
    if (hash.includes('codes')) return 'codes';
    if (hash.includes('settings')) return 'settings';
    return 'designer';
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [codes, setCodes] = useState<QRCodeData[]>([]);
  const [selectedCode, setSelectedCode] = useState<QRCodeData>(createBlankCode);

  // Check URL hash for direct tab navigation (e.g. #/analytics or #/codes)
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash;
      if (h.includes('analytics')) setActiveTab('analytics');
      else if (h.includes('codes')) setActiveTab('codes');
      else if (h.includes('settings')) setActiveTab('settings');
      else setActiveTab('designer');
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [error, setError] = useState('');

  const loadCodes = async (selectInitial = false) => {
    try {
      const list = await api.getCodes();
      setCodes(list);
      if (selectInitial && list.length > 0) {
        setSelectedCode(previous => previous.id ? previous : list[0]);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load QR codes.');
    }
  };

  useEffect(() => {
    loadCodes(true);
  }, []);

  const handleSaveCode = async (updated: QRCodeData) => {
    const saved = await api.saveCode(updated);
    setSelectedCode(saved);
    setCodes(previous => previous.some(code => code.id === saved.id)
      ? previous.map(code => code.id === saved.id ? saved : code)
      : [saved, ...previous]);
  };

  const handleDeleteCode = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this QR code and its analytics?')) {
      try {
        await api.deleteCode(id);
        await loadCodes();
        const remaining = codes.filter((c) => c.id !== id);
        setSelectedCode(remaining[0] || createBlankCode());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete QR code.');
      }
    }
  };

  const handleCreateNew = () => {
    setSelectedCode(createBlankCode());
    setActiveTab('designer');
  };

  const handleSelectCode = (code: QRCodeData) => {
    setSelectedCode(code);
    setActiveTab('designer');
  };

  return (
    <div className="qr-studio-app bg-[#060708] text-[#e5e5e8] font-sans">
      {/* Top Navbar matching Onyx Minimal styling */}
      <header className="qr-studio-header bg-[#0b0c0e] border-b border-[#23252d] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0891b2] flex items-center justify-center text-white shadow-sm shadow-cyan-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">4QR Studio</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase">
                  v1.1.0
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav aria-label="4QR Studio" className="flex flex-wrap items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('designer')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'designer'
                  ? 'bg-[#16171c] text-[#22d3ee] border border-[#23252d]'
                  : 'text-[#9fa0aa] hover:text-white hover:bg-[#16171c]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Designer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#16171c] text-[#22d3ee] border border-[#23252d]'
                  : 'text-[#9fa0aa] hover:text-white hover:bg-[#16171c]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('codes')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'codes'
                  ? 'bg-[#16171c] text-[#22d3ee] border border-[#23252d]'
                  : 'text-[#9fa0aa] hover:text-white hover:bg-[#16171c]'
              }`}
            >
              <List className="w-4 h-4" />
              <span>My Codes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              aria-label="Settings & Help"
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#16171c] text-[#22d3ee] border border-[#23252d]'
                  : 'text-[#9fa0aa] hover:text-white hover:bg-[#16171c]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content View with Ambient Glow */}
      <main className="py-4 relative ambient-glow">
        {error && <p role="alert" className="mx-6 mb-4 rounded-xl border border-red-800 bg-red-950 p-4 text-red-200">{error}</p>}
        {activeTab === 'designer' && (
          <QRDesigner
            currentCode={selectedCode}
            onBack={() => setActiveTab('codes')}
            onSave={handleSaveCode}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            codes={codes}
            onSelectCodeToEdit={handleSelectCode}
          />
        )}

        {activeTab === 'codes' && (
          <QRList
            codes={codes}
            onSelectCode={handleSelectCode}
            onNewCode={handleCreateNew}
            onDeleteCode={handleDeleteCode}
            onViewAnalytics={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'settings' && <PluginSettings />}
      </main>
    </div>
  );
};
