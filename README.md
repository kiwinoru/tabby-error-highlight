# tabby-error-highlight

Plugin ultraligero y de alto rendimiento para **[Tabby](https://tabby.sh/)**, diseñado específicamente para conexiones por consola a routers (Huawei, Cisco, etc.) y terminales locales.

Creado por [Rubén León (rubenleonn)](https://github.com/rubenleonn).

## ¿Qué hace?
Resalta automáticamente y de forma llamativa la cadena **`Error:`** (insensible a mayúsculas/minúsculas: `Error:`, `ERROR:`, `error:`) con texto en blanco puro sobre fondo rojo vivo usando TrueColor RGB 24-bit (`\x1b[38;2;255;255;255;48;2;220;0;0mError:\x1b[0m`) para detectar errores de sintaxis o comandos al cargar configuraciones en routers de un vistazo rápido, garantizando que el color no dependa de la paleta ni del tema del terminal.

## Características
* **Optimizado para conexiones serie (UART / 9600 baudios):** Implementa un acumulador de flujo inteligente (*stream buffer*) con detección de prefijos para ensamblar paquetes fragmentados a baja velocidad sin introducir latencia perceptible al teclear o recibir prompts.
* **Cero configuración:** No requiere menús, perfiles ni configuraciones manuales. Se conecta automáticamente a todas las sesiones de terminal (Serie, Local, SSH, Telnet).
* **Ultraligero:** Bundle compilado de apenas ~3.6 KB (frente a los ~770 KB de plugins con menús gráficos complejos).

## Compilación y despliegue local

Para compilar e instalar en tu Tabby local en macOS:

```bash
npm run deploy
```

Para generar los paquetes portables (`.tar`, `.tar.gz` y `.tgz`):

```bash
npm run pack
```

O para compilar únicamente el bundle:

```bash
npm run build
```

## Instalación portable en cualquier equipo

### Opción 1: Descomprimir el `.tar` / `.tar.gz` portable (Sin necesidad de npm ni Node)

Simplemente descomprime `tabby-error-highlight-portable.tar.gz` (o `.tar`) dentro del directorio de plugins de Tabby:

* **macOS:** `~/Library/Application Support/tabby/plugins/node_modules/`
* **Linux:** `~/.config/tabby/plugins/node_modules/`
* **Windows:** `%APPDATA%\tabby\plugins\node_modules\`
* **Tabby Portable (Windows/Linux):** `<carpeta_tabby>\data\plugins\node_modules\`

La estructura final debe quedar así:
```
.../plugins/node_modules/tabby-error-highlight/
├── dist/
│   ├── index.js
│   └── index.js.LICENSE.txt
├── package.json
└── README.md
```

### Opción 2: Usar el tarball `.tgz` con npm o Tabby `package.json`

Añade la ruta del archivo `.tgz` a las dependencias de `package.json` en la carpeta de plugins de Tabby:

```json
{
  "name": "tabby-plugins",
  "dependencies": {
    "tabby-error-highlight": "file:/ruta/a/tabby-error-highlight-1.0.0.tgz"
  }
}
```

## Licencia

[MIT](LICENSE)
