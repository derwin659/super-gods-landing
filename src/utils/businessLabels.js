const LABELS_BY_TYPE = {
  BARBERSHOP: {
    businessSingular: 'barbería',
    businessDisplay: 'Barbería',
    professionalSingular: 'barbero',
    professionalsPlural: 'barberos',
    professionalDisplay: 'Barbero',
    professionalsDisplay: 'Barberos',
    serviceReference: 'corte',
    courtesyPlural: 'cortesías',
  },
  BEAUTY_SALON: {
    businessSingular: 'salón de belleza',
    businessDisplay: 'Salón de belleza',
    professionalSingular: 'estilista',
    professionalsPlural: 'estilistas',
    professionalDisplay: 'Estilista',
    professionalsDisplay: 'Estilistas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesías',
  },
  HAIR_SALON: {
    businessSingular: 'peluquería',
    businessDisplay: 'Peluquería',
    professionalSingular: 'estilista',
    professionalsPlural: 'estilistas',
    professionalDisplay: 'Estilista',
    professionalsDisplay: 'Estilistas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesías',
  },
  NAILS: {
    businessSingular: 'estudio de uñas',
    businessDisplay: 'Estudio de uñas',
    professionalSingular: 'técnica',
    professionalsPlural: 'técnicas',
    professionalDisplay: 'Técnica',
    professionalsDisplay: 'Técnicas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesías',
  },
  BROWS_LASHES: {
    businessSingular: 'estudio de cejas y pestañas',
    businessDisplay: 'Estudio de cejas y pestañas',
    professionalSingular: 'especialista',
    professionalsPlural: 'especialistas',
    professionalDisplay: 'Especialista',
    professionalsDisplay: 'Especialistas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesías',
  },
  SPA: {
    businessSingular: 'spa',
    businessDisplay: 'Spa',
    professionalSingular: 'especialista',
    professionalsPlural: 'especialistas',
    professionalDisplay: 'Especialista',
    professionalsDisplay: 'Especialistas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesías',
  },
  AESTHETIC_CENTER: {
    businessSingular: 'centro de estética',
    businessDisplay: 'Centro de estética',
    professionalSingular: 'especialista',
    professionalsPlural: 'especialistas',
    professionalDisplay: 'Especialista',
    professionalsDisplay: 'Especialistas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesías',
  },
  TATTOO_STUDIO: {
    businessSingular: 'estudio de tatuajes',
    businessDisplay: 'Estudio de tatuajes',
    professionalSingular: 'tatuador',
    professionalsPlural: 'tatuadores',
    professionalDisplay: 'Tatuador',
    professionalsDisplay: 'Tatuadores',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesías',
  },
  WORKSHOP: {
    businessSingular: 'taller',
    businessDisplay: 'Taller',
    professionalSingular: 'técnico',
    professionalsPlural: 'técnicos',
    professionalDisplay: 'Técnico',
    professionalsDisplay: 'Técnicos',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesías',
  },
  OTHER: {
    businessSingular: 'negocio',
    businessDisplay: 'Negocio',
    professionalSingular: 'profesional',
    professionalsPlural: 'profesionales',
    professionalDisplay: 'Profesional',
    professionalsDisplay: 'Profesionales',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesías',
  },
};

LABELS_BY_TYPE.NAIL_STUDIO = LABELS_BY_TYPE.NAILS;
LABELS_BY_TYPE.AUTO_WORKSHOP = LABELS_BY_TYPE.WORKSHOP;
LABELS_BY_TYPE.MECHANIC_SHOP = LABELS_BY_TYPE.WORKSHOP;

function normalizeBusinessType(value) {
  return String(value || '').trim().toUpperCase();
}

export function getBusinessLabels(type) {
  return LABELS_BY_TYPE[normalizeBusinessType(type)] || LABELS_BY_TYPE.OTHER;
}

export function readBusinessTypeFromStorage() {
  if (typeof window === 'undefined') return 'BARBERSHOP';

  return (
    window.localStorage.getItem('BUSINESS_TYPE') ||
    window.localStorage.getItem('businessType') ||
    window.localStorage.getItem('TENANT_BUSINESS_TYPE') ||
    'BARBERSHOP'
  );
}

export function readBusinessLabels() {
  return getBusinessLabels(readBusinessTypeFromStorage());
}
