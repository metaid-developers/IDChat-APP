import {
  normalizeMnemonicWords,
  validateMnemonicImportWords,
} from '../mnemonicImport';

describe('mnemonic import validation', () => {
  it('normalizes pasted mnemonic words', () => {
    expect(
      normalizeMnemonicWords([
        '  Abandon abandon  ',
        'ABANDON\nabandon',
        'about ',
      ]),
    ).toEqual(['abandon', 'abandon', 'abandon', 'abandon', 'about']);
  });

  it('accepts a valid 12 word BIP39 mnemonic', () => {
    const result = validateMnemonicImportWords(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(' '),
      12,
    );

    expect(result).toEqual({
      ok: true,
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      words: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(' '),
    });
  });

  it('accepts a valid 21 word BIP39 mnemonic', () => {
    const result = validateMnemonicImportWords(
      'add amused food shrimp must also kind wing shed bundle crisp deputy program cry fruit cake later sleep diary leave bread'.split(' '),
      21,
    );

    expect(result.ok).toBe(true);
  });

  it('rejects incomplete words before deriving wallets', () => {
    expect(validateMnemonicImportWords(['abandon', 'abandon'], 12)).toEqual({
      ok: false,
      error: 'Enter all 12 mnemonic words.',
    });
  });

  it('rejects invalid checksum or spelling', () => {
    expect(
      validateMnemonicImportWords(
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'.split(' '),
        12,
      ),
    ).toEqual({
      ok: false,
      error: 'Invalid mnemonic phrase. Check spelling and word order.',
    });
  });

  it('rejects unsupported word counts', () => {
    expect(validateMnemonicImportWords(Array(13).fill('abandon'), 13)).toEqual({
      ok: false,
      error: 'Select a standard mnemonic length: 12, 15, 18, 21, or 24 words.',
    });
  });
});
