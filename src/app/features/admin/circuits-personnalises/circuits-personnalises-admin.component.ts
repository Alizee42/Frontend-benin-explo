import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { CircuitsPersonnalisesService, DemandeCircuitPersonnalise } from '../../../services/circuits-personnalises.service';

@Component({
  selector: 'app-circuits-personnalises-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DataTableComponent],
  templateUrl: './circuits-personnalises-admin.component.html',
  styleUrls: ['./circuits-personnalises-admin.component.scss']
})
export class CircuitsPersonnalisesAdminComponent implements OnInit {
  demandes: DemandeCircuitPersonnalise[] = [];
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
  currentDemande: DemandeCircuitPersonnalise | null = null;
  emailSubject = '';
  emailBody = '';
  refusalReason = '';

  tableColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'client.nom', label: 'Nom', sortable: true },
    { key: 'client.email', label: 'Email', sortable: false },
    { key: 'client.telephone', label: 'Téléphone', sortable: false },
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
      condition: (item: DemandeCircuitPersonnalise) => item.statut === 'En attente'
    },
    {
      label: 'Refuser',
      action: 'reject',
      class: 'btn-reject',
      icon: 'ri-close-line',
      condition: (item: DemandeCircuitPersonnalise) => item.statut === 'En attente'
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
          dateCreation: this.formatDate(d.dateCreation)
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement demandes', error);
        this.isLoading = false;
      }
    });
  }

  onActionClick(actionData: { action: string; item: DemandeCircuitPersonnalise }) {
    const { action, item } = actionData;

    if (action === 'view') {
      this.router.navigate(['/admin/circuits-personnalises/detail', item.id]);
    } else if (action === 'approve') {
      this.approveDemande(item.id);
    } else if (action === 'reject') {
      this.rejectDemande(item.id);
    }
  }

  contactClient(demande: DemandeCircuitPersonnalise) {
    const subject = `Demande de circuit personnalisé #${demande.id} - ${demande.client.nom}`;
    
    const body = `Bonjour ${demande.client.nom},

Nous avons bien reçu votre demande de circuit personnalisé (référence #${demande.id}).

Détails de votre demande :
- Nombre de personnes : ${demande.nombrePersonnes}
- Nombre de jours : ${demande.nombreJours}
- Statut : ${demande.statut}
- Date de création : ${new Date(demande.dateCreation).toLocaleDateString('fr-FR')}

Zones sélectionnées : ${demande.zones.join(', ')}
Activités : ${demande.activites.join(', ')}

${demande.avecHebergement ? 'Hébergement inclus' : 'Sans hébergement'}
${demande.avecTransport ? 'Transport inclus' : 'Sans transport'}
${demande.extras && demande.extras.length > 0 ? `Extras : ${demande.extras.join(', ')}` : ''}

Prix estimé : ${demande.prixEstime ? demande.prixEstime + '€' : 'À déterminer'}

Nous vous contacterons prochainement pour finaliser les détails et vous proposer un devis personnalisé.

Cordialement,
L'équipe Benin Exlo
Téléphone : ${demande.client.telephone}`;

    const mailtoLink = `mailto:${demande.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

  openEmailModal(action: 'approbation' | 'refus', demande: DemandeCircuitPersonnalise) {
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
    const newStatus = this.currentEmailAction === 'approbation' ? 'Validé' : 'Refusé';

    this.circuitsPersonnalisesService.updateStatut(this.currentDemande.id, newStatus).subscribe({
      next: (demande: DemandeCircuitPersonnalise) => {
        alert(`Demande ${this.currentEmailAction === 'approbation' ? 'approuvée' : 'refusée'} avec succès !`);
        this.loadDemandes();
        this.sendCustomEmail(demande);
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

  sendCustomEmail(demande: DemandeCircuitPersonnalise) {
    // Envoyer l'email via l'API backend au lieu d'ouvrir le client email
    this.circuitsPersonnalisesService.envoyerEmail(demande.id, {
      subject: this.emailSubject,
      body: this.emailBody
    }).subscribe({
      next: () => {
        alert('Email envoyé avec succès !');
      },
      error: (error: any) => {
        console.error('Erreur envoi email', error);
        alert('Erreur lors de l\'envoi de l\'email. Vérifiez la configuration du serveur.');
        // Fallback: ouvrir le client email si l'API échoue
        const mailtoLink = `mailto:${demande.client.email}?subject=${encodeURIComponent(this.emailSubject)}&body=${encodeURIComponent(this.emailBody)}`;
        window.open(mailtoLink, '_blank');
      }
    });
  }

  replacePlaceholders(text: string, demande: DemandeCircuitPersonnalise): string {
    return text
      .replace(/{id}/g, demande.id.toString())
      .replace(/{nom}/g, demande.client.nom)
      .replace(/{nombrePersonnes}/g, demande.nombrePersonnes.toString())
      .replace(/{nombreJours}/g, demande.nombreJours.toString())
      .replace(/{zones}/g, demande.zones.join(', '))
      .replace(/{activites}/g, demande.activites.join(', '))
      .replace(/{hebergement}/g, demande.avecHebergement ? 'Hébergement inclus' : 'Sans hébergement')
      .replace(/{transport}/g, demande.avecTransport ? 'Transport inclus' : 'Sans transport')
      .replace(/{extras}/g, demande.extras && demande.extras.length > 0 ? `Extras : ${demande.extras.join(', ')}` : '')
      .replace(/{prix}/g, demande.prixEstime ? demande.prixEstime + '€' : 'À déterminer')
      .replace(/{telephone}/g, demande.client.telephone)
      .replace(/{motif}/g, this.refusalReason);
  }

  get totalDemandes(): number {
    return this.demandes.length;
  }

  get demandesEnAttente(): number {
    return this.demandes.filter(d => d.statut === 'En attente').length;
  }

  get demandesApprouvees(): number {
    return this.demandes.filter(d => d.statut === 'Validé').length;
  }

  get demandesRefusees(): number {
    return this.demandes.filter(d => d.statut === 'Refusé').length;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
