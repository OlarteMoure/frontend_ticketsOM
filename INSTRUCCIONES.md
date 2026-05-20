# Instrucciones de Ejecución: TicketsOM (Backend y Frontend)

Este documento describe paso a paso cómo preparar y ejecutar localmente los proyectos de Backend (Spring Boot) y Frontend (Vue.js 2).

## 🛠️ Requisitos Previos Generales
Para que ambos ecosistemas funcionen correctamente, asegúrate de tener instalados:
- **Java 17 o superior** (para el backend).
- **Node.js y npm** (para el frontend).
- **PostgreSQL** ejecutándose localmente en el puerto `5432`.

---

## ⚙️ 1. Proyecto Backend (Spring Boot)
**Directorio:** `c:\xampp\htdocs\ticketsom-backend`

El backend está construido con Java y Spring Boot utilizando Maven. La configuración principal indica que levantará su servidor en el puerto **`8085`**.

### Preparar la Base de Datos
Según el archivo `application-dev.yml`, la aplicación espera conectarse a una base de datos PostgreSQL. Debes crearla o asegurarte de que exista con estas credenciales:
- **Base de Datos:** `ticketsom_db` *(crea esta base de datos vacía, Spring Boot se encargará de crear las tablas automáticamente)*
- **Puerto:** `5432` (por defecto de Postgres)
- **Usuario:** `postgres`
- **Contraseña:** `admin`

### Cómo ejecutarlo:
1. Abre una terminal (PowerShell o CMD).
2. Navega hasta la carpeta del proyecto backend:
   ```powershell
   cd c:\xampp\htdocs\ticketsom-backend
   ```
3. Ejecuta la aplicación utilizando el wrapper de Maven que viene incluido. Te sugiero forzar el perfil `dev` para asegurarte de que tome tus configuraciones locales:
   ```powershell
   .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
   ```

Sabrás que está listo cuando veas un mensaje similar a *"Started [ApplicationName] in X seconds"* en la consola. La API estará disponible en `http://localhost:8085`.

---

## 🎨 2. Proyecto Frontend (Vue.js 2)
**Directorio:** `c:\xampp\htdocs\ticketsOM`

El frontend es una aplicación clásica desarrollada con Vue.js 2 y Vue CLI. El proyecto ya cuenta con un archivo `.env.development` configurado correctamente para apuntar hacia la API local (`VUE_APP_API_URL=http://localhost:8085/api`).

### Cómo ejecutarlo:
1. Abre **una nueva ventana** de terminal (para no cerrar o interrumpir el backend).
2. Navega hasta la carpeta del proyecto frontend:
   ```powershell
   cd c:\xampp\htdocs\ticketsOM
   ```
3. Si es la primera vez que vas a correr el proyecto en esta computadora (o si borraste la carpeta `node_modules`), instala todas las dependencias del `package.json`:
   ```powershell
   npm install
   ```
4. Levanta el servidor de desarrollo local de Vue:
   ```powershell
   npm run serve
   ```

Una vez compile con éxito, la terminal te entregará una URL (normalmente es **`http://localhost:8080`**). Ábrela en tu navegador y verás la interfaz conectándose a los datos de tu backend local.

> **Tip Recomendado:** Siempre levanta primero el **Backend** y espera a que termine de inicializarse junto con la base de datos. Una vez que esté corriendo, procede a levantar el **Frontend**. Esto evitará que la interfaz te arroje errores de red iniciales por no encontrar la API.
