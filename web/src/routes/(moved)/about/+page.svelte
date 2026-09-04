<!-- A redirect stop for /about, which used to be a page of its own before the
     site became one scroll. The route stays at /about — that's the URL old
     links and search results have — but the section itself is now named
     Experience throughout, so this lands there rather than at a fragment
     nothing on the page answers to. A meta refresh rather than a load-time
     redirect: the site prerenders to static files, and this is the only
     redirect a static host serves without a rewrite rule of its own. -->
<svelte:head>
	<title>Experience — Joshua Smith</title>
	<meta http-equiv="refresh" content="0; url=/#experience" />
</svelte:head>

<a href="/#experience">Continue to Experience</a>
