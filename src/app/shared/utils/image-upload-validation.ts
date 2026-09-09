// Contraintes appliquees aux images uploadees en admin (circuits) : trouve en audit,
// aucune limite n'existait avant (images non optimisees possibles cote public).
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const MIN_IMAGE_WIDTH = 400;
export const MIN_IMAGE_HEIGHT = 300;

export interface ImageValidationError {
  file: File;
  reason: 'size' | 'resolution';
  message: string;
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function validateImageSize(file: File): ImageValidationError | null {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      file,
      reason: 'size',
      message: `"${file.name}" depasse la taille maximale autorisee (${formatSize(file.size)} > ${formatSize(MAX_IMAGE_SIZE_BYTES)})`
    };
  }
  return null;
}

// Lit les dimensions reelles d'une image via un element <img> temporaire (pas de dependance
// externe). Se resout avec null si le fichier n'est pas une image lisible par le navigateur.
export function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export async function validateImageResolution(file: File): Promise<ImageValidationError | null> {
  const dimensions = await readImageDimensions(file);
  if (!dimensions) {
    return null;
  }
  if (dimensions.width < MIN_IMAGE_WIDTH || dimensions.height < MIN_IMAGE_HEIGHT) {
    return {
      file,
      reason: 'resolution',
      message: `"${file.name}" est trop petite (${dimensions.width}x${dimensions.height}px, minimum ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px)`
    };
  }
  return null;
}

// Valide taille puis resolution pour une liste de fichiers ; retourne la premiere erreur
// rencontree, ou null si tous les fichiers respectent les contraintes.
export async function validateImageFiles(files: File[]): Promise<ImageValidationError | null> {
  for (const file of files) {
    const sizeError = validateImageSize(file);
    if (sizeError) {
      return sizeError;
    }
  }
  for (const file of files) {
    const resolutionError = await validateImageResolution(file);
    if (resolutionError) {
      return resolutionError;
    }
  }
  return null;
}
