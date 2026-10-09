import { SessionMiddleware } from "tabby-terminal";

/**
 * SessionMiddleware that highlights "Error:" (case-insensitive) in red,
 * with a stream buffer to reliably catch occurrences even across
 * low-baudrate serial chunk boundaries.
 */
export class ErrorHighlightMiddleware extends SessionMiddleware {
  private buffer = "";
  private timer: NodeJS.Timeout | null = null;

  // Partial prefixes of "Error:" that could complete across chunk boundaries:
  // e.g. "e", "er", "err", "erro", "error", "error:"
  private readonly PREFIX_REGEX = /e(r(r(o(r(:)?)?)?)?)?$/i;

  // Incomplete ANSI escape sequence at end of chunk (e.g. "\x1b" or "\x1b[1;31")
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

    // 1. Immediately flush all complete lines ending in \n or \r
    const lastNl = Math.max(this.buffer.lastIndexOf("\n"), this.buffer.lastIndexOf("\r"));
    if (lastNl !== -1) {
      const ready = this.buffer.slice(0, lastNl + 1);
      this.buffer = this.buffer.slice(lastNl + 1);
      this.emit(this.highlight(ready));
    }

    // 2. Check if the remaining tail already contains complete matches of "Error:"
    if (/error:/i.test(this.buffer)) {
      const matches = [...this.buffer.matchAll(/error:/gi)];
      const lastMatch = matches[matches.length - 1];
      const cutIdx = (lastMatch.index ?? 0) + lastMatch[0].length;
      const ready = this.buffer.slice(0, cutIdx);
      this.buffer = this.buffer.slice(cutIdx);
      this.emit(this.highlight(ready));
    }

    // 3. For any remaining partial buffer without newlines:
    if (this.buffer.length > 0) {
      const incompleteAnsi = this.buffer.match(this.INCOMPLETE_ANSI_REGEX);
      const prefixMatch = this.buffer.match(this.PREFIX_REGEX);

      if (incompleteAnsi || prefixMatch) {
        // Hold the potential incomplete sequence (at most a few characters)
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

        // Wait up to 25ms for the next serial chunk to arrive
        this.timer = setTimeout(() => this.process(true), 25);
      } else {
        // Safe to emit immediately (0ms delay)
        this.emit(this.highlight(this.buffer));
        this.buffer = "";
      }
    }
  }

  /**
   * Highlights "Error:" in bold bright-white on red background (\x1b[1;97;41m...\x1b[0m)
   */
  private highlight(text: string): string {
    return text.replace(/error:/gi, (match) => `\x1b[1;97;41m${match}\x1b[0m`);
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
