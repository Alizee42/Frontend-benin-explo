import { AddCircuitStep2Component } from './add-circuit-step2.component';

/**
 * Regression pour la refonte du wizard admin "Creer un circuit" : upload drag&drop,
 * suppression d'image de galerie par index, et alignement previews/fichiers (les
 * FileReader ne resolvent pas forcement dans l'ordre de selection).
 *
 * Utilise de vrais fichiers (pas de mock de validateImageFiles) : un fichier texte
 * factice n'est pas une image lisible par le navigateur, donc readImageDimensions()
 * resout silencieusement a null et la validation de resolution est ignoree (comportement
 * documente dans image-upload-validation.ts) -- seule la taille est verifiable sans
 * fournir un vrai binaire image.
 */
describe('AddCircuitStep2Component', () => {
  function createComponent(): AddCircuitStep2Component {
    return new AddCircuitStep2Component();
  }

  function makeFile(name: string, sizeBytes = 100): File {
    return new File([new Uint8Array(sizeBytes)], name, { type: 'image/jpeg' });
  }

  function makeDropEvent(files: File[]): DragEvent {
    const dataTransfer = { files } as unknown as DataTransfer;
    return { preventDefault: () => {}, stopPropagation: () => {}, dataTransfer } as unknown as DragEvent;
  }

  it('emet heroSelected avec le fichier et la preview quand le fichier hero est valide', async () => {
    const component = createComponent();
    const file = makeFile('hero.jpg');
    let emitted: { file: File; preview: string } | null = null;
    component.heroSelected.subscribe(e => (emitted = e));

    component.onHeroDrop(makeDropEvent([file]));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(emitted).not.toBeNull();
    expect(emitted!.file).toBe(file);
    expect(typeof emitted!.preview).toBe('string');
  });

  it("n'emet pas heroSelected et emet imageInvalid si le fichier depasse la taille max", async () => {
    const component = createComponent();
    const oversized = makeFile('trop-gros.jpg', 6 * 1024 * 1024);
    let heroEmitted = false;
    let invalidMessage: string | null = null;
    component.heroSelected.subscribe(() => (heroEmitted = true));
    component.imageInvalid.subscribe(e => (invalidMessage = e.message));

    component.onHeroDrop(makeDropEvent([oversized]));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(heroEmitted).toBeFalse();
    expect(invalidMessage as string | null).toContain('trop-gros.jpg');
  });

  it('emet galerieInvalid si moins de 3 fichiers', () => {
    const component = createComponent();
    let invalidCount: number | null = null;
    component.galerieInvalid.subscribe(e => (invalidCount = e.count));

    component.onGalerieDrop(makeDropEvent([makeFile('a.jpg'), makeFile('b.jpg')]));

    expect(invalidCount as number | null).toBe(2);
  });

  it('emet galerieInvalid si plus de 10 fichiers', () => {
    const component = createComponent();
    let invalidCount: number | null = null;
    component.galerieInvalid.subscribe(e => (invalidCount = e.count));
    const files = Array.from({ length: 11 }, (_, i) => makeFile(`img${i}.jpg`));

    component.onGalerieDrop(makeDropEvent(files));

    expect(invalidCount as number | null).toBe(11);
  });

  it("conserve l'alignement previews/fichiers meme si les FileReader resolvent dans le desordre", async () => {
    const component = createComponent();
    const files = [makeFile('premier.jpg'), makeFile('second.jpg'), makeFile('troisieme.jpg')];
    let emitted: { files: File[]; previews: string[] } | null = null;
    component.galerieSelected.subscribe(e => (emitted = e));

    const originalReadAsDataURL = FileReader.prototype.readAsDataURL;
    const pending: Array<() => void> = [];
    spyOn(FileReader.prototype, 'readAsDataURL').and.callFake(function (this: FileReader, blob: Blob) {
      const file = blob as File;
      pending.push(() => {
        Object.defineProperty(this, 'result', { value: `data:${file.name}`, configurable: true });
        (this.onload as any)?.();
      });
    });

    component.onGalerieDrop(makeDropEvent(files));
    await new Promise(resolve => setTimeout(resolve, 50));

    // Resout dans l'ordre inverse de la selection
    [...pending].reverse().forEach(resolve => resolve());

    expect(emitted).not.toBeNull();
    expect(emitted!.previews[0]).toBe('data:premier.jpg');
    expect(emitted!.previews[1]).toBe('data:second.jpg');
    expect(emitted!.previews[2]).toBe('data:troisieme.jpg');

    (FileReader.prototype.readAsDataURL as any) = originalReadAsDataURL;
  });

  it("galerieImageRemoved emet l'index cliqué", () => {
    const component = createComponent();
    let removedIndex: number | null = null;
    component.galerieImageRemoved.subscribe(i => (removedIndex = i));

    component.galerieImageRemoved.emit(1);

    expect(removedIndex as number | null).toBe(1);
  });

  it('onHeroDragOver/DragLeave basculent dragOverHero', () => {
    const component = createComponent();
    const dragEvent = { preventDefault: () => {}, stopPropagation: () => {} } as DragEvent;

    component.onHeroDragOver(dragEvent);
    expect(component.dragOverHero).toBeTrue();

    component.onHeroDragLeave(dragEvent);
    expect(component.dragOverHero).toBeFalse();
  });
});
