import { useEffect, useState } from 'react';
import { Cable, Eye, Printer, Save, TestTube2 } from 'lucide-react';
import {
  isQzConnected,
  isVirtualPrinter,
  listPrinters,
  openDrawerManual,
  previewTestReceipt,
  printTestReceipt,
} from '../../services/qzPrinterService';
import {
  readPrinterSettings,
  savePrinterSettings,
} from '../../utils/printerSettingsStorage';

export default function OwnerPrinterSettingsPage() {
  const [form, setForm] = useState(readPrinterSettings);
  const [printers, setPrinters] = useState([]);
  const [status, setStatus] = useState(isQzConnected() ? 'Conectado' : 'Desconectado');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const virtualPrinter = isVirtualPrinter(form.printerName);

  async function refreshPrinters() {
    setBusy(true);
    setMessage('');
    try {
      const result = await listPrinters();
      setPrinters(result);
      setStatus('Conectado');
      if (!form.printerName && result[0]) {
        setForm((current) => ({ ...current, printerName: result[0] }));
      }
    } catch (error) {
      setStatus('QZ Tray no disponible');
      setMessage(error?.message || 'Instala y abre QZ Tray en esta computadora.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refreshPrinters();
    // Se ejecuta una sola vez al abrir la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save() {
    savePrinterSettings(form);
    setMessage(
      virtualPrinter
        ? 'Configuración guardada. Las ventas abrirán una vista previa porque seleccionaste una impresora virtual.'
        : 'Configuración guardada en esta computadora.'
    );
  }

  function previewTicket() {
    setMessage('');
    try {
      previewTestReceipt(form);
      setMessage('Vista previa abierta en una nueva pestaña.');
    } catch (error) {
      setMessage(error?.message || 'No se pudo abrir la vista previa.');
    }
  }

  async function testPrint() {
    setBusy(true);
    setMessage('');
    try {
      const result = await printTestReceipt(form);
      setMessage(
        result?.previewed
          ? 'Se abrió la vista previa porque la impresora seleccionada es virtual.'
          : 'Ticket de prueba enviado a la impresora.'
      );
    } catch (error) {
      setMessage(error?.message || 'No se pudo imprimir.');
    } finally {
      setBusy(false);
    }
  }

  async function testDrawer() {
    setBusy(true);
    setMessage('');
    try {
      await openDrawerManual(form);
      setMessage('Pulso de gaveta enviado.');
    } catch (error) {
      setMessage(error?.message || 'No se pudo abrir la gaveta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-neutral-950 p-6 text-white">
        <div className="flex items-center gap-3">
          <Printer />
          <div>
            <h1 className="text-2xl font-black">Impresora y gaveta</h1>
            <p className="text-sm text-white/60">Configuración local para esta computadora.</p>
          </div>
        </div>
        <div className="mt-4 inline-flex rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold">
          QZ Tray: {status}
        </div>
      </section>

      <section className="grid gap-5 rounded-[32px] border border-neutral-200 bg-white p-6 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-black">Activar impresión</span>
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black">Impresora</span>
          <select
            className="w-full rounded-2xl border p-3"
            value={form.printerName}
            onChange={(event) => setForm({ ...form, printerName: event.target.value })}
          >
            <option value="">Selecciona</option>
            {printers.map((printer) => (
              <option key={printer}>{printer}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black">Papel</span>
          <select
            className="w-full rounded-2xl border p-3"
            value={form.paperWidth}
            onChange={(event) => setForm({ ...form, paperWidth: Number(event.target.value) })}
          >
            <option value={80}>80 mm</option>
            <option value={58}>58 mm</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black">Pulso de gaveta</span>
          <select
            className="w-full rounded-2xl border p-3"
            value={form.drawerPulse}
            disabled={virtualPrinter}
            onChange={(event) => setForm({ ...form, drawerPulse: event.target.value })}
          >
            <option value="EPSON">ESC/POS Epson</option>
            <option value="STAR">Star</option>
          </select>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.printLogo !== false}
            onChange={(event) => setForm({ ...form, printLogo: event.target.checked })}
          />
          <span className="font-bold">Mostrar logo en el ticket</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.showPoints !== false}
            onChange={(event) => setForm({ ...form, showPoints: event.target.checked })}
          />
          <span className="font-bold">Mostrar puntos ganados y disponibles</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.showAppQr !== false}
            onChange={(event) => setForm({ ...form, showAppQr: event.target.checked })}
          />
          <span className="font-bold">Mostrar QR para descargar la app</span>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black">Texto del QR</span>
          <input
            className="w-full rounded-2xl border p-3"
            value={form.appQrCaption || ''}
            onChange={(event) => setForm({ ...form, appQrCaption: event.target.value })}
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.autoPrint}
            onChange={(event) => setForm({ ...form, autoPrint: event.target.checked })}
          />
          <span className="font-bold">Imprimir al aprobar venta</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.autoOpenDrawer}
            disabled={virtualPrinter}
            onChange={(event) => setForm({ ...form, autoOpenDrawer: event.target.checked })}
          />
          <span className="font-bold">Abrir gaveta cuando haya efectivo</span>
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-black">Pie del ticket</span>
          <input
            className="w-full rounded-2xl border p-3"
            value={form.footer}
            onChange={(event) => setForm({ ...form, footer: event.target.value })}
          />
        </label>

        {virtualPrinter && (
          <div className="lg:col-span-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-800">
            Seleccionaste una impresora virtual. Super Gods abrirá una vista previa legible en lugar de enviar comandos ESC/POS. La gaveta queda desactivada en este modo.
          </div>
        )}

        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <button
            type="button"
            className="rounded-2xl bg-neutral-950 px-5 py-3 font-black text-white"
            onClick={save}
          >
            <Save className="mr-2 inline" size={18} />
            Guardar
          </button>

          <button
            type="button"
            disabled={busy}
            className="rounded-2xl border px-5 py-3 font-black disabled:opacity-50"
            onClick={refreshPrinters}
          >
            <Cable className="mr-2 inline" size={18} />
            Buscar impresoras
          </button>

          <button
            type="button"
            className="rounded-2xl border px-5 py-3 font-black"
            onClick={previewTicket}
          >
            <Eye className="mr-2 inline" size={18} />
            Vista previa
          </button>

          <button
            type="button"
            disabled={busy || !form.printerName}
            className="rounded-2xl border px-5 py-3 font-black disabled:opacity-50"
            onClick={testPrint}
          >
            <TestTube2 className="mr-2 inline" size={18} />
            {virtualPrinter ? 'Probar vista previa' : 'Ticket de prueba'}
          </button>

          <button
            type="button"
            disabled={busy || !form.printerName || virtualPrinter}
            className="rounded-2xl border px-5 py-3 font-black disabled:opacity-50"
            onClick={testDrawer}
          >
            Abrir gaveta de prueba
          </button>
        </div>

        {message && (
          <div className="lg:col-span-2 rounded-2xl bg-neutral-100 p-4 text-sm font-bold">
            {message}
          </div>
        )}
      </section>
    </div>
  );
}
