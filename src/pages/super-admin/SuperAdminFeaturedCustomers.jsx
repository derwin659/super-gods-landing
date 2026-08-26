import { useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { superAdminApi } from '../../api/superAdminApi';
const empty={businessName:'',businessType:'Salón de belleza',city:'',website:'',testimonial:'',sortOrder:0,visible:true,logo:null};
export default function SuperAdminFeaturedCustomers(){
 const [items,setItems]=useState([]),[form,setForm]=useState(empty),[editing,setEditing]=useState(null);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 const load=async()=>{setLoading(true);try{setItems(await superAdminApi.getFeaturedCustomers())}catch(e){setMessage(e.message)}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const change=e=>{const {name,value,type,checked,files}=e.target;setForm(x=>({...x,[name]:type==='checkbox'?checked:type==='file'?files?.[0]||null:value}))};
 const edit=x=>{setEditing(x.id);setForm({...x,logo:null});window.scrollTo({top:0,behavior:'smooth'})};
 const reset=()=>{setEditing(null);setForm(empty)};
 const save=async e=>{e.preventDefault();if(!editing&&!form.logo){setMessage('Selecciona el logo del negocio.');return}setSaving(true);setMessage('');try{if(editing)await superAdminApi.updateFeaturedCustomer(editing,form);else await superAdminApi.createFeaturedCustomer(form);setMessage(editing?'Cliente actualizado.':'Cliente publicado.');reset();await load()}catch(err){setMessage(err.message)}finally{setSaving(false)}};
 const remove=async x=>{if(!confirm(`¿Eliminar a ${x.businessName} de esta sección?`))return;try{await superAdminApi.deleteFeaturedCustomer(x.id);await load()}catch(e){setMessage(e.message)}};
 return <div className="space-y-6">
  <header className="rounded-[30px] bg-[#111] p-7 text-white"><p className="text-xs font-black uppercase tracking-[.2em] text-[#D6A354]">Confianza pública</p><h1 className="mt-2 text-3xl font-black">Clientes destacados</h1><p className="mt-2 max-w-2xl font-semibold text-white/65">Administra los salones y barberías que aparecen en la portada de Super Gods App.</p></header>
  {message&&<div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 font-bold text-amber-900">{message}</div>}
  <form onSubmit={save} className="rounded-[30px] border border-[#E2D5C4] bg-white p-6 shadow-sm">
   <div className="flex items-center gap-3"><Plus className="text-[#B7791F]"/><h2 className="text-xl font-black">{editing?'Editar negocio':'Agregar negocio'}</h2></div>
   <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <Field label="Nombre comercial *"><input name="businessName" required maxLength="150" value={form.businessName} onChange={change}/></Field>
    <Field label="Tipo de negocio"><input name="businessType" maxLength="60" value={form.businessType||''} onChange={change} placeholder="Salón, barbería, spa..."/></Field>
    <Field label="Ciudad"><input name="city" maxLength="100" value={form.city||''} onChange={change}/></Field>
    <Field label="Instagram o web"><input name="website" maxLength="300" value={form.website||''} onChange={change} placeholder="https://..."/></Field>
    <Field label="Orden"><input name="sortOrder" type="number" min="0" value={form.sortOrder} onChange={change}/></Field>
    <Field label={editing?'Reemplazar logo (opcional)':'Logo *'}><input name="logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={change}/></Field>
   </div>
   <Field label="Testimonio opcional"><textarea name="testimonial" maxLength="350" rows="3" value={form.testimonial||''} onChange={change}/></Field>
   <label className="mt-4 flex items-center gap-3 font-black"><input name="visible" type="checkbox" checked={form.visible} onChange={change} className="h-5 w-5"/>Visible en la portada</label>
   <div className="mt-5 flex gap-3"><button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#111] px-6 py-3 font-black text-white"><Upload size={18}/>{saving?'Guardando...':editing?'Guardar cambios':'Publicar cliente'}</button>{editing&&<button type="button" onClick={reset} className="rounded-2xl border px-5 py-3 font-black">Cancelar</button>}</div>
  </form>
  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{loading?<p className="font-black">Cargando...</p>:items.map(x=><article key={x.id} className="rounded-[26px] border border-[#E2D5C4] bg-white p-5 shadow-sm">
   <div className="flex items-start gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border bg-neutral-50 p-2"><img src={x.logoUrl} alt={x.businessName} className="max-h-full max-w-full object-contain"/></div><div className="min-w-0"><h3 className="text-lg font-black">{x.businessName}</h3><p className="text-sm font-bold text-neutral-500">{[x.businessType,x.city].filter(Boolean).join(' · ')||'Cliente Super Gods App'}</p><span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black ${x.visible?'bg-emerald-100 text-emerald-800':'bg-neutral-100 text-neutral-500'}`}>{x.visible?<Eye size={13}/>:<EyeOff size={13}/>} {x.visible?'Visible':'Oculto'} · orden {x.sortOrder}</span></div></div>
   {x.testimonial&&<p className="mt-4 text-sm font-semibold leading-6 text-neutral-600">“{x.testimonial}”</p>}
   <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={()=>edit(x)} className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black"><Pencil size={16}/>Editar</button><button type="button" onClick={()=>remove(x)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700"><Trash2 size={16}/>Eliminar</button></div>
  </article>)}</section>
 </div>
}
function Field({label,children}){return <label className="mt-4 grid gap-2 text-sm font-black text-neutral-700"><span>{label}</span><span className="[&>input]:w-full [&>input]:rounded-2xl [&>input]:border [&>input]:px-4 [&>input]:py-3 [&>textarea]:w-full [&>textarea]:rounded-2xl [&>textarea]:border [&>textarea]:px-4 [&>textarea]:py-3">{children}</span></label>}