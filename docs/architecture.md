# Arquitectura

## Estrategia de bases de datos

El proyecto usa **dos bases de datos** que coexisten durante la transicion de Firestore a PostgreSQL:

| Base de datos | Proposito | Estado |
|---|---|---|
| **Firestore** | Autenticacion, usuarios, creacion de posts, busqueda, comentarios | Activo (por defecto) |
| **PostgreSQL (Supabase)** | Autenticacion (NextAuth), usuarios, cuentas, sesiones, lectura de posts | Nuevo |

La variable `DB_PROVIDER` en el `.env` controla cual se usa para lectura de posts:

```
DB_PROVIDER=firestore   # lectura desde Firestore (default)
DB_PROVIDER=postgres    # lectura desde PostgreSQL
```

Esto permite ir migrando funcionalidades incrementalmente sin romper nada.

## Autenticacion y usuarios

La autenticacion usa **NextAuth v5** con `DrizzleAdapter`, que almacena `users`, `accounts`, `sessions` y `verification_tokens` en PostgreSQL. Los proveedores OAuth (Google, Microsoft Entra ID) estan configurados en NextAuth.

Los usuarios de Firebase Auth fueron exportados a PostgreSQL mediante el script `seedUsers.ts`, que preserva los Firebase UIDs como IDs de usuario en PostgreSQL y enlaza las cuentas OAuth a traves de la tabla `accounts`. Cuando un usuario inicia sesion con NextAuth, el adapter encuentra la cuenta existente y reutiliza el usuario con su Firebase UID original, manteniendo compatibilidad con los `user_id` existentes en los posts.

Al mostrar un listado, el factory `createUserRepository()` elige entre:
- **PostgresUserRepository** (`DB_PROVIDER=postgres`) — consulta la tabla `users` via Drizzle
- **FirebaseUserRepository** (default) — llama a `auth.getUsers()` de Firebase Admin

## Capas

```
Pages / API Routes          ← ensambla posts + usuarios, mapea a cards
        │
   ┌────┴────┐
   │         │
IPostQuery   IUser
Repository   Repository
   │            │
   ├─ PostgresImpl       ├─ PostgresUserRepository (Drizzle → users table)
   ├─ FirestoreImpl      └─ FirebaseUserRepository (Firebase Auth)
```

### IPostQueryRepository

Interfaz para consultas de posts. Dos implementaciones:

- **PostgresPostQueryRepository** — usa Drizzle ORM, JOINs `posts` + `post_translations` + `post_media`, devuelve `PostData` con `userId` (sin datos de usuario completos)
- **FirestorePostQueryRepository** — adapter que envuelve el codigo existente de Firestore, implementa la misma interfaz

Ambas devuelven exactamente el mismo tipo (`PostData[]`), asi que el codigo que las consume no sabe cual base de datos esta usando.

### IUserRepository

Interfaz para resolver datos de usuario. Dos implementaciones:

- **PostgresUserRepository** — consulta la tabla `users` via Drizzle (`WHERE id IN (...)`), devuelve `Map<uid, PostUser>`
- **FirebaseUserRepository** — llama a `auth.getUsers(identifiers)` de Firebase Admin, devuelve `Map<uid, PostUser>`

El factory `createUserRepository()` elige la implementacion segun `DB_PROVIDER`, igual que `createPostQueryRepository()`.

### Ensamblaje (application layer)

`assemblePostsWithUsers()` toma `PostData[]` (con `userId`) y los combina con los datos de usuario del `IUserRepository`. El resultado es `PostWithUser[]`, que ya tiene el campo `user` completo y es compatible con los mappers existentes (`mapPostsToCards`).

## Como agregar una nueva funcionalidad con PostgreSQL

1. Crear la interfaz en `src/infra/dataAccess/<feature>/I<Feature>Repository.ts`
2. Implementar la version PostgreSQL
3. Implementar la version Firestore (o adapter del codigo existente)
4. Crear un factory que elija la implementacion segun `DB_PROVIDER`
5. Usar el factory en las paginas/API routes

El codigo que consume el repositorio nunca importa una implementacion concreta, solo la interfaz y el factory.

## Variables de entorno relevantes

| Variable | Proposito |
|---|---|
| `DB_PROVIDER` | `firestore` o `postgres` — elige que base de datos usar para consultas de posts |
| `DATABASE_URL` | URL de conexion a PostgreSQL (local con Docker o Supabase pooler) |

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
- **ORM**: Drizzle ORM (PostgreSQL)
- **Auth**: NextAuth v5 + Firebase Auth (Google, Microsoft Entra ID, SAML)
- **Search**: Vertex AI embeddings + Firestore
- **i18n**: next-intl (espanol, ingles)
