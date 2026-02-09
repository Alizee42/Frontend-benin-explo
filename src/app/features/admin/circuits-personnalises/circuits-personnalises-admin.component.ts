import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { CircuitsPersonnalisesService, CircuitPersonnaliseDTO } from '../../../services/circuits-personnalises.service';

@Component({
  selector: 'app-circuits-personnalises-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DataTableComponent],
  templateUrl: './circuits-personnalises-admin.component.html',
  styleUrls: ['./circuits-personnalises-admin.component.scss']
})
export class CircuitsPersonnalisesAdminComponent implements OnInit {
  demandes: CircuitPersonnaliseDTO[] = [];
  isLoading = true;

  // Templates d'emails personnalisables
  emailTemplates = {
    approbation: {
      subject: 'Votre demande de circuit personnalisé #{id} a été approuvée',
      body: `Bonjour {nom},

Félicitations ! Votre demande de circuit personnalisé (référence #{id}) a été approuvée.

Détails de votre circuit :
- Nombre de personnes : {nombrePersonnes}
- Nombre de jours : {nombreJours}
- Zones : {zones}
- Activités : {activites}

{hebergement}
{transport}
{extras}

Prix estimé : {prix}

Notre équipe vous contactera dans les prochains jours pour finaliser les détails pratiques, confirmer les dates et établir un devis définitif.

Nous sommes impatients de vous accueillir au Bénin !

Cordialement,
L'équipe Benin Exlo
Téléphone : {telephone}`
    },
    refus: {
      subject: 'Votre demande de circuit personnalisé #{id}',
      body: `Bonjour {nom},

Nous vous remercions d'avoir soumis votre demande de circuit personnalisé (référence #{id}).

Après étude de votre demande, nous ne sommes malheureusement pas en mesure de la satisfaire pour le moment.

Motif : {motif}

Détails de votre demande initiale :
- Nombre de personnes : {nombrePersonnes}
- Nombre de jours : {nombreJours}
- Zones : {zones}
- Activités : {activites}

N'hésitez pas à nous contacter pour modifier votre demande ou pour toute autre question.

Nous restons à votre disposition pour vous proposer d'autres formules adaptées à vos besoins.

Cordialement,
L'équipe Benin Exlo
Téléphone : {telephone}`
    }
  };

  // État de la modale d'email
  showEmailModal = false;
  currentEmailAction: 'approbation' | 'refus' | null = null;
  currentDemande: CircuitPersonnaliseDTO | null = null;
  emailSubject = '';
  emailBody = '';
  refusalReason = '';

  tableColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nomClient', label: 'Nom', sortable: true },
    { key: 'emailClient', label: 'Email', sortable: false },
    { key: 'telephoneClient', label: 'Téléphone', sortable: false },
    { key: 'dateCreation', label: 'Date', sortable: true },
    { key: 'statut', label: 'Statut', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions' as const }
  ];

  tableActions = [
    {
      label: 'Voir détails',
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
          dateCreation: d.dateCreation ? this.formatDate(d.dateCreation) : undefined
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
    const subject = `Demande de circuit personnalisé #${demande.id} - ${demande.nomClient}`;

    const body = `Bonjour ${demande.prenomClient} ${demande.nomClient},
Nous avons bien reçu votre demande de circuit personnalisé (référence #${demande.id}).

Détails de votre demande :
- Nombre de personnes : ${demande.nombrePersonnes}
- Nombre de jours : ${demande.nombreJours}
- Statut : ${demande.statut || 'EN_ATTENTE'}
- Date de création : ${demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}

${demande.avecHebergement ? `Hébergement inclus (${demande.typeHebergement || ''})` : 'Sans hébergement'}
${demande.avecTransport ? `Transport inclus (${demande.typeTransport || ''})` : 'Sans transport'}

Prix estimé : ${demande.prixEstime ? demande.prixEstime + ' XOF' : 'À déterminer'}

Nous vous contacterons prochainement pour finaliser les détails et vous proposer un devis personnalisé.

Cordialement,
L'équipe Benin Exlo
Téléphone : ${demande.telephoneClient}`;

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

    // Préparer le template d'email
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
  }

  sendEmail() {
    if (!this.currentDemande || !this.currentEmailAction) return;

    const confirmation = confirm('Êtes-vous sûr de vouloir envoyer cet email ?');
    if (!confirmation) return;

    // Mettre à jour le statut selon l'action
    const newStatus = this.currentEmailAction === 'approbation' ? 'ACCEPTE' : 'REFUSE';

    this.circuitsPersonnalisesService.updateStatut(this.currentDemande.id!, newStatus).subscribe({
      next: (demande: CircuitPersonnaliseDTO) => {
        alert(`Demande ${this.currentEmailAction === 'approbation' ? 'approuvée' : 'refusée'} avec succès !`);
        this.loadDemandes();
        // TODO: Implémenter sendCustomEmail si nécessaire
        this.closeEmailModal();
      },
      error: (error: any) => {
        console.error('Erreur mise à jour statut', error);
        alert('Erreur lors de la mise à jour. Veuillez réessayer.');
      }
    });
  }

  onRefusalReasonChange() {
    if (this.currentDemande && this.currentEmailAction === 'refus') {
      const template = this.emailTemplates.refus;
      this.emailBody = this.replacePlaceholders(template.body, this.currentDemande);
    }
  }

  // TODO: Réimplémenter sendCustomEmail si fonctionnalité email requise

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
      .replace(/{hebergement}/g, demande.avecHebergement ? `Hébergement inclus (${demande.typeHebergement || ''})` : 'Sans hébergement')
      .replace(/{transport}/g, demande.avecTransport ? `Transport inclus (${demande.typeTransport || ''})` : 'Sans transport')
      .replace(/{extras}/g, '')
      .replace(/{prix}/g, demande.prixEstime ? demande.prixEstime + ' XOF' : 'À déterminer')
      .replace(/{telephone}/g, demande.telephoneClient)
      .replace(/{motif}/g, this.refusalReason);
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
}
