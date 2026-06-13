import { QRCodeSVG } from 'qrcode.react';

export function QRCorner() {
  const controllerUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/controller`
      : '/controller';

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-center">
      <QRCodeSVG value={controllerUrl} size={120} bgColor="#00000000" fgColor="#ffffff" level="M" />
      <span className="text-white text-[11px] mt-1" style={{ opacity: 0.4 }}>
        Scan to create
      </span>
    </div>
  );
}
