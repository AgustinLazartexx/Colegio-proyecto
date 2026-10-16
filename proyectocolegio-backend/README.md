<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# Backend del Colegio

## Entorno local desde cero

1. Configura `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `JWT_SECRET` en `.env`.
2. Crea la base de datos local si aún no existe y prepara el esquema:

   ```powershell
   npm run db:create:local
   npm run migrate:academics
   ```

   La migración es repetible y conserva las tablas/datos que ya existen. No importa datos de MongoDB.
3. Carga cuentas nuevas de prueba en MariaDB:

   ```powershell
   npm run seed:local
   ```

   El seeder es repetible: omite los emails o DNI que ya existan y no modifica cuentas.
4. Crea materias, horarios y asignaciones de prueba:

   ```powershell
   npm run seed:academics
   ```

5. Inicia la API:

   ```powershell
   npm run dev
   ```

## Cuentas de prueba locales

La contraseña inicial de cada cuenta de prueba es su DNI:

| Rol | Email | Contraseña |
|---|---|---|
| Alumno | `alumno1@colegio.test` | `40000001` |
| Alumno | `alumno2@colegio.test` | `40000002` |
| Profesor | `profesor1@colegio.test` | `50000001` |
| Profesor | `profesor2@colegio.test` | `50000002` |

Estas cuentas son exclusivamente para desarrollo local. No uses estos datos en producción.

## Módulos conectados a MariaDB

El backend usa MariaDB para usuarios/autenticación, materias, horarios, asignaciones, calificaciones, notas trimestrales y su auditoría, asistencias, tareas, entregas, anuncios y cuotas. Las tablas de los módulos académicos y escolares se crean con `npm run migrate:academics`; ejecuta las migraciones antes de iniciar la API. El servidor no modifica el esquema automáticamente.

`seed:academics` crea materias, clases y asignaciones de prueba. Las cuentas y los datos locales se crean desde cero; no se importan ni consultan datos de MongoDB. Los archivos subidos se conservan en `uploads`, mientras que sus metadatos y relaciones se guardan en MariaDB.
>>>>>>> 073fbf6 (demoback1.0)
