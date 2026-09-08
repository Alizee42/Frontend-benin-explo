import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MediaService } from './media.service';

/**
 * MediaService.resolveImage() centralise (selon son propre commentaire) une logique de
 * resolution d'URL dupliquee dans home, circuits-list, circuit-detail, data-table : un bug ici
 * impacterait silencieusement l'affichage des images sur plusieurs pages a la fois. Jamais
 * teste jusqu'ici.
 */
describe('MediaService', () => {
  let service: MediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('resolveImage', () => {
    it('returns the fallback image when the raw value is empty', () => {
      expect(service.resolveImage('')).toBe('assets/images/circuit-default.jpg');
      expect(service.resolveImage(undefined)).toBe('assets/images/circuit-default.jpg');
    });

    it('returns a custom fallback when provided', () => {
      expect(service.resolveImage('', 'assets/other.jpg')).toBe('assets/other.jpg');
    });

    it('passes through absolute http/https URLs unchanged', () => {
      expect(service.resolveImage('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
      expect(service.resolveImage('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
    });

    it('passes through protocol-relative URLs unchanged', () => {
      expect(service.resolveImage('//example.com/img.jpg')).toBe('//example.com/img.jpg');
    });

    it('passes through data: URIs unchanged', () => {
      const dataUri = 'data:image/png;base64,AAAA';
      expect(service.resolveImage(dataUri)).toBe(dataUri);
    });

    it('trims surrounding whitespace before evaluating the value', () => {
      expect(service.resolveImage('   ')).toBe('assets/images/circuit-default.jpg');
    });
  });

  describe('get', () => {
    it('resolves a relative url without leading slash by adding one', () => {
      service.get(1).subscribe(result => {
        expect(result.url).toBe('/uploads/photo.jpg');
      });
      const req = httpMock.expectOne('/api/media/1');
      req.flush({ id: 1, url: 'uploads/photo.jpg' });
    });

    it('keeps an absolute url unchanged', () => {
      service.get(1).subscribe(result => {
        expect(result.url).toBe('https://res.cloudinary.com/demo/img.jpg');
      });
      const req = httpMock.expectOne('/api/media/1');
      req.flush({ id: 1, url: 'https://res.cloudinary.com/demo/img.jpg' });
    });
  });

  describe('getImageUrl', () => {
    it('returns the resolved url string directly', () => {
      service.getImageUrl(1).subscribe(url => {
        expect(url).toBe('/uploads/photo.jpg');
      });
      const req = httpMock.expectOne('/api/media/1');
      req.flush({ id: 1, url: '/uploads/photo.jpg' });
    });
  });

  describe('uploadImage', () => {
    it('posts the file as multipart/form-data to /api/media/upload', () => {
      const file = new File(['content'], 'photo.png', { type: 'image/png' });

      service.uploadImage(file).subscribe();

      const req = httpMock.expectOne('/api/media/upload');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush({ id: 1, url: '/uploads/photo.png' });
    });
  });
});
