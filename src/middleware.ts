import { SessionMiddleware } from "tabby-terminal";

/**
 * ============================================================================
 * CONFIGURACIÓN DE COLOR Y ESTILO DEL RESALTADO (ANSI ESCAPE CODES)
 * ============================================================================
 * Usamos TrueColor (RGB 24 bits) para asegurar que el color sea exactamente
 * blanco puro (#ffffff) y fondo rojo (#dc0000), sin depender de la paleta
 * ni de alteraciones del tema del terminal:
 *
 *   - \x1b[38;2;255;255;255m    -> Color de texto: Blanco puro (RGB 255, 255, 255)
 *   - \x1b[48;2;220;0;0m        -> Color de fondo: Rojo vivo (RGB 220, 0, 0)
 *   - \x1b[0m                   -> Reset de estilos al terminar la palabra
 */
const HIGHLIGHT_START = "\x1b[38;2;255;255;255;48;2;220;0;0m";
const HIGHLIGHT_END = "\x1b[0m";

/**
 * SessionMiddleware que resalta "Error:" (insensible a mayúsculas/minúsculas)
 * con un acumulador de stream para asegurar la detección en enlaces serie (9600 baud).
 */
export class ErrorHighlightMiddleware extends SessionMiddleware {
  private buffer = "";
  private timer: NodeJS.Timeout | null = null;

  // Prefijos parciales de "Error:" que podrían completarse en el siguiente paquete:
  // ej. "e", "er", "err", "erro", "error", "error:"
  private readonly PREFIX_REGEX = /e(r(r(o(r(:)?)?)?)?)?$/i;

  // Secuencia de escape ANSI incompleta al final del chunk (ej. "\x1b" o "\x1b[1;31")
  private readonly INCOMPLETE_ANSI_REGEX = /\x1b(\[[0-9;?]*)?$/;

  feedFromSession(data: Buffer): void {
    if (data.length === 0) {
      return super.feedFromSession(data);
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.buffer += data.toString("utf-8");
    this.process(false);
  }

  private process(forceFlush: boolean): void {
    if (forceFlush) {
      if (this.buffer.length > 0) {
        this.emit(this.highlight(this.buffer));
        this.buffer = "";
      }
      return;
    }

    // 1. Emitir inmediatamente las líneas completas que terminan en \n o \r
    const lastNl = Math.max(this.buffer.lastIndexOf("\n"), this.buffer.lastIndexOf("\r"));
    if (lastNl !== -1) {
      const ready = this.buffer.slice(0, lastNl + 1);
      this.buffer = this.buffer.slice(lastNl + 1);
      this.emit(this.highlight(ready));
    }

    // 2. Comprobar si el texto restante ya contiene coincidencias completas de "Error:"
    if (/error:/i.test(this.buffer)) {
      const matches = [...this.buffer.matchAll(/error:/gi)];
      const lastMatch = matches[matches.length - 1];
      const cutIdx = (lastMatch.index ?? 0) + lastMatch[0].length;
      const ready = this.buffer.slice(0, cutIdx);
      this.buffer = this.buffer.slice(cutIdx);
      this.emit(this.highlight(ready));
    }

    // 3. Para cualquier buffer parcial restante sin saltos de línea:
    if (this.buffer.length > 0) {
      const incompleteAnsi = this.buffer.match(this.INCOMPLETE_ANSI_REGEX);
      const prefixMatch = this.buffer.match(this.PREFIX_REGEX);

      if (incompleteAnsi || prefixMatch) {
        // Retener solo la posible secuencia incompleta (unos pocos caracteres)
        const holdLen = Math.max(
          incompleteAnsi ? incompleteAnsi[0].length : 0,
          prefixMatch ? prefixMatch[0].length : 0
        );
        const safeCut = this.buffer.length - holdLen;
        if (safeCut > 0) {
          const ready = this.buffer.slice(0, safeCut);
          this.buffer = this.buffer.slice(safeCut);
          this.emit(this.highlight(ready));
        }

        // Esperar hasta 25ms a que llegue el siguiente paquete del puerto serie
        this.timer = setTimeout(() => this.process(true), 25);
      } else {
        // Seguro de emitir inmediatamente (0ms de retraso al teclear)
        this.emit(this.highlight(this.buffer));
        this.buffer = "";
      }
    }
  }

  /**
   * Aplica el estilo configurado a "Error:"
   */
  private highlight(text: string): string {
    return text.replace(/error:/gi, (match) => `${HIGHLIGHT_START}${match}${HIGHLIGHT_END}`);
  }

  private emit(text: string): void {
    if (text.length > 0) {
      super.feedFromSession(Buffer.from(text, "utf-8"));
    }
  }

  close(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length > 0) {
      this.emit(this.highlight(this.buffer));
      this.buffer = "";
    }
    super.close();
  }
}
