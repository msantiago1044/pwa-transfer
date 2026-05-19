# Transferencia - Compartir sin Limites

Una PWA moderna para transferencia de archivos, imagenes y texto en tiempo real entre PC y movil **sin necesidad de registro**.

## Caracteristicas

+ **Sin Registro**: Genera un codigo de sesion unico al instante
+ **Tiempo Real**: Sync instantanea con Supabase Realtime
+ **QR Integrado**: Escanea el codigo QR o ingresa manualmente
+ **Transferencia Segura**: Las sesiones expiran automaticamente en 1 hora
+ **Archivos y Imagenes**: Soporta hasta 50MB por archivo
+ **Compresion Automatica**: Las imagenes se comprimen para ahorrar almacenamiento
+ **PWA**: Instalable como aplicacion en cualquier dispositivo
+ **Mobile-First**: Diseno minimalista y responsivo
+ **Offline**: Funciona basicamente en modo offline

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Storage**: Supabase Storage
- **Componentes**: Lucide React Icons
- **QR**: qrcode.react + html5-qrcode

## Configuracion Local

### Requisitos Previos

- Node.js 18+
- Cuenta en Supabase (gratuita en https://supabase.com)

### Pasos de Instalacion

1. **Clonar o descargar el proyecto**
```bash\ncd pwa_transfer/nextjs_space\n```\n\n2. **Instalar dependencias**\n```bash\nyarn install\n```\n\n3. **Configurar Supabase**\n   - Copia el archivo `.env.example` a `.env.local`\n   - Rellena tus credenciales de Supabase\n   - Ejecuta los scripts SQL de `docs/setup-supabase.md`\n\n4. **Ejecutar en desarrollo**\n```bash\nyarn dev\n```\n\nLa aplicacion estara disponible en `http://localhost:3000`\n\n## Variables de Entorno\n\nCrea un archivo `.env.local`:\n\n```env\nNEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n```\n\n## Flujo de Uso\n\n### En la PC\n\n1. Abre la aplicacion\n2. Selecciona \"Crear Sesion (PC)\"\n3. Se generara un codigo de 8 caracteres unico\n4. Se mostrara un codigo QR\n5. Puedes copiar el codigo o compartir el QR\n\n### En el Movil\n\n1. Abre la aplicacion\n2. Selecciona \"Conectar a Sesion (Movil)\"\n3. Opcion 1: Escanea el codigo QR de la PC\n4. Opcion 2: Ingresa manualmente el codigo de 8 caracteres\n5. Listo! Ya estan conectados\n\n### Transferencia\n\n- **Texto**: Escribe en el input y presiona Enter\n- **Imagenes**: Haz click en el boton adjuntar\n- **Archivos**: Haz click en el boton adjuntar (max 50MB)\n- Todo aparece **instantaneamente** en el otro dispositivo\n\n## Despliegue Gratuito en Vercel\n\n1. Ve a https://vercel.com\n2. Importa tu repositorio de GitHub\n3. Configura las variables de entorno\n4. Haz click en \"Deploy\"\n\n## Limites de Supabase Free Tier\n\n- Almacenamiento: 1 GB total\n- Tamanio maximo por archivo: 50 MB\n- Conexiones Realtime: 200 concurrentes\n\n## Documentacion Completa\n\nVer `docs/setup-supabase.md` para instrucciones de configuracion en Supabase.\n\n---\n\nDisfrutalo! Transferencias sin limites :)\nEOF\n
