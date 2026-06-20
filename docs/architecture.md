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
Pages / API Routes          ← ensambla posts + usuarios, mapea a cards
        │
   ┌────┼────┐
   │         │         │
IPostQuery   IUser   ISearchPost
Repository   Repo    Repository
   │          │         │
   │          │         │
PostgresImpl Postgres  PostgresSearch
(Drizzle)    UserRepo  PostRepository
```

### IPostQueryRepository

Interfaz para consultas de posts. Implementacion:

- **PostgresPostQueryRepository** — usa Drizzle ORM, JOINs `posts` + `post_translations` + `post_media`, devuelve `PostData` con `userId` (sin datos de usuario completos)

### IUserRepository

Interfaz para resolver datos de usuario. Implementacion:

- **PostgresUserRepository** — consulta la tabla `users` via Drizzle (`WHERE id IN (...)`), devuelve `Map<uid, PostUser>`

### ISearchPostRepository

Interfaz para busqueda de posts. Implementacion:

- **PostgresSearchPostRepository** — usa Drizzle ORM con `ILIKE` sobre `post_translations.title` y `post_translations.content`, JOINs `posts` + `post_media` + `users`, paginacion nativa SQL

### Ensamblaje (application layer)

`assemblePostsWithUsers()` toma `PostData[]` (con `userId`) y los combina con los datos de usuario del `IUserRepository`. El resultado es `PostWithUser[]`, que ya tiene el campo `user` completo y es compatible con los mappers existentes (`mapPostsToCards`).

## Como agregar una nueva funcionalidad

1. Crear la interfaz en `src/infra/dataAccess/<feature>/I<Feature>Repository.ts`
2. Implementar la version PostgreSQL (Drizzle ORM)
3. Crear un factory que devuelva la implementacion
4. Usar el factory en las paginas/API routes

El codigo que consume el repositorio nunca importa una implementacion concreta, solo la interfaz y el factory.

## Variables de entorno relevantes

| Variable | Proposito |
|---|---|
| `DATABASE_URL` | URL de conexion a PostgreSQL (local con Docker o Supabase pooler) |

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
- **ORM**: Drizzle ORM (PostgreSQL)
- **Auth**: NextAuth v5 + Firebase Auth (Google, Microsoft Entra ID, SAML)
- **Search**: PostgreSQL ILIKE (busqueda por titulo y contenido)
- **i18n**: next-intl (espanol, ingles)
