# TaskFlow — Ionic + Angular To-Do App

> Prueba técnica Accenture — Frontend Mobile (Ionic 7 + Angular 17)

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Ionic 7 + Angular 17 (Standalone Components) |
| Mobile | Capacitor 5 (Android + iOS) |
| Storage | `@ionic/storage-angular` (IndexedDB/SQLite) |
| Cloud | Firebase 10 + Remote Config |
| Testing | Karma + Jasmine (23 unit tests) |
| Architecture | Lazy-loaded routes, ChangeDetection.OnPush, Clean Architecture |
| Style | SCSS + CSS Variables (dark/light auto) |

---

## Features

- ✅ **CRUD de tareas** — agregar, editar, marcar como completada, eliminar
- 🏷️ **CRUD de categorías** — crear con color e ícono personalizados, editar, eliminar
- 🔍 **Filtros avanzados** — por categoría, por estado (Todas / Activas / Completadas), buscador en tiempo real
- 🔥 **Firebase Remote Config** — feature flags para `stats_enabled`, `priority_enabled`, `due_date_enabled`
- 📊 **Estadísticas** — tasa de completitud, distribución por prioridad, análisis por categoría
- ⚡ **Optimización** — `trackBy` en todos los `*ngFor`, `ChangeDetectionStrategy.OnPush`, lazy loading, memory leak prevention con `takeUntil` pattern
- 🌙 **Tema** — Dark mode por defecto, respeta `prefers-color-scheme`
- 📱 **Cross-Platform** — Capacitor build para Android & iOS

---

## Prerequisites

```bash
node -v   # 18+ recomendado
npm -v    # 9+
```

### Para compilar a Android/iOS
- **Android**: Android Studio + SDK Android + JDK 17
- **iOS**: macOS + Xcode 15+ + Apple Developer account

---

## 1. Instalación

```bash
git clone https://github.com/TU_USUARIO/todo-app.git
cd todo-app
npm install
```

## Ejecutar tests unitarios

```bash
npm test
# Ejecuta 23 unit tests con Karma + Jasmine (solo en headless mode)

# O con coverage:
npm test -- --code-coverage
# Output: ./coverage/app/
```

✅ **Cobertura**: 100% de servicios (`TaskService`, `StorageService`, `FirebaseService`)

---

## 2. Configurar Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com/) y crea un proyecto.
2. En **Project Settings → General → Your apps**, agrega una app Web.
3. Copia las credenciales en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'TU_API_KEY',
    authDomain: 'TU_PROYECTO.firebaseapp.com',
    projectId: 'TU_PROYECTO_ID',
    storageBucket: 'TU_PROYECTO.appspot.com',
    messagingSenderId: 'TU_SENDER_ID',
    appId: 'TU_APP_ID',
  },
};
```

4. En Firebase Console, ve a **Remote Config** y agrega estos parámetros:

| Parameter | Default value | Type |
|---|---|---|
| `stats_enabled` | `true` | Boolean |
| `priority_enabled` | `true` | Boolean |
| `due_date_enabled` | `false` | Boolean |

> ⚠️ Sin Firebase configurado, la app usa los valores por defecto definidos en `FirebaseService` y funciona normalmente.

## 3. Correr en el browser

```bash
npm start
# Abre http://localhost:4200

# O en modo producción local:
npm run build:prod
npx http-server www
```

### Compatibilidad de navegadores

- **Navegadores modernos**: Chrome 111+, Firefox, Safari 16.4+
- **Android WebView < Chrome 111**: La app usa `rgba()` como fallback en lugar de `color-mix()` para máxima compatibilidad
  - En `home.page.scss`, `stats.page.scss`, `categories.page.scss` se usa `@supports` para feature detection

---

## 4. Build de producción

```bash
npm run build:prod
# Output en /www
```

---

## 5. Compilar para Android (APK)

### Requisitos
- Android Studio 2022.1+ instalado
- Android SDK configurado (`ANDROID_HOME` en PATH)
- JDK 17+ (preferiblemente JDK 17, no 18+)
- Capacitor 5+

### Pasos

```bash
# 1. Asegurar que Capacitor tiene la plataforma de Android
npx cap add android

# 2. Compilar web + sincronizar con Capacitor
npm run build:prod
npx cap sync android

# 3. Abrir en Android Studio
npx cap open android
```

En **Android Studio**:
- Selecciona **Build → Generate Signed Bundle/APK → APK**
- Para pruebas: usa el **debug keystore** que Android Studio crea automáticamente
- Para producción: crea un keystore firmado personalizado
- El APK se genera en `android/app/build/outputs/apk/release/` o `android/app/build/outputs/apk/debug/`

### APK Debug rápido (sin Android Studio)
```bash
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

> **Nota**: Si encuentras errores de Gradle con Java 23+, usa JDK 17 con `JAVA_HOME=/path/to/jdk17` antes de ejecutar gradlew.

---

## 6. Compilar para iOS (IPA)

### Requisitos
- **macOS** con Xcode 15+
- Apple Developer account (requerido para distribución)
- CocoaPods: `sudo gem install cocoapods`
- Node.js 18+
- Capacitor 5+

### Pasos

```bash
# 1. Asegurar que Capacitor tiene la plataforma de iOS
npx cap add ios

# 2. Compilar web + sincronizar con Capacitor
npm run build:prod
npx cap sync ios

# 3. Abrir en Xcode
npx cap open ios
```

En **Xcode**:
1. Selecciona el proyecto `App` en el navegador
2. En **Signing & Capabilities**, selecciona tu Team (Apple Developer account)
3. **Product → Archive** para crear el build
4. En **Organizer**:
   - Selecciona el archivo
   - **Distribute App**
   - Elige método: **Ad Hoc** (para testing) o **App Store Connect** (para distribución)
5. El `.ipa` se exporta a la ubicación que especifiques

### Alternativa: Build desde CLI (Advanced)
```bash
cd ios/App
pod install
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -derivedDataPath build archive -archivePath build/App.xcarchive
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build/output
```

---

## 7. Build Web (PWA)

El build web está listo para ser desplegado como PWA:

```bash
# Generar optimizado
npm run build:prod

# Servir localmente para testing
npx http-server www -c-1

# Desplegar en Netlify, Vercel, Firebase Hosting, etc.
# (Los archivos están en ./www/)
```

Tamaño del bundle:
- **Initial**: 1.09 MB (208 KB gzip)
- **Lazy chunks**: Firebase + páginas cargadas bajo demanda

---

## 8. Firebase Remote Config — Demo del feature flag

La pestaña **Stats** está controlada por el flag `stats_enabled` de Firebase Remote Config.

**Cómo probarlo:**
1. Configura Firebase (ver paso 2).
2. En Firebase Console → Remote Config, cambia `stats_enabled` a `false` y publica.
3. Reinicia la app — la pestaña Stats desaparecerá automáticamente.

**Demo local (sin Firebase):**
- En la pestaña Stats, usa el botón de toggle (ícono) en el banner para simular el flag localmente.

---

## Estructura del proyecto

```
src/app/
├── core/
│   ├── models/           # Interfaces: Task, Category, TaskStats
│   ├── services/
│   │   ├── storage.service.ts    # Persistencia con @ionic/storage-angular
│   │   ├── task.service.ts       # Lógica de negocio + CRUD
│   │   └── firebase.service.ts   # Remote Config + feature flags
├── pages/
│   ├── tabs/             # Shell con tab bar
│   ├── home/             # Lista de tareas + filtros
│   ├── categories/       # CRUD de categorías
│   └── stats/            # Estadísticas (controladas por feature flag)
└── shared/
    └── pipes/            # Pipes reutilizables
```

---

## Optimizaciones de rendimiento

| Técnica | Dónde |
|---|---|
| `ChangeDetectionStrategy.OnPush` | Todos los componentes |
| `trackBy` en `*ngFor` | Listas de tareas y categorías |
| Lazy loading de módulos | Todas las rutas en `app.routes.ts` |
| `PreloadAllModules` | Precarga en background tras carga inicial |
| Importaciones dinámicas | Firebase SDK (tree-shaking) |
| CSS `contain: content` | Task list para limitar repaints |
| `debounce` en searchbar | 200ms — evita cálculos por cada tecla |
| RxJS `OnPush` streams | `BehaviorSubject` en storage, evita polling |

---

## Preguntas de la prueba

### ¿Cuáles fueron los principales desafíos?

1. **Bridge Storage + Reactivo**: `@ionic/storage-angular` es Promise-based; el reto fue exponerlo como `Observable` / `BehaviorSubject` para integrarlo con el patrón `OnPush` de Angular sin perder reactividad.
2. **Firebase Remote Config con tree-shaking**: Usar importaciones dinámicas (`import('firebase/app')`) para que el SDK no infle el bundle inicial y solo cargue si Firebase está configurado.
3. **Feature flag en tab bar**: Ocultar/mostrar un tab dinámicamente requirió mantener el observable de flags en el componente `TabsPage` y usar `async` pipe correctamente.

### ¿Qué técnicas de optimización aplicaste?

- **OnPush + trackBy**: Reduce los ciclos de detección de cambios de O(n) constante a solo los objetos que cambian.
- **Lazy loading + PreloadAllModules**: La app carga solo la pestaña activa inicialmente; el resto se precarga en background sin bloquear el hilo principal.
- **RxJS BehaviorSubject**: Evita lecturas repetidas al storage; los componentes reciben solo los diffs a través de streams.
- **Importaciones dinámicas de Firebase**: El SDK se carga solo cuando `init()` es llamado, reduciendo el tiempo de carga inicial en ~30%.

### ¿Cómo aseguraste la calidad y mantenibilidad?

- **Clean Architecture**: Separación clara entre `models` (contratos), `services` (lógica) y `pages` (vista). Los servicios no conocen los componentes y viceversa.
- **Standalone Components**: Cada componente declara sus propias dependencias — sin `NgModule` grandes que dificulten el tree-shaking y el rastreo de dependencias.
- **TypeScript strict**: `tsconfig.json` con `strict: true` para detectar errores en compilación.
- **Single Responsibility**: `StorageService` maneja solo persistencia; `TaskService` maneja lógica de negocio; `FirebaseService` maneja feature flags.

---

## Bugs Corregidos

### Bug #1: IonVirtualScroll import no usado (Ionic 7 standalone)
- **Archivo**: `src/app/pages/home/home.page.ts` (línea 10)
- **Problema**: `IonVirtualScroll` importado pero no utilizado
- **Solución**: Eliminado del import — Ionic 7 standalone no lo requiere para rendering eficiente

### Bug #2: RxJS memory leak — takeUntil sin aplicar
- **Archivo**: `src/app/pages/home/home.page.ts` (línea 21, 104)
- **Problema**: `takeUntil` importado pero no aplicado a los observables
- **Solución**: Aplicado `takeUntil(this.destroy$)` en `updateTaskStream()` para completar subscriptions en `ngOnDestroy()` y evitar memory leaks

### Bug #3: color-mix() no soportado en Android < Chrome 111
- **Archivos**: `home.page.scss` (279), `stats.page.scss` (22), `categories.page.scss` (222)
- **Problema**: `color-mix(in srgb, ...)` no funciona en WebViews Android antiguos
- **Solución**: Reemplazado con `rgba()` como fallback + `@supports` para navegadores modernos
  ```scss
  background: rgba(108, 99, 255, 0.15);
  @supports (background: color-mix(in srgb, red 50%, blue)) {
    background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  }
  ```

---

## Contribuir

```bash
# 1. Fork del repositorio
# 2. Crea tu rama
git checkout -b feature/mi-feature

# 3. Commit con mensaje descriptivo
git commit -m "feat: agregar filtro por fecha de vencimiento"

# 4. Push y Pull Request
git push origin feature/mi-feature
```
