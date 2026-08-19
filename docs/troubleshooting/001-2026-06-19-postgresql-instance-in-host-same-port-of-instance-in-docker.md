# Resolución de problemas de conexión PostgreSQL con Docker y VS Code

## Problema

Al intentar conectarse a PostgreSQL desde VS Code se obtenía el siguiente error:

```text
Connection error: connection failed:
connection to server at "127.0.0.1", port 5432 failed:
FATAL: password authentication failed for user "postgres"
```

A pesar de que las credenciales parecían correctas:

```yaml
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=comida_justa
```

# Arquitectura

## PostgreSQL en Docker

```yaml
postgres:
  image: postgres:16-alpine
  container_name: devPostgres
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: comida_justa
  ports:
    - "5432:5432"
```

## Aplicación

```yaml
dev_comida_justa:
  environment: DATABASE_URL=postgresql://postgres:postgres@postgres:5432/comida_justa
```

### Nota importante

Dentro de Docker:

```text
postgres
```

es el hostname correcto.

Fuera de Docker (VS Code, DBeaver, pgAdmin, psql local):

```text
localhost
```

o

```text
127.0.0.1
```

deben utilizarse como host.

# Paso 1 - Verificar que PostgreSQL esté funcionando

Verificar que el contenedor esté levantado:

```bash
docker ps
```

Resultado esperado:

```text
devPostgres   postgres:16-alpine   Up (healthy)
```

Verificar logs:

```bash
docker logs devPostgres
```

Resultado esperado:

```text
database system is ready to accept connections
```

# Paso 2 - Verificar acceso dentro del contenedor

Entrar al contenedor:

```bash
docker exec -it devPostgres psql -U postgres
```

Si aparece:

```text
postgres=#
```

entonces PostgreSQL está funcionando correctamente.

Verificar usuario actual:

```sql
SELECT current_user;
```

Resultado esperado:

```text
 current_user
--
 postgres
```

# Paso 3 - Restablecer contraseña del usuario postgres

Dentro de psql:

```sql
ALTER USER postgres WITH PASSWORD 'postgres';
```

Resultado esperado:

```text
ALTER ROLE
```

# Paso 4 - Verificar exposición del puerto Docker

Ejecutar:

```bash
docker ps
```

Resultado esperado:

```text
0.0.0.0:5432->5432/tcp
```

Esto confirma que Docker está exponiendo correctamente PostgreSQL al host.

# Paso 5 - Detectar conflictos de puerto

En Windows:

```powershell
netstat -ano | findstr :5432
```

Resultado encontrado:

```text
TCP    0.0.0.0:5432    LISTENING    7024
TCP    0.0.0.0:5432    LISTENING    8044
```

Esto indica múltiples procesos escuchando en el puerto 5432.

# Paso 6 - Identificar los procesos

Ejecutar:

```powershell
tasklist /FI "PID eq 7024"
tasklist /FI "PID eq 8044"
```

Resultado:

```text
postgres.exe
com.docker.backend.exe
```

# Causa raíz

Había dos servidores PostgreSQL:

## PostgreSQL local de Windows

```text
postgres.exe
```

Instalado como servicio de Windows.

## PostgreSQL Docker

```text
devPostgres
```

Expuesto mediante Docker.

Cuando VS Code intentaba conectarse a:

```text
localhost:5432
```

podía terminar conectándose al PostgreSQL local de Windows en lugar del contenedor Docker.

Por eso aparecía:

```text
password authentication failed for user "postgres"
```

aunque la contraseña del contenedor fuera correcta.

# Solución recomendada

## Opción 1 (Recomendada)

Cambiar el puerto del contenedor Docker.

Modificar:

```yaml
ports:
  - "5432:5432"
```

por:

```yaml
ports:
  - "5433:5432"
```

Recrear contenedores:

```bash
docker compose down
docker compose up -d
```

Conectarse usando:

```text
Host: 127.0.0.1
Port: 5433
Database: comida_justa
User: postgres
Password: postgres
```

o

```text
postgresql://postgres:postgres@127.0.0.1:5433/comida_justa
```

## Opción 2

Detener el servicio PostgreSQL de Windows.

Abrir PowerShell como Administrador:

```powershell
Get-Service *postgres*
```

Detener:

```powershell
Stop-Service postgresql-x64-13
```

o

```powershell
net stop postgresql-x64-13
```

Esto libera el puerto 5432 para Docker.

# Configuraciones correctas

## Desde Docker hacia PostgreSQL

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/comida_justa
```

## Desde herramientas locales

### Puerto 5432

```text
postgresql://postgres:postgres@localhost:5432/comida_justa
```

### Puerto 5433

```text
postgresql://postgres:postgres@localhost:5433/comida_justa
```

# Checklist para nuevos desarrolladores

Antes de reportar problemas de conexión:

## Verificar contenedor

```bash
docker ps
```

## Verificar logs

```bash
docker logs devPostgres
```

## Verificar acceso interno

```bash
docker exec -it devPostgres psql -U postgres
```

## Verificar puertos

```powershell
netstat -ano | findstr :5432
```

## Identificar procesos

```powershell
tasklist /FI "PID eq <PID>"
```

## Verificar URL de conexión

Dentro de Docker:

```text
postgresql://postgres:postgres@postgres:5432/comida_justa
```

Fuera de Docker:

```text
postgresql://postgres:postgres@localhost:5432/comida_justa
```

o

```text
postgresql://postgres:postgres@localhost:5433/comida_justa
```

# IMPORTANTE

1. Poder conectarse desde dentro del contenedor no garantiza que las conexiones externas funcionen.
2. `password authentication failed` no siempre significa que la contraseña sea incorrecta.
3. Verificar siempre si existe un PostgreSQL instalado localmente.
4. Docker y PostgreSQL local pueden competir por el mismo puerto.
5. Usar puertos distintos para desarrollo reduce conflictos y facilita el diagnóstico.
6. El hostname `postgres` funciona únicamente dentro de la red Docker.
7. Las herramientas locales deben usar `localhost` o `127.0.0.1`.
