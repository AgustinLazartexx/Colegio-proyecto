# Backend del sistema escolar

API REST construida con Node.js y Express. Los datos relacionales se gestionan con Sequelize. El entorno local usa MariaDB por defecto; la demo pública configura PostgreSQL.

## Requisitos

- Node.js y npm.
- MariaDB para desarrollo local, salvo que se configure explícitamente otro entorno compatible.

## Configuración local

1. Instala dependencias:

   ```powershell
   npm install
   ```

2. Crea un archivo `.env` en esta carpeta. Como mínimo, configura:

   ```dotenv
   DB_DIALECT=mariadb
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=colegio
   DB_USER=root
   DB_PASSWORD=
   JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_LARGO_Y_ALEATORIO
   FRONTEND_URL=http://localhost:5173
   ```

   Usa las credenciales correspondientes a tu instalación de MariaDB. No compartas ni subas `.env` al repositorio.

3. Crea la base y las tablas académicas:

   ```powershell
   npm run db:create:local
   npm run migrate:academics
   ```

   Las migraciones son repetibles y no importan datos desde los archivos heredados de MongoDB.
   Las inscripciones de alumnos a clases conservan su historial y pueden suspenderse o reactivarse; las inscripciones existentes se mantienen activas al migrar.

   La migración académica también crea el esquema de ciclos. Antes de iniciar la API, revisa el backfill del ciclo inicial:

   ```powershell
   npm.cmd run migrate:initial-cycle -- --anio=2026 --estado=ACTIVO
   ```

   El comando muestra un resumen sin escribir datos. Si el año y el estado son correctos, aplícalo explícitamente:

   ```powershell
   npm.cmd run migrate:initial-cycle -- --anio=2026 --estado=ACTIVO --aplicar
   ```

   El ciclo abarca del 2 de marzo del año indicado al 2 de marzo del año siguiente. El backfill asigna todos los registros SQL existentes a ese único ciclo; respalda la base y confirma ese supuesto antes de usar `--aplicar`. Los estados aceptados son `PLANIFICADO`, `ACTIVO`, `RECUPERACION` y `CERRADO`.

4. Opcionalmente, carga datos ficticios para desarrollo:

   ```powershell
   npm run seed:local
   npm run seed:academics
   ```

   El seeder local evita duplicar cuentas ya existentes. Las credenciales de las cuentas generadas son solo para el entorno local; no reutilizarlas en producción.

   Para cargar el plan de estudios después de las migraciones, ejecuta:

   ```powershell
   npm run seed:curriculum
   ```

   El seed crea cada materia para las divisiones A, B y C y las deja activas. No crea horarios en `clases`, ya que el plan no especifica días ni horas.

   Para crear una sesión semanal de 45 minutos por materia y división, con asignación rotativa de docentes activos:

   ```powershell
   npm run seed:class-schedule
   ```

   El horario usa seis bloques consecutivos por día de lunes a viernes, entre las 08:00 y las 12:30. El seed conserva los IDs y las inscripciones de alumnos de las clases del plan, las reprograma y reemplaza sus asignaciones docentes. Las clases de materias fuera del plan se preservan y reservan su horario para evitar superposiciones. Las aulas de clases nuevas quedan sin asignar.

5. Inicia la API:

   ```powershell
   npm run dev
   ```

La API escucha en el puerto indicado por `PORT` o, por defecto, en `5000`. La ruta raíz `/` informa si responde y qué base de datos está activa.

### Crear una cuenta administradora inicial

Si la cuenta administradora anterior no está en la base SQL activa, crea una nueva desde una terminal local en esta carpeta. No reutilices contraseñas que se hayan compartido por chat.

```powershell
$env:BOOTSTRAP_ADMIN_ENABLED = "true"
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host "Email"
$env:BOOTSTRAP_ADMIN_NAME = Read-Host "Nombre"
$env:BOOTSTRAP_ADMIN_DNI = Read-Host "DNI"
$securePassword = Read-Host "Nueva contraseña (mínimo 12 caracteres)" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $env:BOOTSTRAP_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  npm run bootstrap:admin
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  $securePassword.Dispose()
  Remove-Item Env:BOOTSTRAP_ADMIN_ENABLED, Env:BOOTSTRAP_ADMIN_EMAIL, Env:BOOTSTRAP_ADMIN_NAME, Env:BOOTSTRAP_ADMIN_DNI, Env:BOOTSTRAP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
}
```

El comando está deshabilitado en `NODE_ENV=production`, solo crea un usuario si el email y el DNI todavía no existen y no modifica cuentas existentes. La contraseña se guarda con bcrypt y no se muestra en la salida. No guardes estas variables en archivos versionados.

## Rutas y archivos

Las rutas de la API se montan bajo `/api`: `/auth`, `/usuarios`, `/materias`, `/clases`, `/tareas`, `/entregas`, `/calificaciones`, `/notas`, `/asistencias`, `/anuncios`, `/cuotas` y `/admin`. Los adjuntos cargados se sirven desde `/uploads`.

Las migraciones están en `src/database/migrations/`. Ejecuta las migraciones antes de iniciar el servidor en una base nueva. Los archivos subidos se guardan en `uploads`; los metadatos y relaciones de los módulos escolares se almacenan en la base SQL.

La pantalla de búsqueda administrativa de usuarios requiere un texto de búsqueda o filtros de año/división. La API no devuelve usuarios sin recibir al menos un filtro; otros módulos pueden solicitar un rol específico para completar selectores. Materias y clases se suspenden/reactivan mediante sus rutas de estado; no se permite eliminarlas.

## Pruebas

```powershell
npm test
npm run test:postgres-compat
```

## PostgreSQL para la demo

La demo requiere `DB_DIALECT=postgres` y `DATABASE_URL`, además de las variables de seed indicadas en la configuración de Render. El seed de demo se niega a ejecutarse si el dialecto no es PostgreSQL, si no está activado `DEMO_SEED_ENABLED=true` o si faltan sus credenciales. Usa exclusivamente una base separada con datos ficticios.

Consulta la [guía general del proyecto](../docs/DOCUMENTACION.md) y [DEMO-DEPLOYMENT.md](../DEMO-DEPLOYMENT.md) antes de desplegar.
