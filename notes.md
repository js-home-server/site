Where your own config lives

- src/app.css — the whole theme. Colour tokens, radius, fonts, .dark block.
- components.json — where the CLI puts files, and typescript: false.
- src/lib/utils.js — cn().
- vite.config.js — plugins, adapter, your port 5199.

To browse what you can pull in: https://shadcn-svelte.com/docs/components, then npx shadcn-svelte@latest add <name>.