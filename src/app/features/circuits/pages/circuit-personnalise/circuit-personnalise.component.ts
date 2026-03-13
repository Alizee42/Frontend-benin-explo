import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CircuitsPersonnalisesService, CircuitPersonnaliseDTO, JourDTO } from '../../../../services/circuits-personnalises.service';
import { ZonesService, Zone as ApiZone } from '../../../../services/zones.service';
import { ActivitesService, Activite as ApiActivite } from '../../../../services/activites.service';
import { VillesService, VilleDTO } from '../../../../services/villes.service';
import { HebergementsService, HebergementDTO } from '../../../../services/hebergements.service';
import { ReservationHebergementService } from '../../../../services/reservation-hebergement.service';
import { TarifsCircuitPersonnaliseDTO, TarifsCircuitPersonnaliseService } from '../../../../services/tarifs-circuit-personnalise.service';

interface Zone extends ApiZone {}

interface Activite extends ApiActivite {}

interface Jour {
  numero: number;
  zoneId: number | null;
  villeId: number | null;
  activites: number[];
  villes?: VilleDTO[];
}

interface OptionsGenerales {
  transport: string;
  guide: boolean;
  chauffeur: boolean;
  pensionComplete: boolean;
}

interface DemandeCircuit {
  nombreJours: number;
  nombrePersonnes: number;
  jours: Jour[];
  options: OptionsGenerales;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
}

@Component({
  selector: 'app-circuit-personnalise',
  imports: [CommonModule, FormsModule],
  templateUrl: './circuit-personnalise.component.html',
  styleUrl: './circuit-personnalise.component.scss'
})
export class CircuitPersonnaliseComponent {
  private router = inject(Router);
  private circuitsPersonnalisesService = inject(CircuitsPersonnalisesService);
  private zonesService = inject(ZonesService);
  private activitesService = inject(ActivitesService);
  private villesService = inject(VillesService);
  private hebergementsService = inject(HebergementsService);
  private reservationHebergementService = inject(ReservationHebergementService);
  private tarifsCircuitPersonnaliseService = inject(TarifsCircuitPersonnaliseService);

  private readonly DAILY_MINUTES_LIMIT = 12 * 60;
  private readonly ACTIVITES_PAGE_SIZE = 6;
  private hebergementAvailabilityRequestId = 0;

  etape = 1;

  zones: Zone[] = [];
  villes: VilleDTO[] = [];
  hebergements: HebergementDTO[] = [];
  activites: Activite[] = [];
  tarifsOptions: TarifsCircuitPersonnaliseDTO | null = null;

  transports: string[] = [
    'Voiture compacte (1-2 personnes)',
    'Voiture familiale (3-4 personnes)',
    'Minibus (5-8 personnes)',
    'Bus touristique (9+ personnes)'
  ];

  nombreJours = 1;
  nombrePersonnes = 1;
  jours: Jour[] = [];
  activeJourIndex = 0;
  activitesPageByJour: Record<number, number> = {};
  options: OptionsGenerales = {
    transport: '',
    guide: false,
    chauffeur: false,
    pensionComplete: false
  };
  hebergementMode: 'auto' | 'choisir' = 'auto';
  selectedHebergementId: number | null = null;
  hebergementDateArrivee = '';
  hebergementDateDepart = '';
  isCheckingHebergementAvailability = false;
  hebergementAvailability: boolean | null = null;
  hebergementAvailabilityMessage = '';
  optionsErrorMessage = '';
  etape2ErrorMessage = '';

  demande: DemandeCircuit = {
    nombreJours: 1,
    nombrePersonnes: 1,
    jours: [],
    options: this.options,
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    message: ''
  };

  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  submitErrorMessage = '';
  catalogLoading = true;
  catalogNotices: string[] = [];
  joursExpanded = false;
  imageModalOpen = false;
  imageModalUrl: string | null = null;

  constructor() {
    this.initialiserJours();
    this.chargerDonnees();
  }

  get catalogNoticeText(): string {
    return this.catalogNotices.join(' ');
  }

  private chargerDonnees(): void {
    const notices: string[] = [];
    this.catalogLoading = true;
    this.catalogNotices = [];

    forkJoin({
      zones: this.zonesService.getAllZones().pipe(
        catchError((err) => {
          console.error('Erreur chargement zones pour circuit personnalise', err);
          notices.push('Les zones ne peuvent pas etre chargees pour le moment.');
          return of([] as Zone[]);
        })
      ),
      activites: this.activitesService.getAllActivites().pipe(
        catchError((err) => {
          console.error('Erreur chargement activites pour circuit personnalise', err);
          notices.push('Les activites ne peuvent pas etre chargees pour le moment.');
          return of([] as Activite[]);
        })
      ),
      villes: this.villesService.getAll().pipe(
        catchError((err) => {
          console.error('Erreur chargement villes pour circuit personnalise', err);
          notices.push('Les villes ne peuvent pas etre chargees pour le moment.');
          return of([] as VilleDTO[]);
        })
      ),
      hebergements: this.hebergementsService.getAll().pipe(
        catchError((err) => {
          console.error('Erreur chargement hebergements pour circuit personnalise', err);
          notices.push('Les hebergements ne peuvent pas etre charges pour le moment.');
          return of([] as HebergementDTO[]);
        })
      ),
      tarifs: this.tarifsCircuitPersonnaliseService.getCurrent().pipe(
        catchError((err) => {
          console.error('Erreur chargement tarifs circuit personnalise', err);
          notices.push('Les tarifs de transport et services seront confirmes par notre equipe.');
          return of(null as TarifsCircuitPersonnaliseDTO | null);
        })
      )
    }).subscribe(({ zones, activites, villes, hebergements, tarifs }) => {
      this.zones = zones ?? [];
      this.activites = activites ?? [];
      this.villes = villes ?? [];
      this.hebergements = hebergements ?? [];
      this.tarifsOptions = tarifs;
      this.jours.forEach((jour) => {
        jour.villes = this.getVillesForZone(jour.zoneId);
      });
      this.catalogLoading = false;
      this.catalogNotices = notices;
      this.syncHebergementSelectionAfterCatalogLoad();
    });
  }

  private syncHebergementSelectionAfterCatalogLoad(): void {
    if (this.hebergementMode === 'choisir') {
      this.checkHebergementAvailability();
    }
  }

  initialiserJours(): void {
    this.jours = [];
    this.activitesPageByJour = {};
    for (let i = 1; i <= this.nombreJours; i++) {
      this.jours.push({
        numero: i,
        zoneId: null,
        villeId: null,
        activites: [],
        villes: this.villes
      });
      this.activitesPageByJour[i] = 1;
    }
    this.activeJourIndex = 0;
  }

  changerNombreJours(): void {
    this.initialiserJours();
    this.etape2ErrorMessage = '';
  }

  selectJour(index: number): void {
    this.activeJourIndex = index;
    this.ensureActivitesPageInRange(index);
    this.etape2ErrorMessage = '';
  }

  onZoneChange(jour: Jour, zoneId: number | null): void {
    jour.zoneId = zoneId;
    jour.villeId = null;
    jour.activites = [];
    jour.villes = this.getVillesForZone(zoneId);
    this.resetActivitesPagination(this.activeJourIndex);
    this.etape2ErrorMessage = '';
  }

  onVilleChange(jour: Jour, villeId: number | null): void {
    jour.villeId = villeId;
    jour.activites = [];
    this.resetActivitesPagination(this.activeJourIndex);
    this.etape2ErrorMessage = '';
  }

  getVillesForZone(zoneId: number | null): VilleDTO[] {
    if (!zoneId) {
      return this.villes;
    }
    return this.villes.filter((ville) => ville.zoneId === zoneId);
  }

  private getActiviteDurationMinutes(activite: Activite): number {
    const minutes = (activite as any).dureeMinutes != null
      ? Number((activite as any).dureeMinutes)
      : (activite.duree != null ? Math.round(Number(activite.duree) * 60) : 0);
    return Number.isNaN(minutes) ? 0 : minutes;
  }

  toggleActivite(jourIndex: number, activite: Activite): void {
    const jour = this.jours[jourIndex];
    const activiteIndex = jour.activites.indexOf(activite.id);

    if (activiteIndex > -1) {
      jour.activites.splice(activiteIndex, 1);
      return;
    }

    if (jour.activites.length >= 5) {
      alert('Maximum 5 activites par jour.');
      return;
    }

    const currentTotal = jour.activites.reduce((sum, id) => {
      const selectedActivite = this.activites.find((item) => item.id === id);
      return sum + (selectedActivite ? this.getActiviteDurationMinutes(selectedActivite) : 0);
    }, 0);

    const newTotal = currentTotal + this.getActiviteDurationMinutes(activite);
    if (newTotal > this.DAILY_MINUTES_LIMIT) {
      const heuresMax = this.DAILY_MINUTES_LIMIT / 60;
      alert(`Vous depassez la duree maximale de ${heuresMax}h d activites pour une journee.`);
      return;
    }

    jour.activites.push(activite.id);
    this.etape2ErrorMessage = '';
  }

  isActiviteSelected(jourIndex: number, activite: Activite): boolean {
    return this.jours[jourIndex].activites.includes(activite.id);
  }

  getActivitesDisponibles(jourIndex: number): Activite[] {
    const jour = this.jours[jourIndex];
    if (!jour) {
      return [];
    }

    let disponibles = this.activites;

    if (jour.zoneId) {
      disponibles = disponibles.filter((activite) => activite.zoneId === jour.zoneId);
    }

    if (jour.villeId) {
      disponibles = disponibles.filter((activite) => activite.villeId === jour.villeId);
    }

    return disponibles;
  }

  hasActivitesDisponibles(jourIndex: number): boolean {
    return this.getActivitesDisponibles(jourIndex).length > 0;
  }

  getPaginatedActivitesDisponibles(jourIndex: number): Activite[] {
    const activites = this.getActivitesDisponibles(jourIndex);
    const currentPage = this.getCurrentActivitesPage(jourIndex);
    const start = (currentPage - 1) * this.ACTIVITES_PAGE_SIZE;
    return activites.slice(start, start + this.ACTIVITES_PAGE_SIZE);
  }

  getActivitesTotalPages(jourIndex: number): number {
    const total = this.getActivitesDisponibles(jourIndex).length;
    return Math.max(1, Math.ceil(total / this.ACTIVITES_PAGE_SIZE));
  }

  getCurrentActivitesPage(jourIndex: number): number {
    const key = this.getJourPaginationKey(jourIndex);
    const totalPages = this.getActivitesTotalPages(jourIndex);
    const currentPage = this.activitesPageByJour[key] ?? 1;
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    this.activitesPageByJour[key] = safePage;
    return safePage;
  }

  getActivitesRangeLabel(jourIndex: number): string {
    const total = this.getActivitesDisponibles(jourIndex).length;
    if (total === 0) {
      return '0 activite';
    }
    const currentPage = this.getCurrentActivitesPage(jourIndex);
    const start = (currentPage - 1) * this.ACTIVITES_PAGE_SIZE + 1;
    const end = Math.min(start + this.ACTIVITES_PAGE_SIZE - 1, total);
    return `${start}-${end} sur ${total} activite${total > 1 ? 's' : ''}`;
  }

  getActivitesPageNumbers(jourIndex: number): number[] {
    return Array.from({ length: this.getActivitesTotalPages(jourIndex) }, (_, index) => index + 1);
  }

  changeActivitesPage(jourIndex: number, nextPage: number): void {
    const key = this.getJourPaginationKey(jourIndex);
    const totalPages = this.getActivitesTotalPages(jourIndex);
    this.activitesPageByJour[key] = Math.min(Math.max(nextPage, 1), totalPages);
  }

  calculerPrixActivitesTotal(): number {
    let total = 0;
    this.jours.forEach((jour) => {
      jour.activites.forEach((id) => {
        const activite = this.activites.find((item) => item.id === id);
        if (activite && activite.prix != null) {
          total += activite.prix;
        }
      });
    });
    return total;
  }

  calculerPrixHebergementTotal(): number {
    const hebergement = this.getSelectedHebergement();
    const nuits = this.getNombreNuitsHebergement();
    if (!hebergement || nuits <= 0) {
      return 0;
    }
    return hebergement.prixParNuit * nuits;
  }

  calculerPrixTransportTotal(): number {
    if (!this.options.transport) {
      return 0;
    }
    return this.getTransportDailyRate(this.options.transport) * this.getBillableDays();
  }

  calculerPrixGuideTotal(): number {
    if (!this.options.guide) {
      return 0;
    }
    return this.getTarifValue(this.tarifsOptions?.guideParJour) * this.getBillableDays();
  }

  calculerPrixChauffeurTotal(): number {
    if (!this.options.chauffeur) {
      return 0;
    }
    return this.getTarifValue(this.tarifsOptions?.chauffeurParJour) * this.getBillableDays();
  }

  calculerPrixPensionCompleteTotal(): number {
    if (!this.options.pensionComplete) {
      return 0;
    }
    return this.getTarifValue(this.tarifsOptions?.pensionCompleteParPersonneParJour)
      * this.getBillableDays()
      * Math.max(this.nombrePersonnes, 0);
  }

  calculerPrixTotalEstime(): number {
    return this.calculerPrixActivitesTotal()
      + this.calculerPrixHebergementTotal()
      + this.calculerPrixTransportTotal()
      + this.calculerPrixGuideTotal()
      + this.calculerPrixChauffeurTotal()
      + this.calculerPrixPensionCompleteTotal();
  }

  formatPrixBadge(prix?: number): string {
    if (prix == null || Number.isNaN(prix)) {
      return '';
    }
    const rounded = Math.max(0, Math.round(prix));
    return rounded > 999 ? '999+' : String(rounded);
  }

  getZoneNames(jour: Jour): string {
    if (!jour.zoneId) {
      return '';
    }
    const zone = this.zones.find((item) => item.idZone === jour.zoneId);
    return zone ? zone.nom : '';
  }

  getActiviteNames(jour: Jour): string {
    return jour.activites
      .map((id) => this.activites.find((activite) => activite.id === id)?.nom)
      .filter((name): name is string => !!name)
      .join(', ');
  }

  getActiviteById(id: number): Activite | undefined {
    return this.activites.find((activite) => activite.id === id);
  }

  getTransportsDisponibles(): string[] {
    if (this.nombrePersonnes <= 2) {
      return [this.transports[0]];
    }
    if (this.nombrePersonnes <= 4) {
      return [this.transports[0], this.transports[1]];
    }
    if (this.nombrePersonnes <= 8) {
      return [this.transports[1], this.transports[2]];
    }
    return [this.transports[2], this.transports[3]];
  }

  getTransportDailyRate(transportLabel: string): number {
    if (!this.tarifsOptions) {
      return 0;
    }

    const normalized = transportLabel.toLowerCase();
    if (normalized.includes('compact')) {
      return this.getTarifValue(this.tarifsOptions.transportCompactParJour);
    }
    if (normalized.includes('famil')) {
      return this.getTarifValue(this.tarifsOptions.transportFamilialParJour);
    }
    if (normalized.includes('minibus')) {
      return this.getTarifValue(this.tarifsOptions.transportMinibusParJour);
    }
    if (normalized.includes('bus')) {
      return this.getTarifValue(this.tarifsOptions.transportBusParJour);
    }

    return 0;
  }

  getTransportRateLabel(transportLabel: string): string {
    if (!this.tarifsOptions) {
      return 'Tarif a confirmer';
    }
    return `${this.getTransportDailyRate(transportLabel).toFixed(2)} ${this.getPricingCurrencyLabel()}/jour`;
  }

  getGuideRateLabel(): string {
    if (!this.tarifsOptions) {
      return 'Tarif a confirmer';
    }
    return `${this.getTarifValue(this.tarifsOptions.guideParJour).toFixed(2)} ${this.getPricingCurrencyLabel()}/jour`;
  }

  getChauffeurRateLabel(): string {
    if (!this.tarifsOptions) {
      return 'Tarif a confirmer';
    }
    return `${this.getTarifValue(this.tarifsOptions.chauffeurParJour).toFixed(2)} ${this.getPricingCurrencyLabel()}/jour`;
  }

  getPensionRateLabel(): string {
    if (!this.tarifsOptions) {
      return 'Tarif a confirmer';
    }
    return `${this.getTarifValue(this.tarifsOptions.pensionCompleteParPersonneParJour).toFixed(2)} ${this.getPricingCurrencyLabel()}/pers./jour`;
  }

  getPricingCurrencyLabel(): string {
    return (this.tarifsOptions?.devise || 'EUR').toUpperCase();
  }

  hasActivePaidOptions(): boolean {
    return !!(this.options.transport || this.options.guide || this.options.chauffeur || this.options.pensionComplete);
  }

  getSelectedServicesSummary(): string {
    const services: string[] = [];
    if (this.options.guide) {
      services.push('Guide');
    }
    if (this.options.chauffeur) {
      services.push('Chauffeur');
    }
    if (this.options.pensionComplete) {
      services.push('Pension complete');
    }
    return services.join(' - ');
  }

  isJourPlanningComplete(jour: Jour): boolean {
    return !!(jour.zoneId && jour.villeId && jour.activites.length > 0);
  }

  getJourPlanningStatus(jour: Jour): string {
    return this.isJourPlanningComplete(jour) ? 'Complet' : 'Manquant';
  }

  isPlanningStepComplete(): boolean {
    return this.jours.length > 0 && this.jours.every((jour) => this.isJourPlanningComplete(jour));
  }

  private canContinueFromPlanning(): boolean {
    this.etape2ErrorMessage = '';

    const incompleteJourIndex = this.jours.findIndex((jour) => !this.isJourPlanningComplete(jour));
    if (incompleteJourIndex === -1) {
      return true;
    }

    this.activeJourIndex = incompleteJourIndex;
    this.ensureActivitesPageInRange(incompleteJourIndex);

    const jour = this.jours[incompleteJourIndex];
    const missingParts: string[] = [];
    if (!jour.zoneId) {
      missingParts.push('la zone');
    }
    if (!jour.villeId) {
      missingParts.push('la ville');
    }
    if (jour.activites.length === 0) {
      missingParts.push('au moins une activite');
    }

    this.etape2ErrorMessage = `Complete le jour ${jour.numero} avant de continuer: ${missingParts.join(', ')}.`;
    return false;
  }

  prochaineEtape(): void {
    if (this.etape === 1 && this.catalogLoading) {
      return;
    }
    if (this.etape === 2 && !this.canContinueFromPlanning()) {
      return;
    }
    if (this.etape === 3 && !this.canContinueFromOptions()) {
      return;
    }
    if (this.etape < 5) {
      this.etape++;
    }
  }

  etapePrecedente(): void {
    if (this.etape > 1) {
      this.etape--;
    }
  }

  isFormValid(): boolean {
    return !!(
      this.demande.nom.trim() &&
      this.demande.prenom.trim() &&
      this.demande.email.trim() &&
      this.demande.telephone.trim()
    );
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!this.canContinueFromOptions()) {
      this.etape = 3;
      return;
    }

    this.demande.nombreJours = this.nombreJours;
    this.demande.nombrePersonnes = this.nombrePersonnes;
    this.demande.jours = this.jours;
    this.demande.options = this.options;

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = false;
    this.submitErrorMessage = '';

    const joursDTO: JourDTO[] = this.jours.map((jour) => ({
      numeroJour: jour.numero,
      zoneId: jour.zoneId ?? undefined,
      villeId: jour.villeId ?? undefined,
      activiteIds: jour.activites,
      descriptionJour: ''
    }));

    const selectedHebergement = this.getSelectedHebergement();

    const payload: CircuitPersonnaliseDTO = {
      nomClient: this.demande.nom.trim(),
      prenomClient: this.demande.prenom.trim(),
      emailClient: this.demande.email.trim(),
      telephoneClient: this.demande.telephone.trim(),
      messageClient: this.demande.message.trim(),
      nombreJours: this.demande.nombreJours,
      nombrePersonnes: this.demande.nombrePersonnes,
      dateVoyageSouhaitee: this.hebergementDateArrivee || undefined,
      avecHebergement: this.hasHebergementRequest(),
      typeHebergement: this.getHebergementPayloadValue(),
      hebergementId: selectedHebergement?.id,
      dateArriveeHebergement: selectedHebergement ? this.hebergementDateArrivee : undefined,
      dateDepartHebergement: selectedHebergement ? this.hebergementDateDepart : undefined,
      avecTransport: !!this.options.transport,
      typeTransport: this.options.transport || undefined,
      avecGuide: this.options.guide,
      avecChauffeur: this.options.chauffeur,
      pensionComplete: this.options.pensionComplete,
      jours: joursDTO
    };

    this.circuitsPersonnalisesService.createDemande(payload).subscribe({
      next: () => {
        this.submitSuccess = true;
        this.isSubmitting = false;
      },
      error: (error) => {
        this.submitError = true;
        this.isSubmitting = false;
        this.submitErrorMessage = this.extractErrorMessage(error);
      }
    });
  }

  voirHebergements(): void {
    this.router.navigate(['/hebergements']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  toggleJoursExpanded(): void {
    this.joursExpanded = !this.joursExpanded;
  }

  setHebergementMode(mode: 'auto' | 'choisir'): void {
    this.hebergementMode = mode;
    this.optionsErrorMessage = '';

    if (mode === 'auto') {
      this.clearChosenHebergement();
      this.resetHebergementAvailability(
        'Votre hebergement sera defini avec notre equipe en fonction du circuit et de votre budget.'
      );
      return;
    }

    this.resetHebergementAvailability('Selectionnez un hebergement et vos dates pour verifier la disponibilite.');
    if (this.selectedHebergementId || this.hebergementDateArrivee || this.hebergementDateDepart) {
      this.checkHebergementAvailability();
    }
  }

  onHebergementIdChange(hebergementId: number | null): void {
    this.selectedHebergementId = hebergementId;
    this.optionsErrorMessage = '';
    this.checkHebergementAvailability();
  }

  onHebergementDatesChange(): void {
    this.optionsErrorMessage = '';
    this.checkHebergementAvailability();
  }

  hasHebergementRequest(): boolean {
    return this.hebergementMode === 'auto' || !!this.selectedHebergementId;
  }

  getHebergementDisplayValue(): string {
    if (this.hebergementMode === 'auto') {
      return 'A proposer';
    }
    return this.getSelectedHebergement()?.nom || 'Sans hebergement';
  }

  getHebergementPayloadValue(): string | undefined {
    if (!this.hasHebergementRequest()) {
      return undefined;
    }
    if (this.hebergementMode === 'auto') {
      return 'A proposer';
    }
    return this.getSelectedHebergement()?.nom || undefined;
  }

  getSelectedHebergement(): HebergementDTO | undefined {
    if (!this.selectedHebergementId) {
      return undefined;
    }
    return this.hebergements.find((hebergement) => hebergement.id === this.selectedHebergementId);
  }

  getNombreNuitsHebergement(): number {
    const arrival = this.parseDate(this.hebergementDateArrivee);
    const departure = this.parseDate(this.hebergementDateDepart);
    if (!arrival || !departure) {
      return 0;
    }
    const diffMs = departure.getTime() - arrival.getTime();
    if (diffMs <= 0) {
      return 0;
    }
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  hasValidHebergementDates(): boolean {
    return this.getNombreNuitsHebergement() > 0;
  }

  getMinDateArrivee(): string {
    return this.toIsoDate(new Date());
  }

  getMinDateDepart(): string {
    if (!this.hebergementDateArrivee) {
      return this.getMinDateArrivee();
    }
    const dateArrivee = this.parseDate(this.hebergementDateArrivee);
    if (!dateArrivee) {
      return this.getMinDateArrivee();
    }
    dateArrivee.setDate(dateArrivee.getDate() + 1);
    return this.toIsoDate(dateArrivee);
  }

  getHebergementDateRangeLabel(): string {
    if (!this.hebergementDateArrivee || !this.hebergementDateDepart || !this.hasValidHebergementDates()) {
      return 'Dates a definir';
    }
    const arrivee = this.formatDateLabel(this.hebergementDateArrivee);
    const depart = this.formatDateLabel(this.hebergementDateDepart);
    const nuits = this.getNombreNuitsHebergement();
    return `${arrivee} -> ${depart} (${nuits} nuit${nuits > 1 ? 's' : ''})`;
  }

  getHebergementLocationLabel(): string {
    const hebergement = this.getSelectedHebergement();
    if (!hebergement) {
      return '';
    }
    return hebergement.localisation || hebergement.type || '';
  }

  getDevisNote(): string {
    const hasPricedExtras = this.tarifsOptions && this.hasActivePaidOptions();
    const hasUnpricedExtras = !this.tarifsOptions && this.hasActivePaidOptions();

    if (this.hebergementMode === 'auto' && hasUnpricedExtras) {
      return 'Le total couvre les activites deja chiffrees. L hebergement et les services complementaires seront confirms avec notre equipe.';
    }
    if (this.hebergementMode === 'auto' && hasPricedExtras) {
      return 'Le total couvre les activites et les options selectionnees. L hebergement sera ajoute apres validation avec notre equipe.';
    }
    if (this.hebergementMode === 'auto') {
      return 'Le total couvre les activites deja chiffrees. L hebergement sera propose par notre equipe.';
    }
    if (hasUnpricedExtras) {
      return 'Le total couvre les activites et l hebergement selectionne. Les tarifs des services complementaires seront confirmes par notre equipe.';
    }
    if (hasPricedExtras) {
      return 'Le total couvre les activites, l hebergement selectionne et les services complementaires choisis.';
    }
    return 'Le total couvre les activites et l hebergement selectionne.';
  }

  private canContinueFromOptions(): boolean {
    this.optionsErrorMessage = '';

    if (this.hebergementMode !== 'choisir') {
      return true;
    }

    if (!this.selectedHebergementId) {
      this.optionsErrorMessage = 'Selectionnez un hebergement precis ou laissez notre equipe vous proposer une option.';
      return false;
    }

    if (!this.hebergementDateArrivee || !this.hebergementDateDepart) {
      this.optionsErrorMessage = 'Choisissez la date d arrivee et la date de depart pour cet hebergement.';
      return false;
    }

    if (!this.hasValidHebergementDates()) {
      this.optionsErrorMessage = 'La date de depart doit etre strictement apres la date d arrivee.';
      return false;
    }

    if (this.isCheckingHebergementAvailability) {
      this.optionsErrorMessage = 'La disponibilite de l hebergement est en cours de verification.';
      return false;
    }

    if (this.hebergementAvailability === false) {
      this.optionsErrorMessage = this.hebergementAvailabilityMessage || 'Cet hebergement n est pas disponible pour ces dates.';
      return false;
    }

    if (this.hebergementAvailability == null) {
      this.optionsErrorMessage = this.hebergementAvailabilityMessage || 'Verifiez la disponibilite de l hebergement avant de continuer.';
      return false;
    }

    return true;
  }

  private clearChosenHebergement(): void {
    this.selectedHebergementId = null;
    this.hebergementDateArrivee = '';
    this.hebergementDateDepart = '';
    this.hebergementAvailabilityRequestId++;
    this.isCheckingHebergementAvailability = false;
    this.hebergementAvailability = null;
  }

  private resetHebergementAvailability(message = ''): void {
    this.hebergementAvailabilityRequestId++;
    this.isCheckingHebergementAvailability = false;
    this.hebergementAvailability = null;
    this.hebergementAvailabilityMessage = message;
  }

  private checkHebergementAvailability(): void {
    if (this.hebergementMode !== 'choisir') {
      this.resetHebergementAvailability('');
      return;
    }

    if (!this.selectedHebergementId) {
      this.resetHebergementAvailability('Selectionnez un hebergement pour estimer votre sejour.');
      return;
    }

    if (!this.hebergementDateArrivee || !this.hebergementDateDepart) {
      this.resetHebergementAvailability('Choisissez vos dates de sejour pour verifier la disponibilite.');
      return;
    }

    if (!this.hasValidHebergementDates()) {
      this.hebergementAvailabilityRequestId++;
      this.isCheckingHebergementAvailability = false;
      this.hebergementAvailability = false;
      this.hebergementAvailabilityMessage = 'La date de depart doit etre strictement apres la date d arrivee.';
      return;
    }

    const requestId = ++this.hebergementAvailabilityRequestId;
    this.isCheckingHebergementAvailability = true;
    this.hebergementAvailability = null;
    this.hebergementAvailabilityMessage = 'Verification de la disponibilite en cours...';

    this.reservationHebergementService.checkDisponibilite(
      this.selectedHebergementId,
      this.hebergementDateArrivee,
      this.hebergementDateDepart
    ).subscribe({
      next: (available) => {
        if (requestId !== this.hebergementAvailabilityRequestId) {
          return;
        }
        this.isCheckingHebergementAvailability = false;
        this.hebergementAvailability = available;
        this.hebergementAvailabilityMessage = available
          ? 'Hebergement disponible pour ces dates.'
          : 'Cet hebergement n est pas disponible pour ces dates.';
      },
      error: (error) => {
        if (requestId !== this.hebergementAvailabilityRequestId) {
          return;
        }
        this.isCheckingHebergementAvailability = false;
        this.hebergementAvailability = null;
        this.hebergementAvailabilityMessage = this.extractErrorMessage(error);
      }
    });
  }

  private extractErrorMessage(error: any): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }
    if (typeof error?.error?.message === 'string' && error.error.message.trim()) {
      return error.error.message.trim();
    }
    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
    return 'Une erreur s est produite lors de l envoi. Veuillez reessayer.';
  }

  openImageModal(url: string | null, event: Event): void {
    event.stopPropagation();
    if (!url) {
      return;
    }
    const trimmed = url.trim();
    this.imageModalUrl = (trimmed.startsWith('http') || trimmed.startsWith('data:'))
      ? trimmed
      : (trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
    this.imageModalOpen = true;
  }

  closeImageModal(): void {
    this.imageModalOpen = false;
    this.imageModalUrl = null;
  }

  trackByVille(index: number, ville: VilleDTO): number {
    return ville.id;
  }

  trackByZone(index: number, zone: Zone): number {
    return zone.idZone;
  }

  trackByJour(index: number, jour: Jour): number {
    return jour.numero;
  }

  trackByActivite(index: number, activite: Activite): number {
    return activite.id;
  }

  private resetActivitesPagination(jourIndex: number): void {
    const key = this.getJourPaginationKey(jourIndex);
    this.activitesPageByJour[key] = 1;
  }

  private ensureActivitesPageInRange(jourIndex: number): void {
    this.getCurrentActivitesPage(jourIndex);
  }

  private getJourPaginationKey(jourIndex: number): number {
    return this.jours[jourIndex]?.numero ?? (jourIndex + 1);
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatDateLabel(value: string): string {
    const date = this.parseDate(value);
    if (!date) {
      return value;
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getBillableDays(): number {
    return Math.max(this.nombreJours, 0);
  }

  private getTarifValue(value: number | undefined | null): number {
    if (value == null || Number.isNaN(Number(value))) {
      return 0;
    }
    return Math.max(Number(value), 0);
  }
}
