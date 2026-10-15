// Errors the user is meant to read. `key` points at a ConverterStrings entry so
// the controller can show the message in the page language; `message` is the
// English fallback (also what a plain `err.message` consumer would see).

import type { ConverterStrings } from "./i18n";

export class ConvertError extends Error {
  key: keyof ConverterStrings;
  params?: Record<string, string | number>;
  /** Underlying error behind a wrapper such as "{name}: {why}", if any. */
  reason?: unknown;

  constructor(
    key: keyof ConverterStrings,
    message: string,
    params?: Record<string, string | number>,
    reason?: unknown
  ) {
    super(message);
    this.name = "ConvertError";
    this.key = key;
    this.params = params;
    this.reason = reason;
  }
}
