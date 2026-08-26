/* These three are redirect stops for URLs that used to be pages of their own.
   Written out as directories rather than about.html, so a static host serves
   them at /about with no rule of its own: nginx's default try_files finds
   $uri/ and not $uri.html. Grouped so this applies to them alone — /server is
   a real route tree and its URLs must not move. */
export const trailingSlash = 'always';
