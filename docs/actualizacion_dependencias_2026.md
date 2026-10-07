# Actualización de dependencias y entorno (octubre 2026)

> **Rama:** `upgrade/next-react-ai`
> **Objetivo:** sacar el proyecto de las versiones de 2023 (Next 13, React 18.2, AI SDK v2) y eliminar las vulnerabilidades críticas, en fases pequeñas y verificables.

---

## 1. Estado de las fases

| Fase | Cambio | Estado |
| :--- | :--- | :---: |
| 1 | Next 13.4.17 → 14.2.35, React 18.2.0 → 18.3.1 | ✅ Hecha (`6ff646d`) |
| 2 | Next 14 → 16.3.6, ESLint 8 → 9 (config plana `eslint.config.mjs`), `images.domains` → `remotePatterns` | ✅ Hecha (`e4492ff`) |
| 3 | AI SDK v2 → v7 (`ai`, `@ai-sdk/react`, `@ai-sdk/google`, `@ai-sdk/openai`, `zod`); se elimina `openai`. Node 24 con fnm | ✅ Hecha (pendiente de probar el chat en el navegador) |
| 4 | React 18.3.1 → 19.3.0 (+ tipos), `swr` 2.5.1, `lucide-react` 0.268 → 1.47 (icono `Youtube` → `SquarePlay`), `@radix-ui/react-slot` 1.3.3 | ✅ Hecha (pendiente de probar en el navegador) |

Tras la fase 3 no queda ninguna vulnerabilidad crítica. Las altas restantes vienen de herramientas de desarrollo (ESLint, Tailwind 3, PostCSS) y del `sharp` 0.32 de primer nivel.

---

## 2. Requisito nuevo: Node.js 24 (LTS)

La **AI SDK v7 exige Node.js 22 o superior** (`engines: ">=22"` en todos sus paquetes). Hasta ahora el proyecto se ejecutaba con **Node 20**, que además dejó de tener soporte en abril de 2026.

Se usará **Node 24 LTS**, pero **solo en este proyecto**, gestionado con [fnm](https://github.com/Schniz/fnm) para no afectar a otros proyectos de la máquina.

### Cómo funciona fnm

- Instala varias versiones de Node en paralelo.
- En una carpeta con `.nvmrc` (o `.node-version`) cambia automáticamente a esa versión al hacer `cd` (opción `--use-on-cd`).
- En carpetas sin `.nvmrc` usa la versión marcada con `fnm default`.
- Las apps o tareas que no se lanzan desde la terminal zsh siguen usando el Node de Homebrew.

### Pasos de instalación (una sola vez por máquina)

```bash
brew install fnm
fnm install 20 && fnm default 20   # el resto de proyectos sigue en Node 20
fnm install 24                     # versión de este proyecto
echo 'eval "$(fnm env --use-on-cd --shell zsh)"' >> ~/.zshrc
```

Abrir una terminal nueva (o `source ~/.zshrc`) y comprobar:

```bash
cd "<ruta del proyecto>"
node --version   # v24.x
```

### Cambios en el repositorio (hechos)

- `.nvmrc` con el contenido `24`.
- `package.json` → `"engines": { "node": ">=22" }`.
- Tras cambiar de versión de Node, reinstalar dependencias para recompilar binarios nativos: `npm ci` (respeta `ignore-scripts` de `.npmrc`).

### Volver atrás

Borrar la línea de `fnm env` de `~/.zshrc` (vuelve el `node@20` de Homebrew) o, sin desinstalar nada, `fnm default 20`.

---

## 3. Fase 3: migración a la AI SDK v7 (hecha)

Paquetes (publicados hace más de 14 días al elegirlos):

| Acción | Paquete | Versión |
| :--- | :--- | :--- |
| actualizar | `ai` | 2.2.37 → 7.0.111 |
| añadir | `@ai-sdk/react` | 4.0.114 |
| añadir | `@ai-sdk/google` | 4.0.77 |
| añadir | `@ai-sdk/openai` | 4.0.72 |
| añadir | `zod` | 4.6.5 |
| quitar | `openai` | 4.3.0 |

Cambios de código:

- **`lib/aiClient.ts`**: devuelve un modelo de la AI SDK (proveedor nativo de Gemini en lugar del endpoint "compatible con OpenAI"), manteniendo el orden de elección de clave: `GEMINI_API_KEY` → clave del usuario → `OPENAI_API_KEY`.
- **`app/api/chat/route.ts`**: `streamText` con herramientas definidas con `zod` (`tool({ inputSchema, execute })`), bucle de varios pasos con `stopWhen: isStepCount(n)` e `instructions` en lugar de mensaje `system`. Elimina la selección de clave duplicada. Hoy solo se ejecuta una herramienta con la API antigua `functions`.
- **`pages/chat.tsx`**: `useChat` de `@ai-sdk/react`; los mensajes pasan de `content` a `parts`, el envío pasa a `sendMessage`.
- **`services/openai/enrichArtistInfo.ts`**: `generateText`.
- **`services/openai/generateImageFromPrompt.ts`**: DALL·E mediante `generateImage` de la AI SDK (modelo `dall-e-2`, el que usaba por defecto el SDK anterior; devuelve una data URI).

Referencia: la guía de migración viene dentro del paquete, en `node_modules/ai/docs/08-migration-guides/23-migration-guide-7-0.mdx`.

---

## 4. Normas para instalar paquetes

Protección contra ataques de cadena de suministro (ver también `.npmrc`):

1. `ignore-scripts=true` y `save-exact=true` en `.npmrc`: ningún paquete ejecuta scripts al instalarse y las versiones quedan fijadas.
2. Solo versiones publicadas hace al menos 1–2 semanas.
3. Revisar el diff de `package-lock.json`: paquetes nuevos inesperados, nombres sospechosos, orígenes distintos de `registry.npmjs.org` y nuevos `hasInstallScript`.
4. `npm audit signatures` después de cada instalación.

## 5. Verificación de cada fase

```bash
npx tsc --noEmit
npm run lint
npm run build
```

El chat en streaming (fase 3) y los cambios de React (fase 4) deben probarse además en el navegador con `npm run dev`.

---

## 6. Pendiente (próxima sesión)

1. **Experiencia de escucha frente a la v1 con Spotify.** Con Spotify se podía escuchar el disco entero en streaming; ahora el reproductor depende de los vídeos que Discogs enlaza en cada release, y muchas pistas no tienen vídeo. Evaluar alternativas: volver a Spotify (embed de álbum/playlist; ojo a las restricciones de su API desde febrero de 2026), YouTube Data API (necesita clave), previews de Deezer (30 s, sin clave) u otras.
2. **Probar en el navegador** el chat de DiscBOT (herramientas), la ficha del disco y el mixtape, y después mezclar la rama `upgrade/next-react-ai` en `main`.
3. Reproductor del mixtape con la API de JavaScript de YouTube: pausa real y paso automático a la siguiente pista.
4. Vulnerabilidades altas restantes: Tailwind 3.3 / PostCSS (subir dentro de la versión 3) y `sharp` 0.32 (quitarlo de `package.json`, Next 16 trae el suyo).
5. ESLint 10 cuando `eslint-config-next` la admita; los 5 avisos de `react-hooks/set-state-in-effect`.
6. Script para rellenar BPM/tonalidad de las pistas que ya estaban en el mixtape.
