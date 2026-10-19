export type DotType = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';

export type CornerSquareType = 'square' | 'dot' | 'extra-rounded' | 'rounded' | 'leaf' | 'heavy' | 'dotted';

export type CornerDotType = 'square' | 'dot' | 'rounded' | 'leaf' | 'diamond' | 'grid' | 'teardrop';

export type DownloadFormat = 'png' | 'svg' | 'pdf';

export interface QRStyleConfig {
  pattern: DotType;
  cornerSquare: CornerSquareType;
  cornerDot: CornerDotType;
  patternColor: string;
  bgColor: string;
  isTransparent: boolean;
  logoUrl?: string;
  logoSize?: number; // 0.1 to 0.5
  logoMargin?: number;
}

export interface QRCodeData {
  id?: number;
  slug: string;
  title: string;
  qr_type: 'website' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone';
  target_url: string;
  short_url?: string;
  style_config: QRStyleConfig;
  scans_count?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface ScanRecord {
  id: number;
  qr_id: number;
  slug: string;
  qr_title?: string;
  ip_hash: string;
  device: string;
  os: string;
  browser: string;
  referrer: string;
  scanned_at: string;
}

export interface AnalyticsData {
  total_scans: number;
  unique_scans: number;
  devices: { name: string; count: number }[];
  os: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  daily: { date: string; count: number }[];
  recent_scans: ScanRecord[];
}
