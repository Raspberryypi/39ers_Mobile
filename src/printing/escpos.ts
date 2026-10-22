import type { Line } from './ticketBuilder';

/**
 * Converts layout lines into ESC/POS bytes, the command set nearly all Bluetooth
 * thermal printers understand. Output is plain ASCII on purpose: cheap printers
 * differ in code pages, and accents or the peso sign often print as garbage.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const INIT = [ESC, 0x40];
const align = (a: 'left' | 'center' | 'right') => [ESC, 0x61, a === 'left' ? 0 : a === 'center' ? 1 : 2];
const bold = (on: boolean) => [ESC, 0x45, on ? 1 : 0];
const size = (double: boolean) => [GS, 0x21, double ? 0x11 : 0x00];
const feed = (n: number) => [ESC, 0x64, n];

/** Replace characters that thermal printers commonly cannot print. */
export function toAscii(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (n with tilde -> n)
    .replace(/\u20b1/g, 'P') // peso sign
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\x7e]/g, '?');
}

export interface EscPosOptions {
  /** Blank lines after the ticket so the text clears the tear bar. */
  feedLines?: number;
  /**
   * Most portable printers have no cutter and ignore the command; enable only if
   * the owner's printer has an auto-cutter.
   */
  cut?: boolean;
}

export function renderEscPos(lines: Line[], opts: EscPosOptions = {}): Uint8Array {
  const bytes: number[] = [...INIT];
  for (const l of lines) {
    bytes.push(...align(l.align ?? 'left'), ...bold(!!l.bold), ...size(l.size === 'double'));
    for (const ch of toAscii(l.text)) bytes.push(ch.charCodeAt(0));
    bytes.push(LF);
  }
  bytes.push(...bold(false), ...size(false), ...align('left'), ...feed(opts.feedLines ?? 4));
  if (opts.cut) bytes.push(GS, 0x56, 0x42, 0x00);
  return Uint8Array.from(bytes);
}
