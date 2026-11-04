export function googleReviewLink(raw) {
  const value=String(raw ?? '').trim();
  if (!value || value.length>1000 || /[\x00-\x1f\x7f]/.test(value)) return '';
  try {
    const url=new URL(value);
    if(url.protocol!=='https:' || url.username || url.password || (url.port && url.port!=='443'))return '';
    const h=url.hostname.toLowerCase(),p=url.pathname;
    const allowed=(h==='g.page' && /^\/(?:r\/)?[^/]+\/review\/?$/.test(p))
      || (h==='maps.app.goo.gl' && /^\/[A-Za-z0-9_-]+\/?$/.test(p))
      || (['google.com','www.google.com','maps.google.com'].includes(h) && (p==='/maps'||p.startsWith('/maps/')))
      || (h==='search.google.com'&&p==='/local/writereview'&&!!url.searchParams.get('placeid'));
    return allowed ? url.href : '';
  } catch {return '';}
}
