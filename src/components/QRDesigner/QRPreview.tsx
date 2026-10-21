import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling, { DotType as QRDotType, CornerSquareType as QRCornerSquareType, CornerDotType as QRCornerDotType } from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import { Download, Check, Copy, Link2, Image as ImageIcon } from 'lucide-react';
import { QRStyleConfig, DownloadFormat } from '../../types';

interface QRPreviewProps {
  dataUrl: string;
  shortUrl: string;
  activeEncodedUrl: string;
  styleConfig: QRStyleConfig;
  exportDisabled: boolean;
}

export const QRPreview: React.FC<QRPreviewProps> = ({
  dataUrl,
  shortUrl,
  activeEncodedUrl,
  styleConfig,
  exportDisabled,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<QRCodeStyling | null>(null);

  const [format, setFormat] = useState<DownloadFormat>('png');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

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
    if (!qrCodeInstance.current || exportDisabled) return;
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
          const URL = window.URL;
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
    if (exportDisabled) return;
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
    if (!rawSvg || exportDisabled) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(rawSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL;
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

  return (
    <div className="bg-[#0b0c0e] rounded-3xl p-6 md:p-8 border border-[#23252d] shadow-2xl flex flex-col items-center">
      {/* Live QR Render Area with high-contrast scanner backing */}
      <div className="relative flex items-center justify-center p-3 rounded-2xl bg-white shadow-lg transition-transform hover:scale-102 duration-200">
        <div ref={qrRef} className="qr-studio-preview flex items-center justify-center" />
      </div>

      {/* Direct copyable link bar under QR */}
      <div className="w-full max-w-xs mt-4 flex items-center justify-between bg-[#101115] border border-[#23252d] rounded-xl px-3 py-1.5 text-xs">
        <span className="font-mono text-[#22d3ee] truncate max-w-[160px]" title={encodedData}>
          {encodedData}
        </span>
        <button
          type="button"
          disabled={exportDisabled}
          onClick={handleCopyLink}
          title="Copy link of this QR code"
          className="text-[#22d3ee] hover:text-[#06b6d4] font-semibold flex items-center gap-1 cursor-pointer pl-2"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
            className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
              format === fmt
                ? 'bg-[#0891b2]/20 text-[#22d3ee] border border-[#0891b2] shadow-sm'
                : 'bg-[#101115] text-[#9fa0aa] hover:text-white hover:bg-[#16171c] border border-[#23252d]'
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
          disabled={isDownloading || exportDisabled}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-[#0891b2] hover:bg-[#06b6d4] active:bg-[#0891b2] transition-all shadow-md hover:shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : downloadSuccess ? (
            <>
              <Check className="w-5 h-5 text-emerald-300" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>{exportDisabled ? 'Save before downloading' : `Download ${format.toUpperCase()}`}</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* Copy Link Button */}
          <button
            type="button"
            disabled={exportDisabled}
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl font-semibold text-xs text-[#ccccd2] hover:text-white bg-[#101115] hover:bg-[#16171c] border border-[#23252d] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5 text-[#22d3ee]" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy QR Link'}</span>
          </button>

          {/* Copy Image Button */}
          <button
            type="button"
            disabled={exportDisabled}
            onClick={handleCopyImage}
            className="py-2.5 px-3 rounded-xl font-semibold text-xs text-[#ccccd2] hover:text-white bg-[#101115] hover:bg-[#16171c] border border-[#23252d] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ImageIcon className="w-3.5 h-3.5 text-[#22d3ee]" />}
            <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
