import { createElement, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Image as ImageIcon,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Scissors,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  WalletCards,
} from 'lucide-react';
import {
  createPublicBookingAppointment,
  createPublicProductOrder,
  getPublicBookingAvailability,
  getPublicBookingBootstrap,
  getPublicBookingLinkInfo,
  getPublicBookingProducts,
} from '../../api/publicBookingApi';

const DEFAULT_LOGO = '/logo-super-gods.png';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstText(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatMoney(value, currency = 'S/') {
  const n = asNumber(value, 0);
  if (n <= 0) return '';
  return `${currency} ${n.toFixed(2)}`;
}

function todayDateInput() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function displayDate(yyyyMmDd) {
  if (!yyyyMmDd) return '';
  const [yyyy, mm, dd] = yyyyMmDd.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeBranch(raw) {
  return {
    id: asNumber(raw.branchId ?? raw.id),
    name: firstText(raw.branchName, raw.nombre, raw.name, 'Sede'),
    address: firstText(raw.address, raw.direccion, raw.branchAddress),
    imageUrl: firstText(raw.imageUrl, raw.branchImageUrl, raw.photoUrl),
  };
}

function normalizeBarber(raw) {
  const rawBranchIds = Array.isArray(raw.branchIds) ? raw.branchIds : [];
  const branchIds = rawBranchIds.map(asNumber).filter((id) => Number.isFinite(id) && id > 0);
  const branchId = raw.branchId === undefined || raw.branchId === null ? null : asNumber(raw.branchId);

  const fullName = firstText(
    raw.barberName,
    raw.nombreCompleto,
    `${firstText(raw.nombre, raw.name)} ${firstText(raw.apellido, raw.lastName)}`.trim(),
    'Profesional'
  );

  return {
    id: asNumber(raw.barberId ?? raw.id ?? raw.userId),
    name: fullName,
    photoUrl: firstText(raw.photoUrl, raw.barberPhotoUrl, raw.imageUrl, raw.googlePictureUrl),
    branchId,
    branchIds: branchIds.length > 0 ? branchIds : (branchId ? [branchId] : []),
    serviceIdsByBranch: raw.serviceIdsByBranch && typeof raw.serviceIdsByBranch === 'object'
      ? raw.serviceIdsByBranch
      : {},
  };
}

function normalizeService(raw) {
  return {
    id: asNumber(raw.serviceId ?? raw.id),
    name: firstText(raw.serviceName, raw.nombre, raw.name, 'Servicio'),
    description: firstText(raw.description, raw.descripcion, raw.detail),
    price: asNumber(raw.price ?? raw.precio ?? raw.amount),
    variablePrice: Boolean(
      raw.variablePrice ??
        raw.precioVariable ??
        raw.isVariablePrice ??
        raw.allowPriceOverride
    ),
    durationMinutes: asNumber(raw.durationMinutes ?? raw.duracionMinutos ?? raw.duration, 30),
    imageUrl: firstText(raw.imageUrl, raw.serviceImageUrl, raw.photoUrl),
    category: firstText(raw.category, raw.categoria, raw.categoryName, raw.nombreCategoria),
  };
}

function normalizePublicProduct(raw) {
  const price = asNumber(raw.precioVenta ?? raw.price ?? raw.precio);
  const stock = asNumber(raw.stockActual ?? raw.stock ?? raw.quantity);

  return {
    id: asNumber(raw.productId ?? raw.id),
    branchId: raw.branchId === undefined || raw.branchId === null ? null : asNumber(raw.branchId),
    name: firstText(raw.productName, raw.nombre, raw.name, 'Producto'),
    description: firstText(raw.description, raw.descripcion, raw.detail),
    category: firstText(raw.category, raw.categoria),
    price,
    stock,
    imageUrl: firstText(raw.productImageUrl, raw.imageUrl, raw.imagenUrl, raw.photoUrl),
    publicFeatured: Boolean(raw.publicFeatured ?? raw.featured),
    publicAvailable: raw.publicAvailable !== false && (Boolean(raw.permiteVentaSinStock) || stock > 0),
  };
}

function normalizePaymentMethod(raw) {
  return {
    id: asNumber(raw.id ?? raw.paymentMethodId),
    name: firstText(raw.displayName, raw.name, raw.nombre, 'Método de pago'),
    code: firstText(raw.code, raw.codigo),
    accountLabel: firstText(raw.accountLabel, raw.label, raw.etiqueta, 'Cuenta'),
    accountValue: firstText(raw.accountValue, raw.accountNumber, raw.phone, raw.telefono, raw.numero),
    accountHolderName: firstText(
      raw.accountHolderName,
      raw.accountName,
      raw.holderName,
      raw.ownerName,
      raw.titular,
      raw.nombreTitular
    ),
    instructions: firstText(raw.instructions, raw.instrucciones),
    qrImageUrl: firstText(raw.qrImageUrl, raw.qrUrl, raw.qr),
    requiresOperationCode: Boolean(raw.requiresOperationCode),
    requiresEvidence: Boolean(raw.requiresEvidence),
    active: raw.active !== false && raw.enabled !== false && raw.isActive !== false,
  };
}

function BrandLogo({ src, name }) {
  const [failed, setFailed] = useState(false);
  const cleanSrc = firstText(src);

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/25 bg-white shadow-2xl shadow-black/20 md:h-28 md:w-28">
      {cleanSrc && !failed ? (
        <img
          src={cleanSrc}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-950 text-white">
          <Scissors size={34} />
        </div>
      )}
    </div>
  );
}

function fullCustomerName(data) {
  return `${data.customerName || ''} ${data.customerLastName || ''}`.trim();
}

export default function PublicBookingPage() {
  const { codigoNegocio = '' } = useParams();
  const [searchParams] = useSearchParams();

  const branchIdFromUrl = searchParams.get('branchId');
  const barberIdFromUrl = searchParams.get('barberId');
  const rawMode = firstText(searchParams.get('mode'), searchParams.get('modo')).toLowerCase();
  const isWalkInMode =
    rawMode === 'walkin' ||
    rawMode === 'local' ||
    rawMode === 'preventa' ||
    searchParams.get('walkin') === '1' ||
    searchParams.get('atencion') === '1';

  const [bootstrap, setBootstrap] = useState(null);
  const [linkInfo, setLinkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedBranchId, setSelectedBranchId] = useState(branchIdFromUrl || '');
  const [selectedBarberId, setSelectedBarberId] = useState(barberIdFromUrl || '');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayDateInput());
  const [selectedTime, setSelectedTime] = useState('');

  const [slots, setSlots] = useState([]);
  const [publicProducts, setPublicProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productQuantities, setProductQuantities] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const [customer, setCustomer] = useState({
    customerName: '',
    customerLastName: '',
    customerPhone: '',
    customerEmail: '',
  });

  const [deposit, setDeposit] = useState({
    depositPaymentMethodId: '',
    depositAmount: '',
    depositOperationCode: '',
    depositEvidenceUrl: '',
    depositEvidenceFileName: '',
    depositNote: '',
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const params = {
          branchId: branchIdFromUrl || undefined,
          barberId: barberIdFromUrl || undefined,
        };

        const [bootstrapData, infoData] = await Promise.all([
          getPublicBookingBootstrap(codigoNegocio, params),
          getPublicBookingLinkInfo(codigoNegocio, params).catch(() => null),
        ]);

        if (!active) return;

        setBootstrap(bootstrapData);
        setLinkInfo(infoData);

        const branches = asArray(bootstrapData?.branches).map(normalizeBranch);
        const services = asArray(bootstrapData?.services).map(normalizeService);
        const barbers = asArray(bootstrapData?.barbers).map(normalizeBarber);

        if (!selectedBranchId && branches.length === 1) {
          setSelectedBranchId(String(branches[0].id));
        }

        if (!selectedBarberId && barberIdFromUrl) {
          setSelectedBarberId(String(barberIdFromUrl));
        } else if (!selectedBarberId && barbers.length === 1) {
          setSelectedBarberId(String(barbers[0].id));
        }

        if (!selectedServiceId && services.length === 1) {
          setSelectedServiceId(String(services[0].id));
          setSelectedServiceIds([String(services[0].id)]);
        }

        const defaultAmount = bootstrapData?.bookingDepositDefaultAmount;
        if (defaultAmount !== undefined && defaultAmount !== null && Number(defaultAmount) > 0) {
          setDeposit((prev) => ({
            ...prev,
            depositAmount: String(defaultAmount),
          }));
        }
      } catch (e) {
        if (active) setError(e.message || 'No se pudo cargar la reserva pública.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [codigoNegocio]);

  const branches = useMemo(
    () => asArray(bootstrap?.branches).map(normalizeBranch),
    [bootstrap]
  );

  const services = useMemo(
    () => asArray(bootstrap?.services).map(normalizeService),
    [bootstrap]
  );

  const serviceCategories = useMemo(() => {
    const categories = services
      .map((service) => service.category)
      .filter(Boolean);

    return [...new Set(categories)].sort((a, b) => a.localeCompare(b, 'es'));
  }, [services]);

  const filteredServices = useMemo(() => {
    const queryWords = normalizeSearchText(serviceSearch)
      .split(/\s+/)
      .filter(Boolean);
    const categoryFilter = normalizeSearchText(selectedServiceCategory);

    return services.filter((service) => {
      const category = normalizeSearchText(service.category);
      if (categoryFilter && category !== categoryFilter) return false;

      if (queryWords.length === 0) return true;

      const haystack = normalizeSearchText(
        [
          service.name,
          service.description,
          service.category,
          `${service.price}`,
          `${service.durationMinutes}`,
        ].join(' ')
      );

      return queryWords.every((word) => haystack.includes(word));
    });
  }, [services, serviceSearch, selectedServiceCategory]);

  const allBarbers = useMemo(
    () => asArray(bootstrap?.barbers).map(normalizeBarber),
    [bootstrap]
  );

  const paymentMethods = useMemo(
    () => asArray(bootstrap?.paymentMethods).map(normalizePaymentMethod).filter((method) => method.active),
    [bootstrap]
  );

  const filteredBarbers = useMemo(() => {
    if (!selectedBranchId) return allBarbers;
    const selected = Number(selectedBranchId);

    const withBranch = allBarbers.filter((b) => {
      if (Array.isArray(b.branchIds) && b.branchIds.length > 0) {
        return b.branchIds.includes(selected);
      }
      return b.branchId === selected;
    });
    const branchBarbers = withBranch.length > 0 ? withBranch : allBarbers;
    if (selectedServiceIds.length === 0) return branchBarbers;

    return branchBarbers.filter((barber) => {
      const configuredIds = barber.serviceIdsByBranch?.[String(selected)];
      if (!Array.isArray(configuredIds)) return true;
      const allowed = new Set(configuredIds.map((id) => Number(id)));
      return selectedServiceIds.every((id) => allowed.has(Number(id)));
    });
  }, [allBarbers, selectedBranchId, selectedServiceIds]);

  const selectedBranch = branches.find((b) => String(b.id) === String(selectedBranchId));
  const selectedBarber = allBarbers.find((b) => String(b.id) === String(selectedBarberId));
  const bookableFilteredServices = useMemo(() => {
    if (!selectedBarber || !selectedBranchId) return filteredServices;
    const configuredIds = selectedBarber.serviceIdsByBranch?.[String(Number(selectedBranchId))];
    if (!Array.isArray(configuredIds)) return filteredServices;
    const allowed = new Set(configuredIds.map(Number));
    return filteredServices.filter((service) => allowed.has(Number(service.id)));
  }, [filteredServices, selectedBarber, selectedBranchId]);
  useEffect(() => {
    if (!selectedBarber || !selectedBranchId) return;
    const configuredIds = selectedBarber.serviceIdsByBranch?.[String(Number(selectedBranchId))];
    if (!Array.isArray(configuredIds)) return;
    const allowed = new Set(configuredIds.map(Number));
    setSelectedServiceIds((current) => current.filter((id) => allowed.has(Number(id))));
    setSelectedServiceId((current) => current && !allowed.has(Number(current)) ? '' : current);
  }, [selectedBarber, selectedBranchId]);

  const selectedServices = useMemo(() => {
    return selectedServiceIds
      .map((id) => services.find((service) => String(service.id) === String(id)))
      .filter(Boolean);
  }, [services, selectedServiceIds]);
  const selectedServicesTotal = selectedServices.reduce(
    (sum, service) => sum + service.price,
    0
  );
  const selectedServicesDuration = selectedServices.reduce(
    (sum, service) => sum + service.durationMinutes,
    0
  );
  const selectedMethod = paymentMethods.find(
    (p) => String(p.id) === String(deposit.depositPaymentMethodId)
  );
  const selectedProductLines = useMemo(() => {
    return publicProducts
      .map((product) => ({
        product,
        quantity: asNumber(productQuantities[product.id], 0),
      }))
      .filter((line) => line.quantity > 0);
  }, [publicProducts, productQuantities]);
  const selectedProductsTotal = selectedProductLines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0
  );

  const depositEnabled = Boolean(bootstrap?.bookingDepositEnabled);
  const appointmentDepositEnabled = depositEnabled && (!isWalkInMode || selectedServiceIds.length > 0);
  const forcedBranch = Boolean(branchIdFromUrl);
  const forcedBarber = Boolean(barberIdFromUrl);
  const currencySymbol = firstText(bootstrap?.currencySymbol, linkInfo?.currencySymbol, 'S/');
  const money = (value) => formatMoney(value, currencySymbol);

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      setSelectedTime('');
      setSlots([]);

      if (!selectedBranchId || selectedServiceIds.length === 0 || !selectedDate) return;

      setAvailabilityLoading(true);
      setError('');

      try {
        const data = await getPublicBookingAvailability(codigoNegocio, {
          branchId: selectedBranchId,
          serviceId: selectedServiceId,
          serviceIds: selectedServiceIds,
          date: selectedDate,
          barberId: selectedBarberId || undefined,
        });

        if (!active) return;
        setSlots(asArray(data?.slots));
      } catch (e) {
        if (active) setError(e.message || 'No se pudo cargar horarios disponibles.');
      } finally {
        if (active) setAvailabilityLoading(false);
      }
    }

    loadAvailability();

    return () => {
      active = false;
    };
  }, [codigoNegocio, selectedBranchId, selectedServiceId, selectedServiceIds, selectedDate, selectedBarberId]);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      if (!selectedBranchId) {
        setPublicProducts([]);
        setProductQuantities({});
        return;
      }

      setProductsLoading(true);

      try {
        const data = await getPublicBookingProducts(codigoNegocio, {
          branchId: selectedBranchId,
        });

        if (!active) return;
        const products = asArray(data)
          .map(normalizePublicProduct)
          .filter((product) => product.id);

        products.sort((a, b) => Number(b.publicFeatured) - Number(a.publicFeatured));
        setPublicProducts(products);
        setProductQuantities((prev) => {
          const next = {};
          products.forEach((product) => {
            if (prev[product.id]) next[product.id] = prev[product.id];
          });
          return next;
        });
      } catch {
        if (active) setPublicProducts([]);
      } finally {
        if (active) setProductsLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [codigoNegocio, selectedBranchId]);

  function updateCustomer(key, value) {
    setCustomer((prev) => ({ ...prev, [key]: value }));
  }

  function updateDeposit(key, value) {
    setDeposit((prev) => ({ ...prev, [key]: value }));
  }

  function changeProductQuantity(product, delta) {
    if (!product?.publicAvailable) return;

    setProductQuantities((prev) => {
      const current = asNumber(prev[product.id], 0);
      const max = product.stock > 0 ? product.stock : 99;
      const nextQuantity = Math.max(0, Math.min(max, current + delta));
      return {
        ...prev,
        [product.id]: nextQuantity,
      };
    });
  }

  function handleDepositEvidenceFile(file) {
    if (!file) return;

    const maxSizeMb = 3;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`El comprobante no debe superar ${maxSizeMb} MB.`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Sube una imagen válida del comprobante.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDeposit((prev) => ({
        ...prev,
        depositEvidenceUrl: String(reader.result || ''),
        depositEvidenceFileName: file.name,
      }));
      setError('');
    };
    reader.onerror = () => setError('No se pudo leer la imagen del comprobante.');
    reader.readAsDataURL(file);
  }

  function toggleService(serviceId) {
    const id = String(serviceId);
    setSelectedTime('');
    setSelectedServiceIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      setSelectedServiceId(next[0] || '');
      return next;
    });
  }

  function validate() {
    if (!selectedBranchId) return 'Selecciona una sede.';
    const hasProducts = selectedProductLines.length > 0;
    const needsAppointment = !isWalkInMode || selectedServiceIds.length > 0 || !hasProducts;

    if (needsAppointment && selectedServiceIds.length === 0) return 'Selecciona un servicio.';
    if (needsAppointment && !selectedDate) return 'Selecciona una fecha.';
    if (needsAppointment && !selectedTime) return 'Selecciona una hora disponible.';
    if (!customer.customerName.trim()) return 'Ingresa tu nombre.';
    if (!customer.customerPhone.trim()) return 'Ingresa tu teléfono.';

    if (appointmentDepositEnabled) {
      if (!deposit.depositPaymentMethodId) return 'Selecciona el método del adelanto.';
      if (!deposit.depositAmount || Number(deposit.depositAmount) <= 0) {
        return 'Ingresa un monto de adelanto válido.';
      }
      if (selectedMethod?.requiresOperationCode && !deposit.depositOperationCode.trim()) {
        return 'Ingresa el número de operación del adelanto.';
      }
      if (selectedMethod?.requiresEvidence && !deposit.depositEvidenceUrl.trim()) {
        return 'Sube la imagen del comprobante del adelanto.';
      }
    }

    return '';
  }

  async function submit() {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      const shouldCreateAppointment = selectedServiceIds.length > 0;
      let response = null;

      if (shouldCreateAppointment) {
        const payload = {
          branchId: Number(selectedBranchId),
          serviceId: Number(selectedServiceId),
          serviceIds: selectedServiceIds.map((id) => Number(id)),
          barberId: selectedBarberId ? Number(selectedBarberId) : null,
          date: selectedDate,
          horaInicio: selectedTime,
          customerName: customer.customerName.trim(),
          customerLastName: customer.customerLastName.trim() || null,
          customerPhone: customer.customerPhone.trim(),
          customerEmail: customer.customerEmail.trim() || null,
          promotionId: null,
          depositRequired: appointmentDepositEnabled,
          depositPaymentMethodId: appointmentDepositEnabled ? Number(deposit.depositPaymentMethodId) : null,
          depositAmount: appointmentDepositEnabled ? Number(deposit.depositAmount) : null,
          depositOperationCode:
            appointmentDepositEnabled && selectedMethod?.requiresOperationCode
              ? deposit.depositOperationCode.trim() || null
              : null,
          depositEvidenceUrl:
            appointmentDepositEnabled && selectedMethod?.requiresEvidence
              ? deposit.depositEvidenceUrl.trim() || null
              : null,
          depositNote: appointmentDepositEnabled ? deposit.depositNote.trim() || null : null,
        };

        response = await createPublicBookingAppointment(codigoNegocio, payload);
      }

      const createdProductOrders = [];

      for (const line of selectedProductLines) {
        const order = await createPublicProductOrder(codigoNegocio, {
          branchId: Number(selectedBranchId),
          productId: Number(line.product.id),
          quantity: Number(line.quantity),
          customerName: fullCustomerName(customer) || customer.customerName.trim(),
          customerPhone: customer.customerPhone.trim(),
          paymentMethod: selectedMethod?.code || selectedMethod?.name || 'PAY_AT_SHOP',
          paymentOperationNumber: deposit.depositOperationCode.trim() || null,
          paymentCaptureUrl: deposit.depositEvidenceUrl.trim() || null,
          notes: response?.appointmentId
            ? `Pedido creado junto a reserva publica #${response.appointmentId}.`
            : 'Pedido creado desde QR de atencion en local.',
        });
        createdProductOrders.push(order);
      }

      setSuccess({
        ...(response || {}),
        mode: isWalkInMode ? 'walkin' : 'booking',
        branchName: selectedBranch?.name,
        barberName: selectedBarber?.name,
        serviceName: selectedServices.map((service) => service.name).join(', '),
        servicePrice: selectedServicesTotal,
        serviceDuration: selectedServicesDuration,
        date: selectedServices.length > 0 ? selectedDate : '',
        time: selectedServices.length > 0 ? selectedTime : '',
        customerName: fullCustomerName(customer),
        productOrders: createdProductOrders,
      });
      setProductQuantities({});

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message || 'No se pudo crear la reserva.');
    } finally {
      setSubmitting(false);
    }
  }

  const businessName = firstText(
    linkInfo?.tenantName,
    bootstrap?.tenantName,
    codigoNegocio
  );

  const businessLogo = firstText(
    linkInfo?.tenantLogoUrl,
    bootstrap?.tenantLogoUrl,
    DEFAULT_LOGO
  );

  const businessCover = firstText(
    selectedBranch?.imageUrl,
    linkInfo?.branchImageUrl,
    bootstrap?.tenantCoverImageUrl
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] px-4">
        <div className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
          <p className="text-lg font-black text-slate-950">Cargando reserva...</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Estamos preparando los horarios disponibles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-6 text-slate-950 md:py-10">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[34px] bg-slate-950 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] md:rounded-[42px]">
          {businessCover ? (
            <img
              src={businessCover}
              alt={businessName}
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
          ) : null}
          <div className="absolute inset-0 bg-slate-950/65" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

          <div className="relative flex min-h-[360px] flex-col justify-between p-5 md:min-h-[430px] md:p-8">
            <div className="flex items-start justify-between gap-4">
              <BrandLogo src={businessLogo} name={businessName} />

              <div className="hidden rounded-2xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur md:block">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-100">
                  <ShieldCheck size={18} />
                  {isWalkInMode ? 'Atencion en local' : 'Reserva segura'}
                </div>
                <p className="mt-1 text-xs font-semibold text-white/75">
                  Confirmación directa con el negocio.
                </p>
              </div>
            </div>

            <div className="mt-12 max-w-4xl md:mt-16">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-200">
                {isWalkInMode ? 'QR del local' : 'Reserva online'}
              </p>
              <h1 className="mt-3 text-4xl font-black leading-none md:text-6xl">
                {businessName}
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/85 md:text-lg">
                {isWalkInMode
                  ? 'Separa productos, registra tus datos o solicita atencion desde tu telefono para que el negocio te atienda en caja.'
                  : 'Elige sede, profesional, servicio y horario. Tu cita queda lista en segundos.'}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/15 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-black">
                    <Store size={17} />
                    {selectedBranch?.name || branches[0]?.name || 'Sede disponible'}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-white/70">
                    {selectedBranch?.address || branches[0]?.address || 'Selecciona dónde atenderte.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/15 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-black">
                    <Scissors size={17} />
                    {services.length} servicios
                  </div>
                  <p className="mt-1 text-xs font-semibold text-white/70">
                    Precios y tiempos visibles antes de confirmar.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/15 p-4 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-black">
                    <CalendarDays size={17} />
                    {isWalkInMode ? 'Caja conectada' : 'Horarios reales'}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-white/70">
                    {isWalkInMode ? 'Tus productos llegan como pedido pendiente.' : 'Elige una hora disponible.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <SuccessPanel success={success} onNewBooking={() => setSuccess(null)} />
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <main className="grid gap-6">
            <PremiumSection
              number="1"
              title="Elige sede"
              subtitle={forcedBranch ? 'Este link ya tiene una sede seleccionada.' : 'Selecciona dónde quieres atenderte.'}
              icon={Store}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {branches.map((branch) => (
                  <SelectableCard
                    key={branch.id}
                    selected={String(selectedBranchId) === String(branch.id)}
                    disabled={forcedBranch && String(branchIdFromUrl) !== String(branch.id)}
                    onClick={() => {
                      if (forcedBranch) return;
                      setSelectedBranchId(String(branch.id));
                      setSelectedBarberId('');
                    }}
                  >
                    <ImageThumb src={branch.imageUrl} fallbackIcon={Store} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-black">{branch.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-500">
                        {branch.address || 'Sede disponible para reservas'}
                      </p>
                    </div>
                  </SelectableCard>
                ))}
              </div>
            </PremiumSection>

            <PremiumSection
              number="2"
              title="Elige profesional"
              subtitle={forcedBarber ? 'Este link ya pertenece a un profesional.' : 'Puedes elegir un profesional o dejarlo sin seleccionar.'}
              icon={UserRound}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {!forcedBarber ? (
                  <SelectableCard
                    selected={!selectedBarberId}
                    onClick={() => setSelectedBarberId('')}
                  >
                    <ImageThumb fallbackIcon={Sparkles} />
                    <div>
                      <p className="text-base font-black">Cualquier profesional</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">Asignamos uno disponible.</p>
                    </div>
                  </SelectableCard>
                ) : null}

                {filteredBarbers.map((barber) => (
                  <SelectableCard
                    key={barber.id}
                    selected={String(selectedBarberId) === String(barber.id)}
                    disabled={forcedBarber && String(barberIdFromUrl) !== String(barber.id)}
                    onClick={() => {
                      if (forcedBarber) return;
                      setSelectedBarberId(String(barber.id));
                    }}
                  >
                    <ImageThumb src={barber.photoUrl} fallbackIcon={UserRound} roundedFull />
                    <div className="min-w-0">
                      <p className="truncate text-base font-black">{barber.name}</p>
                      <p className="mt-1 text-xs font-bold text-emerald-700">Disponible según agenda</p>
                    </div>
                  </SelectableCard>
                ))}
              </div>
            </PremiumSection>

            <PremiumSection
              number="3"
              title={isWalkInMode ? 'Elige servicios (opcional)' : 'Elige servicios'}
              subtitle={isWalkInMode ? 'Puedes seleccionar uno o varios servicios, o continuar solo con productos.' : 'Selecciona uno o varios servicios para calcular duración y precio.'}
              icon={Scissors}
            >
              <div className="mb-4 space-y-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Buscar servicio
                  </span>
                  <input
                    type="search"
                    value={serviceSearch}
                    onChange={(event) => setServiceSearch(event.target.value)}
                    placeholder="Ej. facial, limpieza, piercing, profesional"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-950 outline-none ring-blue-100 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4"
                  />
                </label>

                {serviceCategories.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedServiceCategory('')}
                      className={
                        !selectedServiceCategory
                          ? 'shrink-0 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white'
                          : 'shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600'
                      }
                    >
                      Todo
                    </button>
                    {serviceCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedServiceCategory(category)}
                        className={
                          selectedServiceCategory === category
                            ? 'shrink-0 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white'
                            : 'shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600'
                        }
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {isWalkInMode ? (
                  <SelectableCard
                    selected={selectedServiceIds.length === 0}
                    onClick={() => {
                      setSelectedServiceId('');
                      setSelectedServiceIds([]);
                      setSelectedTime('');
                    }}
                    large
                  >
                    <ImageThumb fallbackIcon={Package} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black">Solo productos</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Separar productos para pagar o recoger en caja.
                      </p>
                    </div>
                  </SelectableCard>
                ) : null}
                {selectedServices.length > 0 ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-black text-emerald-900 md:col-span-2">
                    {selectedServices.length} servicio{selectedServices.length === 1 ? '' : 's'} seleccionado{selectedServices.length === 1 ? '' : 's'} · {selectedServicesDuration} min aprox. · {money(selectedServicesTotal)}
                  </div>
                ) : null}
                {filteredServices.length === 0 ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-black text-amber-700 md:col-span-2">
                    No encontramos servicios con esa busqueda. Prueba con otra palabra o categoria.
                  </div>
                ) : null}
                {bookableFilteredServices.map((service) => (
                  <SelectableCard
                    key={service.id}
                    selected={selectedServiceIds.includes(String(service.id))}
                    onClick={() => toggleService(service.id)}
                    large
                  >
                    <ImageThumb src={service.imageUrl} fallbackIcon={Scissors} />
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-3">
                        <p className="min-w-0 flex-1 truncate text-base font-black">{service.name}</p>
                        <p className="shrink-0 text-base font-black text-emerald-700">
                          {service.variablePrice ? 'Desde ' : ''}{money(service.price)}
                        </p>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-500">
                        {service.description || 'Servicio disponible para reserva online.'}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                        <Clock3 size={14} />
                        {service.durationMinutes} min aprox.
                      </div>
                      {service.category ? (
                        <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          {service.category}
                        </div>
                      ) : null}
                      {selectedServiceIds.includes(String(service.id)) ? (
                        <div className="mt-2 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                          Seleccionado
                        </div>
                      ) : null}
                    </div>
                  </SelectableCard>
                ))}
              </div>
            </PremiumSection>

            {isWalkInMode && selectedServiceIds.length === 0 ? (
              <PremiumSection
                number="4"
                title="Atencion sin cita"
                subtitle="Para separar productos no necesitas escoger horario."
                icon={CalendarDays}
              >
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-900">
                  Puedes continuar solo con productos. Si quieres solicitar un servicio tambien, selecciona uno y te mostraremos horarios disponibles.
                </div>
              </PremiumSection>
            ) : (
            <PremiumSection
              number="4"
              title="Fecha y hora"
              subtitle={isWalkInMode ? 'Elige una hora para que el negocio te ubique en agenda.' : 'Selecciona un horario disponible.'}
              icon={CalendarDays}
            >
              <div className="grid gap-4 md:grid-cols-[260px_1fr]">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Fecha
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    min={todayDateInput()}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none ring-blue-100 focus:border-blue-600 focus:ring-4"
                  />
                </label>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
                    <Clock3 size={18} />
                    Horarios disponibles
                  </div>

                  {availabilityLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-black text-slate-500">
                      Buscando horarios...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-black text-amber-700">
                      No hay horarios disponibles para esta selección.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={
                            String(selectedTime) === String(slot)
                              ? 'h-13 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg'
                              : 'h-13 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950'
                          }
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PremiumSection>
            )}

            <PremiumSection
              number="5"
              title="Tus datos"
              subtitle="Usaremos estos datos para registrar y confirmar tu cita."
              icon={Phone}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <PremiumInput
                  label="Nombre"
                  value={customer.customerName}
                  onChange={(value) => updateCustomer('customerName', value)}
                  placeholder="Ej. Juan"
                />
                <PremiumInput
                  label="Apellido"
                  value={customer.customerLastName}
                  onChange={(value) => updateCustomer('customerLastName', value)}
                  placeholder="Opcional"
                />
                <PremiumInput
                  label="Teléfono"
                  value={customer.customerPhone}
                  onChange={(value) => updateCustomer('customerPhone', value)}
                  placeholder="Ej. 958000000"
                />
                <PremiumInput
                  label="Correo"
                  value={customer.customerEmail}
                  onChange={(value) => updateCustomer('customerEmail', value)}
                  placeholder="Opcional"
                />
              </div>
            </PremiumSection>

            {selectedBranchId ? (
              <PremiumSection
                number="6"
                title="Productos para recoger"
                subtitle="Puedes separar productos disponibles y pagarlos o recogerlos en caja."
                icon={Package}
              >
                {productsLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-black text-slate-500">
                    Cargando productos...
                  </div>
                ) : publicProducts.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-black text-slate-500">
                    Este negocio aun no tiene productos publicados para clientes.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {publicProducts.map((product) => {
                      const quantity = asNumber(productQuantities[product.id], 0);
                      const maxReached = product.stock > 0 && quantity >= product.stock;

                      return (
                        <div
                          key={product.id}
                          className={[
                            'rounded-3xl border bg-white p-4 shadow-sm',
                            product.publicFeatured ? 'border-amber-200 ring-2 ring-amber-100' : 'border-slate-200',
                            product.publicAvailable ? '' : 'opacity-60',
                          ].join(' ')}
                        >
                          <div className="flex gap-3">
                            <ImageThumb src={product.imageUrl} fallbackIcon={Package} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-base font-black text-slate-950">{product.name}</p>
                                  <p className="mt-1 text-xs font-bold text-slate-500">
                                    {product.category || 'Producto disponible'}
                                  </p>
                                </div>
                                <p className="shrink-0 text-base font-black text-emerald-700">
                                  {money(product.price)}
                                </p>
                              </div>

                              <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                                {product.description || 'Separa este producto y recÃ³gelo en el local.'}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <span className={`rounded-full px-3 py-1 text-[11px] font-black ${product.publicAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                  {product.publicAvailable ? `Stock ${product.stock}` : 'Agotado'}
                                </span>

                                <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                  <button
                                    type="button"
                                    onClick={() => changeProductQuantity(product, -1)}
                                    disabled={quantity <= 0}
                                    className="flex h-10 w-10 items-center justify-center text-slate-700 disabled:opacity-30"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <div className="w-10 text-center text-sm font-black text-slate-950">{quantity}</div>
                                  <button
                                    type="button"
                                    onClick={() => changeProductQuantity(product, 1)}
                                    disabled={!product.publicAvailable || maxReached}
                                    className="flex h-10 w-10 items-center justify-center text-slate-700 disabled:opacity-30"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedProductLines.length > 0 ? (
                  <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-black text-emerald-900">
                      Productos seleccionados: {selectedProductLines.length} · Total {money(selectedProductsTotal)}
                    </p>
                    <p className="mt-1 text-xs font-bold leading-5 text-emerald-800">
                      El negocio validarÃ¡ el pedido desde caja y lo entregarÃ¡ descontando stock.
                    </p>
                  </div>
                ) : null}
              </PremiumSection>
            ) : null}

            {appointmentDepositEnabled ? (
              <PremiumSection
                number="7"
                title="Adelanto obligatorio"
                subtitle="Este negocio solicita un anticipo para confirmar y separar tu horario."
                icon={WalletCards}
              >
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-black text-amber-900">Anticipo requerido</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-amber-800">
                    Para crear la reserva debes registrar el método de pago, monto, número de operación y subir la captura del comprobante.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                      Método de pago
                    </span>
                    <select
                      value={deposit.depositPaymentMethodId}
                      onChange={(event) => updateDeposit('depositPaymentMethodId', event.target.value)}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none ring-blue-100 focus:border-blue-600 focus:ring-4"
                    >
                      <option value="">Seleccionar método</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedMethod ? (
                    <div className="md:col-span-2 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-sm font-black text-amber-900">
                        Datos para pagar por {selectedMethod.name}
                      </div>
                      {selectedMethod.accountHolderName ? (
                        <p className="mt-2 text-sm font-bold text-amber-900">
                          Titular: {selectedMethod.accountHolderName}
                        </p>
                      ) : null}
                      {selectedMethod.accountValue ? (
                        <p className="mt-1 text-sm font-bold text-amber-900">
                          {selectedMethod.accountLabel || 'Cuenta'}: {selectedMethod.accountValue}
                        </p>
                      ) : null}
                      {selectedMethod.instructions ? (
                        <p className="mt-2 text-sm font-semibold leading-6 text-amber-800">
                          {selectedMethod.instructions}
                        </p>
                      ) : null}
                      {selectedMethod.qrImageUrl ? (
                        <img
                          src={selectedMethod.qrImageUrl}
                          alt={`QR ${selectedMethod.name}`}
                          className="mt-3 h-40 w-40 rounded-2xl border border-amber-200 bg-white object-contain p-2"
                        />
                      ) : null}
                    </div>
                  ) : null}

                  <PremiumInput
                    label="Monto del anticipo"
                    value={deposit.depositAmount}
                    onChange={(value) => updateDeposit('depositAmount', value)}
                    placeholder="Ej. 10"
                    type="number"
                  />

                  {selectedMethod?.requiresOperationCode ? (
                  <PremiumInput
                    label="N° operación"
                    value={deposit.depositOperationCode}
                    onChange={(value) => updateDeposit('depositOperationCode', value)}
                    placeholder="Obligatorio"
                  />
                  ) : null}

                  {selectedMethod?.requiresEvidence ? (
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                      Captura del comprobante
                    </span>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleDepositEvidenceFile(event.target.files?.[0])}
                        className="block w-full text-sm font-bold text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-3 file:text-sm file:font-black file:text-white"
                      />
                      {deposit.depositEvidenceFileName ? (
                        <p className="mt-3 text-xs font-black text-emerald-700">
                          Comprobante cargado: {deposit.depositEvidenceFileName}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs font-bold text-slate-500">
                          Sube una captura en JPG, PNG o imagen. Máximo 3 MB.
                        </p>
                      )}
                    </div>
                  </label>
                  ) : null}

                  {selectedMethod?.requiresEvidence && deposit.depositEvidenceUrl ? (
                    <div className="md:col-span-2">
                      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">Vista previa</p>
                        <img
                          src={deposit.depositEvidenceUrl}
                          alt="Comprobante del adelanto"
                          className="max-h-72 w-full rounded-2xl object-contain"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="md:col-span-2">
                    <PremiumInput
                      label="Nota"
                      value={deposit.depositNote}
                      onChange={(value) => updateDeposit('depositNote', value)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </PremiumSection>
            ) : null}
          </main>

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="mb-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                Resumen
              </div>

              <SummaryLine label="Negocio" value={businessName} />
              <SummaryLine label="Sede" value={selectedBranch?.name || 'Por elegir'} />
              <SummaryLine label="Profesional" value={selectedBarber?.name || 'Cualquiera disponible'} />
              <SummaryLine
                label="Servicios"
                value={
                  selectedServices.length > 0
                    ? `${selectedServices.length} seleccionado${selectedServices.length === 1 ? '' : 's'}`
                    : isWalkInMode ? 'Opcional' : 'Por elegir'
                }
              />
              {selectedServices.length > 0 ? (
                <>
                  <SummaryLine
                    label="Total servicios"
                    value={money(selectedServicesTotal)}
                  />
                  <SummaryLine label="Duración" value={`${selectedServicesDuration} min aprox.`} />
                  <SummaryLine label="Fecha" value={displayDate(selectedDate)} />
                  <SummaryLine label="Hora" value={selectedTime || 'Por elegir'} />
                </>
              ) : null}

              {selectedProductLines.length > 0 ? (
                <>
                  <div className="my-4 h-px bg-slate-100" />
                  <SummaryLine label="Productos" value={`${selectedProductLines.length} seleccionados`} />
                  <SummaryLine label="Total productos" value={money(selectedProductsTotal)} />
                </>
              ) : null}

              {appointmentDepositEnabled ? (
                <>
                  <div className="my-4 h-px bg-slate-100" />
                  <SummaryLine label="Adelanto obligatorio" value={money(deposit.depositAmount) || 'Por definir'} />
                  <SummaryLine label="Método" value={selectedMethod?.name || 'Por elegir'} />
                  {selectedMethod?.accountHolderName ? (
                    <SummaryLine label="Titular" value={selectedMethod.accountHolderName} />
                  ) : null}
                  {selectedMethod?.accountValue ? (
                    <SummaryLine label={selectedMethod.accountLabel || 'Cuenta'} value={selectedMethod.accountValue} />
                  ) : null}
                  {selectedMethod?.requiresEvidence ? (
                    <SummaryLine label="Comprobante" value={deposit.depositEvidenceFileName || 'Pendiente'} />
                  ) : null}
                </>
              ) : null}

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F2A5F] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#123A84] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Confirmando...'
                  : selectedProductLines.length > 0 && selectedServices.length === 0
                    ? 'Enviar pedido a caja'
                    : selectedProductLines.length > 0
                      ? 'Confirmar reserva y productos'
                      : isWalkInMode
                        ? 'Enviar solicitud'
                        : 'Confirmar reserva'}
                <ChevronRight size={18} />
              </button>

              <p className="mt-3 text-center text-xs font-bold leading-5 text-slate-500">
                Revisa bien los datos antes de confirmar tu cita.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PremiumSection({ number, title, subtitle, icon, children }) {
  return (
    <section className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
          {createElement(icon, { size: 22 })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
              Paso {number}
            </span>
            <h2 className="truncate text-xl font-black text-slate-950">{title}</h2>
          </div>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SelectableCard({ selected, disabled = false, onClick, children, large = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition',
        large ? 'min-h-[112px]' : 'min-h-[92px]',
        selected
          ? 'border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-900/15'
          : 'border-slate-200 bg-slate-50 text-slate-950 hover:border-slate-950 hover:bg-white',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ].join(' ')}
    >
      {children}
      {selected ? <CheckCircle2 className="ml-auto shrink-0 text-emerald-300" size={22} /> : null}
    </button>
  );
}

function ImageThumb({ src, fallbackIcon = ImageIcon, roundedFull = false }) {
  return (
    <div
      className={[
        'relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-white/80 text-slate-500 ring-1 ring-slate-200',
        roundedFull ? 'rounded-full' : 'rounded-2xl',
      ].join(' ')}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      {createElement(fallbackIcon, { className: src ? 'absolute opacity-0' : '', size: 24 })}
    </div>
  );
}

function PremiumInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none ring-blue-100 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4"
      />
    </label>
  );
}

function SummaryLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="text-right text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function SuccessPanel({ success, onNewBooking }) {
  const hasService = Boolean(success.serviceName);
  const hasProducts = Array.isArray(success.productOrders) && success.productOrders.length > 0;
  const title = hasService ? 'Reserva creada correctamente' : 'Pedido enviado a caja';
  const actionLabel = hasService ? 'Crear otra reserva' : 'Enviar otro pedido';

  return (
    <div className="mt-5 rounded-[34px] border border-emerald-200 bg-emerald-50 p-6 shadow-[0_24px_70px_rgba(16,185,129,0.10)]">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <CheckCircle2 size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-black text-emerald-950">{title}</h2>
          <p className="mt-1 text-sm font-bold text-emerald-800">
            Estado: {success.estado || success.status || 'CREATED'} · Código: {success.appointmentId || 'registrado'}
          </p>

          <div className="mt-4 grid gap-2 rounded-3xl bg-white/70 p-4 text-sm font-bold text-slate-700 md:grid-cols-2">
            <p><b>Cliente:</b> {success.customerName}</p>
            {hasService ? <p><b>Servicio:</b> {success.serviceName}</p> : null}
            <p><b>Sede:</b> {success.branchName}</p>
            {hasService ? <p><b>Profesional:</b> {success.barberName || 'Cualquiera disponible'}</p> : null}
            {hasService ? <p><b>Fecha:</b> {displayDate(success.date)}</p> : null}
            {hasService ? <p><b>Hora:</b> {success.time}</p> : null}
            {hasProducts ? (
              <p className="md:col-span-2">
                <b>Productos:</b> {success.productOrders.length} pedido{success.productOrders.length === 1 ? '' : 's'} enviado{success.productOrders.length === 1 ? '' : 's'} a caja.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onNewBooking}
            className="mt-4 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
