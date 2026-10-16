# Demo pública del sistema escolar

La demo usa únicamente PostgreSQL y datos ficticios. No conectes servicios ni credenciales de la escuela a este despliegue.

## Requisitos antes de publicar

1. Crea un proyecto PostgreSQL independiente en Neon y copia su connection string, usando la URL con SSL que ofrece Neon.
2. En Render, conecta este repositorio y crea los servicios con el Blueprint de `render.yaml`.
3. En el asistente inicial de Render, completa `DATABASE_URL`, `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_USER_PASSWORD`, `FRONTEND_URL` y `VITE_API_URL`. `FRONTEND_URL` debe ser la URL pública del sitio estático y `VITE_API_URL` la URL pública del servicio API. Usa las URLs completas `https://...onrender.com`, sin añadir `/api` a `VITE_API_URL`.
4. Guarda las credenciales de demo para compartirlas con los potenciales clientes. No las agregues al repositorio.

En servicios ya creados, configura manualmente `FRONTEND_URL` en `colegio-demo-api` y `VITE_API_URL` en `colegio-demo-web` desde **Environment**. Los valores `sync: false` no se actualizan en servicios existentes al sincronizar el Blueprint.

El backend crea el esquema, carga el conjunto ficticio inicial y luego inicia la API. El seed no modifica los registros existentes al volver a ejecutarse, por lo que las ediciones hechas desde la cuenta demo se conservan. El email del administrador es configurable; el email para docente es `docente@colegio.test` y los de estudiantes son `alumna@colegio.test` y `alumno@colegio.test`. Los tres usan `DEMO_USER_PASSWORD`.

## Limitaciones del plan gratuito

- Render puede suspender el servicio web inactivo; la primera petición después de la suspensión puede tardar.
- Los archivos cargados se guardan en el disco efímero del servicio y no deben considerarse persistentes.
- Configura SMTP por separado si quieres que funcione la recuperación de contraseñas por correo.
- Protege la cuenta demo: sus datos son ficticios, pero cualquier visitante con esas credenciales puede modificar el contenido compartido.

Para desarrollo local, conserva MariaDB como valor predeterminado de `DB_DIALECT`; este despliegue selecciona PostgreSQL explícitamente con `DB_DIALECT=postgres`.
