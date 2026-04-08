import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  CircuitPersonnaliseDTO,
  CircuitsPersonnalisesService
} from '../../../../services/circuits-personnalises.service';
import { CircuitPersonnalisePaymentService } from '../../../../services/circuit-personnalise-payment.service';
import {
  PayPalButtonsInstance,
  PayPalClientConfig,
  PayPalNamespace,
  PayPalSdkService
} from '../../../../services/paypal-sdk.service';

@Component({
  selector: 'app-paiement-circuit-personnalise',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paiement-circuit-personnalise.component.html',
  styleUrls: ['../paiement-hebergement/paiement-hebergement.component.scss']
})
export class PaiementCircuitPersonnaliseComponent implements OnInit, AfterViewInit {
  @ViewChild('paypalButtonsContainer') paypalButtonsContainer?: ElementRef<HTMLDivElement>;

  demande: CircuitPersonnaliseDTO | null = null;
  payPalConfig: PayPalClientConfig | null = null;

  loading = true;
  sdkLoading = false;
  paymentProcessing = false;
  buttonsRendered = false;
  buttonsUnavailable = false;
  successMessage = '';
  errorMessage = '';
  private returnOrderToken = '';
  private wasCancelledByPayPal = false;

  private payPalNamespace: PayPalNamespace | null = null;
  private payPalButtonsInstance: PayPalButtonsInstance | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private circuitsPersonnalisesService: CircuitsPersonnalisesService,
    private paymentService: CircuitPersonnalisePaymentService,
    private payPalSdkService: PayPalSdkService
  ) {}

  ngOnInit(): void {
    const demandeId = Number(this.route.snapshot.paramMap.get('demandeId'));
    this.returnOrderToken = this.route.snapshot.queryParamMap.get('token') || '';
    this.wasCancelledByPayPal = (this.route.snapshot.queryParamMap.get('paypal') || '').toLowerCase() === 'cancel';

    if (!Number.isFinite(demandeId) || demandeId <= 0) {
      this.errorMessage = 'Devis introuvable pour ce paiement.';
      this.loading = false;
      return;
    }

    this.loadDemande(demandeId);
  }

  ngAfterViewInit(): void {
    this.tryRenderButtons();
  }

  get isPaid(): boolean {
    return (this.demande?.statutPaiement || '').toUpperCase() === 'PAYE';
  }

  get canAttemptPayment(): boolean {
    if (!this.demande?.id) {
      return false;
    }
    const paymentStatus = (this.demande.statutPaiement || '').toUpperCase();
    const demandeStatus = (this.demande.statut || 'EN_ATTENTE').toUpperCase();
    return demandeStatus === 'ACCEPTE' && paymentStatus !== 'PAYE' && paymentStatus !== 'REMBOURSE' && this.getTotalPrice() > 0;
  }

  getTotalPrice(): number {
    return this.demande?.prixFinal || 0;
  }

  getCfaEstimate(): number {
    return this.getTotalPrice() * 655.957;
  }

  getClientFullName(): string {
    const prenom = this.demande?.prenomClient?.trim() || '';
    const nom = this.demande?.nomClient?.trim() || '';
    return `${prenom} ${nom}`.trim() || 'Voyageur';
  }

  getReservationReference(): string {
    return this.demande?.referenceReservation || 'Devis';
  }

  get payPalCurrency(): string {
    return (this.payPalConfig?.currency || 'EUR').toUpperCase();
  }

  get isSandboxCurrencyMismatch(): boolean {
    return !!this.payPalConfig?.sandbox && this.payPalCurrency !== 'EUR';
  }

  getPaymentStatusLabel(statut?: string): string {
    switch ((statut || '').toUpperCase()) {
      case 'PAYE':
        return 'Paye';
      case 'EN_COURS':
        return 'En cours';
      case 'ECHEC':
        return 'Echec';
      case 'REMBOURSE':
        return 'Rembourse';
      default:
        return 'A payer';
    }
  }

  getPaymentStatusClass(statut?: string): string {
    switch ((statut || '').toUpperCase()) {
      case 'PAYE':
        return 'badge-success';
      case 'EN_COURS':
        return 'badge-info';
      case 'ECHEC':
        return 'badge-danger';
      case 'REMBOURSE':
        return 'badge-secondary';
      default:
        return 'badge-warning';
    }
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  }

  formatPayPalAmount(): string {
    return this.formatAmount(this.getTotalPrice(), this.payPalCurrency);
  }

  formatAmount(value: number, currency = 'EUR'): string {
    return `${value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency.toUpperCase()}`;
  }

  async retryPayment(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.buttonsRendered = false;
    this.buttonsUnavailable = false;

    if (!this.demande?.id) {
      return;
    }

    await this.loadPayPalSdk();
    setTimeout(() => this.tryRenderButtons(true));
  }

  private loadDemande(demandeId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.circuitsPersonnalisesService.getMineDemandeById(demandeId).subscribe({
      next: async (demande) => {
        this.demande = demande;
        this.loading = false;

        if (this.wasCancelledByPayPal) {
          this.errorMessage = 'Le paiement PayPal a ete annule. Vous pouvez relancer le paiement.';
          this.clearPayPalReturnQueryParams();
        }

        if (this.returnOrderToken && !this.isPaid && this.canAttemptPayment) {
          await this.captureReturnedOrder(this.returnOrderToken);
          return;
        }

        if (this.isPaid || !this.canAttemptPayment) {
          return;
        }

        await this.loadPayPalSdk();
        setTimeout(() => this.tryRenderButtons());
      },
      error: () => {
        this.errorMessage = 'Impossible de charger ce devis pour le paiement.';
        this.loading = false;
      }
    });
  }

  private async loadPayPalSdk(): Promise<void> {
    if (this.payPalNamespace || !this.canAttemptPayment) {
      return;
    }

    this.sdkLoading = true;
    try {
      this.payPalConfig = await firstValueFrom(this.paymentService.getConfig());
      if (!this.payPalConfig?.enabled || !this.payPalConfig.clientId) {
        this.errorMessage = 'Le paiement PayPal n\'est pas encore configure sur cette plateforme.';
        return;
      }

      this.payPalNamespace = await this.payPalSdkService.load(this.payPalConfig);
    } catch {
      this.errorMessage = 'Impossible de charger PayPal pour le moment.';
    } finally {
      this.sdkLoading = false;
    }
  }

  private tryRenderButtons(force = false): void {
    if (!force && (this.buttonsRendered || this.sdkLoading || this.paymentProcessing)) {
      return;
    }

    if (!this.payPalNamespace || !this.paypalButtonsContainer?.nativeElement || !this.demande?.id || !this.canAttemptPayment) {
      return;
    }

    const container = this.paypalButtonsContainer.nativeElement;
    container.innerHTML = '';
    this.buttonsUnavailable = false;
    this.errorMessage = '';

    const buttons = this.payPalNamespace.Buttons({
      createOrder: async () => {
        this.errorMessage = '';
        try {
          const response = await firstValueFrom(
            this.paymentService.createOrder(
              this.demande!.id!,
              this.buildPayPalReturnUrl('success'),
              this.buildPayPalReturnUrl('cancel')
            )
          );
          return response.orderId;
        } catch (err: any) {
          const msg: string =
            err?.error?.message ||
            err?.message ||
            'Impossible de creer la commande PayPal.';
          this.errorMessage = msg;
          throw new Error(msg);
        }
      },
      onApprove: async (data) => {
        this.paymentProcessing = true;
        this.errorMessage = '';
        try {
          const response = await firstValueFrom(
            this.paymentService.captureOrder(this.demande!.id!, data.orderID)
          );
          this.demande = response.demande;
          this.successMessage = 'Paiement valide avec succes. Votre devis reste visible dans votre espace client.';
          this.buttonsRendered = false;
          container.innerHTML = '';
        } catch (err: any) {
          this.errorMessage =
            err?.error?.message ||
            err?.message ||
            'Le paiement n\'a pas pu etre finalise. Vous pouvez reessayer.';
        } finally {
          this.paymentProcessing = false;
        }
      },
      onCancel: () => {
        this.errorMessage = 'Le paiement a ete interrompu avant la validation finale.';
      },
      onError: (err: any) => {
        if (!this.errorMessage) {
          this.errorMessage = 'Impossible de lancer le paiement PayPal pour le moment.';
        }
        console.error('[PayPal onError]', err);
      }
    });

    if (buttons.isEligible && !buttons.isEligible()) {
      this.buttonsUnavailable = true;
      return;
    }

    this.payPalButtonsInstance = buttons;
    buttons.render(container)
      .then(() => {
        this.buttonsRendered = true;
      })
      .catch(() => {
        this.buttonsUnavailable = true;
        this.errorMessage = 'Le bouton PayPal n\'a pas pu etre affiche.';
      });
  }

  private async captureReturnedOrder(orderId: string): Promise<void> {
    if (!this.demande?.id) {
      return;
    }

    this.paymentProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await firstValueFrom(
        this.paymentService.captureOrder(this.demande.id, orderId)
      );
      this.demande = response.demande;
      this.successMessage = 'Paiement valide avec succes. Votre devis reste visible dans votre espace client.';
      this.clearPayPalReturnQueryParams();
    } catch {
      this.errorMessage = 'Le paiement a ete approuve par PayPal, mais sa confirmation locale a echoue. Vous pouvez reessayer.';
    } finally {
      this.paymentProcessing = false;
    }
  }

  private buildPayPalReturnUrl(kind: 'success' | 'cancel'): string {
    if (!this.demande?.id) {
      return window.location.href;
    }

    const tree = this.router.createUrlTree(
      ['/paiement/circuit-personnalise', this.demande.id],
      { queryParams: { paypal: kind } }
    );

    return new URL(this.router.serializeUrl(tree), window.location.origin).toString();
  }

  private clearPayPalReturnQueryParams(): void {
    if (!this.returnOrderToken && !this.wasCancelledByPayPal) {
      return;
    }

    this.returnOrderToken = '';
    this.wasCancelledByPayPal = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }
}
