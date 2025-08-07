# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh.
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## API configuration

The frontend uses an environment variable to determine the backend API URL. Copy `.env.example` to `.env.development` and set `VITE_API_URL` to the address of your backend API, e.g.

```bash
VITE_API_URL=http://192.168.200.251:4000/api
```

For production deployments, create `.env.production`:

```bash
# .env.production
VITE_API_URL=https://kontext.gosystem.io/api
```

If `VITE_API_URL` is not set, requests default to `${window.location.origin}/api`.
