function rows({ items, details, formatDateTime, statusLabel }) {
  const cash = items.map((x) => ({ Caja: x.id, Estado: statusLabel(x.status), Apertura: formatDateTime(x.openedAt), Cierre: formatDateTime(x.closedAt), Responsable: x.assignedUserName || x.openedByUserName || '', AperturaMonto: Number(x.openingAmount || 0), Ventas: Number(x.salesTotal || 0), Ingresos: Number(x.movementsIncome || 0), Salidas: Number(x.movementsExpense || 0), Esperado: Number(x.closingAmountExpected || 0), Contado: Number(x.closingAmountCounted || 0), Diferencia: Number(x.differenceAmount || 0) }));
  const sales = details.flatMap(({ cash: box, sales: list }) => list.flatMap((sale) => (sale.items?.length ? sale.items : [null]).map((item) => ({ Caja: box.id, Fecha: formatDateTime(sale.fechaCreacion || sale.createdAt || sale.saleDate), Cliente: sale.customerName || sale.clienteNombre || 'Cliente general', Item: item?.name || item?.nombre || item?.serviceName || item?.productName || '', Profesional: item?.barberName || item?.barberUserName || sale.barberName || sale.barberUserName || 'Sin profesional', Cantidad: Number(item?.quantity || item?.cantidad || 1), PrecioUnitario: Number(item?.unitPrice || item?.precioUnitario || item?.price || 0), TotalVenta: Number(sale.total || sale.totalAmount || 0), Metodo: sale.metodoPago || sale.paymentMethod || '' }))));
  const movements = details.flatMap(({ cash: box, movements: list }) => list.map((x) => ({ Caja: box.id, Fecha: formatDateTime(x.movementDate), Tipo: x.type || '', Concepto: x.concept || '', Profesional: x.barberUserName || '', Metodo: x.paymentMethod || '', Origen: x.fromPaymentMethod || '', Destino: x.toPaymentMethod || '', Monto: Number(x.amount || 0), Nota: x.note || '' })));
  return { cash, sales, movements };
}

function xml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function worksheet(name, data) {
  const headers = data.length ? Object.keys(data[0]) : ['Sin registros'];
  const row = (values, header = false) => `<Row>${values.map((value) => `<Cell${header ? ' ss:StyleID="Header"' : ''}><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${xml(value)}</Data></Cell>`).join('')}</Row>`;
  return `<Worksheet ss:Name="${xml(name)}"><Table>${row(headers, true)}${data.map((item) => row(headers.map((key) => item[key] ?? ''))).join('')}</Table></Worksheet>`;
}

export function exportCashHistoryExcel(payload) {
  const data = rows(payload);
  const content = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#111111" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1"/></Style></Styles>${worksheet('Cajas', data.cash)}${worksheet('Ventas', data.sales)}${worksheet('Movimientos', data.movements)}</Workbook>`;
  const url = URL.createObjectURL(new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `historial-caja-${payload.from}-${payload.to}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

function table(doc, autoTable, title, data) {
  doc.addPage();
  doc.setFontSize(15);
  doc.text(title, 14, 18);
  const headers = data.length ? Object.keys(data[0]) : ['Sin registros'];
  autoTable(doc, { startY: 24, head: [headers], body: data.map((row) => headers.map((key) => row[key] ?? '')), styles: { fontSize: 6.5, cellPadding: 1.6 }, headStyles: { fillColor: [18, 18, 18] }, margin: { left: 8, right: 8 } });
}

export async function exportCashHistoryPdf(payload) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const data = rows(payload);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(18);
  doc.text('Historial de caja', 14, 15);
  doc.setFontSize(10);
  doc.text(`${payload.branch?.name || 'Sede'} | ${payload.from} a ${payload.to}`, 14, 21);
  const headers = data.cash.length ? Object.keys(data.cash[0]) : ['Sin registros'];
  autoTable(doc, { startY: 27, head: [headers], body: data.cash.map((row) => headers.map((key) => row[key] ?? '')), styles: { fontSize: 6.5, cellPadding: 1.6 }, headStyles: { fillColor: [18, 18, 18] } });
  table(doc, autoTable, 'Ventas', data.sales);
  table(doc, autoTable, 'Movimientos', data.movements);
  doc.save(`historial-caja-${payload.from}-${payload.to}.pdf`);
}
