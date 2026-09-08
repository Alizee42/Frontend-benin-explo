import { TestBed } from '@angular/core/testing';

import { PayPalSdkService, PayPalClientConfig, PayPalNamespace } from './paypal-sdk.service';

/**
 * PayPalSdkService charge dynamiquement le SDK PayPal via une balise <script> injectee dans le
 * DOM. Jamais teste jusqu'ici : un bug ici (mauvaise URL, cache de promesse casse, gestion
 * d'erreur silencieuse) casserait le paiement en production sans qu'aucun test ne le detecte.
 */
describe('PayPalSdkService', () => {
  let service: PayPalSdkService;
  const fakePaypal: PayPalNamespace = { Buttons: () => ({ render: () => Promise.resolve() }) };

  const baseConfig: PayPalClientConfig = {
    enabled: true,
    sandbox: true,
    clientId: 'TEST-CLIENT-ID',
    currency: 'EUR',
    brandName: 'Benin Explo'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PayPalSdkService);
    delete (window as any).paypal;
    document.querySelectorAll('script[data-paypal-sdk="true"]').forEach(el => el.remove());
  });

  afterEach(() => {
    delete (window as any).paypal;
    document.querySelectorAll('script[data-paypal-sdk="true"]').forEach(el => el.remove());
  });

  function triggerScriptLoad(): void {
    const script = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    script?.onload?.(new Event('load'));
  }

  function triggerScriptError(): void {
    const script = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    script?.onerror?.(new Event('error'));
  }

  it('injects a script tag pointing to the PayPal SDK with the client id and currency', () => {
    service.load(baseConfig);

    const script = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    expect(script).not.toBeNull();
    expect(script!.src).toContain('client-id=TEST-CLIENT-ID');
    expect(script!.src).toContain('currency=EUR');
  });

  it('adds buyer-country=US only when sandbox is true', () => {
    service.load(baseConfig);
    let script = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    expect(script!.src).toContain('buyer-country=US');

    document.querySelectorAll('script[data-paypal-sdk="true"]').forEach(el => el.remove());
    service.load({ ...baseConfig, sandbox: false, clientId: 'OTHER-ID' });
    script = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    expect(script!.src).not.toContain('buyer-country');
  });

  it('resolves with window.paypal once the script has loaded', async () => {
    const promise = service.load(baseConfig);
    window.paypal = fakePaypal;
    triggerScriptLoad();

    const result = await promise;
    expect(result).toBe(fakePaypal);
  });

  it('rejects when the script fails to load', async () => {
    const promise = service.load(baseConfig);
    triggerScriptError();

    await expectAsync(promise).toBeRejectedWithError('Impossible de charger le SDK PayPal.');
  });

  it('rejects when the script loads but window.paypal is still undefined', async () => {
    const promise = service.load(baseConfig);
    triggerScriptLoad();

    await expectAsync(promise).toBeRejectedWithError('Le SDK PayPal n\'est pas disponible.');
  });

  it('reuses the same in-flight promise for a second load() call with the same config', () => {
    const promise1 = service.load(baseConfig);
    const promise2 = service.load(baseConfig);

    expect(promise1).toBe(promise2);
    expect(document.querySelectorAll('script[data-paypal-sdk="true"]').length).toBe(1);
  });

  it('returns window.paypal immediately without re-injecting a script if already loaded with the same config', async () => {
    const promise = service.load(baseConfig);
    window.paypal = fakePaypal;
    triggerScriptLoad();
    await promise;

    document.querySelectorAll('script[data-paypal-sdk="true"]').forEach(el => el.remove());
    const result = await service.load(baseConfig);

    expect(result).toBe(fakePaypal);
    expect(document.querySelectorAll('script[data-paypal-sdk="true"]').length).toBe(0);
  });

  it('reloads the SDK when the config (currency) changes', async () => {
    const promise = service.load(baseConfig);
    window.paypal = fakePaypal;
    triggerScriptLoad();
    await promise;

    const secondLoad = service.load({ ...baseConfig, currency: 'USD' });
    const script = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    expect(script!.src).toContain('currency=USD');

    triggerScriptLoad();
    await secondLoad;
  });
});
