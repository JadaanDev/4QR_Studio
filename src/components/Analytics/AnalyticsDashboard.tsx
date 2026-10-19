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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Scan Analytics & Insights
          </h1>
          <p className="text-sm text-slate-500 mt-1">
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
              className="pl-3 pr-8 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
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
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!analytics?.recent_scans?.length}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Scans</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '...' : analytics?.total_scans ?? 0}
            </h3>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
              +100% Trackable
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unique Visitors</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {loading ? '...' : analytics?.unique_scans ?? 0}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Privacy Hash
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Codes</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{codes.length}</h3>
            <span className="text-[11px] font-medium text-blue-600 mt-1">
              Dynamic Redirection
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Device</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {analytics?.devices?.[0]?.name || 'Mobile'}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 mt-1">
              Camera / Scanner
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Scan History */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Scan Activity Over Time</h3>
              <p className="text-xs text-slate-400">Timeline of scans received</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Recent Days
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-48 w-full flex items-end gap-2 pt-6 pb-2 border-b border-slate-100">
            {(!analytics?.daily || analytics.daily.length === 0) ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <BarChart3 className="w-8 h-8 text-slate-300 mb-1" />
                No daily scan data recorded yet
              </div>
            ) : (
              analytics.daily.map((d, i) => {
                const max = Math.max(...analytics.daily.map((x) => x.count), 1);
                const heightPercent = Math.max((d.count / max) * 100, 8);
                return (
                  <div key={d.date || i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[28px] bg-blue-500 group-hover:bg-blue-600 rounded-t-md transition-all shadow-xs"
                    />
                    <span className="text-[10px] text-slate-400 truncate max-w-[42px]">
                      {d.date.substring(5)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Breakdown Card: Devices, OS & Browsers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900">Device Breakdown</h3>

          {/* Devices */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Device Type</span>
            {analytics?.devices?.map((dev) => {
              const total = analytics.total_scans || 1;
              const pct = Math.round((dev.count / total) * 100);
              return (
                <div key={dev.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      {dev.name.toLowerCase() === 'mobile' ? (
                        <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                      ) : dev.name.toLowerCase() === 'tablet' ? (
                        <Tablet className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <Laptop className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      {dev.name}
                    </span>
                    <span className="text-slate-500">{dev.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Operating Systems */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operating Systems</span>
            <div className="flex flex-wrap gap-1.5">
              {analytics?.os?.map((item) => (
                <span
                  key={item.name}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700"
                >
                  {item.name}: <strong className="text-slate-900 font-bold">{item.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Scan Logs</h3>
            <p className="text-xs text-slate-400">Chronological stream of scanner device events</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
            {analytics?.recent_scans?.length ?? 0} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">QR Code</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">OS</th>
                <th className="py-3 px-4">Browser</th>
                <th className="py-3 px-4">Source / Referrer</th>
                <th className="py-3 px-4">Scanned At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-xs">
              {(!analytics?.recent_scans || analytics.recent_scans.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No scan events found. Test scan from the generator to see live logs!
                  </td>
                </tr>
              ) : (
                analytics.recent_scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {scan.qr_title || scan.slug}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {scan.device}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{scan.os}</td>
                    <td className="py-3 px-4 text-slate-700">{scan.browser}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {scan.referrer || 'Direct / Camera'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
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
