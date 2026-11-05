# Catálogo digital Nuto Automotores

Catálogo público de vehículos con panel de administración, gestión de unidades e imágenes y recuperación de contraseña por correo. Nuto Automotores ofrece ventas, permutas y consignaciones, y es representante oficial de Beta Motor Argentina. El proyecto está preparado para desplegarse en Vercel con Express Functions, Neon Postgres y Vercel Blob.

**Tecnologías:** Node.js 20+ · Express 5 · PostgreSQL · Vercel Blob · JWT en cookie `httpOnly` · bcrypt · Helmet.

## Arquitectura y persistencia

- Vercel sirve el catálogo estático y ejecuta el backend Express como Function para las rutas API y administrativas.
- Neon Postgres guarda cuentas, sesiones revocables, categorías, productos y referencias a imágenes.
- Los productos admiten un precio opcional en pesos argentinos; si se deja vacío, no se muestra en el catálogo.
- Vercel Blob guarda las imágenes públicas. La aplicación valida tipo MIME y firma del archivo antes de subirlo.

## API

**Pública**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Comprobar conexión con la base |
| GET | `/api/config` | Nombre, WhatsApp, Instagram y mapa |
| GET | `/api/categories` | Categorías con productos activos |
| GET | `/api/products?category=<slug>` | Catálogo público |
| GET | `/api/products/:slug` | Detalle de un producto |

**Autenticación**

`POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `GET /api/auth/recovery-status` · `POST /api/auth/password-recovery` · `POST /api/auth/password-reset`

**Administración** (requiere sesión; las escrituras exigen `X-Requested-With: fetch`)

| Método | Ruta | Descripción |
|---|---|---|
| GET / POST | `/api/admin/products` | Listar / crear producto |
| GET / PUT / DELETE | `/api/admin/products/:id` | Ver / actualizar / eliminar producto |
| GET / POST | `/api/admin/categories` | Listar / crear categoría |
| PUT / DELETE | `/api/admin/categories/:id` | Renombrar / eliminar categoría |
| GET / POST | `/api/admin/users` | Listar / crear cuentas (solo administrador) |
| DELETE | `/api/admin/users/:id` | Eliminar una cuenta; no permite eliminar la propia ni la última cuenta de administrador |
| PUT | `/api/admin/password` | Cambiar contraseña propia |
| POST / DELETE | `/api/admin/uploads` | Subir / limpiar imágenes temporales |
