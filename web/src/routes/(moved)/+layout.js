/* These three are redirect stops for URLs that used to be pages of their own;
   the site is one scroll now, so each one lands where its content went.

   Written out as directories rather than about.html, so a static host serves
   them at /about with no rule of its own: nginx's default try_files finds
   $uri/ and not $uri.html. Grouped so this applies to them alone — /server is
   a real route tree and its URLs must not move.

   Each stop is a meta refresh rather than a load-time redirect: the site
   prerenders to static files, and that is the only redirect a static host
   serves without a rule of its own. */
export const trailingSlash = 'always';
