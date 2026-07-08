function text(value, fallback = '') {
  const clean = value == null ? '' : String(value);
  return clean.trim() || fallback;
}

function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return `S/ ${number(value).toFixed(2)}`;
}

function statusLabel(status) {
  const code = text(status, 'NEW').toUpperCase();
  if (code === 'VIP') return 'VIP';
  if (code === 'FREQUENT') return 'Frecuente';
  if (code === 'INACTIVE') return 'Inactivo';
  return 'Nuevo';
}

function xmlEscape(value) {
  return text(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function sheet(name, rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const headers = safeRows.length ? Object.keys(safeRows[0]) : ['Sin datos'];
  const body = safeRows.length
    ? safeRows.map((row) => `<Row>${headers.map((key) => `<Cell><Data ss:Type="String">${xmlEscape(row[key])}</Data></Cell>`).join('')}</Row>`).join('')
    : '<Row><Cell><Data ss:Type="String">Sin registros para estos filtros</Data></Cell></Row>';

  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table><Row>${headers.map((key) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${xmlEscape(key)}</Data></Cell>`).join('')}</Row>${body}</Table></Worksheet>`;
}

function downloadBlob(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function reportRows(payload = {}) {
  const report = payload.report || {};
  const summary = report.summary || {};
  const items = Array.isArray(report.items) ? report.items : [];
  const filterRows = [
    { Campo: 'Registro desde', Valor: text(payload.from, 'Todos') },
    { Campo: 'Registro hasta', Valor: text(payload.to, 'Todos') },
    { Campo: 'Sede', Valor: text(payload.branchName, 'Todas') },
    { Campo: 'Segmento', Valor: text(payload.statusLabel, 'Todos') },
    { Campo: 'Ultima visita desde', Valor: text(payload.lastVisitFrom, 'Todos') },
    { Campo: 'Ultima visita hasta', Valor: text(payload.lastVisitTo, 'Todos') },
  ];

  const summaryRows = [
    { Metrica: 'Nuevos registrados', Valor: number(summary.totalRegistered) },
    { Metrica: 'Periodo anterior', Valor: number(summary.previousRegistered) },
    { Metrica: 'Variacion %', Valor: `${number(summary.registeredVariationPercent).toFixed(1)}%` },
    { Metrica: 'Filtrados visibles', Valor: number(summary.totalFiltered) },
    { Metrica: 'VIP', Valor: number(summary.vipCustomers) },
    { Metrica: 'Frecuentes', Valor: number(summary.frequentCustomers) },
    { Metrica: 'Nuevos', Valor: number(summary.newCustomers) },
    { Metrica: 'Inactivos +60 dias', Valor: number(summary.inactiveCustomers) },
    { Metrica: 'WhatsApp marketing', Valor: number(summary.withMarketingWhatsapp) },
    { Metrica: 'Bajas WhatsApp', Valor: number(summary.optedOutWhatsapp) },
    { Metrica: 'Valor total', Valor: money(summary.totalSpent) },
    { Metrica: 'Ticket promedio', Valor: money(summary.averageSpent) },
  ];

  const customerRows = items.map((item) => ({
    Cliente: text(item.fullName, 'Cliente'),
    Telefono: text(item.phone, 'Sin telefono'),
    Segmento: statusLabel(item.status),
    Sede: text(item.branchName, 'Sin sede'),
    'Fecha registro': text(item.registeredAt, '-').slice(0, 10),
    'Ultima visita': text(item.lastVisit, '-').slice(0, 10),
    Visitas: number(item.visits),
    'Valor total': money(item.totalSpent),
    'Puntos acumulados': number(item.points),
    'WhatsApp marketing': item.whatsappMarketingEnabled ? 'Si' : 'No',
    'Baja WhatsApp': item.whatsappOptedOut ? 'Si' : 'No',
  }));

  return { filterRows, summaryRows, customerRows };
}

function filename(payload, extension) {
  const segment = text(payload.statusLabel, 'todos').toLowerCase().replaceAll(' ', '-');
  const date = new Date().toISOString().slice(0, 10);
  return `clientes-${segment}-${date}.${extension}`;
}

export function exportCustomerReportExcel(payload = {}) {
  const rows = reportRows(payload);
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Color="#FFFFFF" ss:Bold="1"/><Interior ss:Color="#111827" ss:Pattern="Solid"/></Style></Styles>${sheet('Filtros', rows.filterRows)}${sheet('Resumen', rows.summaryRows)}${sheet('Clientes', rows.customerRows)}</Workbook>`;
  downloadBlob(xml, filename(payload, 'xls'), 'application/vnd.ms-excel;charset=utf-8');
}

export async function exportCustomerReportPdf(payload = {}) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const rows = reportRows(payload);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 30, 'F');
  doc.setTextColor(245, 196, 81);
  doc.setFontSize(18);
  doc.text('Reporte segmentado de clientes', 12, 13);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`${text(payload.statusLabel, 'Todos')} | ${text(payload.branchName, 'Todas las sedes')} | ${text(payload.from, 'sin inicio')} a ${text(payload.to, 'hoy')}`, 12, 22);

  autoTable(doc, {
    startY: 36,
    head: [['Metrica', 'Valor']],
    body: rows.summaryRows.map((row) => [row.Metrica, row.Valor]),
    styles: { fontSize: 8, cellPadding: 2, textColor: [31, 41, 55] },
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 196, 81] },
    margin: { left: 8, right: 8 },
  });

  doc.addPage();
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(15);
  doc.text('Clientes filtrados', 12, 15);
  const headers = rows.customerRows.length ? Object.keys(rows.customerRows[0]) : ['Sin datos'];
  autoTable(doc, {
    startY: 22,
    head: [headers],
    body: rows.customerRows.length ? rows.customerRows.map((row) => headers.map((key) => row[key] ?? '')) : [['Sin registros para estos filtros']],
    styles: { fontSize: 7, cellPadding: 1.7, textColor: [31, 41, 55] },
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 196, 81] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 6, right: 6 },
  });

  doc.save(filename(payload, 'pdf'));
}