import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Globe,
  Save,
  Link as LinkIcon,
  Sparkles,
  Info,
  Link2,
  ExternalLink
} from 'lucide-react';
import { DotType, CornerSquareType, CornerDotType, QRStyleConfig, QRCodeData } from '../../types';
import { PatternIcon, CornerSquareIcon, CornerDotIcon } from './StyleIcons';
import { QRPreview } from './QRPreview';
import { getSiteBaseUrl, buildShortUrl } from '../../api/client';

interface QRDesignerProps {
  currentCode: QRCodeData;
  onBack: () => void;
  onSave: (code: QRCodeData) => Promise<void>;
  onSimulateScan: () => void;
}

const PATTERNS: DotType[] = [
  'square',
  'rounded',
  'extra-rounded',
  'classy',
  'dots',
  'classy-rounded',
];

const CORNER_SQUARES: CornerSquareType[] = [
  'square',
  'dot',
  'rounded',
  'heavy',
  'extra-rounded',
  'leaf',
  'dotted',
];

const CORNER_DOTS: CornerDotType[] = [
  'square',
  'dot',
  'rounded',
  'diamond',
  'teardrop',
  'grid',
  'leaf',
];

export const QRDesigner: React.FC<QRDesignerProps> = ({
  currentCode,
  onBack,
  onSave,
  onSimulateScan,
}) => {
  const siteUrl = getSiteBaseUrl();
  const [title, setTitle] = useState(currentCode.title || '4Jwdh');
  const [targetUrl, setTargetUrl] = useState(
    currentCode.target_url && !currentCode.target_url.includes('example.com')
      ? currentCode.target_url
      : siteUrl ? `${siteUrl}/` : 'https://example.com'
  );
  const [slug, setSlug] = useState(currentCode.slug || '4Jwdh');
  const [encodeMode, setEncodeMode] = useState<'dynamic' | 'direct'>('dynamic');
  const [styleConfig, setStyleConfig] = useState<QRStyleConfig>(
    currentCode.style_config || {
      pattern: 'classy',
      cornerSquare: 'leaf',
      cornerDot: 'teardrop',
      patternColor: '#522b2b',
      bgColor: '#000000',
      isTransparent: true,
      logoUrl: '',
      logoSize: 0.32,
      logoMargin: 6,
    }
  );

  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setTitle(currentCode.title || '4Jwdh');
    if (currentCode.target_url && !currentCode.target_url.includes('example.com')) {
      setTargetUrl(currentCode.target_url);
    } else if (siteUrl) {
      setTargetUrl(`${siteUrl}/`);
    }
    setSlug(currentCode.slug || '4Jwdh');
    if (currentCode.style_config) {
      setStyleConfig(currentCode.style_config);
    }
  }, [currentCode, siteUrl]);

  // Dynamically constructed short link using current WordPress site URL
  const shortLink = buildShortUrl(slug);
  const activeEncodedUrl = encodeMode === 'dynamic' ? shortLink : targetUrl;

  const handleCopyShortLink = () => {
    navigator.clipboard.writeText(shortLink);
    setCopiedShort(true);
    setTimeout(() => setCopiedShort(false), 2000);
  };

  const handleCopyTargetUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setStyleConfig((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...currentCode,
        title,
        target_url: targetUrl,
        slug,
        short_url: shortLink,
        style_config: styleConfig,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* Top Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200/80 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold text-slate-900 bg-transparent hover:bg-white/60 focus:bg-white px-2 py-0.5 rounded-lg border border-transparent focus:border-slate-300 focus:outline-none transition-all"
              placeholder="QR Code Title"
            />
          </div>

          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <span>Short link</span>
            <span className="text-slate-700 font-medium font-mono text-xs sm:text-sm bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
              {shortLink}
            </span>
            <button
              type="button"
              onClick={handleCopyShortLink}
              title="Copy short link"
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedShort ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedShort ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Link info & Save Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            {encodeMode === 'dynamic' ? 'Dynamic Analytics Active' : 'Direct URL Mode'}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Update
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generator controls */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Destination URL & Encode Mode Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Destination URL
                </label>
                <button
                  type="button"
                  onClick={handleCopyTargetUrl}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedTarget ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedTarget ? 'URL Copied!' : 'Copy Destination URL'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://yourwebsite.com/promotion"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                />
              </div>
            </div>

            {/* URL Mode selection (Dynamic Trackable vs Direct URL) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                QR Code Link Mode:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEncodeMode('dynamic')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    encodeMode === 'dynamic'
                      ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Dynamic Trackable URL
                    </span>
                    {encodeMode === 'dynamic' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Routes via <code className="text-slate-800 font-mono text-[10px]">{shortLink}</code> to log full scan analytics and allows changing destination anytime.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEncodeMode('direct')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    encodeMode === 'direct'
                      ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-slate-600" />
                      Direct Destination URL
                    </span>
                    {encodeMode === 'direct' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Directly encodes your destination URL into the QR pattern without redirection.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Style Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Style</h2>

            {/* Pattern Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Pattern</label>
              <div className="flex flex-wrap items-center gap-3">
                {PATTERNS.map((p) => {
                  const isActive = styleConfig.pattern === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setStyleConfig((prev) => ({ ...prev, pattern: p }))}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-white ${
                        isActive
                          ? 'border-2 border-blue-500 shadow-md ring-2 ring-blue-500/20 text-slate-900'
                          : 'border border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <PatternIcon type={p} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Corners Style Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Corners Style</label>

              {/* Corner Outer Frames */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {CORNER_SQUARES.map((cs) => {
                  const isActive = styleConfig.cornerSquare === cs;
                  return (
                    <button
                      key={cs}
                      type="button"
                      onClick={() => setStyleConfig((prev) => ({ ...prev, cornerSquare: cs }))}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-white ${
                        isActive
                          ? 'border-2 border-blue-500 shadow-md ring-2 ring-blue-500/20 text-slate-900'
                          : 'border border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <CornerSquareIcon type={cs} />
                    </button>
                  );
                })}
              </div>

              {/* Corner Inner Dots */}
              <div className="flex flex-wrap items-center gap-3">
                {CORNER_DOTS.map((cd) => {
                  const isActive = styleConfig.cornerDot === cd;
                  return (
                    <button
                      key={cd}
                      type="button"
                      onClick={() => setStyleConfig((prev) => ({ ...prev, cornerDot: cd }))}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-white ${
                        isActive
                          ? 'border-2 border-blue-500 shadow-md ring-2 ring-blue-500/20 text-slate-900'
                          : 'border border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <CornerDotIcon type={cd} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Pattern Color */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pattern color</label>
                <div className="flex items-center gap-2">
                  <label
                    className="w-36 h-10 rounded-lg cursor-pointer border border-slate-300/80 shadow-xs relative overflow-hidden flex items-center justify-center transition-transform hover:scale-102"
                    style={{ backgroundColor: styleConfig.patternColor }}
                  >
                    <input
                      type="color"
                      value={styleConfig.patternColor}
                      onChange={(e) => setStyleConfig((prev) => ({ ...prev, patternColor: e.target.value }))}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    value={styleConfig.patternColor}
                    onChange={(e) => setStyleConfig((prev) => ({ ...prev, patternColor: e.target.value }))}
                    className="w-24 px-2 py-2 text-xs font-mono font-semibold uppercase bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-center"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Background color</label>
                <div className="flex items-center gap-2">
                  <label
                    className="w-36 h-10 rounded-lg cursor-pointer border border-slate-300/80 shadow-xs relative overflow-hidden flex items-center justify-center transition-transform hover:scale-102 disabled:opacity-40"
                    style={{ backgroundColor: styleConfig.bgColor }}
                  >
                    <input
                      type="color"
                      disabled={styleConfig.isTransparent}
                      value={styleConfig.bgColor}
                      onChange={(e) => setStyleConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                    />
                  </label>
                  <input
                    type="text"
                    disabled={styleConfig.isTransparent}
                    value={styleConfig.bgColor}
                    onChange={(e) => setStyleConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                    className="w-24 px-2 py-2 text-xs font-mono font-semibold uppercase bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-center disabled:opacity-40"
                  />
                </div>
              </div>
            </div>

            {/* Transparent background toggle switch matching screenshot */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStyleConfig((prev) => ({ ...prev, isTransparent: !prev.isTransparent }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  styleConfig.isTransparent ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    styleConfig.isTransparent ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-slate-700 cursor-pointer" onClick={() => setStyleConfig((prev) => ({ ...prev, isTransparent: !prev.isTransparent }))}>
                Transparent background
              </span>
            </div>

            {/* Tip Alert */}
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/80 border border-amber-200/60 p-3 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tip! If the code is not scanning, please make the pattern color more intense.</span>
            </div>

            {/* Logo Section */}
            <div className="pt-2">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Logo</h3>
              <p className="text-xs text-slate-500 mb-3">Upload or select logo</p>

              <div className="flex items-center gap-4">
                {/* Upload Card */}
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Plus className="w-6 h-6 text-slate-500" />
                </label>

                {/* If logo is selected */}
                {styleConfig.logoUrl && (
                  <div className="relative group w-16 h-16 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shadow-xs">
                    <img
                      src={styleConfig.logoUrl}
                      alt="Logo preview"
                      className="max-w-full max-h-full object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setStyleConfig((prev) => ({ ...prev, logoUrl: '' }))}
                      title="Remove logo"
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Logo Size and Margin Controls */}
              {styleConfig.logoUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Logo Size: {Math.round((styleConfig.logoSize ?? 0.35) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.15"
                      max="0.45"
                      step="0.01"
                      value={styleConfig.logoSize ?? 0.35}
                      onChange={(e) => setStyleConfig((prev) => ({ ...prev, logoSize: parseFloat(e.target.value) }))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Logo Margin: {styleConfig.logoMargin ?? 6}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="1"
                      value={styleConfig.logoMargin ?? 6}
                      onChange={(e) => setStyleConfig((prev) => ({ ...prev, logoMargin: parseInt(e.target.value, 10) }))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Preview Card (Floating / Sticky) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <QRPreview
            dataUrl={targetUrl}
            shortUrl={shortLink}
            activeEncodedUrl={activeEncodedUrl}
            styleConfig={styleConfig}
            onSimulateScan={onSimulateScan}
          />
        </div>
      </div>
    </div>
  );
};
