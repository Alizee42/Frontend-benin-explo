import { validateImageSize, MAX_IMAGE_SIZE_BYTES } from './image-upload-validation';

/**
 * Regression pour le bug trouve en audit : aucune limite de poids n'etait imposee a l'upload
 * d'image en admin (step2 add-circuit / edit-circuit), permettant des images non optimisees
 * cote public. On ne teste que validateImageSize() ici : validateImageResolution() depend de
 * l'API navigateur Image/URL.createObjectURL, non fiable a simuler en test unitaire, et est
 * couverte fonctionnellement par les composants qui l'utilisent.
 */
describe('validateImageSize', () => {
  function makeFile(name: string, sizeBytes: number): File {
    const content = new Uint8Array(sizeBytes);
    return new File([content], name, { type: 'image/png' });
  }

  it('accepte un fichier sous la limite de taille', () => {
    const file = makeFile('petite.png', 1024);
    expect(validateImageSize(file)).toBeNull();
  });

  it('rejette un fichier au-dessus de la limite de taille avec un message explicite', () => {
    const file = makeFile('trop-grosse.png', MAX_IMAGE_SIZE_BYTES + 1);
    const error = validateImageSize(file);
    expect(error).not.toBeNull();
    expect(error?.reason).toBe('size');
    expect(error?.message).toContain('trop-grosse.png');
  });

  it('accepte un fichier exactement a la limite', () => {
    const file = makeFile('limite.png', MAX_IMAGE_SIZE_BYTES);
    expect(validateImageSize(file)).toBeNull();
  });
});
