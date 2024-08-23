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

// Coûts fixes annuels
const assurance_annuelle = 17000;  // Coût annuel pour assurer les camions
const amortissement_annuel = 40000;  // Amortissement annuel des camions
const frais_financiers_annuels = 72000;  // Intérêts et frais bancaires annuels
const frais_administratifs_annuels = 3000;  // Frais administratifs annuels (hors transporteur)

// Estimation du kilométrage annuel total
const kilometrage_annuel_total = 2000000;  // Kilométrage total annuel estimé

// Coefficient supplémentaire de consommation de carburant par tonne de charge transportée
const coefficient_poids = 0.007;  // Augmentation de la consommation par tonne supplémentaire

// URL de l'API pour récupérer les données des prix des carburants en France au format JSON
const url = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/exports/json";

// Fonction asynchrone pour récupérer le prix du Gazole dans la ville de Beynost
async function getPrixGazoleBeynost() {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Échec de la requête : ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            let found = false;
            let prixGazole = null;

            for (let station of data) {
                if (station.ville === 'Beynost') {
                    let prixList = JSON.parse(station.prix.replace(/'/g, '"'));
                    for (let prix of prixList) {
                        if (prix['@nom'] === 'Gazole') {
                            prixGazole = parseFloat(prix['@valeur']);
                            found = true;
                            break;
                        }
                    }
                    break;
                }
            }

            if (!found) {
                console.error("Désolé, aucune information sur le prix du Gazole n'a été trouvée pour Beynost.");
            }

            return prixGazole;
        })
        .catch(error => {
            console.error('Erreur:', error);
            return null;
        });
}

// Fonction pour calculer le coût total du transporteur en fonction des heures de travail
function calculerCoutTransporteur(heuresJour, heuresNuit) {
    const salaireJour = heuresJour * salaire_heure_jour;
    const salaireNuit = heuresNuit * salaire_heure_nuit;
    const salaireBrut = salaireJour + salaireNuit;
    return salaireBrut + (salaireBrut * charge_sociale_taux);
}

// Fonction pour calculer le coût variable par kilomètre (CRK) ajusté en fonction du poids de la charge, incluant les coûts fixes
function calculerCrkAjuste(distanceKm, prixCarburantLitre, poidsAller, poidsRetour) {
    const consommationAller = consommation_tgx * (1 + coefficient_poids * poidsAller);
    const consommationRetour = consommation_tgx * (1 + coefficient_poids * poidsRetour);
    const carburantAller = consommationAller * prixCarburantLitre;
    const carburantRetour = consommationRetour * prixCarburantLitre;

    const chargesVariablesAller = carburantAller + lubrifiant_km + pneumatique_km + entretien_reparations_km;
    const chargesVariablesRetour = carburantRetour + lubrifiant_km + pneumatique_km + entretien_reparations_km;

    const chargesVariablesMoyennes = (chargesVariablesAller + chargesVariablesRetour) / 2;

    // Calcul des coûts fixes par kilomètre
    const chargesFixesKm = (assurance_annuelle + amortissement_annuel + frais_financiers_annuels + frais_administratifs_annuels) / kilometrage_annuel_total;

    return chargesVariablesMoyennes + chargesFixesKm;  // Retourne le coût total (variable + fixe) par kilomètre
}

// Fonction pour calculer la rentabilité du transport
function calculerRentabilite(distanceKm, prixVenteFret, crk, coutPeage, coutTransporteur) {
    const coutTotalFret = (crk * distanceKm) + (coutPeage * 4) + coutTransporteur;
    const marge = ((prixVenteFret - coutTotalFret) / prixVenteFret) * 100;
    return { marge, coutTotalFret };
}

// Fonction pour déterminer l'indice de rentabilité basé sur la marge bénéficiaire
function indiceRentabilite(marge) {
    if (marge < 20) {
        return "Orange";
    } else if (marge >= 20 && marge < 27) {
        return "Jaune";
    } else if (marge > 33) {
        return "Vert";
    } else {
        return "Rouge";
    }
}

// Gestionnaire d'événement pour la soumission du formulaire
document.getElementById('freight-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const prixVenteFret = parseFloat(document.getElementById('prix_vente_fret').value);
    const heuresJour = parseFloat(document.getElementById('heures_jour').value);
    const heuresNuit = parseFloat(document.getElementById('heures_nuit').value);
    const distanceKm = parseFloat(document.getElementById('distance_km').value);
    const coutPeage = parseFloat(document.getElementById('cout_peage').value);
    const poidsAller = parseFloat(document.getElementById('poids_aller').value);
    const poidsRetour = parseFloat(document.getElementById('poids_retour').value);

    if (isNaN(prixVenteFret) || isNaN(heuresJour) || isNaN(heuresNuit) || isNaN(distanceKm) || isNaN(coutPeage) || isNaN(poidsAller) || isNaN(poidsRetour)) {
        alert("Veuillez remplir correctement tous les champs.");
        return;
    }

    const prix_carburant_litre = await getPrixGazoleBeynost();

    if (prix_carburant_litre === null) {
        alert("Prix du Gazole introuvable à Beynost.");
        return;
    }

    const coutTransporteur = calculerCoutTransporteur(heuresJour, heuresNuit);
    const crkAjuste = calculerCrkAjuste(distanceKm, prix_carburant_litre, poidsAller, poidsRetour);
    const { marge, coutTotalFret } = calculerRentabilite(distanceKm, prixVenteFret, crkAjuste, coutPeage, coutTransporteur);
    const indice = indiceRentabilite(marge);

    localStorage.setItem('marge', marge.toFixed(2));
    localStorage.setItem('crk', crkAjuste.toFixed(4));
    localStorage.setItem('coutTotalFret', coutTotalFret.toFixed(2));
    localStorage.setItem('indice', indice);

    window.location.href = 'result.html';
});
