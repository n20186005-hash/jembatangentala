export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (!local && (url.protocol !== 'https:' || url.hostname !== 'jembatangentala.com')) { url.protocol = 'https:'; url.hostname = 'jembatangentala.com'; url.port = ''; return Response.redirect(url.toString(), 301); }
  const notFoundPage = ['/404', '/404/', '/404.html'].includes(url.pathname);
  const assetRequest = notFoundPage ? new Request(new URL('/__not_found__', url), request) : request;
  let response = await env.ASSETS.fetch(assetRequest);
  const headers = new Headers(response.headers);
  if (response.status === 404 || notFoundPage) headers.set('X-Robots-Tag', 'noindex, follow');
  headers.set('X-Content-Type-Options', 'nosniff'); headers.set('Referrer-Policy', 'strict-origin-when-cross-origin'); headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self'; img-src 'self' data: https://www.google-analytics.com; connect-src 'self' https://*.google-analytics.com https://www.googletagmanager.com; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  if (url.pathname === '/sw.js') headers.set('Cache-Control', 'no-store');
  return new Response(request.method === 'HEAD' ? null : response.body, {status: notFoundPage ? 404 : response.status, headers});
 }
};
