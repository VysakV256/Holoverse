# Holoverse

Holoverse is a local hologram environment built with React, Vite, and React Three Fiber.

It currently supports:

- single-image holograms
- three-image morph holograms
- depth-displaced holograms
- generated mesh and splat modes

## Alpha Prime

This project now includes an `Alpha Prime` persona derived from the Webase agent foundations model.

Files:

- `/Users/vysak/Explorations/Holoverse/public/personas/alpha-prime.json`
- `/Users/vysak/Explorations/Holoverse/src/components/SingleImageHologram.jsx`

The Alpha Prime hologram uses a single-image embodiment mode rather than the older three-image morphing flow.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
