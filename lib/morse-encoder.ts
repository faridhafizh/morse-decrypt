/**
 * Morse Code Dictionary
 */
export const MORSE_DICT: Record<string, string> = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
    'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
    'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
    'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', '0': '-----', ' ': ' ',
};

/**
 * Encodes text into a sequence of timings (ms)
 * Dot = 1 unit, Dash = 3 units, Intra-char = 1 unit, Inter-char = 3 units, Space = 7 units
 */
export function encodeMorse(text: string, unitMs: number = 200): { type: 'on' | 'off', duration: number }[] {
    const sequence: { type: 'on' | 'off', duration: number }[] = [];
    const upperText = text.toUpperCase();

    for (let i = 0; i < upperText.length; i++) {
        const char = upperText[i];
        const code = MORSE_DICT[char];

        if (!code) continue;

        if (code === ' ') {
            sequence.push({ type: 'off', duration: unitMs * 7 });
        } else {
            for (let j = 0; j < code.length; j++) {
                const symbol = code[j];
                if (symbol === '.') {
                    sequence.push({ type: 'on', duration: unitMs });
                } else if (symbol === '-') {
                    sequence.push({ type: 'on', duration: unitMs * 3 });
                }

                // Intra-character gap (between dots/dashes)
                if (j < code.length - 1) {
                    sequence.push({ type: 'off', duration: unitMs });
                }
            }

            // Inter-character gap
            if (i < upperText.length - 1 && upperText[i+1] !== ' ') {
                sequence.push({ type: 'off', duration: unitMs * 3 });
            }
        }
    }

    return sequence;
}
