# tabby-error-highlight

Plugin ultraligero y de alto rendimiento para **[Tabby](https://tabby.sh/)**, diseñado específicamente para conexiones por consola a routers (Huawei, Cisco, etc.) y terminales locales.

Creado por [Rubén León (kiwinoru)](https://github.com/kiwinoru).

## ¿Qué hace?
Resalta automáticamente y de forma llamativa la cadena **`Error:`** (insensible a mayúsculas/minúsculas: `Error:`, `ERROR:`, `error:`) con texto en blanco negrita sobre fondo rojo vivo (`\x1b[1;97;41mError:\x1b[0m`) para detectar errores de sintaxis o comandos al cargar configuraciones en routers de un vistazo rápido.

## Características
* **Optimizado para conexiones serie (UART / 9600 baudios):** Implementa un acumulador de flujo inteligente (*stream buffer*) con detección de prefijos para ensamblar paquetes fragmentados a baja velocidad sin introducir latencia perceptible al teclear o recibir prompts.
* **Cero configuración:** No requiere menús, perfiles ni configuraciones manuales. Se conecta automáticamente a todas las sesiones de terminal (Serie, Local, SSH, Telnet).
* **Ultraligero:** Bundle compilado de apenas ~3.6 KB (frente a los ~770 KB de plugins con menús gráficos complejos).

## Compilación y despliegue local

Para compilar e instalar en Tabby en macOS:

```bash
npm run deploy
```

O para compilar únicamente:

```bash
npm run build
```

## Licencia

[MIT](LICENSE)
