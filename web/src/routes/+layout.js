export const prerender = true;

/* Every prerendered route emits <route>/index.html rather than <route>.html —
   the shape every static host serves for a clean URL with no rewrite rule of
   its own, which is not something to depend on since this site's own host
   (see the "This server" case study) is plain Caddy with no such rule. Every
   internal link has its own trailing slash to match, so there is no redirect
   hop either. */
export const trailingSlash = 'always';
