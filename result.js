// Écouteur d'événement pour s'assurer que le DOM est complètement chargé avant d'exécuter le code
document.addEventListener('DOMContentLoaded', () => {
    // Récupère la marge précédemment calculée depuis le localStorage et la convertit en nombre
    const marge = parseFloat(localStorage.getItem('marge'));
    // Récupère le prix du gazole stocké dans le localStorage et le convertit en nombre
    const prixGazole = parseFloat(localStorage.getItem('prixGazole'));

    // Sélection des éléments du DOM par leur ID pour les manipuler ensuite
    const resultTitle = document.getElementById('result-title');  // Élément pour afficher la catégorie de résultat (ex: "Insuffisante", "Acceptable", "Excellente")
    const resultMessage = document.getElementById('result-message');  // Élément pour afficher un message décrivant la marge calculée
    const retourBtn = document.getElementById('retour-btn');  // Bouton pour revenir à la page précédente
    const prixGazoleElement = document.getElementById('prix-gazole');  // Élément pour afficher le prix du gazole à Beynost

    let resultCategory = '';  // Variable pour stocker la catégorie du résultat basée sur la marge

    // Déterminer la catégorie du résultat selon la valeur de la marge
    if (marge < 20) {  // Si la marge est inférieure à 20%
        resultCategory = 'Insuffisante';  // Catégorie: "Insuffisante"
        resultTitle.classList.add('red-text');  // Ajoute une classe CSS pour colorer le texte en rouge
        retourBtn.classList.add('btn-red');  // Ajoute une classe CSS pour styliser le bouton en rouge
    } else if (marge >= 20 && marge <= 27) {  // Si la marge est entre 20% et 27%
        resultCategory = 'Acceptable';  // Catégorie: "Acceptable"
        resultTitle.classList.add('orange-text');  // Ajoute une classe CSS pour colorer le texte en orange
        retourBtn.classList.add('btn-orange');  // Ajoute une classe CSS pour styliser le bouton en orange
    } else {  // Si la marge est supérieure à 27%
        resultCategory = 'Excellente';  // Catégorie: "Excellente"
        resultTitle.classList.add('green-text');  // Ajoute une classe CSS pour colorer le texte en vert
        retourBtn.classList.add('btn-green');  // Ajoute une classe CSS pour styliser le bouton en vert
    }

    // Met à jour le texte de l'élément resultTitle avec la catégorie du résultat
    resultTitle.textContent = resultCategory;
    // Met à jour le message affiché avec le pourcentage de la marge
    resultMessage.textContent = `La marge de ${marge}%`;
    resultMessage.classList.add('result-message');  // Applique une classe CSS pour ajuster la taille du texte ou d'autres styles

    // Affichage du prix du gazole si disponible
    if (!isNaN(prixGazole)) {  // Vérifie si le prix du gazole est un nombre valide
        // Met à jour le texte pour afficher le prix du gazole avec trois décimales
        prixGazoleElement.textContent = `Prix actuel du gazole à Beynost : ${prixGazole.toFixed(3)} €/L`;
    } else {  // Si le prix du gazole est invalide ou non disponible
        prixGazoleElement.textContent = "Prix du gazole à Beynost indisponible.";  // Affiche un message indiquant que le prix est indisponible
    }

    // Gestionnaire d'événement pour le bouton retour
    retourBtn.addEventListener('click', () => {
        window.history.back();  // Reviens à la page précédente dans l'historique du navigateur
    });
});
