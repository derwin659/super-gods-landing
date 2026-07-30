import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const LocaleContext = createContext(null);
const APP_LOCALE_KEY = 'APP_LOCALE';
const TENANT_LOCALE_KEY = 'TENANT_LOCALE';
const LOCALE_EVENT = 'gods:locale-change';

const dictionaries = {
  'es-PE': {
    language: 'Idioma',
    languageDescription: 'Elige cómo quieres ver Super Gods.',
    save: 'Guardar',
    dashboard: 'Dashboard',
    cash: 'Caja',
    agenda: 'Agenda',
    reports: 'Reportes',
    customers: 'Clientes',
    reviews: 'Reseñas',
    services: 'Servicios',
    products: 'Productos',
    professionals: 'Profesionales',
    branches: 'Sedes',
    settings: 'Configuración',
    signOut: 'Cerrar sesión',
    login: 'Iniciar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    enter: 'Ingresar',
    backToWeb: 'Volver a la web',
    secureBooking: 'Reserva segura',
    inStoreService: 'Atención en local',
    directConfirmation: 'Confirmación directa con el negocio.',
    storeQr: 'QR del local',
    onlineBooking: 'Reserva online',
    bookingHero: 'Elige sede, profesional, servicio y horario. Tu cita queda lista en segundos.',
    walkInHero: 'Separa productos, registra tus datos o solicita atención desde tu teléfono para que el negocio te atienda en caja.',
    chooseBranch: 'Elige sede',
    chooseBranchDescription: 'Selecciona dónde quieres atenderte.',
    chooseProfessional: 'Elige profesional',
    chooseProfessionalDescription: 'Puedes elegir un profesional o dejarlo sin seleccionar.',
    anyProfessional: 'Cualquier profesional',
    availableProfessional: 'Asignamos uno disponible.',
    chooseServices: 'Elige servicios',
    chooseServicesOptional: 'Elige servicios (opcional)',
    searchService: 'Buscar servicio',
    dateAndTime: 'Fecha y hora',
    date: 'Fecha',
    availableTimes: 'Horarios disponibles',
    searchingTimes: 'Buscando horarios...',
    noTimes: 'No hay horarios disponibles para esta selección.',
    yourData: 'Tus datos',
    yourDataDescription: 'Usaremos estos datos para registrar y confirmar tu cita.',
    name: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono',
    nextStep: 'Siguiente paso',
    'Resumen': 'Resumen',
    'Vista general': 'Vista general',
    'Operación': 'Operación',
    'Ventas, agenda y caja': 'Ventas, agenda y caja',
    'Clientes y fidelización': 'Clientes y fidelización',
    'CRM, puntos y campañas': 'CRM, puntos y campañas',
    'Catálogo y equipo': 'Catálogo y equipo',
    'Servicios, sedes y personal': 'Servicios, sedes y personal',
    'Administración': 'Administración',
    'Seguridad y ajustes': 'Seguridad y ajustes',
  },
  'pt-BR': {
    language: 'Idioma',
    languageDescription: 'Escolha como deseja visualizar o Super Gods.',
    save: 'Salvar',
    dashboard: 'Painel',
    cash: 'Caixa',
    agenda: 'Agenda',
    reports: 'Relatórios',
    customers: 'Clientes',
    reviews: 'Avaliações',
    services: 'Serviços',
    products: 'Produtos',
    professionals: 'Profissionais',
    branches: 'Unidades',
    settings: 'Configurações',
    signOut: 'Sair',
    login: 'Entrar',
    email: 'E-mail',
    password: 'Senha',
    enter: 'Entrar',
    backToWeb: 'Voltar ao site',
    secureBooking: 'Reserva segura',
    inStoreService: 'Atendimento no local',
    directConfirmation: 'Confirmação direta com o estabelecimento.',
    storeQr: 'QR da unidade',
    onlineBooking: 'Agendamento online',
    bookingHero: 'Escolha a unidade, o profissional, o serviço e o horário. Seu agendamento fica pronto em segundos.',
    walkInHero: 'Separe produtos, informe seus dados ou solicite atendimento pelo celular para ser atendido no caixa.',
    chooseBranch: 'Escolha a unidade',
    chooseBranchDescription: 'Selecione onde deseja ser atendido.',
    chooseProfessional: 'Escolha o profissional',
    chooseProfessionalDescription: 'Você pode escolher um profissional ou deixar sem seleção.',
    anyProfessional: 'Qualquer profissional',
    availableProfessional: 'Designaremos um profissional disponível.',
    chooseServices: 'Escolha os serviços',
    chooseServicesOptional: 'Escolha os serviços (opcional)',
    searchService: 'Buscar serviço',
    dateAndTime: 'Data e horário',
    date: 'Data',
    availableTimes: 'Horários disponíveis',
    searchingTimes: 'Buscando horários...',
    noTimes: 'Não há horários disponíveis para esta seleção.',
    yourData: 'Seus dados',
    yourDataDescription: 'Usaremos estes dados para registrar e confirmar seu agendamento.',
    name: 'Nome',
    lastName: 'Sobrenome',
    phone: 'Telefone',
    nextStep: 'Próxima etapa',
    'Resumen': 'Visão geral',
    'Vista general': 'Resumo do negócio',
    'Operación': 'Operação',
    'Ventas, agenda y caja': 'Vendas, agenda e caixa',
    'Clientes y fidelización': 'Clientes e fidelização',
    'CRM, puntos y campañas': 'CRM, pontos e campanhas',
    'Catálogo y equipo': 'Catálogo e equipe',
    'Servicios, sedes y personal': 'Serviços, unidades e equipe',
    'Administración': 'Administração',
    'Seguridad y ajustes': 'Segurança e configurações',
    'Dashboard': 'Painel',
    'Caja': 'Caixa',
    'Reportes': 'Relatórios',
    'Reseñas': 'Avaliações',
    'Ajustar puntos': 'Ajustar pontos',
    'Premios': 'Recompensas',
    'Promociones': 'Promoções',
    'Servicios': 'Serviços',
    'Productos': 'Produtos',
    'Barberos': 'Profissionais',
    'Horarios': 'Horários',
    'Sedes': 'Unidades',
    'Métodos de pago': 'Formas de pagamento',
    'Auditoria': 'Auditoria',
    'Administradores': 'Administradores',
    'Plan y pagos': 'Plano e pagamentos',
    'Configuración': 'Configurações',
  },
  'en-US': {
    language: 'Language',
    languageDescription: 'Choose how you want to view Super Gods.',
    save: 'Save',
    dashboard: 'Dashboard',
    cash: 'Cash register',
    agenda: 'Schedule',
    reports: 'Reports',
    customers: 'Customers',
    reviews: 'Reviews',
    services: 'Services',
    products: 'Products',
    professionals: 'Professionals',
    branches: 'Locations',
    settings: 'Settings',
    signOut: 'Sign out',
    login: 'Sign in',
    email: 'Email',
    password: 'Password',
    enter: 'Sign in',
    backToWeb: 'Back to website',
    secureBooking: 'Secure booking',
    inStoreService: 'In-store service',
    directConfirmation: 'Direct confirmation with the business.',
    storeQr: 'Location QR',
    onlineBooking: 'Online booking',
    bookingHero: 'Choose a location, professional, service and time. Your appointment is ready in seconds.',
    walkInHero: 'Select products, enter your details or request service from your phone to be assisted at checkout.',
    chooseBranch: 'Choose a location',
    chooseBranchDescription: 'Select where you want to be served.',
    chooseProfessional: 'Choose a professional',
    chooseProfessionalDescription: 'Choose a professional or leave it unselected.',
    anyProfessional: 'Any professional',
    availableProfessional: 'We will assign an available professional.',
    chooseServices: 'Choose services',
    chooseServicesOptional: 'Choose services (optional)',
    searchService: 'Search service',
    dateAndTime: 'Date and time',
    date: 'Date',
    availableTimes: 'Available times',
    searchingTimes: 'Looking for times...',
    noTimes: 'No times are available for this selection.',
    yourData: 'Your details',
    yourDataDescription: 'We will use this information to register and confirm your appointment.',
    name: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    nextStep: 'Next step',
    'Resumen': 'Overview',
    'Vista general': 'Business overview',
    'Operación': 'Operations',
    'Ventas, agenda y caja': 'Sales, schedule and cash',
    'Clientes y fidelización': 'Customers and loyalty',
    'CRM, puntos y campañas': 'CRM, points and campaigns',
    'Catálogo y equipo': 'Catalog and team',
    'Servicios, sedes y personal': 'Services, locations and staff',
    'Administración': 'Administration',
    'Seguridad y ajustes': 'Security and settings',
    'Dashboard': 'Dashboard',
    'Caja': 'Cash register',
    'Agenda': 'Schedule',
    'Reportes': 'Reports',
    'Clientes': 'Customers',
    'Reseñas': 'Reviews',
    'Ajustar puntos': 'Adjust points',
    'Premios': 'Rewards',
    'Promociones': 'Promotions',
    'Servicios': 'Services',
    'Productos': 'Products',
    'Barberos': 'Professionals',
    'Horarios': 'Schedules',
    'Sedes': 'Locations',
    'Métodos de pago': 'Payment methods',
    'Auditoria': 'Audit log',
    'Administradores': 'Administrators',
    'Plan y pagos': 'Plan and billing',
    'Configuración': 'Settings',
  },
};

export function normalizeLocale(value) {
  const language = String(value || '').trim().replace('_', '-').split('-')[0].toLowerCase();
  if (language === 'pt') return 'pt-BR';
  if (language === 'en') return 'en-US';
  return 'es-PE';
}

export function getAppLocale() {
  return normalizeLocale(
    localStorage.getItem(APP_LOCALE_KEY) ||
      localStorage.getItem(TENANT_LOCALE_KEY) ||
      navigator.language
  );
}

export function applyRegionalSession(data = {}) {
  const tenantLocale = normalizeLocale(data.tenantLocale || data.locale);
  const locale = normalizeLocale(data.locale || tenantLocale);
  localStorage.setItem(TENANT_LOCALE_KEY, tenantLocale);
  localStorage.setItem(APP_LOCALE_KEY, locale);
  window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: locale }));
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getAppLocale);

  useEffect(() => {
    const update = (event) => setLocaleState(normalizeLocale(event.detail || getAppLocale()));
    window.addEventListener(LOCALE_EVENT, update);
    return () => window.removeEventListener(LOCALE_EVENT, update);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((value) => {
    const normalized = normalizeLocale(value);
    localStorage.setItem(APP_LOCALE_KEY, normalized);
    setLocaleState(normalized);
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: normalized }));
  }, []);

  const t = useCallback(
    (key) => dictionaries[locale]?.[key] || dictionaries['es-PE'][key] || key,
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useI18n debe usarse dentro de I18nProvider');
  return context;
}
