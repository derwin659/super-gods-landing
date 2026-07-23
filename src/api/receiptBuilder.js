function text(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
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
    lines.push(`${pad(`Pago ${text(payment?.method)}`, money(payment?.amount, currency), width)}\n`);
  });
  if (Number(sale?.cashReceived || 0) > 0) lines.push(`${pad('Recibido', money(sale.cashReceived, currency), width)}\n`);
  if (Number(sale?.changeAmount || 0) > 0) lines.push(`${pad('Vuelto', money(sale.changeAmount, currency), width)}\n`);
  if (Number(sale?.puntosGanados || 0) > 0) lines.push(`Puntos ganados: ${sale.puntosGanados}\n`);
  lines.push(`${'-'.repeat(width)}\n`);
  lines.push('\x1B\x61\x01');
  lines.push(`${center(settings.disclaimer || 'No es comprobante de pago', width)}\n`);
  lines.push(`${center(settings.footer || 'Gracias por su visita', width)}\n\n\n`);
  lines.push('\x1D\x56\x00');
  return lines.join('');
}

export function drawerCommand(preset = 'EPSON') {
  if (String(preset).toUpperCase() === 'STAR') return '\x1B\x07';
  return '\x1B\x70\x00\x19\xFA';
}
