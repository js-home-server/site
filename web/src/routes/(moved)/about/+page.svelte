<!-- A redirect stop for /about, which used to be a page of its own before the
     site became one scroll. A meta refresh rather than a load-time redirect:
     the site prerenders to static files, and this is the only redirect a
     static host serves without a rewrite rule of its own. -->
<svelte:head>
	<title>About — Joshua Smith</title>
	<meta http-equiv="refresh" content="0; url=/#about" />
</svelte:head>

<a href="/#about">Continue to About</a>
