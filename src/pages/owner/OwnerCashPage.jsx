import { useEffect, useMemo, useState } from 'react';
import {
  closeCashRegister,
  createBarberPayment,
  createCashMovement,
  createCashSale,
  deleteCashSale,
  getBarberPaymentPreview,
  getCashBarbers,
  getCashHistory,
  getCashProducts,
  getCashServices,
  getCashMovements,
  getCurrentCashRegister,
  getOwnerBranches,
  getSalesByCashRegister,
  getTodayCashSales,
  openCashRegister,
  updateCashSale,
} from '../../api/ownerCashApi';
import { createOwnerCustomer, getOwnerCustomers } from '../../api/ownerCustomersApi';

function formatMoney(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: number % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeMethod(value) {
  const code = String(value || '').trim().toUpperCase();

  if (code === 'EFECTIVO') return 'CASH';
  if (code === 'TARJETA') return 'CARD';
  if (code === 'TRANSFERENCIA') return 'TRANSFER';

  return code;
}

function methodLabel(value) {
  const code = normalizeMethod(value);

  const labels = {
    CASH: 'Efectivo',
    YAPE: 'Yape',
    PLIN: 'Plin',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    FREE: 'Gratis',
    NEQUI: 'Nequi',
    DAVIPLATA: 'Daviplata',
    PAGO_MOVIL: 'Pago móvil',
    ZELLE: 'Zelle',
    QR: 'QR',
  };

  return labels[code] || code || 'Otro';
}

function movementTypeLabel(type) {
  const labels = {
    INCOME: 'Ingreso',
    EXPENSE: 'Gasto',
    ADVANCE_BARBER: 'Adelanto barbero',
    PAYMENT_BARBER: 'Pago barbero',
    PAYMENT_METHOD_TRANSFER: 'Traslado entre métodos',
  };

  return labels[type] || type || 'Movimiento';
}

function movementAmountClass(type) {
  if (type === 'INCOME') return 'text-emerald-700';
  if (type === 'PAYMENT_METHOD_TRANSFER') return 'text-blue-700';
  return 'text-red-700';
}

function amountClassByValue(value) {
    const number = Number(value || 0);
  
    if (number < 0) return 'text-red-700';
    if (number > 0) return 'text-neutral-950';
  
    return 'text-neutral-500';
  }
  
  function balanceTone(value) {
    const number = Number(value || 0);
  
    if (number < 0) return 'red';
    if (number > 0) return 'dark';
  
    return 'default';
  }

function StatCard({ title, value, helper, tone = 'default' }) {
  const styles = {
    default: 'border-neutral-200 bg-white',
    gold: 'border-amber-200 bg-[linear-gradient(135deg,#FFFBEB_0%,#FFFFFF_70%)]',
    dark: 'border-neutral-900 bg-neutral-950 text-white',
    green: 'border-emerald-200 bg-emerald-50',
    red: 'border-red-200 bg-red-50',
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] ${styles[tone]}`}>
      <div className={tone === 'dark' ? 'text-sm font-bold text-white/55' : 'text-sm font-bold text-neutral-500'}>
        {title}
      </div>

      <div className={tone === 'dark' ? 'mt-2 text-2xl font-black text-white' : 'mt-2 text-2xl font-black text-neutral-950'}>
        {value}
      </div>

      {helper && (
        <div className={tone === 'dark' ? 'mt-1 text-xs text-white/45' : 'mt-1 text-xs text-neutral-500'}>
          {helper}
        </div>
      )}
    </div>
  );
}


function toDateInputValue(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

function saleIdOf(sale) {
  return sale?.saleId ?? sale?.id ?? sale?.sale_id;
}

function saleDateOf(sale) {
  return (
    sale?.fechaCreacion ??
    sale?.saleDate ??
    sale?.createdAt ??
    sale?.created_at ??
    sale?.fecha ??
    null
  );
}

function saleBarberName(sale) {
  const direct = String(
    sale?.barberName ??
      sale?.barbero ??
      sale?.barberUserName ??
      ''
  ).trim();

  if (direct) return direct;

  const items = Array.isArray(sale?.items) ? sale.items : [];

  for (const item of items) {
    const candidate = String(
      item?.barberUserName ??
        item?.barberName ??
        item?.barbero ??
        ''
    ).trim();

    if (candidate) return candidate;
  }

  return 'Barbero no registrado';
}

function readAttendAppointmentFromStorage() {
  try {
    const raw = window.sessionStorage.getItem('ownerWebAttendAppointment');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.appointmentId) return null;

    return parsed;
  } catch {
    return null;
  }
}

function clearAttendAppointmentFromStorage() {
  window.sessionStorage.removeItem('ownerWebAttendAppointment');
}

function servicePriceOf(service) {
  return Number(service?.price ?? service?.precio ?? 0);
}

function itemSubtotal(item) {
  return Number(item.quantity || 1) * Number(item.unitPrice || 0);
}

function EmptyCard({ title, text, action }) {
    return (
      <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white/70 p-8 text-center">
        <div className="text-xl font-black text-neutral-950">{title}</div>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">
          {text}
        </p>
  
        {action && <div className="mt-5">{action}</div>}
      </div>
    );
  }


  function CashNegativeAlert({ expected, cashSalesTotal, expense }) {
    if (Number(expected || 0) >= 0) return null;
  
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-red-600">
              Alerta de caja negativa
            </div>
  
            <h3 className="mt-2 text-xl font-black text-red-800">
              La caja física esperada está en negativo
            </h3>
  
            <p className="mt-2 max-w-3xl text-sm leading-6 text-red-700">
              Esto pasa cuando las salidas registradas superan el efectivo disponible.
              Revisa si hubo pagos a barberos, adelantos o gastos registrados con un
              método incorrecto.
            </p>
          </div>
  
          <div className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-red-700 shadow-sm">
            {formatMoney(cashSalesTotal)} - {formatMoney(expense)} = {formatMoney(expected)}
          </div>
        </div>
      </div>
    );
  }

function OpenCashModal({ branch, onClose, onSaved }) {
  const [openingAmount, setOpeningAmount] = useState('0');
  const [openingNote, setOpeningNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    const amount = Number(String(openingAmount).replace(',', '.'));

    if (Number.isNaN(amount) || amount < 0) {
      setErrorMsg('Ingresa un monto válido.');
      return;
    }

    setSaving(true);

    try {
      await openCashRegister({
        branchId: branch.id,
        openingAmount: amount,
        openingNote: openingNote.trim() || null,
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo abrir la caja.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Abrir caja" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Monto inicial"
          value={openingAmount}
          onChange={setOpeningAmount}
          type="number"
          step="0.01"
          prefix="S/"
        />

        <TextAreaField
          label="Nota de apertura"
          value={openingNote}
          onChange={setOpeningNote}
          placeholder="Ej. Apertura de turno mañana"
        />

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Abriendo...' : 'Abrir caja'}
        </button>
      </form>
    </ModalShell>
  );
}

function CloseCashModal({ branch, cashRegister, onClose, onSaved }) {
  const expected = Number(cashRegister?.closingAmountExpected || 0);

  const [counted, setCounted] = useState(String(expected.toFixed(2)));
  const [closingNote, setClosingNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const countedNumber = Number(String(counted).replace(',', '.')) || 0;
  const difference = countedNumber - expected;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (Number.isNaN(countedNumber) || countedNumber < 0) {
      setErrorMsg('Ingresa un monto contado válido.');
      return;
    }

    setSaving(true);

    try {
      await closeCashRegister({
        branchId: branch.id,
        cashRegisterId: cashRegister.id,
        closingAmountCounted: countedNumber,
        closingNote: closingNote.trim() || null,
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cerrar la caja.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Cerrar caja" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard title="Esperado" value={formatMoney(expected)} helper="Según sistema" tone="gold" />
          <StatCard
            title="Diferencia"
            value={formatMoney(difference)}
            helper={difference === 0 ? 'Cuadra perfecto' : difference > 0 ? 'Sobra dinero' : 'Falta dinero'}
            tone={difference === 0 ? 'green' : 'red'}
          />
        </div>

        <InputField
          label="Monto contado"
          value={counted}
          onChange={setCounted}
          type="number"
          step="0.01"
          prefix="S/"
        />

        <TextAreaField
          label="Observación de cierre"
          value={closingNote}
          onChange={setClosingNote}
          placeholder="Ej. Caja cerrada sin diferencias"
        />

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-neutral-950 px-5 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Cerrando...' : 'Cerrar caja'}
        </button>
      </form>
    </ModalShell>
  );
}

function MovementModal({ branch, cashRegister, onClose, onSaved }) {
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('Gasto general');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [fromPaymentMethod, setFromPaymentMethod] = useState('YAPE');
  const [toPaymentMethod, setToPaymentMethod] = useState('CASH');

  const [barbers, setBarbers] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [loadingBarbers, setLoadingBarbers] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const concepts = {
    INCOME: [
      'Ingreso adicional',
      'Abono manual',
      'Regularización de caja',
      'Pago externo',
      'Otro ingreso',
    ],
    EXPENSE: [
      'Compra de productos',
      'Limpieza',
      'Movilidad',
      'Alimentación',
      'Mantenimiento',
      'Pago de Luz',
      'Pago de Agua',
      'Pago de Alquiler',
      'Servicios',
      'Otros',
    ],
    ADVANCE_BARBER: [
      'Adelanto a barbero',
      'Préstamo del día',
      'Liquidación parcial',
    ],
    PAYMENT_BARBER: [
      'Pago a barbero manual',
      'Pago de porcentaje',
      'Pago de comisión',
    ],
    PAYMENT_METHOD_TRANSFER: [
      'Traslado entre métodos',
      'Conversión a efectivo',
      'Depósito a cuenta digital',
      'Regularización entre métodos',
    ],
  };

  const paymentMethods = ['CASH', 'YAPE', 'PLIN', 'TRANSFER', 'CARD'];

  const needsBarber = type === 'ADVANCE_BARBER' || type === 'PAYMENT_BARBER';
  const isTransfer = type === 'PAYMENT_METHOD_TRANSFER';

  useEffect(() => {
    async function loadBarbers() {
      if (!branch?.id) return;

      setLoadingBarbers(true);

      try {
        const data = await getCashBarbers(branch.id);
        setBarbers(data.filter((item) => item.id > 0));
      } catch {
        setBarbers([]);
      } finally {
        setLoadingBarbers(false);
      }
    }

    loadBarbers();
  }, [branch?.id]);

  function handleTypeChange(nextType) {
    setType(nextType);
    setConcept(concepts[nextType]?.[0] || 'Movimiento');

    if (nextType !== 'ADVANCE_BARBER' && nextType !== 'PAYMENT_BARBER') {
      setSelectedBarberId('');
    }

    if (nextType === 'PAYMENT_METHOD_TRANSFER') {
      setFromPaymentMethod('YAPE');
      setToPaymentMethod('CASH');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = Number(String(amount).replace(',', '.'));

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Ingresa un monto mayor a cero.');
      return;
    }

    if (isTransfer && fromPaymentMethod === toPaymentMethod) {
      setErrorMsg('El método origen y destino no pueden ser iguales.');
      return;
    }

    if (needsBarber && !selectedBarberId) {
      setErrorMsg('Selecciona el barbero relacionado.');
      return;
    }

    setSaving(true);

    try {
      await createCashMovement({
        branchId: branch.id,
        cashRegisterId: cashRegister.id,
        type,
        amount: parsedAmount,
        concept,
        note: note.trim() || null,
        barberUserId: needsBarber ? Number(selectedBarberId) : null,
        paymentMethod: isTransfer ? toPaymentMethod : paymentMethod,
        fromPaymentMethod: isTransfer ? fromPaymentMethod : null,
        toPaymentMethod: isTransfer ? toPaymentMethod : null,
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo registrar el movimiento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Registrar movimiento" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Tipo de movimiento"
          value={type}
          onChange={handleTypeChange}
          options={[
            { value: 'INCOME', label: 'Añadir ingreso' },
            { value: 'EXPENSE', label: 'Gasto general' },
            { value: 'ADVANCE_BARBER', label: 'Adelanto a barbero' },
            { value: 'PAYMENT_BARBER', label: 'Pago a barbero manual' },
            { value: 'PAYMENT_METHOD_TRANSFER', label: 'Trasladar dinero entre métodos' },
          ]}
        />

        <InputField
          label="Monto"
          value={amount}
          onChange={setAmount}
          type="number"
          step="0.01"
          prefix="S/"
        />

        <SelectField
          label="Concepto"
          value={concept}
          onChange={setConcept}
          options={(concepts[type] || ['Movimiento']).map((item) => ({
            value: item,
            label: item,
          }))}
        />

        {needsBarber && (
          <>
            {loadingBarbers ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                Cargando barberos...
              </div>
            ) : barbers.length === 0 ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700">
                No se encontraron barberos activos para esta sede.
              </div>
            ) : (
              <SelectField
                label="Barbero relacionado"
                value={selectedBarberId}
                onChange={setSelectedBarberId}
                options={[
                  { value: '', label: 'Selecciona un barbero' },
                  ...barbers.map((barber) => ({
                    value: String(barber.id),
                    label: barber.name,
                  })),
                ]}
              />
            )}
          </>
        )}

        {isTransfer ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Desde"
              value={fromPaymentMethod}
              onChange={setFromPaymentMethod}
              options={paymentMethods.map((item) => ({
                value: item,
                label: methodLabel(item),
              }))}
            />

            <SelectField
              label="Hacia"
              value={toPaymentMethod}
              onChange={setToPaymentMethod}
              options={paymentMethods.map((item) => ({
                value: item,
                label: methodLabel(item),
              }))}
            />
          </div>
        ) : (
          <SelectField
            label={type === 'INCOME' ? 'Método de ingreso' : 'Método de salida'}
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={paymentMethods.map((item) => ({
              value: item,
              label: methodLabel(item),
            }))}
          />
        )}

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {isTransfer
            ? 'Este traslado no crea una venta. Solo mueve saldo de un método a otro.'
            : type === 'INCOME'
              ? 'Este ingreso se sumará al esperado de caja solo si el método es efectivo.'
              : needsBarber
                ? 'Este movimiento quedará relacionado al barbero seleccionado.'
                : 'Solo los movimientos en efectivo afectarán el esperado de caja.'}
        </div>

        <TextAreaField
          label="Nota"
          value={note}
          onChange={setNote}
          placeholder={needsBarber ? 'Ej. Pago manual o adelanto solicitado.' : 'Detalle opcional'}
        />

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar movimiento'}
        </button>
      </form>
    </ModalShell>
  );
}

function BarberPaymentModal({ branch, cashRegister, onClose, onSaved }) {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);

  const [barbers, setBarbers] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [periodFrom, setPeriodFrom] = useState(toDateInputValue(sevenDaysAgo));
  const [periodTo, setPeriodTo] = useState(toDateInputValue(today));
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [note, setNote] = useState('');

  const [preview, setPreview] = useState(null);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const paymentMethods = ['CASH', 'YAPE', 'PLIN', 'TRANSFER', 'CARD'];

  useEffect(() => {
    async function loadBarbers() {
      setLoadingBarbers(true);
      setErrorMsg('');

      try {
        const data = await getCashBarbers(branch.id);
        setBarbers(data.filter((item) => item.id > 0));
      } catch (error) {
        setErrorMsg(error.message || 'No se pudieron cargar los barberos.');
      } finally {
        setLoadingBarbers(false);
      }
    }

    loadBarbers();
  }, [branch.id]);

  async function loadPreview(nextBarberId = selectedBarberId) {
    if (!nextBarberId) return;

    setLoadingPreview(true);
    setErrorMsg('');

    try {
      const data = await getBarberPaymentPreview({
        branchId: branch.id,
        barberUserId: Number(nextBarberId),
        periodFrom,
        periodTo,
      });

      setPreview(data);

      const pending = Number(data?.pendingAmount ?? 0);
      setAmountPaid(pending > 0 ? pending.toFixed(2) : '0.00');
    } catch (error) {
      setPreview(null);
      setErrorMsg(error.message || 'No se pudo calcular el pago del barbero.');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleBarberChange(value) {
    setSelectedBarberId(value);
    setPreview(null);
    setAmountPaid('');

    if (value) {
      await loadPreview(value);
    }
  }

  function handleDateChange(kind, value) {
    if (kind === 'from') {
      setPeriodFrom(value);
    } else {
      setPeriodTo(value);
    }

    setPreview(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedBarberId) {
      setErrorMsg('Selecciona un barbero.');
      return;
    }

    const amount = Number(String(amountPaid).replace(',', '.'));

    if (Number.isNaN(amount) || amount <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a cero.');
      return;
    }

    setSaving(true);

    try {
      await createBarberPayment({
        branchId: branch.id,
        cashRegisterId: cashRegister.id,
        barberUserId: Number(selectedBarberId),
        periodFrom,
        periodTo,
        amountPaid: amount,
        paymentMethod,
        note: note.trim() || null,
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo registrar el pago al barbero.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Pagar barbero" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {loadingBarbers ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
            Cargando barberos...
          </div>
        ) : (
          <SelectField
            label="Barbero"
            value={selectedBarberId}
            onChange={handleBarberChange}
            options={[
              { value: '', label: 'Selecciona un barbero' },
              ...barbers.map((barber) => ({
                value: String(barber.id),
                label: barber.name,
              })),
            ]}
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <InputField
            label="Desde"
            value={periodFrom}
            onChange={(value) => handleDateChange('from', value)}
            type="date"
          />

          <InputField
            label="Hasta"
            value={periodTo}
            onChange={(value) => handleDateChange('to', value)}
            type="date"
          />
        </div>

        <button
          type="button"
          onClick={() => loadPreview()}
          disabled={!selectedBarberId || loadingPreview}
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
        >
          {loadingPreview ? 'Calculando...' : 'Calcular pendiente'}
        </button>

        {preview && (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
              Resumen inteligente
            </div>

            <div className="mt-3 text-xl font-black text-neutral-950">
              {preview.barberName || 'Barbero'}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniPreviewItem label="Servicios" value={formatMoney(preview.serviceCommissionAmount)} />
              <MiniPreviewItem label="Productos" value={formatMoney(preview.productCommissionAmount)} />
              <MiniPreviewItem label="Propinas" value={formatMoney(preview.tipsAmount)} />
              <MiniPreviewItem label="Adelantos" value={formatMoney(preview.advancesApplied)} />
              <MiniPreviewItem label="Pagos previos" value={formatMoney(preview.previousPaymentsApplied)} />
              <MiniPreviewItem label="Pendiente" value={formatMoney(preview.pendingAmount)} strong />
            </div>
          </div>
        )}

        <InputField
          label="Monto a pagar"
          value={amountPaid}
          onChange={setAmountPaid}
          type="number"
          step="0.01"
          prefix="S/"
        />

        <SelectField
          label="Método de pago"
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={paymentMethods.map((item) => ({
            value: item,
            label: methodLabel(item),
          }))}
        />

        <TextAreaField
          label="Observación"
          value={note}
          onChange={setNote}
          placeholder="Ej. Pago semanal del barbero"
        />

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Registrando pago...' : 'Confirmar pago'}
        </button>
      </form>
    </ModalShell>
  );
}

function MiniPreviewItem({ label, value, strong = false }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        strong ? 'border-emerald-200 bg-emerald-50' : 'border-neutral-200 bg-white'
      }`}
    >
      <div className="text-xs font-bold text-neutral-500">{label}</div>
      <div className={`mt-1 text-lg font-black ${strong ? 'text-emerald-700' : 'text-neutral-950'}`}>
        {value}
      </div>
    </div>
  );
}

function SalesSection({ sales, onEdit, onDelete }) {
  return (
    <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Ventas
          </div>

          <h3 className="mt-2 text-2xl font-black text-neutral-950">
            Ventas de hoy
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Ventas registradas en la sede seleccionada. Puedes editar o eliminar desde web.
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-700">
          {sales.length} venta{sales.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[26px] border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-[linear-gradient(135deg,#090909_0%,#111827_100%)] text-white">
            <tr>
              <th className="px-5 py-4 font-black">Cliente</th>
              <th className="px-5 py-4 font-black">Barbero</th>
              <th className="px-5 py-4 font-black">Método</th>
              <th className="px-5 py-4 font-black">Total</th>
              <th className="px-5 py-4 font-black">Fecha</th>
              <th className="px-5 py-4 font-black text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-neutral-500" colSpan="6">
                  Aún no hay ventas registradas hoy.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={saleIdOf(sale)} className="border-t border-neutral-200 transition hover:bg-amber-50/50">
                  <td className="px-5 py-5">
                    <div className="font-black text-neutral-950">
                      {sale.customerName || 'Cliente ocasional'}
                    </div>
                    <div className="mt-1 text-xs text-neutral-400">
                      ID: {saleIdOf(sale) || '-'}
                    </div>
                  </td>

                  <td className="px-5 py-5 font-bold text-neutral-700">
                    {saleBarberName(sale)}
                  </td>

                  <td className="px-5 py-5 font-bold text-neutral-700">
                    {methodLabel(sale.metodoPago)}
                  </td>

                  <td className="px-5 py-5 font-black text-emerald-700">
                    {formatMoney(sale.total)}
                  </td>

                  <td className="px-5 py-5 text-xs font-bold text-neutral-500">
                    {formatDateTime(saleDateOf(sale))}
                  </td>

                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(sale)}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-700 hover:bg-neutral-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(sale)}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditSaleModal({ branch, sale, onClose, onSaved }) {
  const [metodoPago, setMetodoPago] = useState(normalizeMethod(sale?.metodoPago || 'CASH'));
  const [subtotal, setSubtotal] = useState(String(Number(sale?.subtotal ?? sale?.total ?? 0).toFixed(2)));
  const [discount, setDiscount] = useState(String(Number(sale?.discount ?? 0).toFixed(2)));
  const [total, setTotal] = useState(String(Number(sale?.total ?? 0).toFixed(2)));
  const [cashReceived, setCashReceived] = useState(String(Number(sale?.cashReceived ?? sale?.total ?? 0).toFixed(2)));
  const [changeAmount, setChangeAmount] = useState(String(Number(sale?.changeAmount ?? 0).toFixed(2)));
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const paymentMethods = ['CASH', 'YAPE', 'PLIN', 'TRANSFER', 'CARD'];

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    const saleId = saleIdOf(sale);
    if (!saleId) {
      setErrorMsg('No se encontró el ID de la venta.');
      return;
    }

    setSaving(true);

    try {
      await updateCashSale({
        branchId: branch.id,
        saleId,
        customerId: sale.customerId ?? null,
        metodoPago,
        subtotal: Number(String(subtotal).replace(',', '.')),
        discount: Number(String(discount).replace(',', '.')),
        total: Number(String(total).replace(',', '.')),
        cashReceived: Number(String(cashReceived).replace(',', '.')),
        changeAmount: Number(String(changeAmount).replace(',', '.')),
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo actualizar la venta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Editar venta" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Método de pago"
          value={metodoPago}
          onChange={setMetodoPago}
          options={paymentMethods.map((item) => ({
            value: item,
            label: methodLabel(item),
          }))}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <InputField label="Subtotal" value={subtotal} onChange={setSubtotal} type="number" step="0.01" prefix="S/" />
          <InputField label="Descuento" value={discount} onChange={setDiscount} type="number" step="0.01" prefix="S/" />
          <InputField label="Total" value={total} onChange={setTotal} type="number" step="0.01" prefix="S/" />
          <InputField label="Recibido" value={cashReceived} onChange={setCashReceived} type="number" step="0.01" prefix="S/" />
          <InputField label="Vuelto" value={changeAmount} onChange={setChangeAmount} type="number" step="0.01" prefix="S/" />
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Este ajuste modifica la venta registrada. Después de guardar se refrescará la caja.
        </div>

        {errorMsg && <ErrorBox message={errorMsg} />}

        <button
          disabled={saving}
          className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </ModalShell>
  );
}


function AppointmentSaleBanner({ appointment, isOpen, onOpenSale, onDismiss }) {
  if (!appointment) return null;

  return (
    <div className="rounded-[32px] border border-amber-200 bg-[linear-gradient(135deg,#FFFBEB_0%,#FFFFFF_75%)] p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-2xl text-white">
            ✂️
          </div>

          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
              Cita enviada desde agenda
            </div>
            <h3 className="mt-1 text-2xl font-black text-neutral-950">
              Atendiendo cita #{appointment.appointmentId}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold text-neutral-600">
              <span>Cliente: {appointment.customerName || 'Cliente'}</span>
              <span>•</span>
              <span>Servicio: {appointment.serviceName || 'Servicio'}</span>
              <span>•</span>
              <span>Barbero: {appointment.barberName || 'Barbero'}</span>
              {appointment.hora && (
                <>
                  <span>•</span>
                  <span>{appointment.hora}{appointment.horaFin ? ` - ${appointment.horaFin}` : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenSale}
            disabled={!isOpen}
            className="rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01] disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            Cobrar cita
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-black text-neutral-700 hover:bg-neutral-50"
          >
            Quitar aviso
          </button>
        </div>
      </div>

      {!isOpen && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-amber-700">
          Para cobrar esta cita primero debes abrir caja en la sede correspondiente.
        </div>
      )}
    </div>
  );
}

function AppointmentSaleModal({ branch, cashRegister, appointment, onClose, onSaved }) {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState('0');
  const [cashReceived, setCashReceived] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const paymentMethods = ['CASH', 'YAPE', 'PLIN', 'TRANSFER', 'CARD'];

  const subtotal = items.reduce((sum, item) => sum + itemSubtotal(item), 0);
  const discountNumber = Number(String(discount).replace(',', '.')) || 0;
  const total = Math.max(0, subtotal - discountNumber);

  useEffect(() => {
    async function loadCatalogs() {
      setLoading(true);
      setErrorMsg('');

      try {
        const [serviceData, barberData, productData] = await Promise.all([
          getCashServices(),
          getCashBarbers(branch.id),
          getCashProducts(branch.id).catch(() => []),
        ]);

        setServices(serviceData);
        setBarbers(barberData.filter((item) => item.id > 0));
        setProducts(productData);

        const initialService = serviceData.find(
          (item) => String(item.id) === String(appointment?.serviceId)
        );
        const initialBarber = barberData.find(
          (item) => String(item.id) === String(appointment?.barberUserId)
        );

        if (initialService && initialBarber) {
          setItems([
            {
              key: `appointment-${appointment.appointmentId}`,
              type: 'service',
              serviceId: initialService.id,
              productId: null,
              barberUserId: initialBarber.id,
              barberName: initialBarber.name,
              name: initialService.name,
              quantity: 1,
              unitPrice: servicePriceOf(initialService),
            },
          ]);
          setSelectedServiceId(String(initialService.id));
          setSelectedBarberId(String(initialBarber.id));
          setCashReceived(String(servicePriceOf(initialService).toFixed(2)));
        }
      } catch (error) {
        setErrorMsg(error.message || 'No se pudieron cargar servicios y barberos.');
      } finally {
        setLoading(false);
      }
    }

    loadCatalogs();
  }, [branch.id, appointment?.appointmentId]);

  useEffect(() => {
    const q = customerName.trim();

    if (selectedCustomer && q === selectedCustomer.nombreCompleto) {
      setCustomerResults([]);
      setCustomerSearching(false);
      return;
    }

    if (q.length < 2) {
      setCustomerResults([]);
      setCustomerSearching(false);
      return;
    }

    let cancelled = false;
    setCustomerSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const data = await getOwnerCustomers({ query: q, limit: 8 });
        if (cancelled) return;
        setCustomerResults(data);
      } catch {
        if (cancelled) return;
        setCustomerResults([]);
      } finally {
        if (!cancelled) setCustomerSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customerName, selectedCustomer]);

  function handleCustomerSearchChange(value) {
    setCustomerName(value);

    if (selectedCustomer && value.trim() !== selectedCustomer.nombreCompleto) {
      setSelectedCustomer(null);
    }
  }

  function selectCustomer(customer) {
    setSelectedCustomer(customer);
    setCustomerName(customer.nombreCompleto || customer.nombres || 'Cliente');
    setCustomerResults([]);
    setCustomerSearching(false);
  }

  useEffect(() => {
    if (paymentMethod !== 'CASH') {
      setCashReceived(String(total.toFixed(2)));
    }
  }, [paymentMethod, total]);

  function addServiceItem() {
    const service = services.find((item) => String(item.id) === String(selectedServiceId));
    const barber = barbers.find((item) => String(item.id) === String(selectedBarberId));
    const qty = Math.max(1, Number(quantity || 1));

    if (!service) {
      setErrorMsg('Selecciona un servicio.');
      return;
    }

    if (!barber) {
      setErrorMsg('Selecciona el barbero que realizó el servicio.');
      return;
    }

    setErrorMsg('');
    setItems((prev) => [
      ...prev,
      {
        key: `service-${service.id}-${barber.id}-${Date.now()}`,
        type: 'service',
        serviceId: service.id,
        productId: null,
        barberUserId: barber.id,
        barberName: barber.name,
        name: service.name,
        quantity: qty,
        unitPrice: servicePriceOf(service),
      },
    ]);
  }

  function addProductItem() {
    const product = products.find((item) => String(item.id) === String(selectedProductId));
    const qty = Math.max(1, Number(quantity || 1));

    if (!product) {
      setErrorMsg('Selecciona un producto.');
      return;
    }

    setErrorMsg('');
    setItems((prev) => [
      ...prev,
      {
        key: `product-${product.id}-${Date.now()}`,
        type: 'product',
        serviceId: null,
        productId: product.id,
        barberUserId: selectedBarberId ? Number(selectedBarberId) : null,
        barberName: barbers.find((item) => String(item.id) === String(selectedBarberId))?.name || null,
        name: product.name,
        quantity: qty,
        unitPrice: Number(product.price || 0),
      },
    ]);
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!cashRegister?.id) {
      setErrorMsg('No hay caja abierta para cobrar esta cita.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Agrega al menos un servicio o producto.');
      return;
    }

    const received = Number(String(cashReceived).replace(',', '.')) || 0;
    if (paymentMethod === 'CASH' && received + 0.009 < total) {
      setErrorMsg('El efectivo recibido no puede ser menor al total.');
      return;
    }

    setSaving(true);

    try {
      await createCashSale({
        branchId: branch.id,
        customerId: appointment.customerId || null,
        appointmentId: appointment.appointmentId || null,
        saleDate: null,
        metodoPago: paymentMethod,
        discount: discountNumber,
        cashReceived: paymentMethod === 'CASH' ? received : total,
        payments: paymentMethod === 'FREE' ? [] : [{ method: paymentMethod, amount: total }],
        items: items.map((item) => ({
          serviceId: item.serviceId,
          productId: item.productId,
          barberUserId: item.barberUserId,
          cantidad: item.quantity,
          precioUnitario: item.unitPrice,
        })),
      });

      clearAttendAppointmentFromStorage();
      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo registrar la venta.');
    } finally {
      setSaving(false);
    }
  }

  const change = paymentMethod === 'CASH'
    ? Math.max(0, (Number(String(cashReceived).replace(',', '.')) || 0) - total)
    : 0;

  return (
    <ModalShell title="Cobrar cita" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
          Cargando servicios y barberos...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5">
            <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-700">
              Cita seleccionada
            </div>
            <div className="mt-2 text-xl font-black text-neutral-950">
              {appointment.customerName || 'Cliente'} · #{appointment.appointmentId}
            </div>
            <div className="mt-2 text-sm font-bold text-neutral-600">
              Servicio inicial: {appointment.serviceName || 'Servicio'} · Barbero: {appointment.barberName || 'Barbero'}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                Servicios adicionales
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SelectField
                  label="Servicio"
                  value={selectedServiceId}
                  onChange={setSelectedServiceId}
                  options={[
                    { value: '', label: 'Selecciona servicio' },
                    ...services.map((service) => ({
                      value: String(service.id),
                      label: `${service.name} · ${formatMoney(service.price)}`,
                    })),
                  ]}
                />

                <SelectField
                  label="Barbero"
                  value={selectedBarberId}
                  onChange={setSelectedBarberId}
                  options={[
                    { value: '', label: 'Selecciona barbero' },
                    ...barbers.map((barber) => ({
                      value: String(barber.id),
                      label: barber.name,
                    })),
                  ]}
                />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px]">
                <InputField label="Cantidad" value={quantity} onChange={setQuantity} type="number" />
                <button
                  type="button"
                  onClick={addServiceItem}
                  className="self-end rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
                >
                  Agregar servicio
                </button>
              </div>

              {products.length > 0 && (
                <div className="mt-5 border-t border-neutral-200 pt-5">
                  <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                    Productos opcionales
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px]">
                    <SelectField
                      label="Producto"
                      value={selectedProductId}
                      onChange={setSelectedProductId}
                      options={[
                        { value: '', label: 'Selecciona producto' },
                        ...products.map((product) => ({
                          value: String(product.id),
                          label: `${product.name} · ${formatMoney(product.price)} · Stock ${product.stock}`,
                        })),
                      ]}
                    />
                    <button
                      type="button"
                      onClick={addProductItem}
                      className="self-end rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-black text-neutral-800 transition hover:bg-amber-50"
                    >
                      Agregar producto
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                Pago
              </div>

              <div className="mt-4 space-y-4">
                <SelectField
                  label="Método de pago"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={paymentMethods.map((method) => ({
                    value: method,
                    label: methodLabel(method),
                  }))}
                />
                <InputField label="Descuento" value={discount} onChange={setDiscount} type="number" step="0.01" prefix="S/" />
                <InputField label="Recibido" value={cashReceived} onChange={setCashReceived} type="number" step="0.01" prefix="S/" />
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                  Items de venta
                </div>
                <div className="mt-1 text-sm font-bold text-neutral-500">
                  Puedes agregar más servicios o productos antes de cobrar.
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-950 px-4 py-3 text-xl font-black text-white">
                {formatMoney(total)}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                  Aún no hay items en la venta.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-black text-neutral-950">{item.name}</div>
                        <div className="mt-1 text-xs font-bold text-neutral-500">
                          {item.type === 'service' ? `Servicio · Barbero: ${item.barberName || '-'}` : `Producto${item.barberName ? ` · Barbero: ${item.barberName}` : ''}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-black text-neutral-950">{formatMoney(itemSubtotal(item))}</div>
                          <div className="text-xs font-bold text-neutral-500">
                            {item.quantity} x {formatMoney(item.unitPrice)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <StatCard title="Subtotal" value={formatMoney(subtotal)} />
            <StatCard title="Descuento" value={formatMoney(discountNumber)} />
            <StatCard title="Total" value={formatMoney(total)} tone="gold" />
            <StatCard title="Vuelto" value={formatMoney(change)} tone={change > 0 ? 'green' : 'default'} />
          </div>

          {errorMsg && <ErrorBox message={errorMsg} />}

          <button
            disabled={saving}
            className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {saving ? 'Guardando venta...' : 'Cobrar y finalizar atención'}
          </button>
        </form>
      )}
    </ModalShell>
  );
}


function SaleModal({ branch, cashRegister, onClose, onSaved }) {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const [customerName, setCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState('0');
  const [cashReceived, setCashReceived] = useState('0');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const paymentMethods = ['CASH', 'YAPE', 'PLIN', 'TRANSFER', 'CARD'];

  const subtotal = items.reduce((sum, item) => sum + itemSubtotal(item), 0);
  const discountNumber = Number(String(discount).replace(',', '.')) || 0;
  const total = Math.max(0, subtotal - discountNumber);
  const received = Number(String(cashReceived).replace(',', '.')) || 0;
  const change = paymentMethod === 'CASH' ? Math.max(0, received - total) : 0;

  useEffect(() => {
    async function loadCatalogs() {
      setLoading(true);
      setErrorMsg('');

      try {
        const [serviceData, barberData, productData] = await Promise.all([
          getCashServices(),
          getCashBarbers(branch.id),
          getCashProducts(branch.id).catch(() => []),
        ]);

        setServices(serviceData);
        setBarbers(barberData.filter((item) => item.id > 0));
        setProducts(productData);
      } catch (error) {
        setErrorMsg(error.message || 'No se pudieron cargar servicios, productos y barberos.');
      } finally {
        setLoading(false);
      }
    }

    loadCatalogs();
  }, [branch.id]);

  useEffect(() => {
    const q = customerName.trim();

    if (selectedCustomer && q === (selectedCustomer.nombreCompleto || selectedCustomer.nombres || 'Cliente')) {
      setCustomerResults([]);
      setCustomerSearching(false);
      return;
    }

    if (q.length < 2) {
      setCustomerResults([]);
      setCustomerSearching(false);
      return;
    }

    let cancelled = false;
    setCustomerSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const data = await getOwnerCustomers({ query: q, limit: 8 });
        if (cancelled) return;
        setCustomerResults(Array.isArray(data) ? data : []);
      } catch {
        if (cancelled) return;
        setCustomerResults([]);
      } finally {
        if (!cancelled) setCustomerSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customerName, selectedCustomer]);

  function handleCustomerSearchChange(value) {
    setCustomerName(value);

    if (selectedCustomer) {
      const selectedName = selectedCustomer.nombreCompleto || selectedCustomer.nombres || 'Cliente';
      if (value.trim() !== selectedName) {
        setSelectedCustomer(null);
      }
    }

    const onlyNumbers = String(value || '').replace(/[^0-9]/g, '');
    if (onlyNumbers.length >= 6 && quickCustomerPhone.trim().length === 0) {
      setQuickCustomerPhone(onlyNumbers);
    }
  }

  function selectCustomer(customer) {
    setSelectedCustomer(customer);
    setCustomerName(customer.nombreCompleto || customer.nombres || 'Cliente');
    setQuickCustomerPhone(customer.telefono || '');
    setCustomerResults([]);
    setCustomerSearching(false);
  }

  async function createQuickCustomerFromSale() {
    setErrorMsg('');

    const name = customerName.trim();
    const phone = String(quickCustomerPhone || '').replace(/[^0-9]/g, '');

    if (!name) {
      setErrorMsg('Escribe el nombre del cliente para crearlo.');
      return;
    }

    if (phone.length < 6) {
      setErrorMsg('Ingresa un teléfono válido para crear el cliente.');
      return;
    }

    setCreatingCustomer(true);

    try {
      const created = await createOwnerCustomer({
        nombres: name,
        telefono: phone,
      });
      selectCustomer(created);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo crear el cliente.');
    } finally {
      setCreatingCustomer(false);
    }
  }

  useEffect(() => {
    if (paymentMethod !== 'CASH') {
      setCashReceived(String(total.toFixed(2)));
    }
  }, [paymentMethod, total]);

  function currentBarber() {
    return barbers.find((item) => String(item.id) === String(selectedBarberId));
  }

  function addServiceItem() {
    const service = services.find((item) => String(item.id) === String(selectedServiceId));
    const barber = currentBarber();
    const qty = Math.max(1, Number(quantity || 1));

    if (!service) {
      setErrorMsg('Selecciona un servicio.');
      return;
    }

    if (!barber) {
      setErrorMsg('Selecciona el barbero que realizó el servicio.');
      return;
    }

    setErrorMsg('');
    setItems((prev) => [
      ...prev,
      {
        key: `service-${service.id}-${barber.id}-${Date.now()}`,
        type: 'service',
        serviceId: service.id,
        productId: null,
        barberUserId: barber.id,
        barberName: barber.name,
        name: service.name,
        quantity: qty,
        unitPrice: servicePriceOf(service),
      },
    ]);

    setSelectedServiceId('');
    setQuantity('1');
  }

  function addProductItem() {
    const product = products.find((item) => String(item.id) === String(selectedProductId));
    const barber = currentBarber();
    const qty = Math.max(1, Number(quantity || 1));

    if (!product) {
      setErrorMsg('Selecciona un producto.');
      return;
    }

    const stock = Number(product.stock ?? product.stockActual ?? 0);
    const allowsWithoutStock = product.permiteVentaSinStock === true || product.allowSaleWithoutStock === true;

    if (!allowsWithoutStock && stock < qty) {
      setErrorMsg(`Stock insuficiente. Disponible: ${stock}.`);
      return;
    }

    const commission = Number(product.barberCommissionAmount ?? product.productCommissionAmount ?? 0);
    if (commission > 0 && !barber) {
      setErrorMsg('Este producto tiene comisión. Selecciona el barbero que hizo la venta.');
      return;
    }

    setErrorMsg('');
    setItems((prev) => [
      ...prev,
      {
        key: `product-${product.id}-${Date.now()}`,
        type: 'product',
        serviceId: null,
        productId: product.id,
        barberUserId: barber?.id || null,
        barberName: barber?.name || null,
        name: product.name,
        quantity: qty,
        unitPrice: Number(product.price ?? product.precioVenta ?? 0),
      },
    ]);

    setSelectedProductId('');
    setQuantity('1');
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!cashRegister?.id) {
      setErrorMsg('No hay caja abierta para registrar la venta.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Agrega al menos un servicio o producto.');
      return;
    }

    if (paymentMethod === 'CASH' && received + 0.009 < total) {
      setErrorMsg('El efectivo recibido no puede ser menor al total.');
      return;
    }

    const hasHaircut = items.some((item) => {
      const name = String(item.name || '').toLowerCase();
      return item.type === 'service' && (
        name.includes('corte') ||
        name.includes('fade') ||
        name.includes('taper') ||
        name.includes('degradado') ||
        name.includes('clásico') ||
        name.includes('clasico')
      );
    });

    setSaving(true);

    try {
      await createCashSale({
        branchId: branch.id,
        customerId: selectedCustomer?.id || null,
        appointmentId: null,
        saleDate: null,
        metodoPago: paymentMethod,
        discount: discountNumber,
        cashReceived: paymentMethod === 'CASH' ? received : total,
        payments: [{ method: paymentMethod, amount: total }],
        cutType: hasHaircut ? 'Corte registrado en caja web' : null,
        cutDetail: hasHaircut ? 'Venta registrada desde panel web' : null,
        cutObservations: selectedCustomer ? null : (customerName.trim() ? `Referencia: ${customerName.trim()}` : null),
        items: items.map((item) => ({
          serviceId: item.serviceId,
          productId: item.productId,
          barberUserId: item.barberUserId,
          cantidad: item.quantity,
          precioUnitario: item.unitPrice,
        })),
      });

      onSaved();
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo registrar la venta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Nueva venta" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
          Cargando servicios, productos y barberos...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                Venta rápida
              </div>
              <h3 className="mt-2 text-2xl font-black text-neutral-950">
                Servicios y productos
              </h3>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Agrega servicios o productos. El stock se descontará de la sede activa.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <label className="block">
                    <span className="text-sm font-black text-neutral-700">Cliente</span>
                    <input
                      value={customerName}
                      onChange={(event) => handleCustomerSearchChange(event.target.value)}
                      placeholder="Buscar por nombre o teléfono"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
                    />
                  </label>

                  {customerSearching && (
                    <div className="mt-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-500">
                      Buscando clientes...
                    </div>
                  )}

                  {selectedCustomer && (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div>
                        <div className="text-sm font-black text-emerald-800">
                          {selectedCustomer.nombreCompleto}
                        </div>
                        <div className="mt-1 text-xs font-bold text-emerald-700/75">
                          {selectedCustomer.telefono || 'Sin teléfono'} · {selectedCustomer.puntosDisponibles || 0} pts
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerName('');
                          setCustomerResults([]);
                        }}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}

                  {!selectedCustomer && customerResults.length > 0 && (
                    <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                      {customerResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-amber-50"
                        >
                          <div>
                            <div className="font-black text-neutral-950">
                              {customer.nombreCompleto}
                            </div>
                            <div className="mt-1 text-xs font-bold text-neutral-500">
                              {customer.telefono || 'Sin teléfono'} · {customer.puntosDisponibles || 0} pts
                            </div>
                          </div>
                          <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-black text-white">
                            Elegir
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!selectedCustomer && !customerSearching && customerName.trim().length >= 2 && customerResults.length === 0 && (
                    <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                        Cliente no encontrado
                      </div>
                      <p className="mt-2 text-xs font-bold leading-5 text-amber-800">
                        Puedes guardar la venta como cliente ocasional o crear el cliente ahora agregando su teléfono.
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                          type="tel"
                          value={quickCustomerPhone}
                          onChange={(event) => setQuickCustomerPhone(event.target.value)}
                          placeholder="Número de teléfono"
                          className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-500"
                        />

                        <button
                          type="button"
                          onClick={createQuickCustomerFromSale}
                          disabled={creatingCustomer}
                          className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
                        >
                          {creatingCustomer ? 'Creando...' : 'Crear cliente'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <SelectField
                  label="Barbero"
                  value={selectedBarberId}
                  onChange={setSelectedBarberId}
                  options={[
                    { value: '', label: 'Selecciona barbero' },
                    ...barbers.map((barber) => ({
                      value: String(barber.id),
                      label: barber.name,
                    })),
                  ]}
                />
              </div>

              <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm font-black text-neutral-950">Agregar servicio</div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px_170px]">
                  <SelectField
                    label="Servicio"
                    value={selectedServiceId}
                    onChange={setSelectedServiceId}
                    options={[
                      { value: '', label: 'Selecciona servicio' },
                      ...services.map((service) => ({
                        value: String(service.id),
                        label: `${service.name} · ${formatMoney(service.price)}`,
                      })),
                    ]}
                  />

                  <InputField label="Cantidad" value={quantity} onChange={setQuantity} type="number" />

                  <button
                    type="button"
                    onClick={addServiceItem}
                    className="self-end rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
                  >
                    Agregar servicio
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-sm font-black text-neutral-950">Agregar producto</div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px_170px]">
                  <SelectField
                    label="Producto"
                    value={selectedProductId}
                    onChange={setSelectedProductId}
                    options={[
                      { value: '', label: 'Selecciona producto' },
                      ...products.map((product) => ({
                        value: String(product.id),
                        label: `${product.name} · ${formatMoney(product.price)} · Stock ${product.stock}`,
                      })),
                    ]}
                  />

                  <InputField label="Cantidad" value={quantity} onChange={setQuantity} type="number" />

                  <button
                    type="button"
                    onClick={addProductItem}
                    className="self-end rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Agregar producto
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
              <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                Cobro
              </div>
              <h3 className="mt-2 text-2xl font-black text-neutral-950">
                {formatMoney(total)}
              </h3>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Total a cobrar
              </p>

              <div className="mt-5 space-y-4">
                <SelectField
                  label="Método de pago"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={paymentMethods.map((method) => ({
                    value: method,
                    label: methodLabel(method),
                  }))}
                />

                <InputField label="Descuento" value={discount} onChange={setDiscount} type="number" step="0.01" prefix="S/" />
                <InputField label="Recibido" value={cashReceived} onChange={setCashReceived} type="number" step="0.01" prefix="S/" />
              </div>

              <div className="mt-5 grid gap-3">
                <StatCard title="Subtotal" value={formatMoney(subtotal)} />
                <StatCard title="Descuento" value={formatMoney(discountNumber)} />
                <StatCard title="Vuelto" value={formatMoney(change)} tone={change > 0 ? 'green' : 'default'} />
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.20em] text-amber-600">
                  Items de venta
                </div>
                <div className="mt-1 text-sm font-bold text-neutral-500">
                  {items.length} item(s) agregado(s)
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-950 px-4 py-3 text-xl font-black text-white">
                {formatMoney(total)}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm font-black text-neutral-500">
                  Aún no hay items en la venta.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-black text-neutral-950">{item.name}</div>
                        <div className="mt-1 text-xs font-bold text-neutral-500">
                          {item.type === 'service'
                            ? `Servicio · Barbero: ${item.barberName || '-'}`
                            : `Producto${item.barberName ? ` · Barbero: ${item.barberName}` : ''}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-black text-neutral-950">{formatMoney(itemSubtotal(item))}</div>
                          <div className="text-xs font-bold text-neutral-500">
                            {item.quantity} x {formatMoney(item.unitPrice)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {errorMsg && <ErrorBox message={errorMsg} />}

          <button
            disabled={saving}
            className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-neutral-950 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {saving ? 'Guardando venta...' : 'Guardar nueva venta'}
          </button>
        </form>
      )}
    </ModalShell>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-[34px] border border-white/10 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">{subtitle}</div>
            <h2 className="mt-1 text-2xl font-black text-neutral-950">{title}</h2>
          </div>

          <button
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

function InputField({ label, value, onChange, type = 'text', step, prefix }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-neutral-700">{label}</span>

      <div className="mt-2 flex rounded-2xl border border-neutral-200 bg-neutral-50 focus-within:border-amber-400">
        {prefix && (
          <div className="flex items-center px-4 font-black text-neutral-500">{prefix}</div>
        )}

        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl bg-transparent px-4 py-4 font-bold text-neutral-950 outline-none"
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-amber-400"
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
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-bold text-neutral-950 outline-none transition focus:border-amber-400"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {message}
    </div>
  );
}


function cashStatusLabel(status) {
  const code = String(status || '').toUpperCase();

  if (code === 'OPEN') return 'Abierta';
  if (code === 'CLOSED') return 'Cerrada';
  if (code === 'AUTO_CLOSED') return 'Cierre automático';

  return status || 'Sin estado';
}

function cashStatusClass(status) {
  const code = String(status || '').toUpperCase();

  if (code === 'OPEN') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (code === 'CLOSED') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (code === 'AUTO_CLOSED') return 'border-orange-200 bg-orange-50 text-orange-700';

  return 'border-neutral-200 bg-neutral-50 text-neutral-700';
}

function paymentTotalFrom(cash, key) {
  const source =
    Array.isArray(cash?.paymentMethodBalances) && cash.paymentMethodBalances.length > 0
      ? cash.paymentMethodBalances
      : cash?.paymentMethodsSummary || [];

  const normalizedKey = normalizeMethod(key);

  return source.reduce((sum, item) => {
    const code = normalizeMethod(item?.paymentMethod);
    return code === normalizedKey ? sum + Number(item?.totalAmount || 0) : sum;
  }, 0);
}

function HistorySummaryCard({ items }) {
  const totals = items.reduce(
    (acc, cash) => {
      acc.sales += Number(cash.salesTotal || 0);
      acc.income += Number(cash.movementsIncome || 0);
      acc.expense += Number(cash.movementsExpense || 0);
      acc.expected += Number(cash.closingAmountExpected || 0);
      acc.cash += paymentTotalFrom(cash, 'CASH');
      acc.yape += paymentTotalFrom(cash, 'YAPE');
      acc.plin += paymentTotalFrom(cash, 'PLIN');
      acc.card += paymentTotalFrom(cash, 'CARD');
      acc.transfer += paymentTotalFrom(cash, 'TRANSFER');
      return acc;
    },
    {
      sales: 0,
      income: 0,
      expense: 0,
      expected: 0,
      cash: 0,
      yape: 0,
      plin: 0,
      card: 0,
      transfer: 0,
    }
  );

  const net = totals.sales + totals.income - totals.expense;

  return (
    <div className="rounded-[30px] border border-amber-200 bg-[linear-gradient(135deg,#FFFBEB_0%,#FFFFFF_68%)] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.045)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
            Resumen del rango
          </div>
          <div className="mt-1 text-sm font-semibold text-neutral-500">
            Consolidado de cajas encontradas en el rango seleccionado.
          </div>
        </div>

        <div className="rounded-full bg-white px-4 py-2 text-xs font-black text-neutral-700 shadow-sm">
          {items.length} caja{items.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <HistoryMetricCard label="Ventas" value={totals.sales} tone="green" />
        <HistoryMetricCard label="Ingresos" value={totals.income} />
        <HistoryMetricCard label="Salidas" value={totals.expense} tone="red" />
        <HistoryMetricCard label="Neto" value={net} tone={net >= 0 ? 'green' : 'red'} />
        <HistoryMetricCard label="Efectivo esperado" value={totals.expected} tone={totals.expected >= 0 ? 'green' : 'red'} />
      </div>

      <div className="mt-5 rounded-[24px] border border-neutral-200 bg-white p-4">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
          Saldo por método
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <HistoryPaymentPill label="Efectivo" value={totals.cash} />
          <HistoryPaymentPill label="Yape" value={totals.yape} />
          <HistoryPaymentPill label="Plin" value={totals.plin} />
          <HistoryPaymentPill label="Tarjeta" value={totals.card} />
          <HistoryPaymentPill label="Transferencia" value={totals.transfer} />
        </div>
      </div>
    </div>
  );
}

function HistoryMetricCard({ label, value, tone = 'default' }) {
  const isRed = tone === 'red';
  const isGreen = tone === 'green';

  const classes = isRed
    ? 'border-red-200 bg-red-50 text-red-700'
    : isGreen
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-neutral-200 bg-white text-neutral-950';

  return (
    <div className={`min-w-0 rounded-[22px] border p-4 ${classes}`}>
      <div className="text-sm font-black text-neutral-500">{label}</div>
      <div className="mt-2 truncate text-2xl font-black">
        {formatMoney(value)}
      </div>
    </div>
  );
}

function HistoryPaymentPill({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
      <div className="truncate text-xs font-bold text-neutral-500">{label}</div>
      <div className={`mt-1 truncate text-base font-black ${amountClassByValue(value)}`}>
        {formatMoney(value)}
      </div>
    </div>
  );
}

function HistoryDetailModal({ branch, cash, onClose }) {
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadSales() {
      setLoadingSales(true);
      setErrorMsg('');

      try {
        const data = await getSalesByCashRegister({
          branchId: branch.id,
          cashRegisterId: cash.id,
        });

        setSales(data);
      } catch (error) {
        setErrorMsg(error.message || 'No se pudieron cargar las ventas de esta caja.');
      } finally {
        setLoadingSales(false);
      }
    }

    loadSales();
  }, [branch.id, cash.id]);

  const paymentsSource =
    cash?.paymentMethodBalances?.length > 0
      ? cash.paymentMethodBalances
      : cash?.paymentMethodsSummary || [];

  const movements = Array.isArray(cash?.movements) ? cash.movements : [];

  return (
    <ModalShell title="Detalle de caja" subtitle={branch?.name || 'Sede'} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`rounded-full border px-4 py-2 text-xs font-black ${cashStatusClass(cash.status)}`}>
            {cashStatusLabel(cash.status)}
          </div>

          <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-black text-neutral-600">
            Caja #{cash.id}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard title="Apertura" value={formatDateTime(cash.openedAt)} helper={cash.openedByUserName || 'Usuario no registrado'} />
          <StatCard title="Cierre" value={formatDateTime(cash.closedAt)} helper={cash.closedByUserName || cash.assignedUserName || 'Pendiente'} />
          <StatCard title="Ventas total" value={formatMoney(cash.salesTotal)} helper="Total registrado" tone="gold" />
          <StatCard title="Esperado" value={formatMoney(cash.closingAmountExpected)} helper="Efectivo físico esperado" tone={balanceTone(cash.closingAmountExpected)} />
          <StatCard title="Contado" value={formatMoney(cash.closingAmountCounted)} helper="Monto contado al cierre" />
          <StatCard title="Diferencia" value={formatMoney(cash.differenceAmount)} helper="Contado - esperado" tone={Number(cash.differenceAmount || 0) === 0 ? 'green' : 'red'} />
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Métodos de pago
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {paymentsSource.length === 0 ? (
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">
                Sin métodos registrados.
              </div>
            ) : (
              paymentsSource.map((payment) => (
                <div
                  key={`${payment.paymentMethod}-${payment.totalAmount}`}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4"
                >
                  <div className="text-sm font-black text-neutral-950">
                    {methodLabel(payment.paymentMethod)}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {payment.count || 0} operación(es)
                  </div>
                  <div className={`mt-2 text-lg font-black ${amountClassByValue(payment.totalAmount)}`}>
                    {formatMoney(payment.totalAmount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Ventas de esta caja
          </div>

          <div className="mt-4 overflow-x-auto rounded-[22px] border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950 text-white">
                <tr>
                  <th className="px-4 py-3 font-black">Cliente</th>
                  <th className="px-4 py-3 font-black">Barbero</th>
                  <th className="px-4 py-3 font-black">Método</th>
                  <th className="px-4 py-3 font-black">Total</th>
                  <th className="px-4 py-3 font-black">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loadingSales ? (
                  <tr>
                    <td className="px-4 py-5 text-neutral-500" colSpan="5">
                      Cargando ventas...
                    </td>
                  </tr>
                ) : errorMsg ? (
                  <tr>
                    <td className="px-4 py-5 text-red-600" colSpan="5">
                      {errorMsg}
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-neutral-500" colSpan="5">
                      No hubo ventas en esta caja.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={saleIdOf(sale)} className="border-t border-neutral-200">
                      <td className="px-4 py-4 font-black text-neutral-950">
                        {sale.customerName || 'Cliente ocasional'}
                      </td>
                      <td className="px-4 py-4 font-bold text-neutral-700">
                        {saleBarberName(sale)}
                      </td>
                      <td className="px-4 py-4 font-bold text-neutral-700">
                        {methodLabel(sale.metodoPago)}
                      </td>
                      <td className="px-4 py-4 font-black text-emerald-700">
                        {formatMoney(sale.total)}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-neutral-500">
                        {formatDateTime(saleDateOf(sale))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[26px] border border-neutral-200 bg-white p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
            Movimientos
          </div>

          <div className="mt-4 space-y-3">
            {movements.length === 0 ? (
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">
                No hubo gastos, ingresos, adelantos ni pagos.
              </div>
            ) : (
              movements.map((movement) => (
                <div key={movement.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-neutral-950">
                        {movement.concept || movementTypeLabel(movement.type)}
                      </div>
                      <div className="mt-1 text-xs font-bold text-neutral-500">
                        {movementTypeLabel(movement.type)} · {methodLabel(movement.paymentMethod)}
                      </div>
                      {movement.barberUserName && (
                        <div className="mt-1 text-xs font-bold text-amber-700">
                          Barbero: {movement.barberUserName}
                        </div>
                      )}
                      {movement.note && (
                        <div className="mt-1 text-xs text-neutral-500">
                          {movement.note}
                        </div>
                      )}
                    </div>

                    <div className={`font-black ${movementAmountClass(movement.type)}`}>
                      {formatMoney(movement.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function CashHistoryModal({ branch, onClose }) {
  const today = new Date();
  const fromDefault = new Date();
  fromDefault.setDate(today.getDate() - 30);

  const [from, setFrom] = useState(toDateInputValue(fromDefault));
  const [to, setTo] = useState(toDateInputValue(today));
  const [items, setItems] = useState([]);
  const [selectedCash, setSelectedCash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadHistory() {
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await getCashHistory({
        branchId: branch.id,
        from,
        to,
      });

      setItems(data);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <>
      <ModalShell title="Historial de caja" subtitle={branch?.name || 'Sede'} onClose={onClose}>
        <div className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_130px]">
            <InputField label="Desde" value={from} onChange={setFrom} type="date" />
            <InputField label="Hasta" value={to} onChange={setTo} type="date" />
            <button
              type="button"
              onClick={loadHistory}
              className="self-end rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-black text-white transition hover:scale-[1.01]"
            >
              Buscar
            </button>
          </div>

          {!loading && !errorMsg && items.length > 0 && (
            <HistorySummaryCard items={items} />
          )}

          {loading ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm font-black text-neutral-500">
              Cargando historial...
            </div>
          ) : errorMsg ? (
            <ErrorBox message={errorMsg} />
          ) : items.length === 0 ? (
            <EmptyCard
              title="Sin cajas en este rango"
              text="No se encontraron cajas registradas para las fechas seleccionadas."
            />
          ) : (
            <div className="space-y-3">
              {items.map((cash) => (
                <button
                  key={cash.id}
                  type="button"
                  onClick={() => setSelectedCash(cash)}
                  className="w-full rounded-[26px] border border-neutral-200 bg-white p-5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${cashStatusClass(cash.status)}`}>
                          {cashStatusLabel(cash.status)}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">
                          Caja #{cash.id}
                        </span>
                      </div>

                      <div className="mt-3 text-base font-black text-neutral-950">
                        {formatDateTime(cash.openedAt)}
                      </div>
                      <div className="mt-1 text-sm font-bold text-neutral-500">
                        Cierre: {formatDateTime(cash.closedAt)}
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:min-w-[520px] lg:grid-cols-4">
                      <HistoryPaymentPill label="Ventas" value={cash.salesTotal} />
                      <HistoryPaymentPill label="Salidas" value={cash.movementsExpense} />
                      <HistoryPaymentPill label="Esperado" value={cash.closingAmountExpected} />
                      <HistoryPaymentPill label="Diferencia" value={cash.differenceAmount} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ModalShell>

      {selectedCash && (
        <HistoryDetailModal
          branch={branch}
          cash={selectedCash}
          onClose={() => setSelectedCash(null)}
        />
      )}
    </>
  );
}


export default function OwnerCashPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [cashRegister, setCashRegister] = useState(null);
  const [movements, setMovements] = useState([]);
  const [sales, setSales] = useState([]);

  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingCash, setLoadingCash] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBarberPaymentModal, setShowBarberPaymentModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [showAppointmentSaleModal, setShowAppointmentSaleModal] = useState(false);

  const selectedBranch = useMemo(() => {
    return branches.find((item) => String(item.id) === String(selectedBranchId)) || null;
  }, [branches, selectedBranchId]);

  async function loadBranches() {
    setLoadingBranches(true);
    setErrorMsg('');

    try {
      const data = await getOwnerBranches();
      setBranches(data);

      if (data.length > 0) {
        setSelectedBranchId((prev) => prev || String(data[0].id));
      }
    } catch (error) {
      setErrorMsg(error.message || 'No se pudieron cargar las sedes.');
    } finally {
      setLoadingBranches(false);
    }
  }

  async function loadCash(branchId = selectedBranchId, { silent = false } = {}) {
    if (!branchId) return;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoadingCash(true);
    }

    setErrorMsg('');

    try {
      const current = await getCurrentCashRegister(branchId);
      setCashRegister(current);

      if (current?.id) {
        const [dataMovements, dataSales] = await Promise.all([
          getCashMovements({
            branchId,
            cashRegisterId: current.id,
          }),
          getTodayCashSales(branchId),
        ]);

        setMovements(dataMovements);
        setSales(Array.isArray(dataSales) ? dataSales : []);
      } else {
        setMovements([]);
        setSales([]);
      }
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo cargar la caja.');
    } finally {
      setLoadingCash(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBranches();

    const pending = readAttendAppointmentFromStorage();
    if (pending) {
      setPendingAppointment(pending);
      if (pending.branchId) {
        setSelectedBranchId(String(pending.branchId));
      }
    }
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadCash(selectedBranchId);
    }
  }, [selectedBranchId]);

  
  function dismissPendingAppointment() {
    clearAttendAppointmentFromStorage();
    setPendingAppointment(null);
    setShowAppointmentSaleModal(false);
  }

  async function handleDeleteSale(sale) {
    const saleId = saleIdOf(sale);
    if (!selectedBranch || !saleId) return;

    const ok = window.confirm('¿Seguro que deseas eliminar esta venta? Esta acción no se puede deshacer.');
    if (!ok) return;

    setErrorMsg('');

    try {
      await deleteCashSale({
        branchId: selectedBranch.id,
        saleId,
      });

      await loadCash(selectedBranchId);
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo eliminar la venta.');
    }
  }

  const isOpen = String(cashRegister?.status || '').toUpperCase() === 'OPEN';

  const paymentsSource =
    Array.isArray(cashRegister?.paymentMethodBalances) && cashRegister.paymentMethodBalances.length > 0
      ? cashRegister.paymentMethodBalances
      : Array.isArray(cashRegister?.paymentMethodsSummary)
        ? cashRegister.paymentMethodsSummary
        : [];

  const expected = Number(cashRegister?.closingAmountExpected || 0);
  const openingAmount = Number(cashRegister?.openingAmount || 0);
  const salesTotal = Number(cashRegister?.salesTotal || 0);
  const cashSalesTotal = Number(cashRegister?.cashSalesTotal || 0);
  const income = Number(cashRegister?.movementsIncome || 0);
  const expense = Number(cashRegister?.movementsExpense || 0);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[34px] border border-amber-400/15 bg-[linear-gradient(135deg,#090909_0%,#15110A_42%,#101827_100%)] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.20),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_32%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Caja Web
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Control de caja
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
              Revisa caja abierta, métodos de pago, ingresos, gastos y movimientos
              operativos por sede.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                  Sede
                </div>

                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="mt-1 bg-transparent text-sm font-black text-white outline-none"
                  disabled={loadingBranches}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id} className="text-neutral-950">
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`rounded-2xl border px-4 py-3 ${
                isOpen
                  ? 'border-emerald-400/20 bg-emerald-400/10'
                  : 'border-red-400/20 bg-red-400/10'
              }`}>
                <div className={`text-[11px] font-black uppercase tracking-[0.18em] ${
                  isOpen ? 'text-emerald-300/70' : 'text-red-300/80'
                }`}>
                  Estado
                </div>

                <div className={`mt-1 text-sm font-black ${
                  isOpen ? 'text-emerald-300' : 'text-red-200'
                }`}>
                  {isOpen ? 'Caja abierta' : 'Caja cerrada'}
                </div>
              </div>

              {cashRegister?.openedAt && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/35">
                    Apertura
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {formatDateTime(cashRegister.openedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadCash(selectedBranchId, { silent: true })}
              disabled={refreshing}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-black text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              disabled={!selectedBranch}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-black text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              Historial
            </button>

            {isOpen ? (
              <>
                <button
                  onClick={() => setShowSaleModal(true)}
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(16,185,129,0.18)] transition hover:scale-[1.02]"
                >
                  Nueva venta
                </button>

                <button
                  onClick={() => setShowMovementModal(true)}
                  className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02]"
                >
                  Movimiento
                </button>

                <button
                  onClick={() => setShowBarberPaymentModal(true)}
                  className="rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(16,185,129,0.18)] transition hover:scale-[1.02]"
                >
                  Pagar barbero
                </button>

                <button
                  onClick={() => setShowCloseModal(true)}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-neutral-950 transition hover:scale-[1.02]"
                >
                  Cerrar caja
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowOpenModal(true)}
                disabled={!selectedBranch}
                className="rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02] disabled:opacity-60"
              >
                Abrir caja
              </button>
            )}
          </div>
        </div>
      </section>

      {errorMsg && <ErrorBox message={errorMsg} />}

      {pendingAppointment && (
        <AppointmentSaleBanner
          appointment={pendingAppointment}
          isOpen={isOpen}
          onOpenSale={() => setShowAppointmentSaleModal(true)}
          onDismiss={dismissPendingAppointment}
        />
      )}

      {loadingBranches || loadingCash ? (
        <div className="rounded-[28px] border border-neutral-200 bg-white p-6 font-bold text-neutral-700 shadow-sm">
          Cargando caja...
        </div>
      ) : !selectedBranch ? (
        <EmptyCard
          title="No hay sedes disponibles"
          text="No se encontraron sedes conectadas al usuario actual."
        />
      ) : !cashRegister ? (
        <EmptyCard
        title="No hay caja abierta"
        text="Abre una caja para empezar a registrar ventas, ingresos, gastos y movimientos del día."
        action={
          <button
            onClick={() => setShowOpenModal(true)}
            disabled={!selectedBranch}
            className="rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-neutral-950 shadow-[0_16px_35px_rgba(251,191,36,0.22)] transition hover:scale-[1.02] disabled:opacity-60"
          >
            Abrir caja ahora
          </button>
        }
      />
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Apertura" value={formatMoney(openingAmount)} helper="Monto inicial" />
            <StatCard title="Ventas total" value={formatMoney(salesTotal)} helper="Todos los métodos" tone="gold" />
            <StatCard title="Ventas efectivo" value={formatMoney(cashSalesTotal)} helper="Solo efectivo" />
            <StatCard title="Ingresos" value={formatMoney(income)} helper="Ingresos manuales" tone="green" />
            <StatCard
  title="Esperado"
  value={formatMoney(expected)}
  helper={expected < 0 ? 'Caja física en negativo' : 'Caja física esperada'}
  tone={balanceTone(expected)}
/>
</section>

<CashNegativeAlert
  expected={expected}
  cashSalesTotal={cashSalesTotal}
  expense={expense}
/>

<section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
            <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                Métodos de pago
              </div>

              <h3 className="mt-2 text-2xl font-black text-neutral-950">
              Saldo actual por método de pago
              </h3>
              <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
  <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
    Fórmula de caja física
  </div>

  <div className="mt-2 text-sm font-black text-neutral-950">
    {formatMoney(cashSalesTotal)} - {formatMoney(expense)} = {formatMoney(expected)}
  </div>

  <div className="mt-1 text-xs text-neutral-500">
    Ventas en efectivo menos salidas registradas.
  </div>
</div>
              <div className="mt-5 space-y-3">
                {paymentsSource.length === 0 ? (
                  <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">
                    Sin pagos registrados aún.
                  </div>
                ) : (
                  paymentsSource.map((payment) => (
                    <div
                      key={`${payment.paymentMethod}-${payment.totalAmount}`}
                      className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4"
                    >
                      <div>
                        <div className="font-black text-neutral-950">
                          {methodLabel(payment.paymentMethod)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {payment.count || 0} operación(es)
                        </div>
                      </div>

                      <div className={`text-lg font-black ${amountClassByValue(payment.totalAmount)}`}>
  {formatMoney(payment.totalAmount)}
</div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 rounded-[24px] border border-red-100 bg-red-50 p-4">
                <div className="text-sm font-black text-red-700">
                  Salidas / gastos
                </div>
                <div className="mt-2 text-2xl font-black text-red-700">
                  {formatMoney(expense)}
                </div>
                <div className="mt-1 text-xs text-red-500">
                Gastos, adelantos, pagos de barbero y salidas registradas.
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                    Movimientos
                  </div>

                  <h3 className="mt-2 text-2xl font-black text-neutral-950">
                    Actividad de caja
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    Ingresos, gastos y traslados registrados en la caja abierta.
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-700">
                  {movements.length} movimiento{movements.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[26px] border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[linear-gradient(135deg,#090909_0%,#111827_100%)] text-white">
                    <tr>
                      <th className="px-5 py-4 font-black">Tipo</th>
                      <th className="px-5 py-4 font-black">Concepto</th>
                      <th className="px-5 py-4 font-black">Método</th>
                      <th className="px-5 py-4 font-black">Monto</th>
                      <th className="px-5 py-4 font-black">Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movements.length === 0 ? (
                      <tr>
                        <td className="px-5 py-6 text-neutral-500" colSpan="5">
                          No hay movimientos registrados.
                        </td>
                      </tr>
                    ) : (
                      movements.map((movement) => (
                        <tr key={movement.id} className="border-t border-neutral-200 transition hover:bg-amber-50/50">
                          <td className="px-5 py-5 font-black text-neutral-950">
                            {movementTypeLabel(movement.type)}
                          </td>

                          <td className="px-5 py-5">
                            <div className="font-bold text-neutral-800">
                              {movement.concept || 'Movimiento'}
                            </div>
                            {movement.note && (
                              <div className="mt-1 text-xs text-neutral-400">
                                {movement.note}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-5 font-bold text-neutral-700">
                            {movement.type === 'PAYMENT_METHOD_TRANSFER'
                              ? `${methodLabel(movement.fromPaymentMethod)} → ${methodLabel(movement.toPaymentMethod)}`
                              : methodLabel(movement.paymentMethod)}
                          </td>

                          <td className={`px-5 py-5 font-black ${movementAmountClass(movement.type)}`}>
                            {formatMoney(movement.amount)}
                          </td>

                          <td className="px-5 py-5 text-xs font-bold text-neutral-500">
                            {formatDateTime(movement.movementDate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <SalesSection
            sales={sales}
            onEdit={(sale) => setEditingSale(sale)}
            onDelete={handleDeleteSale}
          />
        </>
      )}

      {showOpenModal && selectedBranch && (
        <OpenCashModal
          branch={selectedBranch}
          onClose={() => setShowOpenModal(false)}
          onSaved={() => {
            setShowOpenModal(false);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {showCloseModal && selectedBranch && cashRegister && (
        <CloseCashModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          onClose={() => setShowCloseModal(false)}
          onSaved={() => {
            setShowCloseModal(false);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {showHistoryModal && selectedBranch && (
        <CashHistoryModal
          branch={selectedBranch}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showSaleModal && selectedBranch && cashRegister && (
        <SaleModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          onClose={() => setShowSaleModal(false)}
          onSaved={async () => {
            setShowSaleModal(false);
            await loadCash(selectedBranchId);
          }}
        />
      )}

      {showMovementModal && selectedBranch && cashRegister && (
        <MovementModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          onClose={() => setShowMovementModal(false)}
          onSaved={() => {
            setShowMovementModal(false);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {showBarberPaymentModal && selectedBranch && cashRegister && (
        <BarberPaymentModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          onClose={() => setShowBarberPaymentModal(false)}
          onSaved={() => {
            setShowBarberPaymentModal(false);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {showAppointmentSaleModal && selectedBranch && cashRegister && pendingAppointment && (
        <AppointmentSaleModal
          branch={selectedBranch}
          cashRegister={cashRegister}
          appointment={pendingAppointment}
          onClose={() => setShowAppointmentSaleModal(false)}
          onSaved={() => {
            setShowAppointmentSaleModal(false);
            setPendingAppointment(null);
            loadCash(selectedBranchId);
          }}
        />
      )}

      {editingSale && selectedBranch && (
        <EditSaleModal
          branch={selectedBranch}
          sale={editingSale}
          onClose={() => setEditingSale(null)}
          onSaved={() => {
            setEditingSale(null);
            loadCash(selectedBranchId);
          }}
        />
      )}
    </div>
  );
}