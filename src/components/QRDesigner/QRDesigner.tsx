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
}) => {
  const siteUrl = getSiteBaseUrl();
  const [title, setTitle] = useState(currentCode.title || 'Untitled QR');
  const [targetUrl, setTargetUrl] = useState(currentCode.target_url || (siteUrl ? `${siteUrl}/` : ''));
  const [slug, setSlug] = useState(currentCode.slug || '');
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
  const [saveError, setSaveError] = useState('');
  const [renameAcknowledged, setRenameAcknowledged] = useState(false);

  useEffect(() => {
    setTitle(currentCode.title || 'Untitled QR');
    setTargetUrl(currentCode.target_url || (siteUrl ? `${siteUrl}/` : ''));
    setSlug(currentCode.slug || '');
    setRenameAcknowledged(false);
    setSaveError('');
    if (currentCode.style_config) {
      setStyleConfig(currentCode.style_config);
    }
  }, [currentCode, siteUrl]);

  // Clean trackable short link computed dynamically from currently active site
  const shortLink = buildShortUrl(slug);
  const encodeMode = styleConfig.encodeMode || 'dynamic';
  const setEncodeMode = (mode: 'dynamic' | 'direct') => setStyleConfig(previous => ({ ...previous, encodeMode: mode }));
  const slugError = /^[a-zA-Z0-9_-]{1,64}$/.test(slug) ? '' : 'Use 1–64 letters, numbers, hyphens or underscores.';
  const isRenaming = Boolean(currentCode.id && slug.toLowerCase() !== currentCode.slug.toLowerCase());
  const isDirty = title !== currentCode.title || targetUrl !== currentCode.target_url || slug !== currentCode.slug
    || JSON.stringify(styleConfig) !== JSON.stringify(currentCode.style_config);
  const exportDisabled = !currentCode.id || isDirty || isSaving;
  const cannotSave = Boolean(slugError || !targetUrl.trim() || (isRenaming && !renameAcknowledged));

  // Active URL to be encoded into the QR pattern
  const activeEncodedUrl = encodeMode === 'dynamic' ? shortLink : (targetUrl || shortLink);

  const handleCopyShortLink = async () => {
    if (exportDisabled) return;
    try {
      await navigator.clipboard.writeText(shortLink);
      setCopiedShort(true);
      setTimeout(() => setCopiedShort(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyTargetUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setStyleConfig((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (cannotSave) return;
    setSaveError('');
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
      setSaveError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 font-sans">
      {/* Top Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 mb-6 border-b border-[#23252d] gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 bg-[#101115] hover:bg-[#16171c] border border-[#23252d] rounded-lg text-[#ccccd2] hover:text-white text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <input
              type="text"
              aria-label="QR code title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-w-0 w-full text-2xl font-bold text-white bg-transparent hover:bg-white/5 focus:bg-[#101115] px-2 py-0.5 rounded-lg border border-transparent focus:border-[#0891b2] focus:outline-none transition-all"
              placeholder="QR Code Title"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-[#9fa0aa]">
            <span>Short link</span>
            <span className="break-all text-[#22d3ee] font-medium font-mono text-xs sm:text-sm bg-[#101115] px-2.5 py-0.5 rounded border border-[#23252d]">
              {shortLink}
            </span>
            <button
              type="button"
              onClick={handleCopyShortLink}
              disabled={exportDisabled}
              title="Copy short link"
              className="px-2.5 py-1 bg-[#16171c] hover:bg-[#23252d] text-[#ccccd2] hover:text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-[#23252d]"
            >
              {copiedShort ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedShort ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Link info & Save Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            {encodeMode === 'dynamic' ? 'Dynamic Analytics Active' : 'Direct URL Mode'}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || cannotSave}
            className="shrink-0 whitespace-nowrap px-5 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess && !isDirty ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
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

      {saveError && <p role="alert" className="mb-4 p-3 rounded-xl border border-red-800 bg-red-950 text-red-200">{saveError}</p>}
      <p role="status" className="mb-4 text-sm text-[#9fa0aa]">
        {exportDisabled ? 'Unsaved changes — save your QR code before copying or downloading it.' : 'Saved — your QR code is ready to share.'}
      </p>

      {/* Main Grid: Left Controls, Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generator controls */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          <section aria-labelledby="qr-link-label" className="bg-[#0b0c0e] rounded-2xl p-5 border border-[#23252d] space-y-3">
            <label id="qr-link-label" htmlFor="qr-link-slug" className="block text-sm font-bold text-white">QR Code Link</label>
            <p id="qr-link-help" className="text-xs text-[#9fa0aa]">Choose the last part of your dynamic link. The site address and /q/ prefix stay fixed.</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#9fa0aa] break-all">{siteUrl}/q/</span>
              <input id="qr-link-slug" type="text" value={slug} maxLength={64} spellCheck={false} autoCapitalize="none" autoComplete="off"
                aria-describedby={slugError ? 'qr-link-help qr-link-error' : 'qr-link-help'} aria-invalid={Boolean(slugError)}
                onChange={event => { setSlug(event.target.value); setRenameAcknowledged(false); setSaveSuccess(false); setSaveError(''); }}
                className="min-w-0 flex-1 px-3 py-2 bg-[#101115] border border-[#23252d] rounded-xl text-white font-mono" />
            </div>
            {slugError && <p id="qr-link-error" role="alert" className="text-xs text-red-300">{slugError}</p>}
            <p className="text-xs text-[#22d3ee] break-all">Preview: {shortLink}</p>
            {isRenaming && <div className="space-y-2 p-3 rounded-xl border border-amber-800 bg-amber-950/40 text-xs text-amber-200">
              <p>Changing this link retires {buildShortUrl(currentCode.slug)}. Printed QRs using that link will stop working. Download and replace them after saving. Scan history is retained.</p>
              <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={renameAcknowledged} onChange={event => setRenameAcknowledged(event.target.checked)} />I understand that the previous link will stop working.</label>
            </div>}
            {!isRenaming && <p className="text-xs text-[#9fa0aa]">To update an existing printed QR, change only its Destination URL below.</p>}
          </section>
          {/* Destination URL & Encode Mode Card */}
          <div className="bg-[#0b0c0e] rounded-2xl p-5 border border-[#23252d] shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="qr-destination" className="text-xs font-bold text-[#9fa0aa] uppercase tracking-wider">
                  Destination URL
                </label>
                <button
                  type="button"
                  onClick={handleCopyTargetUrl}
                  className="text-xs text-[#22d3ee] hover:text-[#06b6d4] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedTarget ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedTarget ? 'URL Copied!' : 'Copy Destination URL'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6f707f]">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  id="qr-destination"
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://yourwebsite.com/promotion"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#101115] border border-[#23252d] rounded-xl focus:bg-[#16171c] focus:outline-none focus:border-[#0891b2] font-medium text-white placeholder-[#6f707f]"
                />
              </div>
            </div>

            {/* URL Mode selection (Dynamic Trackable vs Direct URL) */}
            <div className="pt-2 border-t border-[#23252d]">
              <label className="block text-xs font-semibold text-[#ccccd2] mb-2">
                QR Code Link Mode:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEncodeMode('dynamic')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    encodeMode === 'dynamic'
                      ? 'border-[#0891b2] bg-[#0891b2]/10 ring-2 ring-[#0891b2]/30 text-white'
                      : 'border-[#23252d] bg-[#101115] hover:bg-[#16171c] text-[#ccccd2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#22d3ee]" />
                      Dynamic Trackable URL
                    </span>
                    {encodeMode === 'dynamic' && <Check className="w-4 h-4 text-[#22d3ee]" />}
                  </div>
                  <p className="text-[11px] text-[#9fa0aa] mt-1">
                    Routes via <code className="text-[#22d3ee] font-mono text-[10px]">{shortLink}</code> to log full scan analytics and allows changing destination anytime.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEncodeMode('direct')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    encodeMode === 'direct'
                      ? 'border-[#0891b2] bg-[#0891b2]/10 ring-2 ring-[#0891b2]/30 text-white'
                      : 'border-[#23252d] bg-[#101115] hover:bg-[#16171c] text-[#ccccd2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-[#9fa0aa]" />
                      Direct Destination URL
                    </span>
                    {encodeMode === 'direct' && <Check className="w-4 h-4 text-[#22d3ee]" />}
                  </div>
                  <p className="text-[11px] text-[#9fa0aa] mt-1">
                    Directly encodes your destination URL into the QR pattern without redirection.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Style Section */}
          <div className="bg-[#0b0c0e] rounded-2xl p-5 border border-[#23252d] shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Style & Customization</h2>

            {/* Pattern Section */}
            <div>
              <label className="block text-sm font-semibold text-[#ccccd2] mb-3">Pattern</label>
              <div className="flex flex-wrap items-center gap-3">
                {PATTERNS.map((p) => {
                  const isActive = styleConfig.pattern === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-label={`Pattern: ${p}`}
                      aria-pressed={isActive}
                      onClick={() => setStyleConfig((prev) => ({ ...prev, pattern: p }))}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'border-2 border-[#0891b2] bg-[#0891b2]/20 shadow-md ring-2 ring-[#0891b2]/30 text-white'
                          : 'border border-[#23252d] bg-[#101115] hover:bg-[#16171c] text-[#9fa0aa] hover:text-white'
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
              <label className="block text-sm font-semibold text-[#ccccd2] mb-3">Corners Style</label>

              {/* Corner Outer Frames */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {CORNER_SQUARES.map((cs) => {
                  const isActive = styleConfig.cornerSquare === cs;
                  return (
                    <button
                      key={cs}
                      type="button"
                      aria-label={`Outer corner: ${cs}`}
                      aria-pressed={isActive}
                      onClick={() => setStyleConfig((prev) => ({ ...prev, cornerSquare: cs }))}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'border-2 border-[#0891b2] bg-[#0891b2]/20 shadow-md ring-2 ring-[#0891b2]/30 text-white'
                          : 'border border-[#23252d] bg-[#101115] hover:bg-[#16171c] text-[#9fa0aa] hover:text-white'
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
                      aria-label={`Inner corner: ${cd}`}
                      aria-pressed={isActive}
                      onClick={() => setStyleConfig((prev) => ({ ...prev, cornerDot: cd }))}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'border-2 border-[#0891b2] bg-[#0891b2]/20 shadow-md ring-2 ring-[#0891b2]/30 text-white'
                          : 'border border-[#23252d] bg-[#101115] hover:bg-[#16171c] text-[#9fa0aa] hover:text-white'
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
                <label className="block text-sm font-semibold text-[#ccccd2] mb-2">Pattern color</label>
                <div className="flex items-center gap-2">
                  <label
                    className="w-36 h-10 rounded-lg cursor-pointer border border-[#23252d] shadow-xs relative overflow-hidden flex items-center justify-center transition-transform hover:scale-102"
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
                    className="w-24 px-2 py-2 text-xs font-mono font-semibold uppercase bg-[#101115] border border-[#23252d] rounded-lg text-[#22d3ee] text-center focus:outline-none focus:border-[#0891b2]"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-semibold text-[#ccccd2] mb-2">Background color</label>
                <div className="flex items-center gap-2">
                  <label
                    className="w-36 h-10 rounded-lg cursor-pointer border border-[#23252d] shadow-xs relative overflow-hidden flex items-center justify-center transition-transform hover:scale-102 disabled:opacity-40"
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
                    className="w-24 px-2 py-2 text-xs font-mono font-semibold uppercase bg-[#101115] border border-[#23252d] rounded-lg text-[#22d3ee] text-center disabled:opacity-40 focus:outline-none focus:border-[#0891b2]"
                  />
                </div>
              </div>
            </div>

            {/* Transparent background toggle switch matching screenshot */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-label="Transparent background"
                aria-checked={styleConfig.isTransparent}
                onClick={() => setStyleConfig((prev) => ({ ...prev, isTransparent: !prev.isTransparent }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  styleConfig.isTransparent ? 'bg-[#0891b2]' : 'bg-[#23252d]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    styleConfig.isTransparent ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-[#ccccd2] cursor-pointer" onClick={() => setStyleConfig((prev) => ({ ...prev, isTransparent: !prev.isTransparent }))}>
                Transparent background
              </span>
            </div>

            {/* Tip Alert */}
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 p-3 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Tip! If the code is not scanning, ensure the pattern color has sufficient contrast with the background.</span>
            </div>

            {/* Logo Section */}
            <div className="pt-2 border-t border-[#23252d]">
              <h3 className="text-lg font-bold text-white mb-1">Logo</h3>
              <p className="text-xs text-[#9fa0aa] mb-3">Upload or select custom brand logo</p>

              <div className="flex items-center gap-4">
                {/* Upload Card */}
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#23252d] hover:border-[#0891b2] bg-[#101115] hover:bg-[#16171c] flex flex-col items-center justify-center cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Plus className="w-6 h-6 text-[#9fa0aa]" />
                </label>

                {/* If logo is selected */}
                {styleConfig.logoUrl && (
                  <div className="relative group w-16 h-16 rounded-xl border border-[#23252d] bg-[#101115] p-1 flex items-center justify-center shadow-xs">
                    <img
                      src={styleConfig.logoUrl}
                      alt="Logo preview"
                      className="max-w-full max-h-full object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setStyleConfig((prev) => ({ ...prev, logoUrl: '' }))}
                      title="Remove logo"
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Logo Size and Margin Controls */}
              {styleConfig.logoUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-[#101115] p-4 rounded-xl border border-[#23252d]">
                  <div>
                    <label className="block text-xs font-semibold text-[#ccccd2] mb-1">
                      Logo Size: {Math.round((styleConfig.logoSize ?? 0.35) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.15"
                      max="0.45"
                      step="0.01"
                      value={styleConfig.logoSize ?? 0.35}
                      onChange={(e) => setStyleConfig((prev) => ({ ...prev, logoSize: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#ccccd2] mb-1">
                      Logo Margin: {styleConfig.logoMargin ?? 6}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="1"
                      value={styleConfig.logoMargin ?? 6}
                      onChange={(e) => setStyleConfig((prev) => ({ ...prev, logoMargin: parseInt(e.target.value, 10) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Preview Card (Floating / Sticky) */}
        <div className="qr-studio-preview-panel lg:col-span-5 xl:col-span-4">
          <QRPreview
            dataUrl={targetUrl}
            shortUrl={shortLink}
            activeEncodedUrl={activeEncodedUrl}
            styleConfig={styleConfig}
            exportDisabled={exportDisabled}
          />
        </div>
      </div>
    </div>
  );
};
