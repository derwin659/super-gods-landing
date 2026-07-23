import qz from 'qz-tray';
import { buildEscPosReceipt, drawerCommand, saleHasCashPayment } from './receiptBuilder';
import { readPrinterSettings } from './printerSettingsStorage';
import { registerDrawerEvent, registerReceiptEvent } from './ownerCashApi';

export async function connectQz() {
  if (!qz.websocket.isActive()) await qz.websocket.connect({ retries: 2, delay: 1 });
  return true;
}

export function isQzConnected() {
  return qz.websocket.isActive();
}

export async function listPrinters() {
  await connectQz();
  const printers = await qz.printers.find();
  return Array.isArray(printers) ? printers : [printers].filter(Boolean);
}

async function rawPrint(printerName, data) {
  await connectQz();
  const config = qz.configs.create(printerName, { encoding: 'UTF-8', copies: 1 });
  return qz.print(config, [{ type: 'raw', format: 'command', flavor: 'plain', data }]);
}

export async function printSaleReceipt(sale, { action = 'PRINT', openDrawer = false, branchId = null } = {}) {
  const settings = readPrinterSettings();
  if (!settings.enabled || !settings.printerName) return { skipped: true };
  const saleId = sale?.saleId || sale?.id;
  try {
    await rawPrint(settings.printerName, buildEscPosReceipt(sale, settings));
    if (saleId) await registerReceiptEvent({ branchId, saleId, action, success: true, printerName: settings.printerName });
  } catch (error) {
    if (saleId) await registerReceiptEvent({ branchId, saleId, action: 'PRINT_FAILED', success: false, printerName: settings.printerName, message: error?.message }).catch(() => {});
    throw error;
  }

  if (openDrawer && settings.autoOpenDrawer && saleHasCashPayment(sale, settings.drawerPaymentMethods)) {
    try {
      await rawPrint(settings.printerName, drawerCommand(settings.drawerPulse));
      if (saleId) await registerDrawerEvent({ branchId, saleId, action: 'DRAWER_AUTO', success: true, printerName: settings.printerName });
    } catch (error) {
      if (saleId) await registerDrawerEvent({ branchId, saleId, action: 'DRAWER_FAILED', success: false, printerName: settings.printerName, message: error?.message }).catch(() => {});
      throw error;
    }
  }
  return { printed: true };
}

export async function autoPrintApprovedSale(sale, { branchId = null } = {}) {
  const settings = readPrinterSettings();
  const status = String(sale?.paymentValidationStatus || '').trim().toUpperCase();
  if (!settings.enabled || !settings.autoPrint || status !== 'APPROVED') return { skipped: true };
  try {
    return await printSaleReceipt(sale, { action: 'PRINT', openDrawer: true, branchId });
  } catch (error) {
    console.error('Venta guardada, pero falló la impresión:', error);
    return { printed: false, error };
  }
}

export async function openDrawerManual({ printerName, drawerPulse = 'EPSON' }) {
  return rawPrint(printerName, drawerCommand(drawerPulse));
}

export async function printTestReceipt({ printerName, paperWidth = 80 }) {
  return rawPrint(printerName, buildEscPosReceipt({ saleId: 'PRUEBA', tenantName: 'Super Gods', branchName: 'Prueba de impresora', fechaCreacion: new Date().toISOString(), items: [{ serviceName: 'Servicio de prueba', cantidad: 1, precioUnitario: 10, subtotal: 10 }], subtotal: 10, total: 10, payments: [{ method: 'CASH', amount: 10 }], currency: 'PEN' }, { paperWidth, disclaimer: 'Ticket de prueba', footer: 'Impresora conectada correctamente' }));
}
