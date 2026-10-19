import React, { useState } from 'react';
import {
  Plus,
  BarChart2,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Power
} from 'lucide-react';
import { QRCodeData } from '../../types';
import { buildShortUrl } from '../../api/client';

interface QRListProps {
  codes: QRCodeData[];
  onSelectCode: (code: QRCodeData) => void;
  onNewCode: () => void;
  onDeleteCode: (id: number) => Promise<void>;
  onViewAnalytics: (qrId: number) => void;
}

export const QRList: React.FC<QRListProps> = ({
  codes,
  onSelectCode,
  onNewCode,
  onDeleteCode,
  onViewAnalytics,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyLink = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#23252d] gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Dynamic QR Codes
          </h1>
          <p className="text-sm text-[#9fa0aa] mt-1">
            Manage your trackable QR links. Change destinations anytime without re-printing.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewCode}
          className="px-4 py-2.5 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New QR Code
        </button>
      </div>

      {/* Empty State when no QR codes created yet */}
      {codes.length === 0 ? (
        <div className="bg-[#0b0c0e] rounded-2xl p-12 border border-[#23252d] text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#16171c] text-[#22d3ee] flex items-center justify-center mx-auto mb-4 border border-[#23252d]">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No QR Codes Yet</h3>
          <p className="text-xs text-[#9fa0aa] mb-6 max-w-sm mx-auto leading-relaxed">
            Create your first dynamic, trackable QR code to customize patterns, add your logo, and monitor scans in real-time.
          </p>
          <button
            type="button"
            onClick={onNewCode}
            className="px-6 py-3 bg-[#0891b2] hover:bg-[#06b6d4] text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-500/20 inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Your First QR Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {codes.map((code) => {
            const shortUrl = buildShortUrl(code.slug);
            return (
              <div
                key={code.id || code.slug}
                className="bg-[#0b0c0e] rounded-2xl p-5 border border-[#23252d] shadow-xs hover:border-[#0891b2]/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-white text-base truncate" title={code.title}>
                      {code.title}
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#101115] text-[#22d3ee] border border-[#23252d]">
                      {code.scans_count || 0} scans
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Short Link */}
                    <div className="flex items-center justify-between bg-[#101115] p-2 rounded-lg border border-[#23252d]">
                      <span className="text-[#22d3ee] font-mono truncate max-w-[200px]">
                        {shortUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => code.id && copyLink(code.id, shortUrl)}
                        className="text-[#9fa0aa] hover:text-white p-1 cursor-pointer transition-colors"
                        title="Copy short link"
                      >
                        {copiedId === code.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Target URL */}
                    <div className="flex items-center gap-1.5 text-[#9fa0aa] truncate">
                      <Globe className="w-3.5 h-3.5 text-[#6f707f] shrink-0" />
                      <span className="truncate" title={code.target_url}>
                        {code.target_url}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 mt-4 border-t border-[#23252d] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSelectCode(code)}
                      className="p-2 hover:bg-[#16171c] rounded-lg text-[#ccccd2] hover:text-[#22d3ee] transition-colors cursor-pointer"
                      title="Customize style & download"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => code.id && onViewAnalytics(code.id)}
                      className="p-2 hover:bg-[#16171c] rounded-lg text-[#ccccd2] hover:text-[#22d3ee] transition-colors cursor-pointer"
                      title="View Analytics"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => code.id && onDeleteCode(code.id)}
                    className="p-2 hover:bg-red-950/40 rounded-lg text-[#9fa0aa] hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete QR code"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
