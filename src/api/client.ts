import { QRCodeData, AnalyticsData, ScanRecord } from '../types';

declare global {
  interface Window {
    qrStudioData?: {
      isWp: boolean;
      isAdmin: boolean;
      restUrl: string;
      nonce: string;
      siteUrl: string;
      adminUrl: string;
    };
  }
}

const isWp = typeof window !== 'undefined' && Boolean(window.qrStudioData?.isWp);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const config = window.qrStudioData!;
  const res = await fetch(`${config.restUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce, ...options.headers },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'The request failed. Please reload and try again.');
  }
  return json.data;
}

function normalizeCode(code: QRCodeData): QRCodeData {
  return {
    ...code,
    id: Number(code.id),
    scans_count: Number(code.scans_count || 0),
    is_active: Boolean(Number(code.is_active)),
  };
}

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
      return (await request<QRCodeData[]>('codes')).map(normalizeCode);
    }
    return getLocalCodes();
  },

  async saveCode(code: Partial<QRCodeData>): Promise<QRCodeData> {
    if (isWp && window.qrStudioData) {
      return normalizeCode(await request<QRCodeData>('codes', {
        method: 'POST',
        body: JSON.stringify(code),
      }));
    }

    const list = getLocalCodes();
    if (code.slug !== undefined && !/^[a-zA-Z0-9_-]{1,64}$/.test(code.slug)) {
      throw new Error('Use 1–64 letters, numbers, hyphens or underscores for the QR Code Link.');
    }
    if (list.some(c => c.id !== code.id && c.slug.toLowerCase() === code.slug?.toLowerCase())) {
      throw new Error('This QR Code Link is already in use. Choose another link.');
    }
    let saved: QRCodeData;
    if (code.id) {
      const idx = list.findIndex(c => c.id === code.id);
      if (idx < 0) throw new Error('QR code not found. Reload My Codes and try again.');
      saved = { ...list[idx], ...code } as QRCodeData;
      saved.short_url = buildShortUrl(saved.slug);
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
      await request(`codes/${id}`, { method: 'DELETE' });
      return true;
    }

    const list = getLocalCodes().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_CODES_KEY, JSON.stringify(list));
    return true;
  },

  async getAnalytics(qrId?: number): Promise<AnalyticsData> {
    if (isWp && window.qrStudioData) {
      return request<AnalyticsData>(`analytics${qrId ? `?qr_id=${qrId}` : ''}`);
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

};
