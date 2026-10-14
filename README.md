# Négoce Mondial — version autonome (GitHub Pages + Firebase)

Jeu de plateau multijoueur en ligne, 2 à 6 joueurs. Cette version n'a pas besoin de compte claude.ai :
les parties sont stockées dans **Cloud Firestore** et chaque joueur est connecté automatiquement par
**connexion anonyme Firebase**. Le site est hébergé gratuitement sur **GitHub Pages**.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu complet |
| `shim.js` | Le branchement entre le jeu et Firebase (ne pas modifier) |
| `firebase-config.js` | **À remplir** avec la configuration de ton projet Firebase |
| `firestore.rules` | Règles de sécurité à copier dans la console Firebase |

## 1. Créer le projet Firebase

1. Va sur https://console.firebase.google.com et clique sur **Créer un projet**. Nomme-le (ex. `negoce-mondial`). Google Analytics n'est pas utile, tu peux le désactiver.
2. **Authentication** → **Commencer** → onglet **Méthode de connexion** → active **Anonyme** → Enregistrer.
3. **Firestore Database** → **Créer une base de données** → emplacement en Europe (ex. `eur3` ou `europe-west`) → **mode production**.
4. Dans Firestore, onglet **Règles** : remplace tout par le contenu de `firestore.rules`, puis **Publier**.
5. **Paramètres du projet** (roue dentée) → **Vos applications** → icône **</>** (Web) → nomme l'appli → **Enregistrer**. Ne coche pas Firebase Hosting.
6. Copie le bloc `firebaseConfig` affiché (apiKey, authDomain, projectId…) : tu en auras besoin à l'étape 3.

## 2. Mettre le jeu sur GitHub

1. Sur https://github.com → **New repository** → nom `negoce-mondial` → **Public** → Create.
2. **Add file** → **Upload files** → glisse les 4 fichiers → **Commit changes**.
3. **Settings** → **Pages** → Source : **Deploy from a branch** → Branch : `main`, dossier `/ (root)` → **Save**.
4. Après 1 à 2 minutes, le jeu est en ligne à l'adresse `https://TON-PSEUDO.github.io/negoce-mondial/`.

## 3. Brancher Firebase

1. Sur GitHub, ouvre `firebase-config.js` → icône crayon (Edit).
2. Remplace les valeurs par celles copiées à l'étape 1.6 → **Commit changes**.
3. Dans Firebase : **Authentication** → **Paramètres** → **Domaines autorisés** → **Ajouter un domaine** → `TON-PSEUDO.github.io`.
4. Recharge le jeu : la page d'accueil s'affiche, crée une partie d'entraînement pour tester.

Les valeurs de `firebase-config.js` ne sont pas des mots de passe : il est normal qu'elles soient publiques.
La protection vient des règles Firestore et de la connexion anonyme.

## Bon à savoir

- **Coût** : le forfait gratuit de Firebase (Spark) suffit largement pour jouer entre amis.
- **Accès** : toute personne qui a le lien peut jouer. Partage-le seulement avec tes amis.
- **Triche** : la logique du jeu tourne dans le navigateur des joueurs. Un joueur doué en informatique
  pourrait modifier une partie. Entre amis, ce n'est pas un problème ; pour un jeu public, il faudrait
  déplacer les règles sur un serveur (Cloud Functions).
- **Mises à jour** : pour une nouvelle version du jeu, remplace seulement `index.html` sur GitHub.
- Les parties et règles créées sur claude.ai ne sont pas reprises : les deux versions ont chacune leur base.
