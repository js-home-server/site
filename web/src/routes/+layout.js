export const prerender = true;

/* Emits <route>/index.html, not <route>.html — the shape a clean URL needs
   with no rewrite rule (this site's Caddy host has none). Internal links carry the trailing slash too, so no redirect hop. */
export const trailingSlash = 'always';
