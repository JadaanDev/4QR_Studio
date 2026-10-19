import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling, { DotType as QRDotType, CornerSquareType as QRCornerSquareType, CornerDotType as QRCornerDotType } from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import { Download, Check, Sparkles, Copy, QrCode, Link2, Image as ImageIcon } from 'lucide-react';
import { QRStyleConfig, DownloadFormat } from '../../types';

interface QRPreviewProps {
  dataUrl: string;
  shortUrl: string;
  activeEncodedUrl: string;
  styleConfig: QRStyleConfig;
  onSimulateScan?: () => void;
}

export const QRPreview: React.FC<QRPreviewProps> = ({
  dataUrl,
  shortUrl,
  activeEncodedUrl,
  styleConfig,
  onSimulateScan,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);

  const [format, setFormat] = useState<DownloadFormat>('png');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [scanAlert, setScanAlert] = useState(false);

  // Map application corner types to qr-code-styling accepted options
  const mapCornerSquare = (type: string): QRCornerSquareType => {
    switch (type) {
      case 'dot':
        return 'dot';
      case 'extra-rounded':
      case 'rounded':
      case 'leaf':
        return 'extra-rounded';
      case 'square':
      case 'heavy':
      case 'dotted':
      default:
        return 'square';
    }
  };

  const mapCornerDot = (type: string): QRCornerDotType => {
    switch (type) {
      case 'dot':
      case 'rounded':
      case 'teardrop':
      case 'leaf':
        return 'dot';
      case 'square':
      case 'diamond':
      case 'grid':
      default:
        return 'square';
    }
  };

  const mapPattern = (type: string): QRDotType => {
    switch (type) {
      case 'rounded':
        return 'rounded';
      case 'dots':
        return 'dots';
      case 'classy':
        return 'classy';
      case 'classy-rounded':
        return 'classy-rounded';
      case 'extra-rounded':
        return 'extra-rounded';
      case 'square':
      default:
        return 'square';
    }
  };

  const encodedData = activeEncodedUrl || shortUrl || dataUrl || 'https://example.com';

  useEffect(() => {
    const qr = new QRCodeStyling({
      width: 280,
      height: 280,
      type: 'svg',
      data: encodedData,
      image: styleConfig.logoUrl || undefined,
      dotsOptions: {
        color: styleConfig.patternColor,
        type: mapPattern(styleConfig.pattern),
      },
      cornersSquareOptions: {
        color: styleConfig.patternColor,
        type: mapCornerSquare(styleConfig.cornerSquare),
      },
      cornersDotOptions: {
        color: styleConfig.patternColor,
        type: mapCornerDot(styleConfig.cornerDot),
      },
      backgroundOptions: {
        color: styleConfig.isTransparent ? 'transparent' : styleConfig.bgColor,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: styleConfig.logoMargin ?? 6,
        imageSize: styleConfig.logoSize ?? 0.35,
        hideBackgroundDots: true,
      },
    });

    qrCodeInstance.current = qr;

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qr.append(qrRef.current);
    }
  }, []);

  // Update QR instance when styles or data change
  useEffect(() => {
    if (!qrCodeInstance.current) return;

    qrCodeInstance.current.update({
      data: encodedData,
      image: styleConfig.logoUrl || undefined,
      dotsOptions: {
        color: styleConfig.patternColor,
        type: mapPattern(styleConfig.pattern),
      },
      cornersSquareOptions: {
        color: styleConfig.patternColor,
        type: mapCornerSquare(styleConfig.cornerSquare),
      },
      cornersDotOptions: {
        color: styleConfig.patternColor,
        type: mapCornerDot(styleConfig.cornerDot),
      },
      backgroundOptions: {
        color: styleConfig.isTransparent ? 'transparent' : styleConfig.bgColor,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: styleConfig.logoMargin ?? 6,
        imageSize: styleConfig.logoSize ?? 0.35,
        hideBackgroundDots: true,
      },
    });
  }, [encodedData, styleConfig]);

  const handleDownload = async () => {
    if (!qrCodeInstance.current) return;
    setIsDownloading(true);

    try {
      const fileName = `qr-code-${Date.now()}`;

      if (format === 'pdf') {
        const rawSvg = qrRef.current?.querySelector('svg');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // Convert SVG to high-res canvas for PDF insertion
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');

        if (rawSvg && ctx) {
          const svgData = new XMLSerializer().serializeToString(rawSvg);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const URL = window.URL || window.webkitURL || window;
          const blobURL = URL.createObjectURL(svgBlob);
          const img = new Image();

          await new Promise<void>((resolve) => {
            img.onload = () => {
              if (!styleConfig.isTransparent) {
                ctx.fillStyle = styleConfig.bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              URL.revokeObjectURL(blobURL);
              resolve();
            };
            img.src = blobURL;
          });

          const imgData = canvas.toDataURL('image/png');
          pdf.setFontSize(22);
          pdf.setTextColor(30, 41, 59);
          pdf.text('Dynamic QR Code', 105, 30, { align: 'center' });
          pdf.setFontSize(11);
          pdf.setTextColor(100, 116, 139);
          pdf.text(`Scan link: ${encodedData}`, 105, 38, { align: 'center' });
          pdf.addImage(imgData, 'PNG', 45, 50, 120, 120);

          pdf.setFontSize(9);
          pdf.setTextColor(148, 163, 184);
          pdf.text('Generated with QR Studio for WordPress', 105, 275, { align: 'center' });
          pdf.save(`${fileName}.pdf`);
        }
      } else {
        await qrCodeInstance.current.download({
          name: fileName,
          extension: format,
        });
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(encodedData);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyImage = async () => {
    const rawSvg = qrRef.current?.querySelector('svg');
    if (!rawSvg) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(rawSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      const img = new Image();

      await new Promise<void>((resolve) => {
        img.onload = () => {
          if (!styleConfig.isTransparent) {
            ctx.fillStyle = styleConfig.bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(blobURL);
          resolve();
        };
        img.src = blobURL;
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2000);
        } catch (e) {
          console.warn('Clipboard write image not permitted, copied URL instead:', e);
          handleCopyLink();
        }
      });
    } catch (err) {
      console.error('Copy image error:', err);
    }
  };

  const handleTestScan = () => {
    if (onSimulateScan) {
      onSimulateScan();
      setScanAlert(true);
      setTimeout(() => setScanAlert(false), 3000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 qr-preview-shadow border border-slate-100 flex flex-col items-center">
      {/* Live QR Render Area */}
      <div className="relative w-[280px] h-[280px] flex items-center justify-center p-2 rounded-2xl transition-all duration-300">
        <div ref={qrRef} className="flex items-center justify-center transition-transform hover:scale-105 duration-200" />
      </div>

      {/* Direct copyable link bar under QR */}
      <div className="w-full max-w-xs mt-3 flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
        <span className="font-mono text-slate-600 truncate max-w-[200px]" title={encodedData}>
          {encodedData}
        </span>
        <button
          type="button"
          onClick={handleCopyLink}
          title="Copy link of this QR code"
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer pl-2"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Format Selector Pills */}
      <div className="flex items-center justify-center gap-2 mt-4 w-full max-w-xs">
        {(['png', 'svg', 'pdf'] as DownloadFormat[]).map((fmt) => (
          <button
            key={fmt}
            type="button"
            onClick={() => setFormat(fmt)}
            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
              format === fmt
                ? 'bg-blue-50 text-blue-600 border border-blue-500 shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Primary Action Buttons: Download + Copy Link */}
      <div className="w-full max-w-xs mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md hover:shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : downloadSuccess ? (
            <>
              <Check className="w-5 h-5 text-white" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Download</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy QR Link'}</span>
          </button>

          {/* Copy Image Button */}
          <button
            type="button"
            onClick={handleCopyImage}
            className="py-2.5 px-3 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ImageIcon className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Link Tester / Scanner simulation */}
      <div className="w-full max-w-xs mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Analytics Testing
          </span>
          <span className="text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
            Trackable
          </span>
        </div>

        <button
          type="button"
          onClick={handleTestScan}
          className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5 text-slate-500" />
          Simulate Camera Scan (+1 Analytics)
        </button>

        {scanAlert && (
          <div className="p-2 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg text-center animate-fade-in border border-emerald-200">
            ✓ Scan recorded! Check the Analytics tab.
          </div>
        )}
      </div>
    </div>
  );
};
