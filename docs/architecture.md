# Arquitectura

## Estrategia de bases de datos

El proyecto usa **dos bases de datos** que coexisten durante la transicion de Firestore a PostgreSQL:

| Base de datos | Proposito | Estado |
|---|---|---|
| **Firestore** | Creacion de posts, comentarios, archivos multimedia | Activo (pendiente de migrar) |
| **PostgreSQL (Supabase)** | Autenticacion (NextAuth), usuarios, cuentas, sesiones, lectura de posts, busqueda | Principal |

La mayoria de las lecturas ya usan exclusivamente PostgreSQL. Solo la creacion de posts, los comentarios y el almacenamiento de archivos siguen en Firestore/Firebase.

## Autenticacion y usuarios

La autenticacion usa **NextAuth v5** con `DrizzleAdapter`, que almacena `users`, `accounts`, `sessions` y `verification_tokens` en PostgreSQL. Los proveedores OAuth (Google, Microsoft Entra ID) estan configurados en NextAuth.

Los usuarios de Firebase Auth fueron exportados a PostgreSQL mediante el script `seedUsers.ts`, que preserva los Firebase UIDs como IDs de usuario en PostgreSQL y enlaza las cuentas OAuth a traves de la tabla `accounts`. Cuando un usuario inicia sesion con NextAuth, el adapter encuentra la cuenta existente y reutiliza el usuario con su Firebase UID original, manteniendo compatibilidad con los `user_id` existentes en los posts.

Al mostrar un listado, el factory `createUserRepository()` usa **PostgresUserRepository** que consulta la tabla `users` via Drizzle.

## Capas

```
Pages / API Routes          ← consultan repos, mapean a cards
        │
   ┌────┼────┐
   │         │         │
IPostQuery   IUser   ISearchPost
Repository   Repo    Repository
   │          │         │
   │          │         │
Postgres     Postgres  PostgresSearch
(LATERAL,    UserRepo  (ILIKE,
1 query)     (Drizzle)  Drizzle)
```

- **Post listing** ya no depende de `IUserRepository`. El JOIN con `users` ocurre dentro del repositorio de posts, en una sola query.
- **Search** incluye su propio JOIN con `users` directamente en el repositorio.
- `IUserRepository` queda para casos donde se necesita resolver usuarios por ID fuera del contexto de posts (ej. perfil de usuario).

### IPostQueryRepository

Interfaz para listado paginado de posts. `PostData` incluye el objeto `user` completo.

- **PostgresPostQueryRepository** — una sola query SQL con `LEFT JOIN LATERAL`:
  - `LEFT JOIN users` — datos del autor (1:1, sin duplicacion)
  - `LEFT JOIN LATERAL (jsonb_agg FROM post_translations)` — traducciones agrupadas en JSON (1:many)
  - `LEFT JOIN LATERAL (jsonb_agg FROM post_media ORDER BY sort_order)` — media agrupada en JSON (1:many)
  - `COUNT(*) OVER()` — total de posts en la misma query, sin consulta separada

  **Ventajas del enfoque LATERAL:**
  - 1 solo round trip para posts + users + translations + media + total count
  - Sin `GROUP BY` ni `DISTINCT` — las subconsultas laterales evitan la explosion de filas
  - Media ordenada por `sort_order` directamente en SQL
  - Cada subconsulta solo ve las filas de su post (`WHERE post_id = p.id`)

### IUserRepository

Interfaz para resolver datos de usuario por ID. Usada internamente por `PostgresSearchPostRepository`.

- **PostgresUserRepository** — consulta `users` via Drizzle (`WHERE id IN (...)`)

### ISearchPostRepository

Interfaz para busqueda de posts. `ISearchPostResultDTO` incluye el objeto `user` completo.

- **PostgresSearchPostRepository** — `ILIKE` sobre `post_translations.title` y `post_translations.content`, JOINs `posts` + `post_media` + `users`, paginacion nativa SQL

## Como agregar una nueva funcionalidad

1. Crear la interfaz (puerto) en `src/domain/ports/`
2. Implementar la version PostgreSQL en `src/infra/dataAccess/<feature>/`
3. Crear un factory que devuelva la implementacion
4. Usar el factory en las paginas/API routes

Principios:
- El codigo consumidor solo importa la interfaz y el factory, nunca la implementacion concreta.
- Para relaciones 1:many usa `LEFT JOIN LATERAL` con `jsonb_agg` (evita `GROUP BY` + `DISTINCT`).
- Prefiere una sola query con JOINs sobre multiples queries + ensamblaje en memoria.

## Variables de entorno relevantes

| Variable | Proposito |
|---|---|
| `DATABASE_URL` | URL de conexion a PostgreSQL (local con Docker o Supabase pooler) |

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
- **ORM**: Drizzle ORM (PostgreSQL)
- **Auth**: NextAuth v5 (Google, Microsoft Entra ID)
- **Search**: PostgreSQL ILIKE (busqueda por titulo y contenido)
- **i18n**: next-intl (espanol, ingles)
