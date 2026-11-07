import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, Check } from 'lucide-react';

interface QRCodeWidgetProps {
  value: string;
  title?: string;
  subtitle?: string;
  size?: number;
}

export const QRCodeWidget: React.FC<QRCodeWidgetProps> = ({
  value,
  title = 'Scan to Pay via Mobile Banking / MFS',
  subtitle = 'Open bKash, Nagad, Rocket, or any banking app and scan QR code',
  size = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff',
        },
      }, (error) => {
        if (error) console.error('Error generating QR code:', error);
      });
    }
  }, [value, size]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'payment-qr-code.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col items-center text-center space-y-4">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dynamic Payment QR</span>
        </div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-600 max-w-xs">{subtitle}</p>}
      </div>

      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-inner inline-block">
        <canvas ref={canvasRef} className="rounded-xl block mx-auto shadow-2xs" />
      </div>

      <div className="w-full space-y-2 pt-1">
        <div className="bg-slate-100 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-700 break-all border border-slate-200 select-all">
          {value}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadQR}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
