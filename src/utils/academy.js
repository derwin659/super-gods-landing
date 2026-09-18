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