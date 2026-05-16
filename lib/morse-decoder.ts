/**
 * MorseDecoder class
 * Processes luminance samples and outputs decoded characters.
 */
export class MorseDecoder {
  private lastSignal: number = 0;
  private high: boolean = false;
  private signalStart: number = 0;
  private signalEnd: number = 0;
  private lowStart: number = 0;
  private dotDuration: number = 0;          // estimated unit length (ms)
  private dotDurations: number[] = [];      // recent high‑pulse lengths
  private symbolBuffer: string = '';        // dots & dashes of current character
  private decodedText: string = '';
  private minSignal: number = 255;
  private maxSignal: number = 0;
  private threshold: number = 150;
  private onChar: (char: string) => void;

  private readonly MIN_UNIT_MS = 40;        // ignore glitches
  private readonly DASH_FACTOR = 3;
  private readonly CHAR_GAP_FACTOR = 3;
  private readonly WORD_GAP_FACTOR = 7;

  // Morse code lookup
  private static readonly MORSE_MAP: Record<string, string> = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
    '--..': 'Z', '.----': '1', '..---': '2', '...--': '3',
    '....-': '4', '.....': '5', '-....': '6', '--...': '7',
    '---..': '8', '----.': '9', '-----': '0',
  };

  constructor(onChar: (char: string) => void) {
    this.onChar = onChar;
  }

  /** Call with a signal value (0‑255) and current timestamp (ms) */
  feed(signal: number, now: number) {
    // Auto-calibrate threshold with slow adaptation
    // We let the min/max signals slowly drift towards the current signal
    // to adapt to changing environmental conditions.
    const adaptationRate = 0.002; 
    this.minSignal = this.minSignal * (1 - adaptationRate) + signal * adaptationRate;
    this.maxSignal = this.maxSignal * (1 - adaptationRate) + signal * adaptationRate;

    if (signal < this.minSignal) this.minSignal = signal;
    if (signal > this.maxSignal) this.maxSignal = signal;
    
    // Threshold is 60% up from min in the current range
    const range = this.maxSignal - this.minSignal;
    if (range > 15) { // Minimum range to consider it a valid signal vs noise
      this.threshold = this.minSignal + range * 0.6;
    } else {
      // If range is too small, keep threshold high to avoid noise triggers
      this.threshold = this.minSignal + 20; 
    }

    const isHigh = signal > this.threshold;

    // Rising edge: signal turned ON
    if (isHigh && !this.high) {
      this.high = true;
      this.signalStart = now;

      // Measure previous low period (gap)
      const lowDuration = now - this.lowStart;
      if (this.lowStart > 0 && lowDuration > this.MIN_UNIT_MS) {
        this.handleGap(lowDuration);
      }
    }
    // Falling edge: signal turned OFF
    else if (!isHigh && this.high) {
      this.high = false;
      this.signalEnd = now;
      this.lowStart = now;
      const highDuration = now - this.signalStart;

      if (highDuration > this.MIN_UNIT_MS) {
        this.dotDurations.push(highDuration);
        // Keep only recent durations for adaptive speed (sliding window)
        if (this.dotDurations.length > 15) {
          this.dotDurations.shift();
        }

        // Estimate dot length from the median of the last few pulses
        if (this.dotDurations.length >= 3) {
          const sorted = [...this.dotDurations].sort((a, b) => a - b);
          this.dotDuration = sorted[Math.floor(sorted.length / 2)];
        }
        this.recordSymbol(highDuration);
      }
    }

    this.lastSignal = signal;
  }

  private recordSymbol(duration: number) {
    if (this.dotDuration === 0) return; // not enough data yet
    const ratio = duration / this.dotDuration;
    // Dash = 3 units, dot = 1 unit (allow some tolerance)
    if (ratio > 2.0) {
      this.symbolBuffer += '-';
    } else {
      this.symbolBuffer += '.';
    }
  }

  private handleGap(gapDuration: number) {
    if (this.dotDuration === 0) return;
    const units = gapDuration / this.dotDuration;

    if (units > this.WORD_GAP_FACTOR - 1) {
      // Word gap: flush character and add a space
      this.flushCharacter();
      this.decodedText += ' ';
      this.onChar(' '); // notify UI
    } else if (units > this.CHAR_GAP_FACTOR - 1) {
      // Character gap: flush current character
      this.flushCharacter();
    }
    // else intra‑character gap → do nothing
  }

  private flushCharacter() {
    if (this.symbolBuffer.length === 0) return;
    const char = MorseDecoder.MORSE_MAP[this.symbolBuffer] ?? '?';
    this.decodedText += char;
    this.onChar(char);
    this.symbolBuffer = '';
  }

  /** Get the complete decoded text so far */
  getText(): string {
    return this.decodedText;
  }

  /** Get the current threshold for UI feedback */
  getThreshold(): number {
    return this.threshold;
  }

  /** Get the current min/max for UI feedback */
  getRange(): { min: number, max: number } {
    return { min: this.minSignal, max: this.maxSignal };
  }

  reset() {
    this.decodedText = '';
    this.symbolBuffer = '';
    this.dotDurations = [];
    this.dotDuration = 0;
    this.minSignal = 255;
    this.maxSignal = 0;
    this.threshold = 150;
  }
}
