import { useEffect, useMemo, useState } from 'react';
import { Archive, Building2, Check, Image, Plus, RefreshCw, RotateCcw, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { getOwnerBranches } from '../../api/ownerBranchesApi';
import { archiveOwnerShowcase, createOwnerCatalog, deleteOwnerShowcase, getOwnerShowcase, moderateOwnerShowcase, publishOwnerShowcase } from '../../api/ownerShowcaseApi';

const filters = [['PENDING_APPROVAL','Pendientes'],['PUBLISHED','Publicados'],['REJECTED','Rechazados'],['ARCHIVED','Archivados']];
const initialForm = { title:'', description:'', category:'', visibilityScope:'ALL_BRANCHES', branchId:'', branchIds:[], mediaType:'IMAGE', durationSeconds:'', consent:false, file:null };
const branchIdOf = (branch) => String(branch.id ?? branch.branchId ?? '');
const branchNameOf = (branch) => branch.nombre || branch.name || branch.branchName || 'Sede';

export default function OwnerShowcasePage() {
  const [status,setStatus]=useState('PENDING_APPROVAL');
  const [items,setItems]=useState([]);
  const [branches,setBranches]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [working,setWorking]=useState(0);
  const [showCreator,setShowCreator]=useState(false);
  const [form,setForm]=useState(initialForm);

  async function load(){setLoading(true);setError('');try{setItems(await getOwnerShowcase(status));}catch(e){setError(e.message||'No se pudo cargar la vitrina.');}finally{setLoading(false);}}
  useEffect(()=>{load();},[status]);
  useEffect(()=>{getOwnerBranches({onlyActive:true}).then((data)=>setBranches(Array.isArray(data)?data:[])).catch(()=>setBranches([]));},[]);
  const selectedNames=useMemo(()=>branches.filter((b)=>form.branchIds.includes(branchIdOf(b))).map(branchNameOf),[branches,form.branchIds]);

  async function submitCatalog(event){
    event.preventDefault();setWorking(-1);setError('');setSuccess('');
    try{
      if(!form.file) throw new Error('Selecciona una foto o un video.');
      if(form.visibilityScope==='ORIGIN_BRANCH'&&!form.branchId) throw new Error('Selecciona la sede donde aparecerá.');
      if(form.visibilityScope==='SELECTED_BRANCHES'&&!form.branchIds.length) throw new Error('Selecciona al menos una sede.');
      const data=new FormData();
      data.append('title',form.title);data.append('description',form.description);data.append('category',form.category);data.append('visibilityScope',form.visibilityScope);data.append('mediaType',form.mediaType);data.append('consent',String(form.consent));data.append('file',form.file);
      if(form.branchId)data.append('branchId',form.branchId);
      form.branchIds.forEach((id)=>data.append('branchIds',id));
      if(form.mediaType==='VIDEO')data.append('durationSeconds',form.durationSeconds||'1');
      await createOwnerCatalog(data);
      setForm(initialForm);setShowCreator(false);setStatus('PUBLISHED');setSuccess('La inspiración ya está publicada para los clientes.');await load();
    }catch(e){setError(e.message||'No se pudo publicar el contenido.');}finally{setWorking(0);}
  }
  async function moderate(item,next){let reason=null;if(next==='REJECTED'){reason=window.prompt('Motivo del rechazo para el profesional:','La imagen no cumple los criterios de publicación.');if(reason===null)return;}setWorking(item.id);setError('');try{await moderateOwnerShowcase(item.id,next,reason);await load();}catch(e){setError(e.message||'No se pudo moderar.');}finally{setWorking(0);}}
  async function manage(item,action){if(action==='delete'&&!window.confirm('¿Eliminar definitivamente este trabajo? Esta acción no se puede deshacer.'))return;setWorking(item.id);setError('');try{if(action==='archive')await archiveOwnerShowcase(item.id);if(action==='publish')await publishOwnerShowcase(item.id);if(action==='delete')await deleteOwnerShowcase(item.id);await load();}catch(e){setError(e.message||'No se pudo actualizar el trabajo.');}finally{setWorking(0);}}
  function toggleBranch(id){setForm((current)=>({...current,branchIds:current.branchIds.includes(id)?current.branchIds.filter((value)=>value!==id):[...current.branchIds,id]}));}

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0F172A,#312E81)] p-7 text-white shadow-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-3 text-amber-300"><Image size={24}/><span className="text-xs font-black uppercase tracking-[.22em]">Vitrina premium</span></div><h1 className="mt-4 text-3xl font-black">Trabajos e inspiración</h1><p className="mt-2 max-w-2xl text-sm font-semibold text-white/70">Modera los trabajos del equipo y publica contenido propio para una, varias o todas tus sedes.</p></div><button onClick={()=>setShowCreator((value)=>!value)} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-neutral-950 shadow-lg"><Plus size={20}/>{showCreator?'Cerrar formulario':'Publicar inspiración'}</button></div>
    </section>

    {showCreator&&<form onSubmit={submitCatalog} className="rounded-[30px] border border-amber-200 bg-[linear-gradient(145deg,#fff,#fffbeb)] p-6 shadow-lg">
      <div className="flex items-start gap-3"><div className="rounded-2xl bg-neutral-950 p-3 text-amber-300"><Sparkles size={22}/></div><div><h2 className="text-xl font-black">Nueva inspiración del negocio</h2><p className="text-sm font-semibold text-neutral-500">Se publica de inmediato y no queda asociada obligatoriamente a un barbero.</p></div></div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <label className="text-sm font-black">Título<input required maxLength={120} value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Ej. Balayage caramelo" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none focus:border-amber-400"/></label>
        <label className="text-sm font-black">Categoría<input maxLength={80} value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} placeholder="Ej. Color, barbería, uñas" className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none focus:border-amber-400"/></label>
        <label className="text-sm font-black">Tipo<select value={form.mediaType} onChange={(e)=>setForm({...form,mediaType:e.target.value})} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-4"><option value="IMAGE">Foto</option><option value="VIDEO">Video</option></select></label>
        <label className="text-sm font-black">Archivo<input required type="file" accept={form.mediaType==='VIDEO'?'video/*':'image/*'} onChange={(e)=>setForm({...form,file:e.target.files?.[0]||null})} className="mt-2 block w-full rounded-2xl border border-dashed border-neutral-300 bg-white p-3 text-sm"/></label>
        {form.mediaType==='VIDEO'&&<label className="text-sm font-black">Duración en segundos<input required min="1" max="90" type="number" value={form.durationSeconds} onChange={(e)=>setForm({...form,durationSeconds:e.target.value})} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-4"/></label>}
        <label className="text-sm font-black lg:col-span-2">Descripción<textarea maxLength={600} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="Cuenta qué hace especial este resultado" className="mt-2 min-h-24 w-full rounded-2xl border border-neutral-200 bg-white p-4 outline-none focus:border-amber-400"/></label>
      </div>
      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-center gap-2 font-black"><Building2 size={19}/>¿Dónde aparecerá?</div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['ALL_BRANCHES','Todas las sedes'],['SELECTED_BRANCHES','Algunas sedes'],['ORIGIN_BRANCH','Una sede']].map(([value,label])=><button type="button" key={value} onClick={()=>setForm({...form,visibilityScope:value})} className={`rounded-2xl border px-4 py-3 text-sm font-black ${form.visibilityScope===value?'border-amber-400 bg-amber-50 text-neutral-950':'border-neutral-200 text-neutral-500'}`}>{label}</button>)}</div>
        {form.visibilityScope==='ORIGIN_BRANCH'&&<select value={form.branchId} onChange={(e)=>setForm({...form,branchId:e.target.value})} className="mt-4 w-full rounded-2xl border border-neutral-200 p-4 font-bold"><option value="">Selecciona una sede</option>{branches.map((b)=><option key={branchIdOf(b)} value={branchIdOf(b)}>{branchNameOf(b)}</option>)}</select>}
        {form.visibilityScope==='SELECTED_BRANCHES'&&<div className="mt-4 flex flex-wrap gap-2">{branches.map((b)=>{const id=branchIdOf(b);const active=form.branchIds.includes(id);return <button type="button" key={id} onClick={()=>toggleBranch(id)} className={`rounded-full px-4 py-2 text-sm font-black ${active?'bg-neutral-950 text-white':'border border-neutral-200 bg-white text-neutral-600'}`}>{active?'✓ ':''}{branchNameOf(b)}</button>})}{selectedNames.length===0&&<span className="text-sm font-semibold text-neutral-400">Elige las sedes.</span>}</div>}
      </div>
      <label className="mt-5 flex items-start gap-3 rounded-2xl bg-neutral-100 p-4 text-sm font-bold"><input type="checkbox" checked={form.consent} onChange={(e)=>setForm({...form,consent:e.target.checked})} className="mt-1" required/><span>Confirmo que el negocio tiene autorización para publicar este contenido.</span></label>
      <button disabled={working===-1} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white disabled:opacity-50"><Upload size={19}/>{working===-1?'Publicando...':'Publicar en la vitrina'}</button>
    </form>}

    {success&&<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">{success}</div>}
    <section className="flex flex-wrap gap-2">{filters.map(([value,label])=><button key={value} onClick={()=>setStatus(value)} className={`rounded-full px-4 py-2 text-sm font-black ${status===value?'bg-neutral-950 text-white':'border border-neutral-200 bg-white text-neutral-600'}`}>{label}</button>)}<button onClick={load} className="ml-auto rounded-full border border-neutral-200 bg-white p-2.5"><RefreshCw size={18}/></button></section>
    {error&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
    {loading?<div className="rounded-3xl bg-white p-10 text-center font-black">Cargando trabajos...</div>:items.length===0?<div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center"><Image className="mx-auto text-neutral-300" size={55}/><h2 className="mt-4 text-xl font-black">No hay trabajos en este estado</h2></div>:<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map((item)=>{const catalog=item.originType==='TENANT_CATALOG';return <article key={item.id} className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm"><div className="relative aspect-[4/3] bg-neutral-100">{item.mediaType==='VIDEO'?<video src={item.imageUrl} poster={item.thumbnailUrl} controls preload="metadata" className="h-full w-full object-cover"/>:<img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover"/>}<span className="absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1 text-xs font-black text-white">{item.mediaType==='VIDEO'?'VIDEO':'FOTO'}</span><span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${catalog?'bg-amber-300 text-neutral-950':'bg-white/90 text-neutral-700'}`}>{catalog?'Inspiración del negocio':'Trabajo profesional'}</span></div><div className="p-5"><div className="text-xs font-black uppercase tracking-wider text-amber-700">{catalog?(item.visibilityScope==='ALL_BRANCHES'?'Todas las sedes':item.visibilityScope==='SELECTED_BRANCHES'?`${item.branchIds?.length||0} sedes`:item.branchName):item.branchName}</div><h2 className="mt-2 text-xl font-black">{item.title}</h2><p className="mt-1 text-sm font-bold text-neutral-500">{catalog?(item.category||'Catálogo del negocio'):[item.professionalName,item.serviceName].filter(Boolean).join(' · ')}</p>{item.description&&<p className="mt-3 text-sm text-neutral-600">{item.description}</p>}{item.rejectionReason&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{item.rejectionReason}</p>}{status==='PENDING_APPROVAL'&&<div className="mt-5 grid grid-cols-2 gap-3"><button disabled={working===item.id} onClick={()=>moderate(item,'REJECTED')} className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-black text-red-700"><X size={18}/>Rechazar</button><button disabled={working===item.id} onClick={()=>moderate(item,'PUBLISHED')} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white"><Check size={18}/>Publicar</button></div>}{status==='PUBLISHED'&&<button disabled={working===item.id} onClick={()=>manage(item,'archive')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 font-black text-white"><Archive size={18}/>Pausar publicación</button>}{status==='ARCHIVED'&&<div className="mt-5 grid grid-cols-2 gap-3"><button disabled={working===item.id} onClick={()=>manage(item,'delete')} className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-black text-red-700"><Trash2 size={18}/>Eliminar</button><button disabled={working===item.id} onClick={()=>manage(item,'publish')} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white"><RotateCcw size={18}/>Republicar</button></div>}</div></article>})}</div>}
  </div>;
}
