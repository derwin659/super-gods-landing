const LABELS_BY_TYPE = {
  BARBERSHOP: {
    businessSingular: 'barberia',
    professionalSingular: 'barbero',
    professionalsPlural: 'barberos',
    serviceReference: 'corte',
    courtesyPlural: 'cortesias',
  },
  HAIR_SALON: {
    businessSingular: 'salon',
    professionalSingular: 'estilista',
    professionalsPlural: 'estilistas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesias',
  },
  NAIL_STUDIO: {
    businessSingular: 'estudio',
    professionalSingular: 'tecnica',
    professionalsPlural: 'tecnicas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesias',
  },
  SPA: {
    businessSingular: 'spa',
    professionalSingular: 'especialista',
    professionalsPlural: 'especialistas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesias',
  },
  AESTHETIC_CENTER: {
    businessSingular: 'centro',
    professionalSingular: 'especialista',
    professionalsPlural: 'especialistas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesias',
  },
  TATTOO_STUDIO: {
    businessSingular: 'estudio',
    professionalSingular: 'artista',
    professionalsPlural: 'artistas',
    serviceReference: 'servicio',
    courtesyPlural: 'cortesias',
  },
};

function normalizeBusinessType(value) {
  return String(value || '').trim().toUpperCase();
}

export function getBusinessLabels(type) {
  return LABELS_BY_TYPE[normalizeBusinessType(type)] || LABELS_BY_TYPE.BARBERSHOP;
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
