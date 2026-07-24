function text(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function money(value, currency = 'PEN') {
  const symbols = { PEN: 'S/', USD: '$', EUR: '€', VES: 'Bs', COP: '$', MXN: '$' };
  return `${symbols[currency] || currency} ${Number(value || 0).toFixed(2)}`;
}

function pad(left, right, width) {
  const a = text(left);
  const b = text(right);
  const spaces = Math.max(1, width - a.length - b.length);
  return `${a}${' '.repeat(spaces)}${b}`.slice(0, width);
}

function center(value, width) {
  const v = text(value).slice(0, width);
  return `${' '.repeat(Math.max(0, Math.floor((width - v.length) / 2)))}${v}`;
}

function itemName(item) {
  return text(item?.serviceName || item?.serviceNombre || item?.productName || item?.nombreItem || 'Item');
}

function paymentMethodLabel(value) {
  const code = String(value || '').trim().toUpperCase();
  const labels = {
    CASH: 'Efectivo',
    EFECTIVO: 'Efectivo',
    YAPE: 'Yape',
    PLIN: 'Plin',
    CARD: 'Tarjeta',
    TARJETA: 'Tarjeta',
    TRANSFER: 'Transferencia',
    TRANSFERENCIA: 'Transferencia',
    MIXED: 'Pago mixto',
    FREE: 'Gratis',
  };
  return labels[code] || text(value) || 'Otro';
}

export function createTestSale() {
  return {
    saleId: 'PRUEBA',
    tenantName: 'Super Gods',
    tenantLogoUrl: '/logo-super-gods.png',
    branchName: 'Prueba de impresión',
    branchAddress: 'Dirección del negocio',
    fechaCreacion: new Date().toISOString(),
    customerName: 'Cliente de prueba',
    barberName: 'Profesional de prueba',
    items: [
      {
        serviceName: 'Servicio de prueba',
        cantidad: 1,
        precioUnitario: 10,
        subtotal: 10,
      },
    ],
    subtotal: 10,
    total: 10,
    cashReceived: 20,
    changeAmount: 10,
    payments: [{ method: 'CASH', amount: 10 }],
    puntosGanados: 50,
    puntosDisponibles: 250,
    currency: 'PEN',
    paymentValidationStatus: 'APPROVED',
  };
}

export function saleHasCashPayment(sale, configured = ['CASH']) {
  const allowed = new Set((configured || []).map((x) => String(x).trim().toUpperCase()));
  const normalize = (x) => String(x || '').trim().toUpperCase().replace('EFECTIVO', 'CASH');
  const payments = Array.isArray(sale?.payments) ? sale.payments : [];
  if (payments.some((p) => Number(p?.amount || 0) > 0 && allowed.has(normalize(p?.method)))) return true;
  return allowed.has(normalize(sale?.metodoPago));
}

export function buildEscPosReceipt(sale, settings = {}) {
  const width = Number(settings.paperWidth) === 58 ? 32 : 48;
  const currency = sale?.currency || 'PEN';
  const lines = [];
  lines.push('\x1B\x40');
  lines.push('\x1B\x61\x01');
  lines.push('\x1B\x45\x01');
  lines.push(`${center(sale?.tenantName || 'Super Gods', width)}\n`);
  lines.push('\x1B\x45\x00');
  if (sale?.branchName) lines.push(`${center(sale.branchName, width)}\n`);
  if (sale?.branchAddress) lines.push(`${center(sale.branchAddress, width)}\n`);
  if (sale?.branchPhone) lines.push(`${center(`Tel: ${sale.branchPhone}`, width)}\n`);
  lines.push(`${'-'.repeat(width)}\n`);
  lines.push('\x1B\x61\x00');
  lines.push(`Venta #${sale?.saleId || '-'}\n`);
  lines.push(`Fecha: ${new Date(sale?.fechaCreacion || Date.now()).toLocaleString('es-PE')}\n`);
  lines.push(`Cliente: ${text(sale?.customerName || 'Cliente ocasional')}\n`);
  lines.push(`Profesional: ${text(sale?.barberName || '-')}\n`);
  lines.push(`${'-'.repeat(width)}\n`);
  (sale?.items || []).forEach((item) => {
    const qty = Number(item?.cantidad || 1);
    lines.push(`${itemName(item).slice(0, width)}\n`);
    lines.push(`${pad(`${qty} x ${money(item?.precioUnitario, currency)}`, money(item?.subtotal, currency), width)}\n`);
    if (item?.barberUserName) lines.push(`  ${text(item.barberUserName).slice(0, width - 2)}\n`);
  });
  lines.push(`${'-'.repeat(width)}\n`);
  lines.push(`${pad('Subtotal', money(sale?.subtotal, currency), width)}\n`);
  if (Number(sale?.discount || 0) > 0) lines.push(`${pad('Descuento', `-${money(sale.discount, currency)}`, width)}\n`);
  if (Number(sale?.depositApplied || 0) > 0) lines.push(`${pad('Inicial aplicada', `-${money(sale.depositApplied, currency)}`, width)}\n`);
  if (Number(sale?.tipAmount || 0) > 0) lines.push(`${pad('Propina', money(sale.tipAmount, currency), width)}\n`);
  lines.push('\x1B\x45\x01');
  lines.push(`${pad('TOTAL', money(sale?.total, currency), width)}\n`);
  lines.push('\x1B\x45\x00');
  (sale?.payments || []).forEach((payment) => {
    lines.push(`${pad(`Pago ${paymentMethodLabel(payment?.method)}`, money(payment?.amount, currency), width)}\n`);
  });
  if (Number(sale?.cashReceived || 0) > 0) lines.push(`${pad('Recibido', money(sale.cashReceived, currency), width)}\n`);
  if (Number(sale?.changeAmount || 0) > 0) lines.push(`${pad('Vuelto', money(sale.changeAmount, currency), width)}\n`);
  if (settings.showPoints !== false) {
    if (Number(sale?.puntosGanados || 0) > 0) lines.push(`Puntos ganados: +${sale.puntosGanados}\n`);
    if (sale?.puntosDisponibles !== null && sale?.puntosDisponibles !== undefined) {
      lines.push(`Puntos disponibles: ${Number(sale.puntosDisponibles || 0)}\n`);
    }
  }
  lines.push(`${'-'.repeat(width)}\n`);
  lines.push('\x1B\x61\x01');

  if (settings.showAppQr !== false && settings.deferQrImage === true) {
    lines.push(`${center(settings.appQrCaption || 'Descarga la app Super Gods', width)}\n`);
    lines.push(`${center('Android / iOS', width)}\n\n`);
    return lines.join('');
  }

  lines.push(`${center(settings.disclaimer || 'No es comprobante de pago', width)}\n`);
  lines.push(`${center(settings.footer || 'Gracias por su visita', width)}\n\n\n`);
  lines.push('\x1D\x56\x00');
  return lines.join('');
}

export function buildEscPosReceiptAfterQr(sale, settings = {}) {
  const width = Number(settings.paperWidth) === 58 ? 32 : 48;
  const lines = ['\n'];
  lines.push('\x1B\x61\x01');
  const tenantCode = text(sale?.tenantCode || sale?.codigoTenant || sale?.businessCode || '');
  if (tenantCode) lines.push(`${center(`Código del negocio: ${tenantCode}`, width)}\n`);
  lines.push(`${center(settings.disclaimer || 'No es comprobante de pago', width)}\n`);
  lines.push(`${center(settings.footer || 'Gracias por su visita', width)}\n\n\n`);
  lines.push('\x1D\x56\x00');
  return lines.join('');
}

export function buildReceiptPreviewHtml(sale, settings = {}) {
  const currency = sale?.currency || 'PEN';
  const paperWidth = Number(settings.paperWidth) === 58 ? 58 : 80;
  const items = Array.isArray(sale?.items) ? sale.items : [];
  const payments = Array.isArray(sale?.payments) ? sale.payments : [];

  const itemRows = items.map((item) => {
    const quantity = Number(item?.cantidad || 1);
    return `
      <div class="item">
        <div class="item-name">${escapeHtml(itemName(item))}</div>
        <div class="row"><span>${quantity} × ${escapeHtml(money(item?.precioUnitario, currency))}</span><strong>${escapeHtml(money(item?.subtotal, currency))}</strong></div>
        ${item?.barberUserName ? `<div class="muted">${escapeHtml(item.barberUserName)}</div>` : ''}
      </div>`;
  }).join('');

  const paymentRows = payments.map((payment) => `
    <div class="row"><span>${escapeHtml(paymentMethodLabel(payment?.method))}</span><span>${escapeHtml(money(payment?.amount, currency))}</span></div>
  `).join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vista previa ticket #${escapeHtml(sale?.saleId || 'PRUEBA')}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #eceff3; color: #111; font-family: Arial, Helvetica, sans-serif; }
    .toolbar { position: sticky; top: 0; z-index: 2; display: flex; gap: 10px; justify-content: center; padding: 14px; background: #111; }
    .toolbar button { border: 0; border-radius: 12px; padding: 11px 18px; font-weight: 800; cursor: pointer; }
    .ticket { width: ${paperWidth}mm; min-height: 120mm; margin: 24px auto; padding: 7mm 5mm; background: white; box-shadow: 0 16px 45px rgba(0,0,0,.18); font-size: ${paperWidth === 58 ? 11 : 12}px; }
    .center { text-align: center; }
    .logo-wrap { margin-bottom: 6px; }
    .logo { display: inline-block; max-width: 34mm; max-height: 18mm; object-fit: contain; filter: grayscale(1) contrast(1.25); }
    .business { font-size: 1.45em; font-weight: 900; }
    .branch { margin-top: 3px; font-weight: 700; }
    .muted { color: #555; font-size: .92em; }
    .separator { border-top: 1px dashed #222; margin: 9px 0; }
    .row { display: flex; justify-content: space-between; gap: 12px; margin: 4px 0; }
    .item { margin: 8px 0; }
    .item-name { font-weight: 800; overflow-wrap: anywhere; }
    .total { font-size: 1.25em; font-weight: 900; }
    .loyalty { font-weight: 700; }
    .qr-block { margin: 12px auto 4px; text-align: center; }
    .qr-caption { font-weight: 900; margin-bottom: 6px; }
    .qr-image { width: ${paperWidth === 58 ? 42 : 48}mm; max-width: 100%; height: auto; object-fit: contain; filter: grayscale(1) contrast(1.25); }
    .footer { margin-top: 12px; line-height: 1.45; }
    @media print {
      @page { size: ${paperWidth}mm auto; margin: 0; }
      body { background: white; }
      .toolbar { display: none; }
      .ticket { margin: 0; box-shadow: none; width: ${paperWidth}mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
    <button onclick="window.close()">Cerrar</button>
  </div>
  <main class="ticket">
    ${settings.printLogo !== false && sale?.tenantLogoUrl ? `<div class="center logo-wrap"><img class="logo" src="${escapeHtml(sale.tenantLogoUrl)}" alt="Logo" /></div>` : ''}
    <div class="center business">${escapeHtml(sale?.tenantName || 'Super Gods')}</div>
    ${sale?.branchName ? `<div class="center branch">${escapeHtml(sale.branchName)}</div>` : ''}
    ${sale?.branchAddress ? `<div class="center muted">${escapeHtml(sale.branchAddress)}</div>` : ''}
    ${sale?.branchPhone ? `<div class="center muted">Tel: ${escapeHtml(sale.branchPhone)}</div>` : ''}
    <div class="separator"></div>
    <div>Venta #${escapeHtml(sale?.saleId || '-')}</div>
    <div>Fecha: ${escapeHtml(new Date(sale?.fechaCreacion || Date.now()).toLocaleString('es-PE'))}</div>
    <div>Cliente: ${escapeHtml(sale?.customerName || 'Cliente ocasional')}</div>
    <div>Profesional: ${escapeHtml(sale?.barberName || '-')}</div>
    <div class="separator"></div>
    ${itemRows || '<div class="muted">Sin artículos</div>'}
    <div class="separator"></div>
    <div class="row"><span>Subtotal</span><span>${escapeHtml(money(sale?.subtotal, currency))}</span></div>
    ${Number(sale?.discount || 0) > 0 ? `<div class="row"><span>Descuento</span><span>-${escapeHtml(money(sale.discount, currency))}</span></div>` : ''}
    ${Number(sale?.depositApplied || 0) > 0 ? `<div class="row"><span>Inicial aplicada</span><span>-${escapeHtml(money(sale.depositApplied, currency))}</span></div>` : ''}
    ${Number(sale?.tipAmount || 0) > 0 ? `<div class="row"><span>Propina</span><span>${escapeHtml(money(sale.tipAmount, currency))}</span></div>` : ''}
    <div class="row total"><span>TOTAL</span><span>${escapeHtml(money(sale?.total, currency))}</span></div>
    ${paymentRows}
    ${Number(sale?.cashReceived || 0) > 0 ? `<div class="row"><span>Recibido</span><span>${escapeHtml(money(sale.cashReceived, currency))}</span></div>` : ''}
    ${Number(sale?.changeAmount || 0) > 0 ? `<div class="row"><span>Vuelto</span><span>${escapeHtml(money(sale.changeAmount, currency))}</span></div>` : ''}
    ${settings.showPoints !== false && Number(sale?.puntosGanados || 0) > 0 ? `<div class="row loyalty"><span>Puntos ganados</span><strong>+${escapeHtml(sale.puntosGanados)}</strong></div>` : ''}
    ${settings.showPoints !== false && sale?.puntosDisponibles !== null && sale?.puntosDisponibles !== undefined ? `<div class="row loyalty"><span>Puntos disponibles</span><strong>${escapeHtml(Number(sale.puntosDisponibles || 0))}</strong></div>` : ''}
    ${settings.showAppQr !== false ? `
      <div class="separator"></div>
      <div class="qr-block">
        <div class="qr-caption">${escapeHtml(settings.appQrCaption || 'Descarga la app Super Gods')}</div>
        <div class="muted">Android / iOS</div>
        <img class="qr-image" src="${escapeHtml(settings.appQrImageUrl || '/super-gods-app-qr.png')}" alt="QR para descargar Super Gods" />
        ${(sale?.tenantCode || sale?.codigoTenant || sale?.businessCode) ? `<div class="muted">Código del negocio: ${escapeHtml(sale?.tenantCode || sale?.codigoTenant || sale?.businessCode)}</div>` : ''}
      </div>` : ''}
    <div class="separator"></div>
    <div class="center footer">
      <div>${escapeHtml(settings.disclaimer || 'No es comprobante de pago')}</div>
      <strong>${escapeHtml(settings.footer || 'Gracias por su visita')}</strong>
    </div>
  </main>
</body>
</html>`;
}

export function drawerCommand(preset = 'EPSON') {
  if (String(preset).toUpperCase() === 'STAR') return '\x1B\x07';
  return '\x1B\x70\x00\x19\xFA';
}
