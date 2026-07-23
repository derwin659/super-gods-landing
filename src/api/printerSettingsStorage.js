const STORAGE_KEY = 'SUPER_GODS_PRINTER_SETTINGS_V1';

export const DEFAULT_PRINTER_SETTINGS = {
  enabled: false,
  printerName: '',
  paperWidth: 80,
  autoPrint: true,
  autoOpenDrawer: true,
  drawerPaymentMethods: ['CASH'],
  drawerPulse: 'EPSON',
  printLogo: false,
  footer: 'Gracias por su visita',
  disclaimer: 'No es comprobante de pago',
};

export function readPrinterSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_PRINTER_SETTINGS };
  } catch {
    return { ...DEFAULT_PRINTER_SETTINGS };
  }
}

export function savePrinterSettings(settings) {
  const clean = { ...DEFAULT_PRINTER_SETTINGS, ...(settings || {}) };
  clean.paperWidth = Number(clean.paperWidth) === 58 ? 58 : 80;
  clean.drawerPaymentMethods = Array.isArray(clean.drawerPaymentMethods)
    ? clean.drawerPaymentMethods.map((x) => String(x).trim().toUpperCase())
    : ['CASH'];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  return clean;
}
