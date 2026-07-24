import {
  buildEscPosReceipt,
  buildEscPosReceiptAfterQr,
  buildReceiptPreviewHtml,
  createTestSale,
  drawerCommand,
  saleHasCashPayment,
} from '../utils/receiptBuilder';
import { readPrinterSettings } from '../utils/printerSettingsStorage';
import {
  registerDrawerEvent,
  registerReceiptEvent,
} from '../api/ownerCashApi';


function resolveAssetUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  try {
    return new URL(raw, window.location.origin).href;
  } catch {
    return raw;
  }
}

function buildNativeEscPosQr(value, { moduleSize = 5, errorCorrection = 49 } = {}) {
  const data = String(value || '').trim();
  if (!data) throw new Error('No se configuró la URL del QR.');

  const gs = '\x1D';
  const storeLength = data.length + 3;
  const pL = String.fromCharCode(storeLength & 0xff);
  const pH = String.fromCharCode((storeLength >> 8) & 0xff);

  return [
    '\x1B\x61\x01',                         // centrar
    `${gs}(k\x04\x00\x31\x41\x32\x00`, // modelo QR 2
    `${gs}(k\x03\x00\x31\x43${String.fromCharCode(moduleSize)}`,
    `${gs}(k\x03\x00\x31\x45${String.fromCharCode(errorCorrection)}`,
    `${gs}(k${pL}${pH}\x31\x50\x30${data}`,
    `${gs}(k\x03\x00\x31\x51\x30`,
    '\n',
  ].join('');
}

function getQz() {
  const qz = window.qz;

  if (!qz) {
    throw new Error(
      'QZ Tray no está cargado. Verifica public/qz-tray.js y la etiqueta <script src="/qz-tray.js"> en index.html.'
    );
  }

  if (!qz.websocket || !qz.printers || !qz.configs || !qz.print) {
    throw new Error('La librería QZ Tray se cargó de forma incompleta.');
  }

  return qz;
}

export function isVirtualPrinter(printerName) {
  const name = String(printerName || '').trim().toUpperCase();
  return [
    'MICROSOFT PRINT TO PDF',
    'MICROSOFT XPS DOCUMENT WRITER',
    'ONENOTE',
    'FAX',
  ].some((virtualName) => name.includes(virtualName));
}

export function openReceiptPreview(sale, settings = {}) {
  const normalizedSale = {
    ...(sale || {}),
    tenantLogoUrl: resolveAssetUrl(sale?.tenantLogoUrl || sale?.logoUrl),
  };
  const normalizedSettings = {
    ...settings,
    appQrImageUrl: resolveAssetUrl(settings.appQrImageUrl || '/super-gods-app-qr.png'),
  };
  const html = buildReceiptPreviewHtml(normalizedSale, normalizedSettings);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const previewUrl = URL.createObjectURL(blob);

  const preview = window.open(previewUrl, '_blank', 'width=620,height=900');

  if (!preview) {
    URL.revokeObjectURL(previewUrl);
    throw new Error('El navegador bloqueó la vista previa. Permite ventanas emergentes para este sitio.');
  }

  // Esperamos para que la pestaña termine de leer el Blob antes de liberar la URL.
  window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
  return preview;
}

export async function connectQz() {
  const qz = getQz();

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect({ retries: 3, delay: 1 });
  }

  return true;
}

export function isQzConnected() {
  try {
    const qz = getQz();
    return Boolean(qz.websocket.isActive());
  } catch {
    return false;
  }
}

export async function listPrinters() {
  const qz = getQz();
  await connectQz();

  const printers = await qz.printers.find();
  return Array.isArray(printers) ? printers : [printers].filter(Boolean);
}

async function qzPrint(printerName, data) {
  if (!printerName) {
    throw new Error('Selecciona una impresora antes de imprimir.');
  }

  const jobs = Array.isArray(data) ? data : [{
    type: 'raw',
    format: 'command',
    flavor: 'plain',
    data,
  }];

  if (jobs.length === 0) {
    throw new Error('No hay datos para enviar a la impresora.');
  }

  if (isVirtualPrinter(printerName)) {
    throw new Error('Las impresoras virtuales no aceptan comandos ESC/POS. Usa Vista previa del ticket.');
  }

  const qz = getQz();
  await connectQz();

  const config = qz.configs.create(printerName, {
    encoding: 'UTF-8',
    copies: 1,
  });

  return qz.print(config, jobs);
}

async function printThermalReceipt(printerName, sale, settings) {
  const logoUrl = resolveAssetUrl(sale?.tenantLogoUrl || sale?.logoUrl);
  const qrData = String(settings.appQrUrl || 'https://www.supergodsapp.com/').trim();
  const is58 = Number(settings.paperWidth) === 58;

  // El logo es opcional. Si falla, continuamos sin volver a imprimir el ticket.
  if (settings.printLogo !== false && logoUrl) {
    try {
      await qzPrint(printerName, '\x1B\x61\x01\n');
      await qzPrint(printerName, [{
        type: 'pixel',
        format: 'image',
        flavor: 'file',
        data: logoUrl,
        options: {
          language: 'ESCPOS',
          dotDensity: 'double',
          pageWidth: is58 ? 384 : 576,
          imageWidth: is58 ? 72 : 120,
          interpolation: 'nearest-neighbor',
        },
      }]);
      await qzPrint(printerName, '\n');
    } catch (logoError) {
      console.warn('No se pudo imprimir el logo; se continuará con el ticket.', logoError);
    }
  }

  const withQr = settings.showAppQr !== false && Boolean(qrData);

  // Imprime siempre la parte principal actualizada: detalle, pagos y puntos.
  await qzPrint(printerName, buildEscPosReceipt(sale, {
    ...settings,
    deferQrImage: withQr,
  }));

  if (withQr) {
    try {
      const moduleSize = is58 ? 4 : 6;
      await qzPrint(printerName, buildNativeEscPosQr(qrData, { moduleSize }));
    } catch (qrError) {
      console.warn('No se pudo imprimir el QR nativo; se imprimirá la URL como texto.', qrError);
      await qzPrint(printerName, `\x1B\x61\x01${qrData}\n`);
    }

    // El pie siempre se imprime, incluso si el QR nativo no es compatible.
    await qzPrint(printerName, buildEscPosReceiptAfterQr(sale, settings));
  }

  return { printed: true };
}

export function previewSaleReceipt(sale, settings = readPrinterSettings()) {
  return openReceiptPreview(sale, settings);
}

export function previewTestReceipt(settings = {}) {
  return openReceiptPreview(createTestSale(), {
    ...settings,
    disclaimer: 'Vista previa de prueba',
    footer: settings.footer || 'Gracias por su visita',
  });
}

export async function printSaleReceipt(
  sale,
  { action = 'PRINT', openDrawer = false, branchId = null } = {}
) {
  const settings = readPrinterSettings();

  if (!settings.enabled || !settings.printerName) {
    return { skipped: true };
  }

  const saleId = sale?.saleId || sale?.id;

  if (isVirtualPrinter(settings.printerName)) {
    try {
      openReceiptPreview(sale, settings);
      if (saleId) {
        await registerReceiptEvent({
          branchId,
          saleId,
          action: 'PREVIEW',
          success: true,
          printerName: settings.printerName,
          message: 'Vista previa abierta; no se enviaron comandos ESC/POS.',
        });
      }
      return { previewed: true };
    } catch (error) {
      if (saleId) {
        await registerReceiptEvent({
          branchId,
          saleId,
          action: 'PREVIEW_FAILED',
          success: false,
          printerName: settings.printerName,
          message: error?.message,
        }).catch(() => {});
      }
      throw error;
    }
  }

  try {
    await printThermalReceipt(settings.printerName, sale, settings);

    if (saleId) {
      await registerReceiptEvent({
        branchId,
        saleId,
        action,
        success: true,
        printerName: settings.printerName,
      });
    }
  } catch (error) {
    if (saleId) {
      await registerReceiptEvent({
        branchId,
        saleId,
        action: 'PRINT_FAILED',
        success: false,
        printerName: settings.printerName,
        message: error?.message,
      }).catch(() => {});
    }

    throw error;
  }

  const shouldOpenDrawer =
    openDrawer &&
    settings.autoOpenDrawer &&
    saleHasCashPayment(sale, settings.drawerPaymentMethods);

  if (shouldOpenDrawer) {
    try {
      await qzPrint(settings.printerName, drawerCommand(settings.drawerPulse));

      if (saleId) {
        await registerDrawerEvent({
          branchId,
          saleId,
          action: 'DRAWER_AUTO',
          success: true,
          printerName: settings.printerName,
        });
      }
    } catch (error) {
      if (saleId) {
        await registerDrawerEvent({
          branchId,
          saleId,
          action: 'DRAWER_FAILED',
          success: false,
          printerName: settings.printerName,
          message: error?.message,
        }).catch(() => {});
      }

      throw error;
    }
  }

  return { printed: true };
}

export async function autoPrintApprovedSale(sale, { branchId = null } = {}) {
  const settings = readPrinterSettings();
  const status = String(sale?.paymentValidationStatus || '').trim().toUpperCase();

  if (!settings.enabled || !settings.autoPrint || status !== 'APPROVED') {
    return { skipped: true };
  }

  try {
    return await printSaleReceipt(sale, {
      action: 'PRINT',
      openDrawer: true,
      branchId,
    });
  } catch (error) {
    console.error('Venta guardada, pero falló la impresión o vista previa:', error);
    return { printed: false, error };
  }
}

export async function openDrawerManual({ printerName, drawerPulse = 'EPSON' }) {
  if (isVirtualPrinter(printerName)) {
    throw new Error('Una impresora virtual no puede abrir una gaveta.');
  }
  return qzPrint(printerName, drawerCommand(drawerPulse));
}

export async function printTestReceipt({ printerName, paperWidth = 80, footer = 'Gracias por su visita', printLogo = true, showPoints = true, showAppQr = true, appQrImageUrl = '/super-gods-app-qr.png', appQrUrl = 'https://www.supergodsapp.com/', appQrCaption = 'Descarga la app Super Gods' }) {
  const testSale = createTestSale();
  const settings = {
    paperWidth,
    disclaimer: 'Ticket de prueba',
    footer,
    printLogo,
    showPoints,
    showAppQr,
    appQrImageUrl,
    appQrUrl,
    appQrCaption,
  };

  if (isVirtualPrinter(printerName)) {
    openReceiptPreview(testSale, settings);
    return { previewed: true };
  }

  return printThermalReceipt(printerName, testSale, settings);
}
