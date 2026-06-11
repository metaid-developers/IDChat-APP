import * as bip39 from 'bip39';

export const SUPPORTED_MNEMONIC_WORD_COUNTS = [12, 15, 18, 21, 24] as const;

export type MnemonicImportValidationResult =
  | {
      ok: true;
      mnemonic: string;
      words: string[];
    }
  | {
      ok: false;
      error: string;
    };

export function normalizeMnemonicWords(rawWords: string[]): string[] {
  return rawWords
    .flatMap((word) => word.normalize('NFKD').trim().toLowerCase().split(/\s+/))
    .filter(Boolean);
}

export function validateMnemonicImportWords(
  rawWords: string[],
  expectedWordCount: number,
): MnemonicImportValidationResult {
  if (!SUPPORTED_MNEMONIC_WORD_COUNTS.includes(expectedWordCount as never)) {
    return {
      ok: false,
      error: 'Select a standard mnemonic length: 12, 15, 18, 21, or 24 words.',
    };
  }

  const words = normalizeMnemonicWords(rawWords);

  if (words.length !== expectedWordCount) {
    return {
      ok: false,
      error: `Enter all ${expectedWordCount} mnemonic words.`,
    };
  }

  const mnemonic = words.join(' ');

  if (!bip39.validateMnemonic(mnemonic)) {
    return {
      ok: false,
      error: 'Invalid mnemonic phrase. Check spelling and word order.',
    };
  }

  return {
    ok: true,
    mnemonic,
    words,
  };
}
