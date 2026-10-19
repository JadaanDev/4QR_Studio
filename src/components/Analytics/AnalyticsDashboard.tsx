import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  Users,
  Eye,
  Calendar,
  Filter,
  Download,
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { AnalyticsData, QRCodeData } from '../../types';
import { api } from '../../api/client';

interface AnalyticsDashboardProps {
  codes: QRCodeData[];
  onSelectCodeToEdit: (code: QRCodeData) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  codes,
  onSelectCodeToEdit,
}) => {
  const [selectedQrId, setSelectedQrId] = useState<number | undefined>(undefined);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics(selectedQrId);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedQrId]);

  const exportCSV = () => {
    if (!analytics || !analytics.recent_scans.length) return;
    const headers = ['ID', 'QR Slug', 'QR Title', 'Device', 'OS', 'Browser', 'Referrer', 'Scanned At'];
    const rows = analytics.recent_scans.map(s => [
      s.id,
      s.slug,
      `"${(s.qr_title || '').replace(/"/g, '""')}"`,
      s.device,
      s.os,
      s.browser,
      `"${(s.referrer || '').replace(/"/g, '""')}"`,
      s.scanned_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `qr-analytics-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 font-sans space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#23252d] gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#22d3ee]" />
            Scan Analytics & Insights
          </h1>
          <p className="text-sm text-[#9fa0aa] mt-1">
            Real-time scans, unique visitor tracking, and device diagnostics for your dynamic QR codes.
          </p>
        </div>

        {/* Filter and Actions */}
        <div className="flex items-center gap-2.5">
          {/* QR Code Filter Selector */}
          <div className="relative">
            <select
              value={selectedQrId || ''}
              onChange={(e) => setSelectedQrId(e.target.value ? Number(e.target.value) : undefined)}
              className="pl-3 pr-8 py-2 text-xs font-semibold bg-[#101115] border border-[#23252d] rounded-xl text-white focus:outline-none focus:border-[#0891b2] shadow-xs cursor-pointer"
            >
              <option value="">All QR Codes</option>
              {codes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.slug})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            title="Refresh analytics data"
            className="p-2 bg-[#101115] hover:bg-[#16171c] border border-[#23252d] rounded-xl text-[#ccccd2] hover:text-white shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#22d3ee]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!analytics?.recent_scans?.length}
            className="px-3.5 py-2 bg-[#101115] hover:bg-[#16171c] border border-[#23252d] text-[#ccccd2] hover:text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0c0e] p-5 rounded-2xl border border-[#23252d] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9fa0aa]">Total Scans</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {loading ? '...' : analytics?.total_scans ?? 0}
            </h3>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 mt-1">
              +100% Trackable
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#101115] text-[#22d3ee] border border-[#23252d] flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0b0c0e] p-5 rounded-2xl border border-[#23252d] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9fa0aa]">Unique Visitors</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {loading ? '...' : analytics?.unique_scans ?? 0}
            </h3>
            <span className="text-[11px] font-medium text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Privacy Hash
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#101115] text-[#22d3ee] border border-[#23252d] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0b0c0e] p-5 rounded-2xl border border-[#23252d] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9fa0aa]">Active Codes</p>
            <h3 className="text-2xl font-black text-white mt-1">{codes.length}</h3>
            <span className="text-[11px] font-medium text-cyan-400 mt-1">
              Dynamic Redirection
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#101115] text-[#22d3ee] border border-[#23252d] flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0b0c0e] p-5 rounded-2xl border border-[#23252d] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9fa0aa]">Top Device</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {analytics?.devices?.[0]?.name || 'Mobile'}
            </h3>
            <span className="text-[11px] font-medium text-[#9fa0aa] mt-1">
              Camera / Scanner
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#101115] text-[#22d3ee] border border-[#23252d] flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Scan History */}
        <div className="lg:col-span-2 bg-[#0b0c0e] rounded-2xl p-6 border border-[#23252d] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Scan Activity Over Time</h3>
              <p className="text-xs text-[#9fa0aa]">Timeline of scans received</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#ccccd2] bg-[#101115] border border-[#23252d] px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-[#22d3ee]" />
              Recent Days
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-48 w-full flex items-end gap-2 pt-6 pb-2 border-b border-[#23252d]">
            {(!analytics?.daily || analytics.daily.length === 0) ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#6f707f] text-xs">
                <BarChart3 className="w-8 h-8 text-[#3a3b46] mb-1" />
                No daily scan data recorded yet
              </div>
            ) : (
              analytics.daily.map((d, i) => {
                const max = Math.max(...analytics.daily.map((x) => x.count), 1);
                const heightPercent = Math.max((d.count / max) * 100, 8);
                return (
                  <div key={d.date || i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-bold text-[#22d3ee] opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[28px] bg-[#0891b2] group-hover:bg-[#22d3ee] rounded-t-md transition-all shadow-xs"
                    />
                    <span className="text-[10px] text-[#9fa0aa] truncate max-w-[42px]">
                      {d.date.substring(5)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Breakdown Card: Devices, OS & Browsers */}
        <div className="bg-[#0b0c0e] rounded-2xl p-6 border border-[#23252d] shadow-xs space-y-5">
          <h3 className="text-base font-bold text-white">Device Breakdown</h3>

          {/* Devices */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-[#9fa0aa] uppercase tracking-wider">Device Type</span>
            {analytics?.devices?.map((dev) => {
              const total = analytics.total_scans || 1;
              const pct = Math.round((dev.count / total) * 100);
              return (
                <div key={dev.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-[#e5e5e8]">
                    <span className="flex items-center gap-1.5">
                      {dev.name.toLowerCase() === 'mobile' ? (
                        <Smartphone className="w-3.5 h-3.5 text-[#22d3ee]" />
                      ) : dev.name.toLowerCase() === 'tablet' ? (
                        <Tablet className="w-3.5 h-3.5 text-[#22d3ee]" />
                      ) : (
                        <Laptop className="w-3.5 h-3.5 text-[#22d3ee]" />
                      )}
                      {dev.name}
                    </span>
                    <span className="text-[#9fa0aa]">{dev.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#16171c] h-2 rounded-full overflow-hidden border border-[#23252d]">
                    <div className="bg-[#0891b2] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Operating Systems */}
          <div className="space-y-2 pt-2 border-t border-[#23252d]">
            <span className="text-xs font-semibold text-[#9fa0aa] uppercase tracking-wider">Operating Systems</span>
            <div className="flex flex-wrap gap-1.5">
              {analytics?.os?.map((item) => (
                <span
                  key={item.name}
                  className="px-2.5 py-1 bg-[#101115] border border-[#23252d] rounded-lg text-xs font-medium text-[#ccccd2]"
                >
                  {item.name}: <strong className="text-white font-bold">{item.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-[#0b0c0e] rounded-2xl border border-[#23252d] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#23252d] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Scan Logs</h3>
            <p className="text-xs text-[#9fa0aa]">Chronological stream of scanner device events</p>
          </div>
          <span className="text-xs bg-[#101115] border border-[#23252d] text-[#22d3ee] px-2.5 py-1 rounded-full font-semibold">
            {analytics?.recent_scans?.length ?? 0} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#e5e5e8]">
            <thead className="bg-[#101115] text-[11px] uppercase tracking-wider font-bold text-[#9fa0aa] border-b border-[#23252d]">
              <tr>
                <th className="py-3 px-4">QR Code</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">OS</th>
                <th className="py-3 px-4">Browser</th>
                <th className="py-3 px-4">Source / Referrer</th>
                <th className="py-3 px-4">Scanned At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23252d] font-medium text-xs">
              {(!analytics?.recent_scans || analytics.recent_scans.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6f707f]">
                    No scan events found. Test scan from the generator to see live logs!
                  </td>
                </tr>
              ) : (
                analytics.recent_scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-[#16171c]/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {scan.qr_title || scan.slug}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-[#101115] border border-[#23252d] text-[#22d3ee] px-2 py-0.5 rounded text-[11px]">
                        {scan.device}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#ccccd2]">{scan.os}</td>
                    <td className="py-3 px-4 text-[#ccccd2]">{scan.browser}</td>
                    <td className="py-3 px-4 text-[#9fa0aa] max-w-xs truncate">
                      {scan.referrer || 'Direct / Camera'}
                    </td>
                    <td className="py-3 px-4 text-[#9fa0aa] font-mono">
                      {new Date(scan.scanned_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
