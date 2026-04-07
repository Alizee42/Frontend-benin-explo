import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReservationHebergementIndisponibiliteDTO,
  ReservationHebergementService
} from '../../../../services/reservation-hebergement.service';
import { HebergementsService, HebergementDTO } from '../../../../services/hebergements.service';
import { ReservationHebergementDTO } from '../../../../models/reservation-hebergement.dto';
import { AuthService } from '../../../../services/auth.service';

interface CalendarMonthView {
  label: string;
  monthKey: string;
  weeks: (Date | null)[][];
}

@Component({
  selector: 'app-reservation-hebergement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-hebergement.component.html',
  styleUrls: ['./reservation-hebergement.component.v2.scss']
})
export class ReservationHebergementComponent implements OnInit {
  readonly weekDayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  hebergement: HebergementDTO | null = null;
  currentImageIndex = 0;
  currentStep = 1;
  totalSteps = 3;
  calendarOffset = 0;
  readonly visibleMonthCount = 2;
  calendarMonths: CalendarMonthView[] = [];
  bookedRanges: ReservationHebergementIndisponibiliteDTO[] = [];

  reservation: ReservationHebergementDTO = {
    hebergementId: 0,
    nomClient: '',
    prenomClient: '',
    emailClient: '',
    telephoneClient: '',
    dateArrivee: '',
    dateDepart: '',
    nombrePersonnes: 1,
    commentaires: ''
  };

  isLoading = false;
  isSubmitting = false;
  checkingAvailability = false;
  availabilityOk: boolean | null = null;
  errorMessage = '';
  successMessage = '';
  confirmationModalOpen = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private reservationService: ReservationHebergementService,
    private hebergementService: HebergementsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.prefillReservationFromAccount();
    this.refreshCalendarMonths();

    const hebergementId = Number(this.route.snapshot.params['id']);
    if (Number.isFinite(hebergementId) && hebergementId > 0) {
      this.loadHebergement(hebergementId);
      this.loadBookedRanges(hebergementId);
      this.reservation.hebergementId = hebergementId;
    } else {
      this.errorMessage = 'Hebergement invalide.';
    }
  }

  loadHebergement(id: number): void {
    this.isLoading = true;
    this.hebergementService.getById(id).subscribe({
      next: (hebergement: HebergementDTO) => {
        this.hebergement = hebergement;
        this.currentImageIndex = 0;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = "Erreur lors du chargement de l'hebergement";
        this.isLoading = false;
      }
    });
  }

  loadBookedRanges(hebergementId: number): void {
    this.reservationService.getBookedRangesByHebergement(hebergementId).subscribe({
      next: (ranges) => {
        this.bookedRanges = [...(ranges || [])]
          .filter((range) => !!range?.dateArrivee && !!range?.dateDepart)
          .sort((a, b) => a.dateArrivee.localeCompare(b.dateArrivee));
        this.refreshCalendarMonths();
      },
      error: () => {
        this.bookedRanges = [];
        this.refreshCalendarMonths();
      }
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }
    if (!this.hasValidStayDates()) {
      this.errorMessage = "La date de depart doit etre apres la date d'arrivee.";
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.create(this.reservation).subscribe({
      next: () => {
        this.successMessage = 'Votre reservation a ete creee avec succes.';
        this.confirmationModalOpen = true;
        this.isSubmitting = false;
      },
      error: (error: any) => {
        this.errorMessage = error?.error || 'Erreur lors de la creation de la reservation';
        this.isSubmitting = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.reservation.hebergementId > 0 &&
      this.reservation.nomClient &&
      this.reservation.prenomClient &&
      this.reservation.emailClient &&
      this.reservation.telephoneClient &&
      this.reservation.dateArrivee &&
      this.reservation.dateDepart &&
      this.reservation.nombrePersonnes > 0 &&
      this.hasValidStayDates()
    );
  }

  getTotalPrice(): number {
    const nights = this.getNombreNuits();
    if (!this.hebergement || nights <= 0) return 0;
    return nights * this.hebergement.prixParNuit;
  }

  getMinDateArrivee(): string {
    return this.toIsoDate(new Date());
  }

  getNombreNuits(): number {
    const arrival = this.parseDate(this.reservation.dateArrivee);
    const departure = this.parseDate(this.reservation.dateDepart);
    if (!arrival || !departure) return 0;
    const diffMs = departure.getTime() - arrival.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  getMinDateDepart(): string {
    if (!this.reservation.dateArrivee) return this.getMinDateArrivee();
    const dateArrivee = this.parseDate(this.reservation.dateArrivee);
    if (!dateArrivee) return this.getMinDateArrivee();
    return this.toIsoDate(this.addDays(dateArrivee, 1));
  }

  onArrivalInputChange(): void {
    if (this.reservation.dateDepart && this.reservation.dateDepart <= this.reservation.dateArrivee) {
      this.reservation.dateDepart = '';
    }
    this.errorMessage = '';
    this.availabilityOk = null;
    this.refreshCalendarMonths();
    this.onDateChange();
  }

  onDepartureInputChange(): void {
    this.errorMessage = '';
    this.availabilityOk = null;
    this.refreshCalendarMonths();
    this.onDateChange();
  }

  onDateChange(): void {
    this.availabilityOk = null;

    if (!this.reservation.dateArrivee || !this.reservation.dateDepart) return;
    if (!this.hasValidStayDates()) return;

    if (!this.canSelectDeparture(this.reservation.dateDepart)) {
      this.availabilityOk = false;
      this.errorMessage = "Ces dates ne sont pas disponibles pour cet hebergement.";
      return;
    }

    this.checkingAvailability = true;
    this.reservationService.checkDisponibilite(
      this.reservation.hebergementId,
      this.reservation.dateArrivee,
      this.reservation.dateDepart
    ).subscribe({
      next: (available) => {
        this.availabilityOk = available;
        this.checkingAvailability = false;
        if (!available) {
          this.errorMessage = "Ces dates ne sont pas disponibles pour cet hebergement.";
        } else {
          this.errorMessage = '';
        }
      },
      error: () => {
        this.checkingAvailability = false;
      }
    });
  }

  get hasMedias(): boolean { return this.imageUrls.length > 0; }
  get currentMediaUrl(): string | null { return this.hasMedias ? (this.imageUrls[this.currentImageIndex] ?? null) : null; }
  get imageUrls(): string[] { return this.hebergement ? this.hebergement.imageUrls || [] : []; }
  get hasBookedRanges(): boolean { return this.bookedRanges.length > 0; }
  get hasAccountPrefill(): boolean {
    const user = this.authService.getUser();
    return !!(user?.nom || user?.prenom || user?.email || user?.telephone);
  }
  get isAccountEmailLocked(): boolean { return !!this.authService.getUser()?.email; }

  previousImage(): void {
    if (!this.hasMedias) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
  }

  nextImage(): void {
    if (!this.hasMedias) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.imageUrls.length;
  }

  setCurrentImage(index: number): void {
    if (!this.hasMedias) return;
    if (index >= 0 && index < this.imageUrls.length) this.currentImageIndex = index;
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.errorMessage = '';
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.errorMessage = '';
    }
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return !!(this.reservation.nomClient && this.reservation.prenomClient && this.reservation.emailClient && this.reservation.telephoneClient);
    }
    if (step === 2) {
      const datesOk = !!(this.reservation.dateArrivee && this.reservation.dateDepart && this.reservation.nombrePersonnes > 0 && this.hasValidStayDates());
      return datesOk && this.availabilityOk !== false;
    }
    if (step === 3) {
      return this.isFormValid();
    }
    return false;
  }

  canProceedToNext(): boolean {
    return this.isStepValid(this.currentStep);
  }

  canOpenStep(step: number): boolean {
    if (step <= 1) return true;
    if (step <= this.currentStep) return true;
    for (let i = 1; i < step; i++) {
      if (!this.isStepValid(i)) return false;
    }
    return true;
  }

  hasValidStayDates(): boolean {
    return this.getNombreNuits() > 0;
  }

  closeConfirmationModal(destination: 'stay' | 'hebergements' | 'reservations' = 'stay'): void {
    this.confirmationModalOpen = false;
    if (destination === 'hebergements') {
      this.router.navigate(['/hebergements']);
      return;
    }
    if (destination === 'reservations') {
      this.router.navigate(['/mes-reservations']);
    }
  }

  previousCalendarMonths(): void {
    if (this.calendarOffset <= 0) return;
    this.calendarOffset--;
    this.refreshCalendarMonths();
  }

  nextCalendarMonths(): void {
    this.calendarOffset++;
    this.refreshCalendarMonths();
  }

  canGoPreviousCalendar(): boolean {
    return this.calendarOffset > 0;
  }

  getUpcomingBookedRanges(): ReservationHebergementIndisponibiliteDTO[] {
    const today = this.getMinDateArrivee();
    return this.bookedRanges
      .filter((range) => range.dateDepart >= today)
      .slice(0, 4);
  }

  getCalendarHint(): string {
    if (!this.reservation.dateArrivee || this.reservation.dateDepart) {
      return "Cliquez d'abord sur votre date d'arrivee, puis sur votre date de depart.";
    }
    return 'Date d arrivee selectionnee. Choisissez maintenant votre date de depart.';
  }

  formatDisplayDate(value: string): string {
    const date = this.parseDate(value);
    if (!date) return value;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  onCalendarDateClick(day: Date | null): void {
    if (!day) return;

    const iso = this.toIsoDate(day);
    const selectingArrival = !this.reservation.dateArrivee || !!this.reservation.dateDepart;

    if (selectingArrival) {
      if (!this.canSelectArrival(iso)) return;
      this.reservation.dateArrivee = iso;
      this.reservation.dateDepart = '';
      this.errorMessage = '';
      this.availabilityOk = null;
      this.refreshCalendarMonths();
      return;
    }

    if (iso <= this.reservation.dateArrivee) {
      if (!this.canSelectArrival(iso)) return;
      this.reservation.dateArrivee = iso;
      this.reservation.dateDepart = '';
      this.errorMessage = '';
      this.availabilityOk = null;
      this.refreshCalendarMonths();
      return;
    }

    if (!this.canSelectDeparture(iso)) {
      this.availabilityOk = false;
      this.errorMessage = "La plage selectionnee chevauche des dates deja reservees.";
      return;
    }

    this.reservation.dateDepart = iso;
    this.errorMessage = '';
    this.availabilityOk = null;
    this.refreshCalendarMonths();
    this.onDateChange();
  }

  clearSelectedDates(): void {
    this.reservation.dateArrivee = '';
    this.reservation.dateDepart = '';
    this.availabilityOk = null;
    this.errorMessage = '';
    this.refreshCalendarMonths();
  }

  canSelectCalendarDate(day: Date | null): boolean {
    if (!day) return false;

    const iso = this.toIsoDate(day);
    const selectingArrival = !this.reservation.dateArrivee || !!this.reservation.dateDepart;

    if (selectingArrival) {
      return this.canSelectArrival(iso);
    }

    if (iso <= this.reservation.dateArrivee) {
      return this.canSelectArrival(iso);
    }

    return this.canSelectDeparture(iso);
  }

  getCalendarDayClasses(day: Date | null): Record<string, boolean> {
    if (!day) {
      return { 'calendar-day--empty': true };
    }

    const iso = this.toIsoDate(day);
    const isSelectedStart = this.reservation.dateArrivee === iso;
    const isSelectedEnd = this.reservation.dateDepart === iso;
    const isSelectedRange = !!(
      this.reservation.dateArrivee &&
      this.reservation.dateDepart &&
      iso > this.reservation.dateArrivee &&
      iso < this.reservation.dateDepart
    );

    return {
      'calendar-day--today': iso === this.getMinDateArrivee(),
      'calendar-day--past': this.isPastDate(iso),
      'calendar-day--booked': this.isBookedNight(iso),
      'calendar-day--arrival-marker': this.isArrivalMarker(iso),
      'calendar-day--departure-marker': this.isDepartureMarker(iso),
      'calendar-day--selected-start': isSelectedStart,
      'calendar-day--selected-end': isSelectedEnd,
      'calendar-day--selected-range': isSelectedRange,
      'calendar-day--interactive': this.canSelectCalendarDate(day)
    };
  }

  private canSelectArrival(isoDate: string): boolean {
    return !this.isPastDate(isoDate) && !this.isBookedNight(isoDate);
  }

  private canSelectDeparture(isoDate: string): boolean {
    if (!this.reservation.dateArrivee) return false;
    if (isoDate <= this.reservation.dateArrivee) return false;
    return !this.bookedRanges.some((range) =>
      this.reservation.dateArrivee! < range.dateDepart && isoDate > range.dateArrivee
    );
  }

  private isBookedNight(isoDate: string): boolean {
    return this.bookedRanges.some((range) => isoDate >= range.dateArrivee && isoDate < range.dateDepart);
  }

  private isArrivalMarker(isoDate: string): boolean {
    return this.bookedRanges.some((range) => range.dateArrivee === isoDate);
  }

  private isDepartureMarker(isoDate: string): boolean {
    return this.bookedRanges.some((range) => range.dateDepart === isoDate);
  }

  private isPastDate(isoDate: string): boolean {
    return isoDate < this.getMinDateArrivee();
  }

  private refreshCalendarMonths(): void {
    const currentMonth = this.startOfMonth(new Date());
    this.calendarMonths = Array.from({ length: this.visibleMonthCount }, (_, index) => {
      const monthDate = this.addMonths(currentMonth, this.calendarOffset + index);
      return this.buildCalendarMonth(monthDate);
    });
  }

  private buildCalendarMonth(monthDate: Date): CalendarMonthView {
    return {
      label: monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      monthKey: `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`,
      weeks: this.buildMonthWeeks(monthDate)
    };
  }

  private buildMonthWeeks(monthDate: Date): (Date | null)[][] {
    const firstDay = this.startOfMonth(monthDate);
    const firstWeekday = this.getMondayFirstWeekday(firstDay);
    const daysInMonth = this.getDaysInMonth(monthDate);
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = Array.from({ length: firstWeekday }, () => null);

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(this.createDate(monthDate.getFullYear(), monthDate.getMonth(), day));

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }

  private createDate(year: number, monthIndex: number, day: number): Date {
    const date = new Date(year, monthIndex, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private startOfMonth(date: Date): Date {
    return this.createDate(date.getFullYear(), date.getMonth(), 1);
  }

  private addMonths(date: Date, months: number): Date {
    return this.createDate(date.getFullYear(), date.getMonth() + months, 1);
  }

  private addDays(date: Date, days: number): Date {
    return this.createDate(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private getMondayFirstWeekday(date: Date): number {
    const weekday = date.getDay();
    return weekday === 0 ? 6 : weekday - 1;
  }

  private prefillReservationFromAccount(): void {
    const user = this.authService.getUser();

    if (!user) {
      return;
    }

    this.reservation.nomClient = this.reservation.nomClient || user.nom || '';
    this.reservation.prenomClient = this.reservation.prenomClient || user.prenom || '';
    this.reservation.emailClient = user.email || this.reservation.emailClient;
    this.reservation.telephoneClient = this.reservation.telephoneClient || user.telephone || '';
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    const date = this.createDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
