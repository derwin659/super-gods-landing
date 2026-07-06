import { useEffect, useState } from 'react';
import { History, Megaphone, Send, ShieldCheck, Users } from 'lucide-react';
import { getCampaignHistory, getCampaignPreview, runConfirmedCampaigns } from '../../api/ownerMarketingCampaignsApi';

export default function OwnerCampaignOperationsPanel() {
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextPreview, nextHistory] = await Promise.all([getCampaignPreview(), getCampaignHistory()]);
      setPreview(nextPreview);
      setHistory(Array.isArray(nextHistory) ? nextHistory : []);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las campañas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async () => {
    const eligible = Number(preview?.eligible || 0);
    if (!window.confirm(`Se programarán ${eligible} mensajes elegibles. ¿Confirmas el envío?`)) return;
    setSending(true);
    setError('');
    try {
      const result = await runConfirmedCampaigns();
      window.alert(`${result?.sent || 0} mensajes programados.`);
      await load();
    } catch (e) {
      setError(e.message || 'No se pudo ejecutar la campaña.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-[32px] border border-amber-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,.08)]">
      <div className="bg-gradient-to-br from-neutral-950 via-slate-900 to-amber-950 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Automatización VIP</p><h2 className="mt-2 text-2xl font-black">Campañas de recuperación</h2><p className="mt-1 text-sm font-semibold text-white/60">Revisa el alcance real antes de enviar.</p></div>
          <button onClick={run} disabled={loading || sending || Number(preview?.eligible || 0) === 0} className="flex items-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 font-black text-neutral-950 disabled:opacity-40"><Send size={18}/>{sending ? 'Procesando...' : 'Revisar y enviar'}</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[[Megaphone,'Campañas',preview?.campaigns],[Users,'Elegibles',preview?.eligible],[ShieldCheck,'Sin permiso',preview?.withoutConsent],[History,'Anti-spam',preview?.cooldown]].map(([Icon,label,value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4"><Icon size={18} className="text-amber-300"/><p className="mt-3 text-xs font-black uppercase tracking-wider text-white/50">{label}</p><p className="mt-1 text-2xl font-black">{loading ? '—' : value || 0}</p></div>)}
        </div>
      </div>
      <div className="p-6">
        {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">{error}</div>}
        <div className="flex items-center justify-between"><h3 className="text-lg font-black text-neutral-950">Historial de entregas</h3><button onClick={load} className="text-sm font-black text-amber-700">Actualizar</button></div>
        <div className="mt-4 divide-y divide-neutral-100">
          {!loading && history.length === 0 && <p className="py-8 text-center font-semibold text-neutral-400">Aún no hay entregas registradas.</p>}
          {history.slice(0, 100).map((item) => <div key={item.id} className="flex items-center gap-4 py-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Send size={18}/></div><div className="min-w-0 flex-1"><p className="truncate font-black text-neutral-900">{item.customerName || 'Cliente'}</p><p className="truncate text-sm font-semibold text-neutral-500">{item.campaignName || item.campaignCode}</p></div><time className="text-xs font-bold text-neutral-400">{String(item.sentAt || '').replace('T',' ').slice(0,16)}</time></div>)}
        </div>
      </div>
    </section>
  );
}
