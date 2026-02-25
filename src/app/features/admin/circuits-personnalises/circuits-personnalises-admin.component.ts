import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { CircuitsPersonnalisesService, CircuitPersonnaliseDTO } from '../../../services/circuits-personnalises.service';

@Component({
  selector: 'app-circuits-personnalises-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DataTableComponent, AdminActionsBarComponent],
  templateUrl: './circuits-personnalises-admin.component.html',
  styleUrls: ['./circuits-personnalises-admin.component.scss']
})
export class CircuitsPersonnalisesAdminComponent implements OnInit {
  demandes: CircuitPersonnaliseDTO[] = [];
  isLoading = true;

  // Templates d'emails personnalisables
  emailTemplates = {
    approbation: {
      subject: 'Votre demande de circuit personnalisee a ete approuvee',
      body: `Bonjour {nom},

Felicitations ! Votre demande de circuit personnalisee a ete approuvee.

Details de votre circuit :
- Nombre de personnes : {nombrePersonnes}
- Nombre de jours : {nombreJours}
- Zones : {zones}
- Activites : {activites}

{hebergement}
{transport}
{extras}

Prix estime : {prix}

Notre equipe vous contactera dans les prochains jours pour finaliser les details pratiques, confirmer les dates et etablir un devis definitif.

Nous sommes impatients de vous accueillir au Benin !

Cordialement,
L'equipe Benin Explo
Telephone : {telephone}`
    },
    refus: {
      subject: 'Votre demande de circuit personnalisee',
      body: `Bonjour {nom},

Nous vous remercions d'avoir soumis votre demande de circuit personnalisee.

Apres etude de votre demande, nous ne sommes malheureusement pas en mesure de la satisfaire pour le moment.

Motif : {motif}

Details de votre demande initiale :
- Nombre de personnes : {nombrePersonnes}
- Nombre de jours : {nombreJours}
- Zones : {zones}
- Activites : {activites}

N'hesitez pas a nous contacter pour modifier votre demande ou pour toute autre question.

Nous restons a votre disposition pour vous proposer d'autres formules adaptees a vos besoins.

Cordialement,
L'equipe Benin Explo
Telephone : {telephone}`
    }
  };

  // Etat de la modale d'email
  showEmailModal = false;
  currentEmailAction: 'approbation' | 'refus' | null = null;
  currentDemande: CircuitPersonnaliseDTO | null = null;
  emailSubject = '';
  emailBody = '';
  refusalReason = '';
  isSendingDecision = false;
  modalError = '';
  modalSuccess = '';

  tableColumns = [
        { key: 'nomClient', label: 'Nom', sortable: true },
    { key: 'emailClient', label: 'Email', sortable: false },
    { key: 'telephoneClient', label: 'Telephone', sortable: false },
    { key: 'dateCreationDisplay', label: 'Date', sortable: true },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status' as const, formatter: (value: string) => this.getStatusLabel(value) },
    { key: 'actions', label: 'Actions', type: 'actions' as const }
  ];

  tableActions = [
    {
      label: 'Voir details',
      action: 'view',
      class: 'btn-view',
      icon: 'ri-eye-line'
    },
    {
      label: 'Approuver',
      action: 'approve',
      class: 'btn-approve',
      icon: 'ri-check-line',
      condition: (item: CircuitPersonnaliseDTO) => item.statut === 'EN_ATTENTE'
    },
    {
      label: 'Refuser',
      action: 'reject',
      class: 'btn-reject',
      icon: 'ri-close-line',
      condition: (item: CircuitPersonnaliseDTO) => item.statut === 'EN_ATTENTE'
    }
  ];

  constructor(
    private circuitsPersonnalisesService: CircuitsPersonnalisesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDemandes();
  }

  loadDemandes() {
    this.isLoading = true;
    this.circuitsPersonnalisesService.getAllDemandes().subscribe({
      next: (data) => {
        this.demandes = data.map(d => ({
          ...d,
          dateCreationDisplay: d.dateCreation ? this.formatDate(d.dateCreation) : undefined
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement demandes', error);
        this.isLoading = false;
      }
    });
  }

  onActionClick(actionData: { action: string; item: CircuitPersonnaliseDTO }) {
    const { action, item } = actionData;

    if (action === 'view') {
      this.router.navigate(['/admin/circuits-personnalises/detail', item.id]);
    } else if (action === 'approve') {
      this.approveDemande(item.id!);
    } else if (action === 'reject') {
      this.rejectDemande(item.id!);
    }
  }

  contactClient(demande: CircuitPersonnaliseDTO) {
    const subject = `Demande de circuit personnalisee - ${demande.nomClient}`;

    const body = `Bonjour ${demande.prenomClient} ${demande.nomClient},
Nous avons bien recu votre demande de circuit personnalisee.

Details de votre demande :
- Nombre de personnes : ${demande.nombrePersonnes}
- Nombre de jours : ${demande.nombreJours}
- Statut : ${demande.statut || 'EN_ATTENTE'}
- Date de creation : ${demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}

${demande.avecHebergement ? `Hebergement inclus (${demande.typeHebergement || ''})` : 'Sans hebergement'}
${demande.avecTransport ? `Transport inclus (${demande.typeTransport || ''})` : 'Sans transport'}

Prix estime : ${demande.prixEstime ? demande.prixEstime + ' XOF' : 'A determiner'}

Nous vous contacterons prochainement pour finaliser les details et vous proposer un devis personnalisee.

Cordialement,
L'equipe Benin Explo
Telephone : ${demande.telephoneClient}`;

    const mailtoLink = `mailto:${demande.emailClient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  }

  approveDemande(id: number) {
    const demande = this.demandes.find(d => d.id === id);
    if (demande) {
      this.openEmailModal('approbation', demande);
    }
  }

  rejectDemande(id: number) {
    const demande = this.demandes.find(d => d.id === id);
    if (demande) {
      this.openEmailModal('refus', demande);
    }
  }

  openEmailModal(action: 'approbation' | 'refus', demande: CircuitPersonnaliseDTO) {
    this.currentEmailAction = action;
    this.currentDemande = demande;
    this.refusalReason = '';
    this.modalError = '';
    this.modalSuccess = '';
    this.isSendingDecision = false;

    // Preparer le template d'email
    const template = this.emailTemplates[action];
    this.emailSubject = this.replacePlaceholders(template.subject, demande);
    this.emailBody = this.replacePlaceholders(template.body, demande);

    this.showEmailModal = true;
  }

  closeEmailModal() {
    this.showEmailModal = false;
    this.currentEmailAction = null;
    this.currentDemande = null;
    this.emailSubject = '';
    this.emailBody = '';
    this.refusalReason = '';
    this.modalError = '';
    this.modalSuccess = '';
    this.isSendingDecision = false;
  }

  sendEmail() {
    if (!this.currentDemande || !this.currentEmailAction) return;
    if (this.isSendingDecision) return;
    this.modalError = '';
    this.modalSuccess = '';
    this.isSendingDecision = true;

    // Mise a jour du statut: le backend envoie l'email automatiquement.
    const newStatus = this.currentEmailAction === 'approbation' ? 'ACCEPTE' : 'REFUSE';

    const commentaireAdmin = this.currentEmailAction === 'approbation'
      ? 'Validation envoyee depuis le module admin.'
      : 'Refus envoye depuis le module admin.';

    this.circuitsPersonnalisesService.updateStatut(
      this.currentDemande.id!,
      newStatus,
      undefined,
      commentaireAdmin,
      this.currentEmailAction === 'refus' ? this.refusalReason.trim() : undefined,
      this.emailSubject,
      this.emailBody
    ).subscribe({
      next: (demande: CircuitPersonnaliseDTO) => {
        this.isSendingDecision = false;
        this.modalSuccess = `Demande ${this.currentEmailAction === 'approbation' ? 'approuvee' : 'refusee'} et email envoye automatiquement.`;
        this.loadDemandes();
        setTimeout(() => this.closeEmailModal(), 900);
      },
      error: (error: any) => {
        this.isSendingDecision = false;
        console.error('Erreur mise a jour statut', error);
        this.modalError = 'Erreur lors de la mise a jour ou de l envoi email. Verifie le backend et reessaye.';
      }
    });
  }

  onRefusalReasonChange() {
    if (this.currentDemande && this.currentEmailAction === 'refus') {
      const template = this.emailTemplates.refus;
      this.emailBody = this.replacePlaceholders(template.body, this.currentDemande);
    }
  }

  // TODO: Reimplementer sendCustomEmail si fonctionnalite email requise

  replacePlaceholders(text: string, demande: CircuitPersonnaliseDTO): string {
    const zonesStr = demande.jours.map(j => j.zoneNom).filter(z => z).join(', ') || 'N/A';
    const activitesStr = demande.jours.flatMap(j => j.activiteNoms || []).join(', ') || 'N/A';
    
    return text
      .replace(/{id}/g, (demande.id || 0).toString())
      .replace(/{nom}/g, `${demande.prenomClient} ${demande.nomClient}`)
      .replace(/{nombrePersonnes}/g, demande.nombrePersonnes.toString())
      .replace(/{nombreJours}/g, demande.nombreJours.toString())
      .replace(/{zones}/g, zonesStr)
      .replace(/{activites}/g, activitesStr)
      .replace(/{hebergement}/g, demande.avecHebergement ? `Hebergement inclus (${demande.typeHebergement || ''})` : 'Sans hebergement')
      .replace(/{transport}/g, demande.avecTransport ? `Transport inclus (${demande.typeTransport || ''})` : 'Sans transport')
      .replace(/{extras}/g, '')
      .replace(/{prix}/g, this.formatPriceXofEur(demande.prixEstime))
      .replace(/{telephone}/g, demande.telephoneClient)
      .replace(/{motif}/g, this.refusalReason);
  }
  private formatPriceXofEur(amount?: number): string {
    if (amount === undefined || amount === null || Number.isNaN(amount)) {
      return 'A determiner';
    }
    const eur = amount / 655.957;
    const xofFormatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount);
    const eurFormatted = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(eur);
    return `${xofFormatted} FCFA (≈ ${eurFormatted} EUR)`;
  }

  get totalDemandes(): number {
    return this.demandes.length;
  }

  get demandesEnAttente(): number {
    return this.demandes.filter(d => d.statut === 'EN_ATTENTE').length;
  }

  get demandesApprouvees(): number {
    return this.demandes.filter(d => d.statut === 'ACCEPTE').length;
  }

  get demandesRefusees(): number {
    return this.demandes.filter(d => d.statut === 'REFUSE').length;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getStatusLabel(statut?: string): string {
    const normalized = String(statut || '').trim().toUpperCase();
    if (normalized === 'EN_ATTENTE') return 'En attente';
    if (normalized === 'EN_TRAITEMENT') return 'En traitement';
    if (normalized === 'ACCEPTE') return 'Acceptee';
    if (normalized === 'REFUSE') return 'Refusee';
    return normalized || '-';
  }
}






