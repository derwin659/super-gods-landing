import { useEffect, useState } from 'react';
import { ClipboardCopy, History, Megaphone, Send, ShieldCheck, Trash2, Users } from 'lucide-react';
import { getCampaignHistory, getCampaignPreview, runConfirmedCampaigns, runSegmentCampaign } from '../../api/ownerMarketingCampaignsApi';

export default function OwnerCampaignOperationsPanel() {
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [importedDraft, setImportedDraft] = useState(null);
  const [segmentTitle, setSegmentTitle] = useState('Tenemos algo especial para ti');
  const [segmentMessage, setSegmentMessage] = useState('Hola, tenemos una campana especial para ti. Responde este mensaje para coordinar tu visita.');
  const [sendingSegment, setSendingSegment] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextPreview, nextHistory] = await Promise.all([getCampaignPreview(), getCampaignHistory()]);
      setPreview(nextPreview);
      setHistory(Array.isArray(nextHistory) ? nextHistory : []);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las campanas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    try {
      const raw = window.sessionStorage.getItem('ownerCustomerCampaignDraft');
      if (raw) setImportedDraft(JSON.parse(raw));
    } catch {
      setImportedDraft(null);
    }
  }, []);

  const clearImportedDraft = () => {
    window.sessionStorage.removeItem('ownerCustomerCampaignDraft');
    setImportedDraft(null);
  };

  const copyImportedPhones = async () => {
    const phones = (importedDraft?.customers || [])
      .map((item) => String(item.phone || '').trim())
      .filter(Boolean)
      .join('\n');

    if (!phones) return;

    try {
      await navigator.clipboard.writeText(phones);
      window.alert('Telefonos copiados. Revisa el mensaje antes de enviarlo.');
    } catch {
      window.alert(phones);
    }
  };

  const runImportedSegment = async () => {
    const customers = importedDraft?.customers || [];
    const customerIds = customers.map((item) => item.id).filter(Boolean);
    if (!customerIds.length) {
      window.alert('La audiencia no tiene clientes validos para registrar.');
      return;
    }
    if (!segmentMessage.trim()) {
      window.alert('Escribe el mensaje de la campana.');
      return;
    }

    const ready = importedDraft?.counts?.marketingReady || 0;
    const needsConsent = importedDraft?.counts?.needsConsent || 0;
    if (!window.confirm(`Se registrara una campana para ${ready} clientes con permiso marketing. ${needsConsent} quedaran excluidos si no tienen consentimiento. ¿Confirmas?`)) return;

    setSendingSegment(true);
    setError('');
    try {
      const result = await runSegmentCampaign({
        title: segmentTitle,
        message: segmentMessage,
        customerIds,
        filterSnapshot: {
          status: importedDraft.status,
          counts: importedDraft.counts,
          createdFrom: 'OWNER_CUSTOMERS_REPORT',
        },
        channelWhatsapp: true,
      });
      window.alert(`${result?.queued || 0} mensajes registrados. Excluidos: consentimiento ${result?.withoutConsent || 0}, sin telefono ${result?.noPhone || 0}, anti-spam ${result?.cooldown || 0}.`);
      clearImportedDraft();
      await load();
    } catch (e) {
      setError(e.message || 'No se pudo registrar la campana segmentada.');
    } finally {
      setSendingSegment(false);
    }
  };

  const run = async () => {
    const eligible = Number(preview?.eligible || 0);
    if (!window.confirm(`Se programaran ${eligible} mensajes elegibles. ¿Confirmas el envio?`)) return;
    setSending(true);
    setError('');
    try {
      const result = await runConfirmedCampaigns();
      window.alert(`${result?.sent || 0} mensajes programados.`);
      await load();
    } catch (e) {
      setError(e.message || 'No se pudo ejecutar la campana.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-[32px] border border-amber-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,.08)]">
      <div className="bg-gradient-to-br from-neutral-950 via-slate-900 to-amber-950 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Automatizacion VIP</p>
            <h2 className="mt-2 text-2xl font-black">Campanas de recuperacion</h2>
            <p className="mt-1 text-sm font-semibold text-white/60">Revisa el alcance real antes de enviar.</p>
          </div>
          <button onClick={run} disabled={loading || sending || Number(preview?.eligible || 0) === 0} className="flex items-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 font-black text-neutral-950 disabled:opacity-40"><Send size={18}/>{sending ? 'Procesando...' : 'Revisar y enviar'}</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[[Megaphone,'Campanas',preview?.campaigns],[Users,'Elegibles',preview?.eligible],[ShieldCheck,'Sin permiso',preview?.withoutConsent],[History,'Anti-spam',preview?.cooldown]].map(([Icon,label,value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4"><Icon size={18} className="text-amber-300"/><p className="mt-3 text-xs font-black uppercase tracking-wider text-white/50">{label}</p><p className="mt-1 text-2xl font-black">{loading ? '-' : value || 0}</p></div>)}
        </div>
      </div>
      <div className="p-6">
        {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">{error}</div>}
        {importedDraft ? (
          <div className="mb-5 overflow-hidden rounded-[26px] border border-amber-200 bg-amber-50 shadow-sm">
            <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Audiencia importada</p>
                <h3 className="mt-1 text-xl font-black text-neutral-950">Borrador desde reporte de clientes</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-neutral-600">No se envio nada. Esta audiencia queda como preview para revisar mensaje y destinatarios antes de cualquier envio.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-white px-3 py-2 text-neutral-800">{importedDraft.counts?.filtered || 0} filtrados</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-2 text-emerald-800">{importedDraft.counts?.eligible || 0} con telefono</span>
                  <span className="rounded-full bg-blue-100 px-3 py-2 text-blue-800">{importedDraft.counts?.marketingReady || 0} con permiso marketing</span>
                  <span className="rounded-full bg-yellow-100 px-3 py-2 text-yellow-800">{importedDraft.counts?.needsConsent || 0} requieren revisar permiso</span>
                  <span className="rounded-full bg-red-100 px-3 py-2 text-red-700">{importedDraft.counts?.excluded || 0} excluidos</span>
                  <span className="rounded-full bg-white px-3 py-2 text-neutral-800">Segmento: {importedDraft.status || 'Todos'}</span>
                  {importedDraft.counts?.capped ? <span className="rounded-full bg-orange-100 px-3 py-2 text-orange-800">Audiencia limitada a 500</span> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={runImportedSegment} disabled={sendingSegment} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"><Send size={16}/>{sendingSegment ? 'Registrando...' : 'Confirmar campana'}</button>
                <button type="button" onClick={copyImportedPhones} className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white"><ClipboardCopy size={16}/>Copiar telefonos</button>
                <button type="button" onClick={clearImportedDraft} className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-neutral-700"><Trash2 size={16}/>Limpiar</button>
              </div>
            </div>
            <div className="border-t border-amber-200 bg-white/80 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Plantilla de mensaje</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <input value={segmentTitle} onChange={(event) => setSegmentTitle(event.target.value)} maxLength={150} className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-bold text-neutral-900 outline-none focus:border-amber-400" placeholder="Titulo de la campana" />
                <textarea value={segmentMessage} onChange={(event) => setSegmentMessage(event.target.value)} maxLength={500} rows={3} className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-bold text-neutral-900 outline-none focus:border-amber-400" placeholder="Mensaje para WhatsApp" />
              </div>
            </div>
            <div className="border-t border-amber-200 bg-white/70 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Primeros destinatarios</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {(importedDraft.customers || []).slice(0, 8).map((customer) => (
                  <div key={customer.id || customer.phone} className="rounded-2xl border border-neutral-100 bg-white px-4 py-3">
                    <p className="truncate text-sm font-black text-neutral-950">{customer.name || 'Cliente'}</p>
                    <p className="mt-1 text-xs font-bold text-neutral-500">{customer.phone} - {customer.status || 'Segmento'} - {customer.branchName || 'Sin sede'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex items-center justify-between"><h3 className="text-lg font-black text-neutral-950">Historial de entregas</h3><button onClick={load} className="text-sm font-black text-amber-700">Actualizar</button></div>
        <div className="mt-4 divide-y divide-neutral-100">
          {!loading && history.length === 0 && <p className="py-8 text-center font-semibold text-neutral-400">Aun no hay entregas registradas.</p>}
          {history.slice(0, 100).map((item) => <div key={item.id} className="flex items-center gap-4 py-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Send size={18}/></div><div className="min-w-0 flex-1"><p className="truncate font-black text-neutral-900">{item.customerName || 'Cliente'}</p><p className="truncate text-sm font-semibold text-neutral-500">{item.title || item.campaignName || item.campaignCode}</p></div><time className="text-xs font-bold text-neutral-400">{String(item.sentAt || '').replace('T',' ').slice(0,16)}</time></div>)}
        </div>
      </div>
    </section>
  );
}