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

4. Opcionalmente, carga datos ficticios para desarrollo:

   ```powershell
   npm run seed:local
   npm run seed:academics
   ```

   El seeder local evita duplicar cuentas ya existentes. Las credenciales de las cuentas generadas son solo para el entorno local; no reutilizarlas en producción.

5. Inicia la API:

   ```powershell
   npm run dev
   ```

La API escucha en el puerto indicado por `PORT` o, por defecto, en `5000`. La ruta raíz `/` informa si responde y qué base de datos está activa.

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
