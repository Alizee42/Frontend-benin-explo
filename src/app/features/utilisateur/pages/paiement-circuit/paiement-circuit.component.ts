import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ReservationCircuitDTO,
  ReservationsCircuitService
} from '../../../../services/reservations-circuit.service';
import { CircuitPaymentService } from '../../../../services/circuit-payment.service';
import {
  PayPalButtonsInstance,
  PayPalClientConfig,
  PayPalNamespace,
  PayPalSdkService
} from '../../../../services/paypal-sdk.service';

@Component({
  selector: 'app-paiement-circuit',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paiement-circuit.component.html',
  styleUrls: ['../paiement-hebergement/paiement-hebergement.component.scss']
})
export class PaiementCircuitComponent implements OnInit, AfterViewInit {
  @ViewChild('paypalButtonsContainer') paypalButtonsContainer?: ElementRef<HTMLDivElement>;

  reservation: ReservationCircuitDTO | null = null;
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
    private reservationsCircuitService: ReservationsCircuitService,
    private paymentService: CircuitPaymentService,
    private payPalSdkService: PayPalSdkService
  ) {}

  ngOnInit(): void {
    const reservationId = Number(this.route.snapshot.paramMap.get('reservationId'));
    this.returnOrderToken = this.route.snapshot.queryParamMap.get('token') || '';
    this.wasCancelledByPayPal = (this.route.snapshot.queryParamMap.get('paypal') || '').toLowerCase() === 'cancel';

    if (!Number.isFinite(reservationId) || reservationId <= 0) {
      this.errorMessage = 'Reservation introuvable pour ce paiement.';
      this.loading = false;
      return;
    }

    this.loadReservation(reservationId);
  }

  ngAfterViewInit(): void {
    this.tryRenderButtons();
  }

  get isPaid(): boolean {
    return (this.reservation?.statutPaiement || '').toUpperCase() === 'PAYE';
  }

  get canAttemptPayment(): boolean {
    if (!this.reservation?.id) {
      return false;
    }
    const paymentStatus = (this.reservation.statutPaiement || '').toUpperCase();
    const reservationStatus = (this.reservation.statut || 'EN_ATTENTE').toUpperCase();
    return reservationStatus !== 'ANNULEE' && paymentStatus !== 'PAYE' && paymentStatus !== 'REMBOURSE';
  }

  getTotalPrice(): number {
    return this.reservation?.prixTotal || 0;
  }

  getCfaEstimate(): number {
    return this.getTotalPrice() * 655.957;
  }

  getClientFullName(): string {
    const prenom = this.reservation?.prenom?.trim() || '';
    const nom = this.reservation?.nom?.trim() || '';
    return `${prenom} ${nom}`.trim() || 'Voyageur';
  }

  getReservationReference(): string {
    return this.reservation?.referenceReservation || 'Reservation';
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

    if (!this.reservation?.id) {
      return;
    }

    await this.loadPayPalSdk();
    setTimeout(() => this.tryRenderButtons(true));
  }

  private loadReservation(reservationId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.reservationsCircuitService.getMineById(reservationId).subscribe({
      next: async (reservation) => {
        this.reservation = reservation;
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
        this.errorMessage = 'Impossible de charger cette reservation pour le paiement.';
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

    if (!this.payPalNamespace || !this.paypalButtonsContainer?.nativeElement || !this.reservation?.id || !this.canAttemptPayment) {
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
              this.reservation!.id!,
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
            this.paymentService.captureOrder(this.reservation!.id!, data.orderID)
          );
          this.reservation = response.reservation;
          this.successMessage = 'Paiement valide avec succes. Votre circuit reste visible dans votre espace client.';
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
    if (!this.reservation?.id) {
      return;
    }

    this.paymentProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await firstValueFrom(
        this.paymentService.captureOrder(this.reservation.id, orderId)
      );
      this.reservation = response.reservation;
      this.successMessage = 'Paiement valide avec succes. Votre circuit reste visible dans votre espace client.';
      this.clearPayPalReturnQueryParams();
    } catch {
      this.errorMessage = 'Le paiement a ete approuve par PayPal, mais sa confirmation locale a echoue. Vous pouvez reessayer.';
    } finally {
      this.paymentProcessing = false;
    }
  }

  private buildPayPalReturnUrl(kind: 'success' | 'cancel'): string {
    if (!this.reservation?.id) {
      return window.location.href;
    }

    const tree = this.router.createUrlTree(
      ['/paiement/circuit', this.reservation.id],
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
