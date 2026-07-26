'use client';

import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeWrapper({ value }: { value: string }) {
  return <QRCodeSVG value={value} size={160} level="H" />;
}