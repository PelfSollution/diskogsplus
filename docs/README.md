# Índice de Documentación: Diskogs Plus (v2.0)

Bienvenido a la carpeta de documentación técnica y de evolución de **Diskogs Plus**. Aquí se agrupan los informes de auditoría, las decisiones de arquitectura, el balance de mejoras implementadas y la hoja de ruta de tareas pendientes.

---

## 📚 Documentos Disponibles

| Documento | Descripción | Estado |
| :--- | :--- | :---: |
| [**`docs/design.md`**](./design.md) | **Sistema de diseño (oct. 2026)**: claro, grises piedra y acento verde; Inter y JetBrains Mono; barra lateral, `VinylDisc` con la portada en la galleta, tablas, etiquetas Camelot y reproductores. | 🟢 Actualizado |
| [**`docs/roadmap.md`**](./roadmap.md) | **Roadmap (oct. 2026)**: comparativa de servicios de streaming para volver a escuchar los discos enteros, y fases de sesiones, exportación, colección e infraestructura. | 🟡 En curso |
| [**`docs/actualizacion_dependencias_2026.md`**](./actualizacion_dependencias_2026.md) | **Actualización de dependencias (oct. 2026)**: fases de Next 13 → 16, AI SDK v2 → v7 y React 19, requisito de Node 24 con fnm y normas para instalar paquetes de forma segura. | 🟡 En curso |
| [**`docs/supabase.md`**](./supabase.md) | **Supabase (oct. 2026)**: auditoría del esquema, `supabase/schema.sql` y paso a paso para crear el proyecto nuevo; fase 2 para cerrar el acceso público. | 🟡 En curso |
| [**`docs/balance_v2_y_roadmap.md`**](./balance_v2_y_roadmap.md) | **Balance consolidado de la v2.0**: Resumen de todas las mejoras aplicadas (Google Gemini 2.5 Flash, YouTube Player, migración total de Material-UI a Tailwind, persistencia híbrida, seguridad) y listado de tareas pendientes priorizadas. | 🟢 Actualizado |
| [**`docs/auditoria_tecnica_inicial.md`**](./auditoria_tecnica_inicial.md) | **Auditoría Técnica de partida**: Diagnóstico exhaustivo del estado del proyecto tras 3 años de inactividad, análisis de deuda técnica, vulnerabilidades de seguridad encontradas y propuesta original de arquitectura. | 📄 Histórico |

---

## 🛠️ Resumen de la Arquitectura v2.0

```mermaid
graph TD
    Client["Frontend Next.js + Tailwind + Lucide"] --> UI["UI Components & Modals (100% Tailwind)"]
    Client --> Pages["Pages: Catalog, Mixtape Player, DiscBOT, Matching, Dashboard"]
    
    Pages --> LocalStore["Persistencia Híbrida: LocalStorage (Offline) + Supabase"]
    Pages --> DiscBOT["DiscBOT Agent (Google Gemini 2.5 Flash)"]
    Pages --> Player["Mixtape Turntable (YouTube IFrame API)"]
    
    DiscBOT --> Tools["Tool Calling: Camelot Wheel, Last.fm, Discogs API"]
    Pages --> AIImages["Generación Portadas: Google Imagen 3 / SDXL Flux"]
```

---

## 🚀 Guía Rápida para Desarrolladores

### 0. Node.js 24
El proyecto necesita **Node.js 22 o superior** (se usa Node 24 LTS mediante `fnm` y `.nvmrc`). Instrucciones en [`actualizacion_dependencias_2026.md`](./actualizacion_dependencias_2026.md#2-requisito-nuevo-nodejs-24-lts).

### 1. Variables de Entorno (`.env.local`)
Asegúrate de tener configurado tu archivo `.env.local` con las siguientes claves esenciales:
```env
# Google AI Studio (DiscBOT Agent y Enriquecimiento)
GEMINI_API_KEY=tu_clave_de_gemini
GEMINI_MODEL=gemini-2.5-flash

# Last.fm (Biografías y Metadatos Contextuales)
LASTFM_API_KEY=tu_clave_lastfm

# Discogs API
CONSUMER_KEY=tu_consumer_key
CONSUMER_SECRET=tu_consumer_secret
```

### 2. Comandos Clave
* **Ejecutar en desarrollo:** `npm run dev`
* **Verificar TypeScript:** `npx tsc --noEmit`
* **Ejecutar linter:** `npm run lint`
* **Compilación de producción:** `npm run build`
