export function academyLessons(lessons, role, permissions = []) {
  if (!['OWNER', 'ADMIN'].includes(role)) return [];
  return lessons.filter((lesson) => lesson.roles.includes(role)
    && (role !== 'ADMIN' || !lesson.permission || permissions.includes(lesson.permission)));
}
export function academyProgressKey(session) {
  return `gods-academy:v1:${session?.tenantId || 'none'}:${session?.role || 'none'}:${session?.userId || 'none'}`;
}
export function readAcademyProgress(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
  } catch { return []; }
}
export const academyModules = ["Entrar y orientarse","Preparar negocio y equipo","Clientes y agenda","Caja y operación diaria","Productos e inventario","Fidelización y comunicación","Vitrina y reputación","Reportes y control","Herramientas adicionales y cuenta","Capacitar al equipo y al cliente","Primera jornada y autonomía"].map((title, index) => ({ id: index + 1, title: 'Módulo ' + String(index + 1).padStart(2, '0') + ' · ' + title }));
export function academyModuleId(lesson) {
  const legacy = { 'Configuración': 2, Clientes: 3, Agenda: 3, Caja: 4, Reportes: 8, 'Mi cuenta': 10, Reservas: 10, Beneficios: 10, 'Mi trabajo': 10, 'Atención': 10 };
  return lesson.moduleId || legacy[lesson.category] || 1;
}
export function academyGroups(lessons) {
  return academyModules.map(module => ({ ...module, lessons: lessons.filter(lesson => academyModuleId(lesson) === module.id).sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id.localeCompare(b.id)) })).filter(module => module.lessons.length);
}
