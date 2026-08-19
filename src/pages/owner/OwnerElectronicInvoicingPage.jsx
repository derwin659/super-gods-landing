import { useEffect, useState } from 'react';
import { BadgeCheck, Building2, FileCheck2, KeyRound, ReceiptText, ShieldCheck } from 'lucide-react';
import { getElectronicInvoicingAccess, getElectronicInvoicingSettings, updateElectronicInvoicingSettings } from '../../api/electronicInvoicingApi';

const emptyForm = {
  fiscalRuc: '', legalName: '', commercialName: '', fiscalAddress: '', ubigeo: '',
  salesPointCode: 'GODS', annexCode: '0000', invoiceSeries: 'F001', receiptSeries: 'B001',
  nextInvoiceNumber: 1, nextReceiptNumber: 1, credentialAlias: 'PRODUCTION', igvRate: 18,
  enabled: false,
};

function Field({ label, value, onChange, type = 'text', hint, maxLength }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-800">{label}</span>
      <input type={type} value={value ?? ''} maxLength={maxLength} onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-14 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400 focus:bg-white" />
      {hint && <span className="mt-2 block text-xs font-semibold leading-5 text-neutral-500">{hint}</span>}
    </label>
  );
}

export default function OwnerElectronicInvoicingPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [credentialConfigured, setCredentialConfigured] = useState(false);
  const [access, setAccess] = useState(null);
  const isDemo = form.fiscalRuc === '20100100100' || form.credentialAlias === 'DEMO';
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    getElectronicInvoicingAccess().then((permission) => {
      setAccess(permission);
      if (!permission?.available) return null;
      return getElectronicInvoicingSettings();
    }).then((data) => {
      if (data) { setForm({ ...emptyForm, ...data }); setCredentialConfigured(Boolean(data.credentialConfigured)); }
    }).catch((reason) => setError(reason.message || 'No se pudo cargar la configuración tributaria.'))
      .finally(() => setLoading(false));
  }, []);

  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const data = await updateElectronicInvoicingSettings({
        ...form,
        fiscalRuc: form.fiscalRuc.trim(), ubigeo: form.ubigeo.trim(),
        invoiceSeries: form.invoiceSeries.trim().toUpperCase(), receiptSeries: form.receiptSeries.trim().toUpperCase(),
        nextInvoiceNumber: Number(form.nextInvoiceNumber), nextReceiptNumber: Number(form.nextReceiptNumber),
        igvRate: Number(form.igvRate),
      });
      setForm({ ...emptyForm, ...data }); setCredentialConfigured(Boolean(data.credentialConfigured));
      setMessage('Configuración tributaria guardada correctamente.');
    } catch (reason) { setError(reason.message || 'No se pudo guardar la configuración.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="rounded-3xl border border-neutral-200 bg-white p-6 font-bold text-neutral-500">Cargando configuración tributaria...</div>;

  if (!access?.available) return (
    <div className="rounded-[34px] border border-amber-200 bg-amber-50 p-8">
      <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Módulo adicional</div>
      <h1 className="mt-3 text-3xl font-black text-neutral-950">Facturación electrónica no activada</h1>
      <p className="mt-3 max-w-2xl font-semibold leading-7 text-neutral-600">{access?.message || 'Solicita la activación para conectar el RUC de este negocio con Mifact y SUNAT.'}</p>
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold text-neutral-700">La caja y las ventas siguen funcionando normalmente. No se generará ningún costo de proveedor mientras este tenant no esté autorizado.</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#090909,#172033)] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Facturación electrónica</div>
            <h1 className="mt-3 text-3xl font-black">Boletas y facturas desde cada venta</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/60">Configura el emisor, series y conexión con Mifact. Las credenciales permanecen protegidas en el backend.</p></div>
          <div className={`rounded-2xl px-4 py-3 text-sm font-black ${form.enabled && credentialConfigured ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 text-white/70'}`}>
            {form.enabled && credentialConfigured ? 'Lista para emitir' : 'Configuración incompleta'}
          </div>
        </div>
      </section>

      {isDemo && <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5 text-violet-900"><div className="font-black">Ambiente de demostración</div><p className="mt-1 text-sm font-semibold">Las emisiones usan el RUC demo de Mifact. No son comprobantes productivos de tu empresa.</p></div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
      {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">{message}</div>}

      <form onSubmit={save} className="space-y-5">
        <section className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3"><Building2 className="text-amber-600"/><div><h2 className="text-xl font-black">Datos del emisor</h2><p className="text-sm font-semibold text-neutral-500">Deben coincidir con la ficha RUC.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="RUC" value={form.fiscalRuc} maxLength={11} onChange={(v) => change('fiscalRuc', v.replace(/\D/g, ''))}/>
            <Field label="Razón social" value={form.legalName} onChange={(v) => change('legalName', v)}/>
            <Field label="Nombre comercial" value={form.commercialName} onChange={(v) => change('commercialName', v)}/>
            <Field label="Ubigeo SUNAT" value={form.ubigeo} maxLength={6} onChange={(v) => change('ubigeo', v.replace(/\D/g, ''))}/>
            <div className="md:col-span-2"><Field label="Domicilio fiscal" value={form.fiscalAddress} onChange={(v) => change('fiscalAddress', v)}/></div>
          </div>
        </section>

        <section className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3"><ReceiptText className="text-amber-600"/><div><h2 className="text-xl font-black">Series y correlativos</h2><p className="text-sm font-semibold text-neutral-500">Usa la continuación indicada por tu contador o proveedor.</p></div></div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Código punto de venta" value={form.salesPointCode} onChange={(v) => change('salesPointCode', v)}/>
            <Field label="Anexo emisor" value={form.annexCode} maxLength={4} onChange={(v) => change('annexCode', v)}/>
            <Field label="IGV %" type="number" value={form.igvRate} onChange={(v) => change('igvRate', v)}/>
            <Field label="Serie factura" value={form.invoiceSeries} maxLength={4} onChange={(v) => change('invoiceSeries', v)}/>
            <Field label="Siguiente factura" type="number" value={form.nextInvoiceNumber} onChange={(v) => change('nextInvoiceNumber', v)}/>
            <div/>
            <Field label="Serie boleta" value={form.receiptSeries} maxLength={4} onChange={(v) => change('receiptSeries', v)}/>
            <Field label="Siguiente boleta" type="number" value={form.nextReceiptNumber} onChange={(v) => change('nextReceiptNumber', v)}/>
          </div>
        </section>

        <section className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><KeyRound className="text-amber-600"/><div><h2 className="text-xl font-black">Conexión Mifact</h2><p className="text-sm font-semibold text-neutral-500">El alias referencia una variable segura del backend; aquí nunca se muestra el token.</p></div></div>
            <div className={`rounded-full px-4 py-2 text-xs font-black ${credentialConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{credentialConfigured ? 'Credencial encontrada' : 'Credencial ausente'}</div></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Alias de credencial" value={form.credentialAlias} onChange={(v) => change('credentialAlias', v.toUpperCase())}/>
            <label className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><div><div className="font-black">Habilitar emisión</div><div className="text-xs font-semibold text-neutral-500">Actívalo solo cuando datos, series y token sean correctos.</div></div><input type="checkbox" checked={Boolean(form.enabled)} onChange={(e) => change('enabled', e.target.checked)} className="h-6 w-6 accent-emerald-500"/></label></div>
        </section>

        <button disabled={saving} className="sticky bottom-4 w-full rounded-2xl bg-amber-400 px-6 py-5 text-lg font-black text-neutral-950 shadow-xl disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar configuración tributaria'}</button>
      </form>
    </div>
  );
}
