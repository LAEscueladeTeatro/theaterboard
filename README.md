# TheaterBoard - Aplicación de Gestión Teatral

TheaterBoard es una aplicación web completa diseñada para la gestión de actividades y puntuaciones en una escuela de teatro. Consta de un backend Node.js/Express con PostgreSQL y un frontend React (Vite).

## Estructura del Proyecto

El repositorio está organizado en dos carpetas principales:

-   `frontend/`: Contiene la aplicación React construida con Vite.
-   `backend/`: Contiene la API del servidor Node.js con Express y la base de datos PostgreSQL.

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

-   [Node.js](https://nodejs.org/) (versión LTS recomendada, ej. 18.x o superior)
-   [npm](https://www.npmjs.com/) (generalmente viene con Node.js) o [yarn](https://yarnpkg.com/)
-   [PostgreSQL](https://www.postgresql.org/download/) (Base de datos)

## Configuración Local

Sigue estos pasos para configurar y ejecutar la aplicación en tu entorno local.

### 1. Backend

   a. **Navega a la carpeta del backend:**
      ```bash
      cd backend
      ```

   b. **Instala las dependencias:**
      ```bash
      npm install
      # o si usas yarn:
      # yarn install
      ```

   c. **Configura las Variables de Entorno:**
      Crea un archivo `.env` en la raíz de la carpeta `backend/` copiando el contenido de `backend/.env.example` (si existe) o creando uno nuevo con las siguientes variables:
      ```env
      DB_USER=tu_usuario_postgres
      DB_PASSWORD=tu_contraseña_postgres
      DB_HOST=localhost
      DB_PORT=5432
      DB_NAME=theaterboard_db # O el nombre que prefieras para tu base de datos local
      JWT_SECRET=tu_secreto_jwt_muy_seguro_y_largo
      # PORT=3001 # Opcional, por defecto es 3001 si no se especifica
      ```
      Reemplaza los valores con tus credenciales de PostgreSQL y un secreto JWT fuerte.

   d. **Configura la Base de Datos PostgreSQL:**
      - Asegúrate de que tu servidor PostgreSQL esté en ejecución.
      - Crea una nueva base de datos con el nombre que especificaste en `DB_NAME` (ej. `theaterboard_db`).
      - Ejecuta el script de inicialización para crear las tablas y datos de ejemplo. Puedes usar una herramienta como `psql` o un cliente gráfico de BD (pgAdmin, DBeaver, etc.):
        ```bash
        # Ejemplo con psql (asegúrate de estar conectado a tu instancia de PostgreSQL)
        # \c theaterboard_db
        # \i ruta/completa/a/backend/init.sql
        ```
        O, si tu cliente de BD lo permite, simplemente abre y ejecuta el contenido de `backend/init.sql` en la base de datos que creaste.

   e. **Inicia el servidor backend (modo desarrollo):**
      ```bash
      npm run dev
      ```
      El servidor backend debería estar corriendo en `http://localhost:3001` (o el puerto que hayas configurado).

### 2. Frontend

   a. **Navega a la carpeta del frontend (desde la raíz del proyecto):**
      ```bash
      cd frontend
      # Si ya estabas en backend/, usa: cd ../frontend
      ```

   b. **Instala las dependencias:**
      ```bash
      npm install
      # o si usas yarn:
      # yarn install
      ```

   c. **Configura las Variables de Entorno (Opcional para desarrollo local):**
      El frontend está configurado para usar `http://localhost:3001/api` como URL base de la API por defecto si `VITE_API_BASE_URL` no está definida.
      Si necesitas apuntar a una URL de API diferente para desarrollo local, crea un archivo `.env.development.local` en la raíz de `frontend/` con el siguiente contenido:
      ```env
      VITE_API_BASE_URL=http://localhost:tu_puerto_backend/api
      ```

   d. **Inicia el servidor de desarrollo del frontend:**
      ```bash
      npm run dev
      ```
      La aplicación frontend debería estar accesible en `http://localhost:5173` (o el puerto que Vite asigne, revisa la salida de la consola).

## Variables de Entorno Requeridas para Producción

Cuando despliegues la aplicación, necesitarás configurar las siguientes variables de entorno en tu plataforma de hosting:

### Backend:

-   `PORT`: El puerto en el que escuchará tu aplicación Node.js (generalmente asignado por la plataforma).
-   `DB_USER`: Usuario de la base de datos de producción.
-   `DB_PASSWORD`: Contraseña de la base de datos de producción.
-   `DB_HOST`: Host de la base de datos de producción.
-   `DB_PORT`: Puerto de la base de datos de producción.
-   `DB_NAME`: Nombre de la base de datos de producción.
-   `JWT_SECRET`: Un secreto JWT fuerte y único para producción.
-   `NODE_ENV`: `production` (muchas plataformas lo configuran automáticamente).

### Frontend:

-   `VITE_API_BASE_URL`: La URL pública completa de tu backend desplegado (ej. `https://tu-backend.onrender.com/api`).

## Instrucciones de Build para Producción

### Backend:

No hay un paso de "build" explícito para esta aplicación Node.js. El proceso de despliegue típicamente involucra instalar las dependencias de producción:
```bash
npm install --omit=dev
# o si usas yarn:
# yarn install --production
```
(Muchas plataformas PaaS como Render manejan esto automáticamente con `npm install` o `yarn install`).

### Frontend:

1.  Navega a la carpeta del frontend:
    ```bash
    cd frontend
    ```
2.  Instala dependencias (si no lo has hecho o es un entorno limpio):
    ```bash
    npm install
    ```
3.  Ejecuta el script de build:
    ```bash
    npm run build
    ```
    Esto generará una carpeta `dist/` en `frontend/` con los archivos estáticos optimizados listos para ser desplegados.

## Despliegue en Render (Ejemplo)

Esta es una guía general para desplegar en [Render](https://render.com/). Pasos similares aplicarían a otras Plataformas como Servicio (PaaS).

### 1. Base de Datos PostgreSQL en Render

   a. Desde tu dashboard de Render, crea un nuevo servicio "PostgreSQL".
   b. Elige un nombre, región, plan, etc.
   c. Una vez creada, Render te proporcionará los detalles de conexión (Host, Nombre de la Base de Datos, Usuario, Contraseña, Puerto). **Guarda estos datos de forma segura.**
   d. Conéctate a esta base de datos de producción usando tu cliente de BD preferido y ejecuta el script `backend/init.sql` para crear la estructura de tablas.

### 2. Backend (Servicio Web Node.js en Render)

   a. Desde tu dashboard de Render, crea un nuevo "Web Service".
   b. Conecta tu repositorio de GitHub/GitLab.
   c. **Configuración del Servicio:**
      -   **Nombre:** Elige un nombre para tu servicio backend (ej. `theaterboard-backend`).
      -   **Región:** Elige una región cercana a tus usuarios.
      -   **Rama:** La rama que quieres desplegar (ej. `main` o `master`).
      -   **Root Directory:** (Opcional) Si tu backend no está en la raíz del repo, especifica la ruta (ej. `backend`). Si está en la raíz y el frontend en una subcarpeta, puedes dejarlo vacío o especificar `.`.
      -   **Runtime:** Node.js (Render debería detectarlo).
      -   **Build Command:** `npm install` (o `yarn install` si usas Yarn). Asegúrate de que `backend/package.json` tenga un script `start`.
      -   **Start Command:** `node backend/server.js` (o `npm start` si tu `package.json` en `backend/` tiene ` "start": "node server.js" `). Si el `package.json` principal maneja el inicio del backend, ajusta el comando.
   d. **Variables de Entorno (Advanced):**
      Añade todas las variables de entorno requeridas para el backend listadas anteriormente, usando los detalles de tu base de datos PostgreSQL de Render y un `JWT_SECRET` seguro.
      -   `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT` (usa los de la BD de Render).
      -   `JWT_SECRET` (genera uno nuevo y seguro para producción).
      -   `PORT` (Render suele inyectar esto, pero puedes definirlo si es necesario).
      -   `NODE_ENV=production`
   e. Crea el servicio web. Render construirá y desplegará tu backend. Anota la URL pública que Render le asigne (ej. `https://theaterboard-backend.onrender.com`).

### 3. Frontend (Sitio Estático en Render)

   a. Desde tu dashboard de Render, crea un nuevo "Static Site".
   b. Conecta el mismo repositorio de GitHub/GitLab.
   c. **Configuración del Sitio Estático:**
      -   **Nombre:** Elige un nombre (ej. `theaterboard-frontend`).
      -   **Rama:** La misma rama que el backend.
      -   **Root Directory:** `frontend` (importante para que Render encuentre el `package.json` del frontend).
      -   **Build Command:** `npm install && npm run build` (o `yarn install && yarn build`).
      -   **Publish Directory:** `frontend/dist` (la carpeta donde Vite coloca los archivos de build).
   d. **Variables de Entorno (Advanced):**
      Añade la variable de entorno para el frontend:
      -   `VITE_API_BASE_URL`: La URL pública completa de tu servicio backend desplegado en Render (ej. `https://theaterboard-backend.onrender.com/api`).
   e. Crea el sitio estático. Render construirá y desplegará tu frontend.

### 4. Configuración CORS (Backend)

   Una vez que tengas la URL de tu frontend desplegado (ej. `https://theaterboard-frontend.onrender.com`), es **altamente recomendable** actualizar la configuración de CORS en tu backend (`backend/server.js`) para permitir solicitudes solo desde ese origen específico, en lugar de `app.use(cors());` que permite todos los orígenes.

   Ejemplo de configuración CORS más restrictiva:
   ```javascript
   // backend/server.js
   const corsOptions = {
     origin: 'https://tu-frontend-url.onrender.com', // Reemplaza con tu URL de frontend
     optionsSuccessStatus: 200
   };
   app.use(cors(corsOptions));
   ```
   Necesitarás volver a desplegar el backend después de este cambio.

## Scripts Útiles

### Backend (`backend/package.json`):

-   `npm run dev`: Inicia el servidor backend en modo desarrollo con Nodemon.
-   `npm start`: Inicia el servidor backend (para producción).

### Frontend (`frontend/package.json`):

-   `npm run dev`: Inicia el servidor de desarrollo de Vite para el frontend.
-   `npm run build`: Compila el frontend para producción.
-   `npm run preview`: Previsualiza la build de producción localmente.
-   `npm run lint`: Ejecuta ESLint para revisar el código.

---

Este README debería proporcionar una buena base para configurar, ejecutar y desplegar la aplicación TheaterBoard. ¡Asegúrate de reemplazar los placeholders con tus URLs y credenciales reales!
