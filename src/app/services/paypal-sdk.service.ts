import { Injectable } from '@angular/core';

export interface PayPalClientConfig {
  enabled: boolean;
  sandbox: boolean;
  clientId: string;
  currency: string;
  brandName: string;
}

export interface PayPalOrderApproveData {
  orderID: string;
}

export interface PayPalButtonsOptions {
  createOrder: () => Promise<string> | string;
  onApprove: (data: PayPalOrderApproveData) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}

export interface PayPalButtonsInstance {
  render: (container: HTMLElement | string) => Promise<void>;
  isEligible?: () => boolean;
  close?: () => Promise<void>;
}

export interface PayPalNamespace {
  Buttons: (options: PayPalButtonsOptions) => PayPalButtonsInstance;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

@Injectable({ providedIn: 'root' })
export class PayPalSdkService {
  private loadPromise: Promise<PayPalNamespace> | null = null;
  private currentScriptUrl = '';

  load(config: PayPalClientConfig): Promise<PayPalNamespace> {
    const scriptUrl = this.buildScriptUrl(config);

    if (window.paypal && this.currentScriptUrl === scriptUrl) {
      return Promise.resolve(window.paypal);
    }

    if (this.loadPromise && this.currentScriptUrl === scriptUrl) {
      return this.loadPromise;
    }

    this.currentScriptUrl = scriptUrl;
    this.loadPromise = new Promise<PayPalNamespace>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.dataset['paypalSdk'] = 'true';
      script.onload = () => {
        if (window.paypal) {
          resolve(window.paypal);
          return;
        }
        reject(new Error('Le SDK PayPal n\'est pas disponible.'));
      };
      script.onerror = () => reject(new Error('Impossible de charger le SDK PayPal.'));
      document.body.appendChild(script);
    });

    return this.loadPromise;
  }

  private buildScriptUrl(config: PayPalClientConfig): string {
    const params = new URLSearchParams({
      'client-id': config.clientId,
      currency: config.currency || 'EUR',
      intent: 'capture',
      components: 'buttons'
    });

    if (config.sandbox) {
      params.set('buyer-country', 'US');
    }

    return `https://www.paypal.com/sdk/js?${params.toString()}`;
  }
}
