import { useEffect, useState } from 'react';
import { Cable, Printer, Save, TestTube2 } from 'lucide-react';
import { listPrinters, openDrawerManual, printTestReceipt, isQzConnected } from '../../services/qzPrinterService';
import { readPrinterSettings, savePrinterSettings } from '../../utils/printerSettingsStorage';

export default function OwnerPrinterSettingsPage() {
  const [form, setForm] = useState(readPrinterSettings);
  const [printers, setPrinters] = useState([]);
  const [status, setStatus] = useState(isQzConnected() ? 'Conectado' : 'Desconectado');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function refreshPrinters() {
    setBusy(true); setMessage('');
    try {
      const result = await listPrinters();
      setPrinters(result);
      setStatus('Conectado');
      if (!form.printerName && result[0]) setForm((x) => ({ ...x, printerName: result[0] }));
    } catch (error) {
      setStatus('QZ Tray no disponible');
      setMessage(error?.message || 'Instala y abre QZ Tray en esta computadora.');
    } finally { setBusy(false); }
  }

  useEffect(() => { refreshPrinters(); }, []);

  function save() {
    savePrinterSettings(form);
    setMessage('Configuración guardada en esta computadora.');
  }

  async function testPrint() {
    setBusy(true); setMessage('');
    try { await printTestReceipt(form); setMessage('Ticket de prueba enviado.'); }
    catch (error) { setMessage(error?.message || 'No se pudo imprimir.'); }
    finally { setBusy(false); }
  }

  async function testDrawer() {
    setBusy(true); setMessage('');
    try { await openDrawerManual(form); setMessage('Pulso de gaveta enviado.'); }
    catch (error) { setMessage(error?.message || 'No se pudo abrir la gaveta.'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <section className="rounded-[32px] bg-neutral-950 p-6 text-white">
      <div className="flex items-center gap-3"><Printer/><div><h1 className="text-2xl font-black">Impresora y gaveta</h1><p className="text-sm text-white/60">Configuración local para esta computadora.</p></div></div>
      <div className="mt-4 inline-flex rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold">QZ Tray: {status}</div>
    </section>
    <section className="grid gap-5 rounded-[32px] border border-neutral-200 bg-white p-6 lg:grid-cols-2">
      <label className="space-y-2"><span className="text-sm font-black">Activar impresión</span><input type="checkbox" checked={form.enabled} onChange={(e)=>setForm({...form,enabled:e.target.checked})}/></label>
      <label className="space-y-2"><span className="text-sm font-black">Impresora</span><select className="w-full rounded-2xl border p-3" value={form.printerName} onChange={(e)=>setForm({...form,printerName:e.target.value})}><option value="">Selecciona</option>{printers.map((p)=><option key={p}>{p}</option>)}</select></label>
      <label className="space-y-2"><span className="text-sm font-black">Papel</span><select className="w-full rounded-2xl border p-3" value={form.paperWidth} onChange={(e)=>setForm({...form,paperWidth:Number(e.target.value)})}><option value={80}>80 mm</option><option value={58}>58 mm</option></select></label>
      <label className="space-y-2"><span className="text-sm font-black">Pulso de gaveta</span><select className="w-full rounded-2xl border p-3" value={form.drawerPulse} onChange={(e)=>setForm({...form,drawerPulse:e.target.value})}><option value="EPSON">ESC/POS Epson</option><option value="STAR">Star</option></select></label>
      <label className="flex items-center gap-3"><input type="checkbox" checked={form.autoPrint} onChange={(e)=>setForm({...form,autoPrint:e.target.checked})}/><span className="font-bold">Imprimir al aprobar venta</span></label>
      <label className="flex items-center gap-3"><input type="checkbox" checked={form.autoOpenDrawer} onChange={(e)=>setForm({...form,autoOpenDrawer:e.target.checked})}/><span className="font-bold">Abrir gaveta cuando haya efectivo</span></label>
      <label className="space-y-2 lg:col-span-2"><span className="text-sm font-black">Pie del ticket</span><input className="w-full rounded-2xl border p-3" value={form.footer} onChange={(e)=>setForm({...form,footer:e.target.value})}/></label>
      <div className="flex flex-wrap gap-3 lg:col-span-2"><button className="rounded-2xl bg-neutral-950 px-5 py-3 font-black text-white" onClick={save}><Save className="mr-2 inline" size={18}/>Guardar</button><button disabled={busy} className="rounded-2xl border px-5 py-3 font-black" onClick={refreshPrinters}><Cable className="mr-2 inline" size={18}/>Buscar impresoras</button><button disabled={busy||!form.printerName} className="rounded-2xl border px-5 py-3 font-black" onClick={testPrint}><TestTube2 className="mr-2 inline" size={18}/>Ticket de prueba</button><button disabled={busy||!form.printerName} className="rounded-2xl border px-5 py-3 font-black" onClick={testDrawer}>Abrir gaveta de prueba</button></div>
      {message && <div className="lg:col-span-2 rounded-2xl bg-neutral-100 p-4 text-sm font-bold">{message}</div>}
    </section>
  </div>;
}
