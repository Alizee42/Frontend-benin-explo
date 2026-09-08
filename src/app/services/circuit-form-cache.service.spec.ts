import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CircuitFormCacheService } from './circuit-form-cache.service';
import { ZonesAdminService } from './zones-admin.service';
import { VillesService } from './villes.service';
import { ActivitesService } from './activites.service';

/**
 * CircuitFormCacheService a un TTL de 5 minutes (cache-then-network) pour les villes/activites
 * par zone, et un cache permanent pour les zones. Teste ici avec jasmine.clock() pour controler
 * le temps sans attendre reellement 5 minutes.
 */
describe('CircuitFormCacheService', () => {
  let service: CircuitFormCacheService;
  let zonesServiceSpy: jasmine.SpyObj<ZonesAdminService>;
  let villesServiceSpy: jasmine.SpyObj<VillesService>;
  let activitesServiceSpy: jasmine.SpyObj<ActivitesService>;

  beforeEach(() => {
    zonesServiceSpy = jasmine.createSpyObj('ZonesAdminService', ['getAll']);
    villesServiceSpy = jasmine.createSpyObj('VillesService', ['getByZone']);
    activitesServiceSpy = jasmine.createSpyObj('ActivitesService', ['getActivitesByZone']);

    zonesServiceSpy.getAll.and.returnValue(of([{ idZone: 1, nom: 'Sud' } as any]));
    villesServiceSpy.getByZone.and.returnValue(of([{ id: 1, nom: 'Cotonou' } as any]));
    activitesServiceSpy.getActivitesByZone.and.returnValue(of([{ id: 1, nom: 'Randonnee' } as any]));

    TestBed.configureTestingModule({
      providers: [
        { provide: ZonesAdminService, useValue: zonesServiceSpy },
        { provide: VillesService, useValue: villesServiceSpy },
        { provide: ActivitesService, useValue: activitesServiceSpy }
      ]
    });
    service = TestBed.inject(CircuitFormCacheService);
  });

  let clockInstalled = false;

  function installClock(): void {
    jasmine.clock().install();
    clockInstalled = true;
  }

  afterEach(() => {
    if (clockInstalled) {
      jasmine.clock().uninstall();
      clockInstalled = false;
    }
  });

  describe('getZones', () => {
    it('calls the API only once even when subscribed multiple times', () => {
      service.getZones().subscribe();
      service.getZones().subscribe();
      service.getZones().subscribe();

      expect(zonesServiceSpy.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getVillesForZone', () => {
    it('calls the API on first access and caches the result', () => {
      service.getVillesForZone(1).subscribe();
      service.getVillesForZone(1).subscribe();

      expect(villesServiceSpy.getByZone).toHaveBeenCalledTimes(1);
    });

    it('calls the API again after the TTL (5 minutes) has expired', () => {
      installClock();
      const baseTime = new Date();
      jasmine.clock().mockDate(baseTime);

      service.getVillesForZone(1).subscribe();
      expect(villesServiceSpy.getByZone).toHaveBeenCalledTimes(1);

      jasmine.clock().mockDate(new Date(baseTime.getTime() + 5 * 60 * 1000 + 1));

      service.getVillesForZone(1).subscribe();
      expect(villesServiceSpy.getByZone).toHaveBeenCalledTimes(2);
    });

    it('does not call the API again just before the TTL expires', () => {
      installClock();
      const baseTime = new Date();
      jasmine.clock().mockDate(baseTime);

      service.getVillesForZone(1).subscribe();
      jasmine.clock().mockDate(new Date(baseTime.getTime() + 5 * 60 * 1000 - 1));

      service.getVillesForZone(1).subscribe();
      expect(villesServiceSpy.getByZone).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateZoneCache', () => {
    it('forces a fresh API call for villes and activites of that zone', () => {
      service.getVillesForZone(1).subscribe();
      service.getActivitesForZone(1).subscribe();

      service.invalidateZoneCache(1);

      service.getVillesForZone(1).subscribe();
      service.getActivitesForZone(1).subscribe();

      expect(villesServiceSpy.getByZone).toHaveBeenCalledTimes(2);
      expect(activitesServiceSpy.getActivitesByZone).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('resets zones, villes and activites caches', () => {
      service.getZones().subscribe();
      service.getVillesForZone(1).subscribe();
      service.getActivitesForZone(1).subscribe();

      service.clearCache();

      service.getZones().subscribe();
      service.getVillesForZone(1).subscribe();
      service.getActivitesForZone(1).subscribe();

      expect(zonesServiceSpy.getAll).toHaveBeenCalledTimes(2);
      expect(villesServiceSpy.getByZone).toHaveBeenCalledTimes(2);
      expect(activitesServiceSpy.getActivitesByZone).toHaveBeenCalledTimes(2);
    });
  });

  describe('hasCachedDataForZone', () => {
    it('returns false when nothing is cached for the zone', () => {
      expect(service.hasCachedDataForZone(1)).toBeFalse();
    });

    it('returns true once both villes and activites are cached for the zone', () => {
      service.getVillesForZone(1).subscribe();
      service.getActivitesForZone(1).subscribe();

      expect(service.hasCachedDataForZone(1)).toBeTrue();
    });

    it('returns false when only villes are cached but not activites', () => {
      service.getVillesForZone(1).subscribe();

      expect(service.hasCachedDataForZone(1)).toBeFalse();
    });
  });
});
