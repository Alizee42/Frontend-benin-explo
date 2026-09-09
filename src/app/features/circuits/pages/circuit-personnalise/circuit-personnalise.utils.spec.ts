import { isValidPhone } from './circuit-personnalise.utils';

/**
 * Regression pour le bug UX trouve en audit : le champ telephone du formulaire
 * circuit-personnalise n'avait aucune validation de format, contrairement a l'email.
 */
describe('isValidPhone', () => {
  it('accepte un numero beninois avec indicatif', () => {
    expect(isValidPhone('+229 97 00 00 00')).toBeTrue();
  });

  it('accepte un numero avec tirets et parentheses', () => {
    expect(isValidPhone('(01) 23-45-67-89')).toBeTrue();
  });

  it('accepte un numero sans indicatif ni espaces', () => {
    expect(isValidPhone('22997000000')).toBeTrue();
  });

  it('rejette une chaine vide', () => {
    expect(isValidPhone('')).toBeFalse();
  });

  it('rejette un numero trop court (moins de 8 chiffres)', () => {
    expect(isValidPhone('123456')).toBeFalse();
  });

  it('rejette un numero trop long (plus de 15 chiffres)', () => {
    expect(isValidPhone('1234567890123456')).toBeFalse();
  });

  it('rejette du texte libre non numerique', () => {
    expect(isValidPhone('appelez-moi')).toBeFalse();
  });

  it('rejette un numero contenant des lettres melangees a des chiffres', () => {
    expect(isValidPhone('0123abc4567')).toBeFalse();
  });

  it('ignore les espaces en debut/fin avant validation', () => {
    expect(isValidPhone('  +229 97 00 00 00  ')).toBeTrue();
  });
});
