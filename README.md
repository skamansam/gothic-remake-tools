# Gothic Remake Tools

A SvelteKit application for Gothic 1 Remake game tools, built with Twintrinsic components and Tailwind CSS.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type checking
pnpm check

# Linting
pnpm lint
pnpm format

# Testing
pnpm test:e2e
```

## Features

- **Theming System**: Multiple Gothic-themed color schemes (Gothic Gold, Old Camp, New Camp, Swamp Camp, Fire Mage, Water Mage)
- **Twintrinsic Components**: Built with the Twintrinsic component library
- **Responsive Design**: Works across all screen sizes
- **TypeScript**: Full type safety

## Project Structure

```
gothic-remake-tools/
├── src/
│   ├── lib/
│   │   ├── theme.ts          # Theme configuration
│   │   └── index.ts
│   ├── routes/
│   │   ├── +layout.svelte    # Main layout
│   │   ├── +page.svelte      # Home page
│   │   └── theme/            # Theme selector
│   └── app.css               # Global styles
├── tests/
│   └── e2e/
└── AGENTS.md                 # Agent guidelines
```

## Themes

The site includes 6 pre-configured themes inspired by Gothic 1 Remake:

- **Gothic Gold** (default) - Classic gold and dark theme
- **Old Camp** - Bronze and warm tones
- **New Camp** - Green and nature-inspired
- **Swamp Camp** - Purple and mystical
- **Fire Mage** - Red and fiery
- **Water Mage** - Cyan and cool

Custom themes can also be created using the theme selector.

