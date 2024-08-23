// Définition de la consommation de carburant du camion Man TGX en litres par kilomètre
const consommation_tgx = 29.52 / 100;  // Le camion consomme 29,52 litres de carburant pour 100 km, donc 0,2952 litres par km

// Informations concernant l'entreprise
const salaire_heure_jour = 11.86;  // Salaire horaire pour les heures de jour en euros
const salaire_heure_nuit = 14.91;  // Salaire horaire pour les heures de nuit en euros
const charge_sociale_taux = 0.45;  // Taux des charges sociales (45% du salaire brut)

// Coûts variables par kilomètre parcouru
const lubrifiant_km = 0.0015;  // Coût du lubrifiant par kilomètre
const pneumatique_km = 0.03;  // Coût des pneus par kilomètre
const entretien_reparations_km = 0.10;  // Coût de l'entretien et des réparations par kilomètre

// Coefficient supplémentaire de consommation de carburant par tonne de charge transportée
const coefficient_poids = 0.007;  // Augmentation de la consommation par tonne supplémentaire

// URL de l'API pour récupérer les données des prix des carburants en France au format JSON
const url = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/exports/json";

// Fonction asynchrone pour récupérer le prix du Gazole dans la ville de Beynost
async function getPrixGazoleBeynost() {
    return fetch(url)  // Envoie une requête HTTP à l'URL spécifiée
        .then(response => {
            if (!response.ok) {  // Vérifie si la réponse est correcte (statut HTTP 200)
                throw new Error(`Échec de la requête : ${response.status}`);  // Lance une erreur si la requête a échoué
            }
            return response.json();  // Convertit la réponse en JSON
        })
        .then(data => {
            let found = false;  // Variable pour vérifier si le prix a été trouvé
            let prixGazole = null;  // Variable pour stocker le prix du Gazole

            // Parcours des stations dans les données reçues
            for (let station of data) {
                if (station.ville === 'Beynost') {  // Vérifie si la station est située à Beynost
                    let prixList = JSON.parse(station.prix.replace(/'/g, '"'));  // Transforme le format de prix en JSON
                    for (let prix of prixList) {
                        if (prix['@nom'] === 'Gazole') {  // Recherche du prix du Gazole
                            prixGazole = parseFloat(prix['@valeur']);  // Convertit la valeur du prix en nombre
                            found = true;  // Marque le prix comme trouvé
                            break;  // Sort de la boucle dès que le prix est trouvé
                        }
                    }
                    break;  // Sort de la boucle principale une fois la station de Beynost trouvée
                }
            }

            if (!found) {
                console.error("Désolé, aucune information sur le prix du Gazole n'a été trouvée pour Beynost.");  // Affiche une erreur si aucun prix n'est trouvé
            }

            return prixGazole;  // Retourne le prix du Gazole ou null si non trouvé
        })
        .catch(error => {
            console.error('Erreur:', error);  // Affiche l'erreur en cas de problème lors de la requête
            return null;  // Retourne null pour indiquer l'absence de données
        });
}

// Fonction pour calculer le coût total du transporteur en fonction des heures de travail
function calculerCoutTransporteur(heuresJour, heuresNuit) {
    const salaireJour = heuresJour * salaire_heure_jour;  // Calcul du salaire pour les heures de jour
    const salaireNuit = heuresNuit * salaire_heure_nuit;  // Calcul du salaire pour les heures de nuit
    const salaireBrut = salaireJour + salaireNuit;  // Somme des salaires de jour et de nuit
    return salaireBrut + (salaireBrut * charge_sociale_taux);  // Ajoute les charges sociales au salaire brut pour obtenir le coût total
}

// Fonction pour calculer le coût variable par kilomètre (CRK) ajusté en fonction du poids de la charge
function calculerCrkAjuste(distanceKm, prixCarburantLitre, poidsAller, poidsRetour) {
    const consommationAller = consommation_tgx * (1 + coefficient_poids * poidsAller);  // Ajuste la consommation en fonction du poids à l'aller
    const consommationRetour = consommation_tgx * (1 + coefficient_poids * poidsRetour);  // Ajuste la consommation en fonction du poids au retour
    const carburantAller = consommationAller * prixCarburantLitre;  // Coût du carburant pour l'aller
    const carburantRetour = consommationRetour * prixCarburantLitre;  // Coût du carburant pour le retour

    // Calcul des coûts variables pour l'aller et le retour (carburant, lubrifiant, pneus, entretien)
    const chargesVariablesAller = carburantAller + lubrifiant_km + pneumatique_km + entretien_reparations_km;
    const chargesVariablesRetour = carburantRetour + lubrifiant_km + pneumatique_km + entretien_reparations_km;

    // Moyenne des coûts variables pour l'aller-retour
    const chargesVariablesMoyennes = (chargesVariablesAller + chargesVariablesRetour) / 2;
    return chargesVariablesMoyennes;  // Retourne le coût variable moyen par kilomètre
}

// Fonction pour calculer la rentabilité du transport
function calculerRentabilite(distanceKm, prixVenteFret, crk, coutPeage, coutTransporteur) {
    // Calcul du coût total du fret en additionnant les coûts variables, les péages et le coût du transporteur
    const coutTotalFret = (crk * distanceKm) + (coutPeage * 4) + coutTransporteur;  // Le coût du péage est multiplié par 4 pour refléter un trajet complet
    const marge = ((prixVenteFret - coutTotalFret) / prixVenteFret) * 100;  // Calcul de la marge bénéficiaire en pourcentage
    return { marge, coutTotalFret };  // Retourne un objet contenant la marge et le coût total du fret
}

// Fonction pour déterminer l'indice de rentabilité basé sur la marge bénéficiaire
function indiceRentabilite(marge) {
    // Détermine l'indice de rentabilité en fonction de la marge
    if (marge < 20) {
        return "Orange";  // Rentabilité faible
    } else if (marge >= 20 && marge < 27) {
        return "Jaune";  // Rentabilité moyenne
    } else if (marge > 33) {
        return "Vert";  // Rentabilité élevée
    } else {
        return "Rouge";  // Rentabilité critique
    }
}

// Gestionnaire d'événement pour la soumission du formulaire
document.getElementById('freight-form').addEventListener('submit', async function(event) {
    event.preventDefault();  // Empêche le rechargement de la page à la soumission du formulaire

    // Récupération des valeurs saisies dans le formulaire
    const prixVenteFret = parseFloat(document.getElementById('prix_vente_fret').value);
    const heuresJour = parseFloat(document.getElementById('heures_jour').value);
    const heuresNuit = parseFloat(document.getElementById('heures_nuit').value);
    const distanceKm = parseFloat(document.getElementById('distance_km').value);
    const coutPeage = parseFloat(document.getElementById('cout_peage').value);
    const poidsAller = parseFloat(document.getElementById('poids_aller').value);
    const poidsRetour = parseFloat(document.getElementById('poids_retour').value);

    // Vérification des valeurs du formulaire (s'assurer que toutes les valeurs sont des nombres valides)
    if (isNaN(prixVenteFret) || isNaN(heuresJour) || isNaN(heuresNuit) || isNaN(distanceKm) || isNaN(coutPeage) || isNaN(poidsAller) || isNaN(poidsRetour)) {
        alert("Veuillez remplir correctement tous les champs.");  // Affiche une alerte si des valeurs sont manquantes ou invalides
        return;  // Arrête l'exécution si les valeurs ne sont pas valides
    }

    // Récupération du prix du Gazole à Beynost via l'API
    const prix_carburant_litre = await getPrixGazoleBeynost();

    // Si le prix du Gazole n'est pas trouvé, arrêter le programme
    if (prix_carburant_litre === null) {
        alert("Prix du Gazole introuvable à Beynost.");  // Alerte si le prix n'a pas pu être récupéré
        return;  // Arrête l'exécution si le prix du Gazole n'est pas disponible
    }

    // Calcul des coûts associés au transport
    const coutTransporteur = calculerCoutTransporteur(heuresJour, heuresNuit);  // Calcule le coût du transporteur
    const crkAjuste = calculerCrkAjuste(distanceKm, prix_carburant_litre, poidsAller, poidsRetour);  // Calcule le coût variable ajusté par kilomètre
    const { marge, coutTotalFret } = calculerRentabilite(distanceKm, prixVenteFret, crkAjuste, coutPeage, coutTransporteur);  // Calcule la marge et le coût total du fret
    const indice = indiceRentabilite(marge);  // Détermine l'indice de rentabilité basé sur la marge

    // Stockage des résultats dans le localStorage pour être utilisés ultérieurement
    localStorage.setItem('marge', marge.toFixed(2));  // Stocke la marge avec deux décimales
    localStorage.setItem('crk', crkAjuste.toFixed(4));  // Stocke le CRK ajusté avec quatre décimales
    localStorage.setItem('coutTotalFret', coutTotalFret.toFixed(2));  // Stocke le coût total du fret avec deux décimales
    localStorage.setItem('indice', indice);  // Stocke l'indice de rentabilité

    // Redirection vers la page des résultats pour afficher les calculs
    window.location.href = 'result.html';  // Change la page courante pour afficher les résultats
});
