import { useEffect, useMemo, useState } from 'react';
import {
  adjustOwnerProductStock,
  createOwnerProduct,
  getOwnerBranchesForProducts,
  getOwnerProducts,
  getOwnerProductStockMovements,
  toggleOwnerProductActive,
  updateOwnerProduct,
  uploadOwnerProductImage,
} from '../../api/ownerProductsApi';
import { formatTenantMoney, getTenantCurrencySymbol } from '../../utils/tenantMoney';

function formatMoney(value) {
  return formatTenantMoney(value);
}

function prettyDate(value) {
  if (!value) return '-';

  const raw = String(value);
  const normalized = raw.includes('T') ? raw : `${raw}T00:00:00`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toDateInputValue(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function ErrorBox({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
      {message}
    </div>
  );
}

function ModalShell({ title, subtitle, children, onClose, maxWidth = 'max-w-4xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-4 py-8 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full ${maxWidth} overflow-auto rounded-[34px] border border-white/10 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
              {subtitle}
            </div>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-black text-neutral-700 hover:bg-neutral-100"
          >
            Cerrar
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', step, prefix }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>
      <div className="mt-2 flex overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 focus-within:border-amber-400">
        {prefix && (
          <span className="flex items-center border-r border-neutral-200 px-4 text-sm font-black text-neutral-500">
            {prefix}
          </span>
        )}
        <input
          type={type}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-4 py-4 font-bold text-neutral-950 outline-none placeholder:text-neutral-400"
        />
      </div>
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[110px] w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatCard({ title, value, helper, tone = 'default' }) {
  const styles = {
    default: 'border-neutral-200 bg-white text-neutral-950',
    gold: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    dark: 'border-neutral-900 bg-neutral-950 text-white',
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] ${styles[tone]}`}>
      <div className={tone === 'dark' ? 'text-sm font-bold text-white/55' : 'text-sm font-bold text-neutral-500'}>
        {title}
      </div>
      <div className={tone === 'dark' ? 'mt-2 text-2xl font-black text-white' : 'mt-2 text-2xl font-black'}>
        {value}
      </div>
      {helper && <div className={tone === 'dark' ? 'mt-1 text-xs text-white/45' : 'mt-1 text-xs text-neutral-500'}>{helper}</div>}
    </div>
  );
}

function ProductAvatar({ product }) {
  const imageUrl = String(product?.imageUrl || '').trim();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={product.nombre}
        className="h-16 w-16 rounded-2xl border border-neutral-200 object-cover"
      />
    );
  }

  return (
    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-2xl ${product.stockBajo ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50'}`}>
      {product.stockBajo ? '⚠️' : '📦'}
    </div>
  );
}

function ProductFormModal({ branch, product, onClose, onSaved }) {
  const isEdit = Boolean(product?.id);

  const [nombre, setNombre] = useState(product?.nombre || '');
  const [categoria, setCategoria] = useState(product?.categoria || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [descripcion, setDescripcion] = useState(product?.descripcion || '');
  const [precioCompra, setPrecioCompra] = useState(product ? String(product.precioCompra || 0) : '');
  const [precioVenta, setPrecioVenta] = useState(product ? String(product.precioVenta || 0) : '');
  const [barberCommissionAmount, setBarberCommissionAmount] = useState(product ? String(product.barberCommissionAmount || 0) : '0');
  const [stockActual, setStockActual] = useState(product ? String(product.stockActual || 0) : '0');
  const [stockMinimo, setStockMinimo] = useState(product ? String(product.stockMinimo || 0) : '0');
  const [activo, setActivo] = useState(product?.activo !== false);
  const [permiteVentaSinStock, setPermiteVentaSinStock] = useState(product?.permiteVentaSinStock === true);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');

    if (!String(nombre).trim()) {
      setErrorMsg('Ingresa el nombre del producto.');
      return;
    }

    const sellPrice = Number(String(precioVenta).replace(',', '.'));

    if (Number.isNaN(sellPrice) || sellPrice <= 0) {
      setErrorMsg('Ingresa un precio de venta mayor a cero.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nombre,
        categoria,
        sku,
        descripcion,
        precioCompra: Number(String(precioCompra || 0).replace(',', '.')) || 0,
        precioVenta: sellPrice,
        barberCommissionAmount: Number(String(barberCommissionAmount || 0).replace(',', '.')) || 0,
        stockActual: Number(stockActual || 0) || 0,
        stockMinimo: Number(stockMinimo || 0) || 0,
        activo,
        permiteVentaSinStock,
      };

      let saved = isEdit
        ? await updateOwnerProduct({ branchId: branch.id, productId: product.id, payload })
        : await createOwnerProduct({ branchId: branch.id, payload });

      if (imageFile) {
        saved = await uploadOwnerProductImage({
          branchId: branch.id,
          productId: saved.id,
          file: imageFile,
        });
      }

      onSaved(saved);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      subtitle={branch?.name || 'Productos'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorBox message={errorMsg} />

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
          <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
            <div>
              <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} alt="Vista previa" className="h-full w-full object-cover" />
                ) : product?.imageUrl ? (
                  <img src={product.imageUrl} alt={product.nombre} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-sm font-bold text-neutral-400">
                    Imagen del producto
                  </div>
                )}
              </div>

              <label className="mt-3 block cursor-pointer rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-black text-neutral-700 hover:bg-neutral-50">
                Elegir imagen
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Nombre" value={nombre} onChange={setNombre} placeholder="Ej. Cera matte premium" />
              <InputField label="Categoría" value={categoria} onChange={setCategoria} placeholder="Ej. Ceras" />
              <InputField label="SKU" value={sku} onChange={setSku} placeholder="Código interno opcional" />
              <InputField label="Precio compra" value={precioCompra} onChange={setPrecioCompra} type="number" step="0.01" prefix={getTenantCurrencySymbol()} />
              <InputField label="Precio venta" value={precioVenta} onChange={setPrecioVenta} type="number" step="0.01" prefix={getTenantCurrencySymbol()} />
              <InputField label="Comisión barbero" value={barberCommissionAmount} onChange={setBarberCommissionAmount} type="number" step="0.01" prefix={getTenantCurrencySymbol()} />
              <InputField label="Stock actual" value={stockActual} onChange={setStockActual} type="number" />
              <InputField label="Stock mínimo" value={stockMinimo} onChange={setStockMinimo} type="number" />
            </div>
          </div>
        </div>

        <TextAreaField
          label="Descripción"
          value={descripcion}
          onChange={setDescripcion}
          placeholder="Describe brevemente el producto."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
            <div>
              <div className="font-black text-neutral-950">Producto activo</div>
              <div className="text-sm font-semibold text-neutral-500">Aparecerá para vender en caja.</div>
            </div>
            <input type="checkbox" checked={activo} onChange={(event) => setActivo(event.target.checked)} className="h-5 w-5" />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
            <div>
              <div className="font-black text-neutral-950">Permitir venta sin stock</div>
              <div className="text-sm font-semibold text-neutral-500">Úsalo solo para casos especiales.</div>
            </div>
            <input type="checkbox" checked={permiteVentaSinStock} onChange={(event) => setPermiteVentaSinStock(event.target.checked)} className="h-5 w-5" />
          </label>
        </div>

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </form>
    </ModalShell>
  );
}

const movementTypes = [
  { value: 'ENTRADA', label: 'Recepción / compra', entry: true },
  { value: 'AJUSTE', label: 'Ajuste manual', entry: false },
  { value: 'PERDIDA', label: 'Pérdida', entry: false },
  { value: 'DEVOLUCION', label: 'Devolución', entry: true },
  { value: 'SALIDA_INTERNA', label: 'Salida interna', entry: false },
];

function StockAdjustModal({ branch, product, onClose, onSaved }) {
  const [tipoMovimiento, setTipoMovimiento] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [fechaRecepcion, setFechaRecepcion] = useState(toDateInputValue(new Date()));
  const [proveedor, setProveedor] = useState('');
  const [costoUnitario, setCostoUnitario] = useState(product?.precioCompra ? String(product.precioCompra) : '');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedType = movementTypes.find((item) => item.value === tipoMovimiento) || movementTypes[0];
  const parsedQty = Number(cantidad || 0) || 0;
  const quantityDelta = selectedType.entry ? parsedQty : -parsedQty;
  const stockPreview = Number(product?.stockActual || 0) + quantityDelta;

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');

    if (!parsedQty || parsedQty <= 0) {
      setErrorMsg('Ingresa una cantidad mayor a cero.');
      return;
    }

    if (stockPreview < 0 && product?.permiteVentaSinStock !== true) {
      setErrorMsg('El stock no puede quedar negativo para este producto.');
      return;
    }

    setSaving(true);

    try {
      const updated = await adjustOwnerProductStock({
        branchId: branch.id,
        productId: product.id,
        payload: {
          quantityDelta,
          tipoMovimiento,
          proveedor,
          fechaRecepcion,
          costoUnitario: costoUnitario === '' ? null : Number(String(costoUnitario).replace(',', '.')),
          numeroComprobante,
          observacion,
        },
      });

      onSaved(updated);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo ajustar el stock.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Ajustar stock" subtitle={product?.nombre || 'Inventario'} onClose={onClose} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorBox message={errorMsg} />

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard title="Stock actual" value={product.stockActual} helper="Antes del ajuste" />
          <StatCard title="Nuevo stock" value={stockPreview} helper="Vista previa" tone={stockPreview < 0 ? 'red' : 'gold'} />
          <StatCard title="Stock mínimo" value={product.stockMinimo} helper={product.stockBajo ? 'Stock bajo' : 'Control'} tone={product.stockBajo ? 'red' : 'green'} />
        </div>

        <SelectField
          label="Tipo de movimiento"
          value={tipoMovimiento}
          onChange={setTipoMovimiento}
          options={movementTypes.map((item) => ({ value: item.value, label: item.label }))}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Cantidad" value={cantidad} onChange={setCantidad} type="number" placeholder="Ej. 10" />
          <InputField label="Fecha de recepción" value={fechaRecepcion} onChange={setFechaRecepcion} type="date" />
          <InputField label="Proveedor" value={proveedor} onChange={setProveedor} placeholder="Ej. Distribuidora Cusco" />
          <InputField label="Costo unitario" value={costoUnitario} onChange={setCostoUnitario} type="number" step="0.01" prefix={getTenantCurrencySymbol()} />
          <InputField label="Número de comprobante" value={numeroComprobante} onChange={setNumeroComprobante} placeholder="Ej. F001-123" />
        </div>

        <TextAreaField
          label="Observación"
          value={observacion}
          onChange={setObservacion}
          placeholder="Ej. Ingreso de mercadería o ajuste por conteo físico"
        />

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar movimiento'}
        </button>
      </form>
    </ModalShell>
  );
}

function movementLabel(type) {
  const labels = {
    ENTRADA: 'Recepción',
    AJUSTE: 'Ajuste',
    PERDIDA: 'Pérdida',
    DEVOLUCION: 'Devolución',
    SALIDA_INTERNA: 'Salida interna',
    VENTA: 'Venta',
  };

  return labels[String(type || '').toUpperCase()] || 'Movimiento';
}

function movementTone(type) {
  const code = String(type || '').toUpperCase();
  if (code === 'ENTRADA' || code === 'DEVOLUCION') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (code === 'PERDIDA' || code === 'SALIDA_INTERNA') return 'text-red-700 bg-red-50 border-red-200';
  if (code === 'VENTA') return 'text-blue-700 bg-blue-50 border-blue-200';
  return 'text-violet-700 bg-violet-50 border-violet-200';
}

function StockMovementsModal({ branch, product, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadMovements() {
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await getOwnerProductStockMovements({
        branchId: branch.id,
        productId: product.id,
        limit: 30,
      });
      setMovements(data);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovements();
  }, [branch.id, product.id]);

  return (
    <ModalShell title="Movimientos de stock" subtitle={product?.nombre || 'Inventario'} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard title="Stock actual" value={product.stockActual} />
          <StatCard title="Stock mínimo" value={product.stockMinimo} />
          <StatCard title="Movimientos" value={movements.length} tone="gold" />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={loadMovements}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-50"
          >
            Actualizar
          </button>
        </div>

        <ErrorBox message={errorMsg} />

        {loading ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-8 text-center font-black text-neutral-500">
            Cargando historial...
          </div>
        ) : movements.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-neutral-300 bg-white/70 p-8 text-center">
            <div className="text-xl font-black text-neutral-950">Sin movimientos todavía</div>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Cuando registres compras, ajustes o ventas, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white">
            <div className="grid grid-cols-12 gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
              <div className="col-span-3">Movimiento</div>
              <div className="col-span-2">Cantidad</div>
              <div className="col-span-2">Stock</div>
              <div className="col-span-2">Costo</div>
              <div className="col-span-3">Detalle</div>
            </div>

            {movements.map((movement) => (
              <div key={movement.id} className="grid grid-cols-12 gap-3 border-b border-neutral-100 px-4 py-4 text-sm last:border-b-0">
                <div className="col-span-12 sm:col-span-3">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${movementTone(movement.tipoMovimiento)}`}>
                    {movementLabel(movement.tipoMovimiento)}
                  </span>
                  <div className="mt-2 font-bold text-neutral-500">{prettyDate(movement.fechaCreacion)}</div>
                </div>

                <div className="col-span-4 sm:col-span-2 font-black text-neutral-950">
                  {movement.cantidad} und.
                </div>

                <div className="col-span-4 sm:col-span-2 font-black text-neutral-950">
                  {movement.stockAnterior} → {movement.stockNuevo}
                </div>

                <div className="col-span-4 sm:col-span-2 font-black text-neutral-950">
                  {movement.costoUnitario > 0 ? formatMoney(movement.costoTotal) : '-'}
                </div>

                <div className="col-span-12 sm:col-span-3 text-neutral-600">
                  {movement.proveedor && <div className="font-bold">Proveedor: {movement.proveedor}</div>}
                  {movement.numeroComprobante && <div>Comp.: {movement.numeroComprobante}</div>}
                  {movement.userName && <div>Por: {movement.userName}</div>}
                  {movement.observacion && <div className="mt-1 text-neutral-500">{movement.observacion}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

export default function OwnerProductsPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [products, setProducts] = useState([]);
  const [onlyActive, setOnlyActive] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [modal, setModal] = useState(null);

  const selectedBranch = useMemo(() => {
    return branches.find((item) => String(item.id) === String(selectedBranchId)) || branches[0] || null;
  }, [branches, selectedBranchId]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      if (onlyActive && !product.activo) return false;
      if (!q) return true;

      return (
        product.nombre.toLowerCase().includes(q) ||
        product.categoria.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q)
      );
    });
  }, [products, onlyActive, search]);

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, product) => sum + Number(product.stockActual || 0) * Number(product.precioCompra || 0), 0);
  }, [products]);

  const lowStockCount = useMemo(() => products.filter((product) => product.stockBajo).length, [products]);

  async function loadInitial() {
    setLoading(true);
    setErrorMsg('');

    try {
      const branchList = await getOwnerBranchesForProducts();
      setBranches(branchList);

      const firstBranchId = selectedBranchId || branchList[0]?.id || '';
      setSelectedBranchId(firstBranchId ? String(firstBranchId) : '');

      if (firstBranchId) {
        const productList = await getOwnerProducts({ branchId: firstBranchId });
        setProducts(productList);
      } else {
        setProducts([]);
      }
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar productos.');
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts({ silent = false } = {}) {
    if (!selectedBranch?.id) return;

    if (silent) setRefreshing(true);
    else setLoading(true);
    setErrorMsg('');

    try {
      const productList = await getOwnerProducts({ branchId: selectedBranch.id });
      setProducts(productList);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar productos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedBranch?.id) {
      loadProducts({ silent: true });
    }
  }, [selectedBranch?.id]);

  async function handleToggle(product) {
    if (!selectedBranch) return;

    try {
      await toggleOwnerProductActive({ branchId: selectedBranch.id, productId: product.id });
      await loadProducts({ silent: true });
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cambiar el estado del producto.');
    }
  }

  function handleSaved() {
    setModal(null);
    loadProducts({ silent: true });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-neutral-900 bg-[linear-gradient(135deg,#080808_0%,#111827_55%,#292524_100%)] p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.22em] text-amber-400">
              Inventario web
            </div>
            <h1 className="mt-3 text-3xl font-black lg:text-4xl">
              Productos e inventario
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
              Administra productos, precios, stock, recepción de mercadería y movimientos desde el panel web.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => loadProducts({ silent: true })}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white hover:bg-white/10"
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>

            <button
              type="button"
              onClick={() => setModal({ type: 'form', product: null })}
              className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_14px_34px_rgba(251,191,36,0.22)] hover:scale-[1.01]"
            >
              Nuevo producto
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Productos" value={products.length} helper="Total registrados" />
        <StatCard title="Stock bajo" value={lowStockCount} helper="Requieren reposición" tone={lowStockCount > 0 ? 'red' : 'green'} />
        <StatCard title="Stock valorizado" value={formatMoney(totalStockValue)} helper="Según costo compra" tone="gold" />
        <StatCard title="Sede" value={selectedBranch?.name || 'Sede'} helper="Inventario activo" tone="dark" />
      </div>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.045)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <SelectField
            label="Sede"
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            options={branches.map((branch) => ({ value: String(branch.id), label: branch.name }))}
          />

          <InputField
            label="Buscar producto"
            value={search}
            onChange={setSearch}
            placeholder="Nombre, categoría o SKU"
          />

          <label className="flex h-[58px] items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 font-black text-neutral-700">
            Solo activos
            <input type="checkbox" checked={onlyActive} onChange={(event) => setOnlyActive(event.target.checked)} className="h-5 w-5" />
          </label>
        </div>
      </section>

      <ErrorBox message={errorMsg} />

      {loading ? (
        <div className="rounded-[30px] border border-neutral-200 bg-white p-10 text-center font-black text-neutral-500">
          Cargando productos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
            📦
          </div>
          <div className="mt-4 text-xl font-black text-neutral-950">
            No hay productos para mostrar
          </div>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            Crea tu primer producto o cambia los filtros de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-[30px] border border-neutral-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.045)]"
            >
              <div className="flex gap-4">
                <ProductAvatar product={product} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-neutral-950">{product.nombre}</h3>
                      <div className="mt-1 text-sm font-bold text-neutral-500">
                        {product.categoria || 'Sin categoría'} {product.sku ? `· SKU ${product.sku}` : ''}
                      </div>
                    </div>

                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${product.activo ? (product.stockBajo ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700') : 'bg-neutral-100 text-neutral-500'}`}>
                      {product.activo ? (product.stockBajo ? 'Stock bajo' : 'Activo') : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs font-bold text-neutral-500">Venta</div>
                      <div className="mt-1 font-black text-neutral-950">{formatMoney(product.precioVenta)}</div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs font-bold text-neutral-500">Costo</div>
                      <div className="mt-1 font-black text-neutral-950">{formatMoney(product.precioCompra)}</div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs font-bold text-neutral-500">Stock</div>
                      <div className="mt-1 font-black text-neutral-950">{product.stockActual}</div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs font-bold text-neutral-500">Comisión</div>
                      <div className="mt-1 font-black text-neutral-950">{formatMoney(product.barberCommissionAmount)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'form', product })}
                      className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'stock', product })}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 hover:bg-amber-100"
                    >
                      Stock / recepción
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'movements', product })}
                      className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"
                    >
                      Movimientos
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(product)}
                      className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-50"
                    >
                      {product.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal?.type === 'form' && selectedBranch && (
        <ProductFormModal
          branch={selectedBranch}
          product={modal.product}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {modal?.type === 'stock' && selectedBranch && (
        <StockAdjustModal
          branch={selectedBranch}
          product={modal.product}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {modal?.type === 'movements' && selectedBranch && (
        <StockMovementsModal
          branch={selectedBranch}
          product={modal.product}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

