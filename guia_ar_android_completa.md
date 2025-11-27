# Guía Completa y Extensa para el Desarrollo de una Aplicación de Realidad Aumentada (AR) para Android

Esta guía ofrece **contexto completo**, una **estructura profesional de archivos**, y una **ruta detallada de desarrollo** para crear una aplicación de **Realidad Aumentada (AR)** en **Android**, utilizando **AR.js + A-Frame** dentro de una aplicación híbrida con **Ionic/Angular**, con acceso a **cámara nativa**, **renderizado de modelos**, manejo de **targets dinámicos**, y opcionalmente integración con **Firebase y Supabase**.

---

# 1. CONTEXTO GENERAL DEL PROYECTO

> **Nota Importante:** Este proyecto utiliza **Angular con NgModule**, no Standalone Components. Toda la arquitectura, componentes, servicios y providers deben registrarse en *app.module.ts* u otros módulos personalizados según la estructura del proyecto.

> **Responsabilidades de Autenticación y Datos (clave):**
> - **Autenticación de Usuarios:** se realiza **exclusivamente en Firebase Auth**.
> - **Perfil y metadatos del usuario:** se guardan en **Firebase Realtime Database** bajo `users/<uid>`.
> - **Targets y assets:** se guardan y administran en **Supabase** (Base de datos y Storage). **Cada usuario debe tener sus propios targets**.
> - Si no se usa autenticación de Supabase, el cliente asocia y filtra los targets por el `uid` de Firebase. Para políticas estrictas en Supabase, usar RLS con Supabase Auth o mover operaciones a Edge Functions/servidor con clave `service_role`.

## 1.1 Objetivo Principal
Crear una aplicación móvil para Android capaz de:
- **Detectar y rastrear imágenes o marcadores (targets)** usando AR.js.
- **Renderizar modelos 3D o imágenes superpuestas** sobre esos targets.
- **Usar la cámara del dispositivo Android** directamente desde WebView.
- **Soportar múltiples targets dinámicos** desde un único componente AR.
- **Autenticar usuarios con Firebase** y **persistir su perfil en Realtime Database**.
- **Guardar targets por usuario en Supabase tabla targets** y **almacenar assets** (patterns, modelos) en Supabase Storage.

La aplicación se desarrolla con **Ionic + Angular**, pero el motor de AR será **Web-AR** a través de AR.js y A‑Frame, ejecutado dentro de un `WebView` o `iframe`.

---

# 2. REQUERIMIENTOS PRINCIPALES

1. Debe existir **solo un componente de AR** dentro de toda la aplicación.
2. Ese componente debe ser capaz de **cargar targets, modelos y configuración de forma dinámica**.
3. La cámara debe estar habilitada en Android, por lo que se deben modificar:
   - `AndroidManifest.xml`
   - configuración de permisos en Ionic
   - parámetros del WebView
4. La aplicación se debe estructurar de forma modular usando:
   - **Componentes**
   - **Servicios**
   - **Providers**
   - **Models**

---

# 3. ESTRUCTURA COMPLETA DE ARCHIVOS PARA EL PROYECTO

A continuación se propone una estructura limpia, profesional y escalable:

```
project-root/
│
├── android/                      # Proyecto Android nativo generado por Capacitor
│   ├── app/src/main/AndroidManifest.xml
│   └── ...
│
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── ar-view/
│   │   │       ├── ar-view.component.ts
│   │   │       ├── ar-view.component.html
│   │   │       ├── ar-view.component.scss
│   │   │       └── ar-view.config.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   │   ├── home.page.ts
│   │   │   │   ├── home.page.html
│   │   │   │   └── home.page.scss
│   │   │   ├── login/   (opcional)
│   │   │   └── register (opcional)
│   │   │
│   │   ├── services/
│   │   │   ├── targets.service.ts     # Carga targets desde Supabase/JSON
│   │   │   ├── assets.service.ts      # Acceso a modelos/imágenes
│   │   │   └── auth.service.ts        # Firebase (opcional)
│   │   │
│   │   ├── providers/
│   │   │   └── app.provider.ts
│   │   │
│   │   ├── models/
│   │   │   ├── target.model.ts
│   │   │   ├── asset.model.ts
│   │   │   └── user.model.ts
│   │   │
│   │   └── app.module.ts
│   │
│   ├── assets/
│   │   ├── targets/        # .patt o .mind
│   │   ├── models/         # .glb, .gltf, obj
│   │   └── images/
│   │
│   ├── theme/
│   ├── global.scss
│   └── index.html
│
└── capacitor.config.json
```

---

# 4. CONFIGURACIÓN DE ANDROID (CÁMARA Y WEBVIEW)

## 4.1 Permisos en AndroidManifest.xml
Ubicado en: `android/app/src/main/AndroidManifest.xml`

Agregar:

```
<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 4.2 Habilitar cámara en WebView
En `android/app/src/main/java/.../MainActivity.java`:

```
import android.webkit.WebChromeClient;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    WebView webView = (WebView) this.bridge.getWebView();
    webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
    webView.getSettings().setJavaScriptEnabled(true);
    webView.getSettings().setDomStorageEnabled(true);
    webView.setWebChromeClient(new WebChromeClient() {
      @Override
      public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(() -> request.grant(request.getResources()));
      }
    });
  }
}
```

Esto es esencial para AR.js.

---

# 5. COMPONENTE DE REALIDAD AUMENTADA (ÚNICO)

Este componente es el corazón del proyecto.

## 5.1 Estructura básica del HTML

```
<a-scene
  embedded
  vr-mode-ui="enabled: false"
  arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best;">

  <a-marker id="dynamic-marker"></a-marker>

  <a-entity id="model-container"></a-entity>

  <a-entity camera></a-entity>
</a-scene>
```

## 5.2 Carga dinámica de targets y modelos
En `ar-view.component.ts`:

```
ngOnInit() {
  this.targetsService.getActiveTarget().subscribe(target => {
    const marker = document.querySelector('#dynamic-marker');
    marker.setAttribute('type', target.type);
    marker.setAttribute('url', target.pattern);

    const model = document.querySelector('#model-container');
    model.setAttribute('gltf-model', target.modelUrl);
    model.setAttribute('scale', target.scale);
  });
}
```

---

# 6. SERVICIOS DEL PROYECTO

## 6.1 Servicio de Targets (Supabase por Usuario o JSON)
Este servicio permite que la aplicación cambie automáticamente el target sin modificar el componente. **Cada usuario tiene su propia colección de targets**:

- **Identidad del usuario:** se obtiene desde Firebase Auth (`uid`).
- **Persistencia de usuario:** se guarda/actualiza el perfil en `Firebase Realtime Database` (`users/<uid>`).
- **Targets por usuario:** se guardan en **Supabase** en la tabla `targets`, incluyendo el campo `user_id` con el `uid` de Firebase.
- **Carga de assets:** patterns `.patt/.mind` y modelos `.glb/.gltf` se suben a **Supabase Storage**. Ruta sugerida `users/<uid>/<folder>/<timestamp>-archivo`.

### 6.1.1 Esquema sugerido de la tabla `targets` (Supabase)
- `id` (serial/uuid)
- `user_id` (text) — `uid` de Firebase del dueño del target
- `name` (text)
- `type` (text) — `preset` | `pattern`
- `pattern` (text) — nombre de preset o URL del pattern
- `modelUrl` (text)
- `scale` (text)
- `created_at` (timestamp)

### 6.1.2 Políticas y seguridad (según arquitectura)
- Si no se usa **Supabase Auth**, el cliente **filtra por `user_id`** usando el `uid` de Firebase.
- Para **enforzar** propiedad en Supabase:
  - Usar **RLS** con Supabase Auth y política `user_id = auth.uid()`.
  - O mover inserciones/updates a **Edge Functions** con `service_role`, validando `uid` de Firebase en el backend.
- **Storage:** si no hay Supabase Auth, usar buckets con permisos que permitan `upload`/`read` desde el cliente; si requieres control estricto, usar funciones backend.

Ejemplo de estructura:

```
{
  "id": 1,
  "user_id": "<firebase-uid>",
  "type": "pattern",
  "name": "Logo AR",
  "pattern": "https://.../logo.patt",
  "modelUrl": "https://.../model.glb",
  "scale": "0.5 0.5 0.5"
}
```

---

# 7. LOGIN Y REGISTRO CON FIREBASE

### Características incluidas:
- **Login/registro con email** usando Firebase Auth.
- **Guard de Angular** para proteger páginas si se desea.
- **Persistencia del perfil de usuario** en Firebase Realtime Database (`users/<uid>`).
- **Targets y assets** del usuario se manejan en **Supabase**; al guardar un target, incluir `user_id = uid` de Firebase.

### Flujo recomendado
- El usuario se registra/inicia sesión en Firebase.
- Se guarda/actualiza su perfil en Realtime Database.
- En Home, al guardar/cargar targets, el servicio **filtra por `user_id`** (uid de Firebase) y hace `upsert/select` en Supabase.
- Al subir archivos, se usa Supabase Storage en rutas por usuario.

---

# 8. PROCESO COMPLETO DE DESARROLLO

## Paso 1: Crear proyecto Ionic
```
ionic start ar-project blank --type=angular
```

## Paso 2: Instalar Capacitor
```
ionic build
ionic cap add android
```

## Paso 3: Integrar AR.js
Agregar en `index.html`:

```
<script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
<script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"></script>
```

## Paso 4: Crear el componente AR
Ubicado en: `src/app/components/ar-view/`

## Paso 5: Configurar servicios, providers y carga dinámica

## Paso 6: Configurar permisos en Android

## Paso 7: Build final
```
ionic build
ionic cap copy android
ionic cap open android
```
Compilación en Android Studio.

---

# 9. RECURSOS RECOMENDADOS
- Generador de marcadores: https://jeromeetienne.github.io/AR-js/three.js/examples/marker-training/examples/generator.html
- Video tutorial de Image Tracking

---

# 10. CONCLUSIÓN
Este documento provee una **guía completa**, con **contexto técnico**, **estructura profesional**, y **procedimientos claros** para desarrollar una aplicación AR para Android usando AR.js. La arquitectura asegura que **cada usuario tenga sus propios targets**, con **autenticación/perfil** en **Firebase** y **persistencia de targets/assets** en **Supabase**.
