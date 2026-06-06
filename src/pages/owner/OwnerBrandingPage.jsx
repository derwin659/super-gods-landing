import { useEffect, useMemo, useState } from 'react';
import { Image, Loader2, Scissors, UploadCloud } from 'lucide-react';
import { getOwnerTenantBranding, uploadOwnerTenantLogo } from '../../api/ownerTenantBrandingApi';

function clean(value) {
  return String(value || '').trim();
}

export default function OwnerBrandingPage() {
  const [branding, setBranding] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const previewUrl = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile);
    return clean(branding?.logoUrl);
  }, [branding?.logoUrl, logoFile]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getOwnerTenantBranding();
        if (active) setBranding(data);
      } catch (e) {
        if (active) setError(e.message || 'No se pudo cargar la marca.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (logoFile) URL.revokeObjectURL(previewUrl);
    };
  }, [logoFile, previewUrl]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setSuccess('');
    setError('');

    if (!file) {
      setLogoFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Selecciona una imagen valida para el logo.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('El logo debe pesar menos de 3 MB.');
      return;
    }

    setLogoFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!logoFile) {
      setError('Selecciona un logo antes de guardar.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = await uploadOwnerTenantLogo(logoFile);
      setBranding(data);
      setLogoFile(null);
      setSuccess('Logo actualizado. Ya se mostrara en la reserva publica.');
    } catch (e) {
      setError(e.message || 'No se pudo subir el logo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] bg-neutral-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className="relative grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Marca del negocio
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Logo visible en reservas
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/65">
              Sube el logo que veran tus clientes al reservar por web. La imagen grande de portada se toma de la foto de la sede.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white text-neutral-950">
                {previewUrl ? (
                  <img src={previewUrl} alt="Logo actual" className="h-full w-full object-cover" />
                ) : (
                  <Scissors size={28} />
                )}
              </div>
              <div>
                <p className="font-black">{branding?.nombre || 'Tu negocio'}</p>
                <p className="text-xs font-semibold text-white/55">
                  {branding?.ciudad || 'Logo del negocio'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{success}</div> : null}

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="aspect-square overflow-hidden rounded-[26px] border border-neutral-200 bg-neutral-950">
            {previewUrl ? (
              <img src={previewUrl} alt="Vista previa del logo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white">
                <Scissors size={54} />
              </div>
            )}
          </div>
          <p className="mt-4 text-sm font-bold leading-6 text-neutral-500">
            Recomendado: imagen cuadrada, fondo limpio, minimo 512 x 512 px.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          {loading ? (
            <div className="flex items-center gap-3 text-sm font-black text-neutral-500">
              <Loader2 className="animate-spin" size={18} />
              Cargando marca...
            </div>
          ) : (
            <>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 py-10 text-center transition hover:border-amber-400 hover:bg-amber-50">
                <UploadCloud className="text-amber-600" size={34} />
                <span className="mt-3 text-lg font-black text-neutral-950">
                  Seleccionar logo
                </span>
                <span className="mt-1 text-sm font-bold text-neutral-500">
                  PNG, JPG o WEBP. Maximo 3 MB.
                </span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Image className="mt-0.5 shrink-0 text-blue-700" size={20} />
                  <p className="text-sm font-bold leading-6 text-blue-900">
                    Para cambiar la foto grande de portada en reservas, entra a Configuracion {'>'} Sedes y sube una imagen real de la barberia.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !logoFile}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                {saving ? 'Subiendo logo...' : 'Guardar logo'}
              </button>
            </>
          )}
        </form>
      </section>
    </div>
  );
}
