PROYECTO 1 - CONFIRMACIÓN

- Proyecto independiente. No contiene cámara, video, galería ni Cloudinary.
- Tiene /admin protegido por ADMIN_PASSWORD.
- Netlify Database guarda la lista y las confirmaciones.
- Los enlaces son https://TU-DOMINIO/?i=CODIGO

CONFIGURACIÓN EN NETLIFY
1. Crear un proyecto nuevo y subir esta carpeta.
2. En Data & Storage > Database, crear una base de datos.
3. Crear variables de entorno:
   ADMIN_PASSWORD = contraseña privada del panel
   ADMIN_SESSION_SECRET = cadena larga aleatoria
4. Hacer un deploy de producción para aplicar la migración.
5. Abrir https://TU-DOMINIO/admin

NOTA: copiar la carpeta assets de la invitación actual dentro de este proyecto, porque el HTML conserva las referencias a assets/portada.png y assets/osg_S_114.mp3.
