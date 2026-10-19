import { QRCodeData, AnalyticsData, ScanRecord } from '../types';

declare global {
  interface Window {
    qrStudioData?: {
      isWp: boolean;
      restUrl: string;
      nonce: string;
      siteUrl: string;
      adminUrl: string;
    };
  }
}

const isWp = typeof window !== 'undefined' && Boolean(window.qrStudioData?.isWp);

export function getSiteBaseUrl(): string {
  if (typeof window !== 'undefined' && window.qrStudioData?.siteUrl) {
    return window.qrStudioData.siteUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return '';
}

export function buildShortUrl(slug: string): string {
  const base = getSiteBaseUrl();
  return `${base}/q/${slug}`;
}

// Clean local storage keys for standalone / dev mode
const STORAGE_CODES_KEY = 'four_qr_codes';
const STORAGE_SCANS_KEY = 'four_qr_scans';

function getLocalCodes(): QRCodeData[] {
  const data = localStorage.getItem(STORAGE_CODES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function getLocalScans(): ScanRecord[] {
  const data = localStorage.getItem(STORAGE_SCANS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export const api = {
  isWordPress(): boolean {
    return isWp;
  },

  getSiteUrl(): string {
    return getSiteBaseUrl();
  },

  async getCodes(): Promise<QRCodeData[]> {
    if (isWp && window.qrStudioData) {
      const res = await fetch(`${window.qrStudioData.restUrl}codes`, {
        headers: { 'X-WP-Nonce': window.qrStudioData.nonce },
      });
      const json = await res.json();
      return json.data || [];
    }
    return getLocalCodes();
  },

  async saveCode(code: Partial<QRCodeData>): Promise<QRCodeData> {
    if (isWp && window.qrStudioData) {
      const res = await fetch(`${window.qrStudioData.restUrl}codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.qrStudioData.nonce,
        },
        body: JSON.stringify(code),
      });
      const json = await res.json();
      return json.data;
    }

    const list = getLocalCodes();
    let saved: QRCodeData;
    if (code.id) {
      const idx = list.findIndex(c => c.id === code.id);
      saved = { ...list[idx], ...code } as QRCodeData;
      list[idx] = saved;
    } else {
      const slug = code.slug || Math.random().toString(36).substring(2, 8);
      saved = {
        ...code,
        id: Date.now(),
        slug,
        title: code.title || 'Untitled QR',
        qr_type: code.qr_type || 'website',
        target_url: code.target_url || `${getSiteBaseUrl()}/`,
        short_url: buildShortUrl(slug),
        scans_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        style_config: code.style_config || {
          pattern: 'classy',
          cornerSquare: 'leaf',
          cornerDot: 'teardrop',
          patternColor: '#522b2b',
          bgColor: '#000000',
          isTransparent: true,
        },
      } as QRCodeData;
      list.unshift(saved);
    }
    localStorage.setItem(STORAGE_CODES_KEY, JSON.stringify(list));
    return saved;
  },

  async deleteCode(id: number): Promise<boolean> {
    if (isWp && window.qrStudioData) {
      const res = await fetch(`${window.qrStudioData.restUrl}codes/${id}`, {
        method: 'DELETE',
        headers: { 'X-WP-Nonce': window.qrStudioData.nonce },
      });
      const json = await res.json();
      return json.success;
    }

    const list = getLocalCodes().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_CODES_KEY, JSON.stringify(list));
    return true;
  },

  async getAnalytics(qrId?: number): Promise<AnalyticsData> {
    if (isWp && window.qrStudioData) {
      const url = `${window.qrStudioData.restUrl}analytics${qrId ? `?qr_id=${qrId}` : ''}`;
      const res = await fetch(url, {
        headers: { 'X-WP-Nonce': window.qrStudioData.nonce },
      });
      const json = await res.json();
      return json.data || {
        total_scans: 0,
        unique_scans: 0,
        devices: [],
        os: [],
        browsers: [],
        daily: [],
        recent_scans: [],
      };
    }

    // Local empty analytics computation
    const scans = getLocalScans().filter(s => (qrId ? s.qr_id === qrId : true));
    const total_scans = scans.length;
    const unique_scans = new Set(scans.map(s => s.ip_hash)).size;

    const deviceMap: Record<string, number> = {};
    const osMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};

    scans.forEach(s => {
      deviceMap[s.device] = (deviceMap[s.device] || 0) + 1;
      osMap[s.os] = (osMap[s.os] || 0) + 1;
      browserMap[s.browser] = (browserMap[s.browser] || 0) + 1;
      const d = s.scanned_at.substring(0, 10);
      dailyMap[d] = (dailyMap[d] || 0) + 1;
    });

    return {
      total_scans,
      unique_scans,
      devices: Object.entries(deviceMap).map(([name, count]) => ({ name, count })),
      os: Object.entries(osMap).map(([name, count]) => ({ name, count })),
      browsers: Object.entries(browserMap).map(([name, count]) => ({ name, count })),
      daily: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
      recent_scans: scans,
    };
  },

  simulateScan(code: QRCodeData): void {
    if (!code.id) return;
    const devices = ['Mobile', 'Desktop', 'Tablet'];
    const oss = ['iOS', 'Android', 'Windows 10/11', 'macOS'];
    const browsers = ['Safari', 'Chrome', 'Firefox', 'Edge'];
    const referrers = ['Camera App', 'Instagram', 'Direct', 'Facebook', 'Twitter / X'];

    const newScan: ScanRecord = {
      id: Date.now(),
      qr_id: code.id,
      slug: code.slug,
      qr_title: code.title,
      ip_hash: Math.random().toString(36).substring(2, 10),
      device: devices[Math.floor(Math.random() * devices.length)],
      os: oss[Math.floor(Math.random() * oss.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      scanned_at: new Date().toISOString(),
    };

    const scans = getLocalScans();
    scans.unshift(newScan);
    localStorage.setItem(STORAGE_SCANS_KEY, JSON.stringify(scans));

    const codes = getLocalCodes();
    const idx = codes.findIndex(c => c.slug === code.slug);
    if (idx !== -1) {
      codes[idx].scans_count = (codes[idx].scans_count || 0) + 1;
      localStorage.setItem(STORAGE_CODES_KEY, JSON.stringify(codes));
    }
  },
};
