# Installer et mettre à jour

## Installer depuis GitHub

Utilise **OpenChamber local 2.5.2 ou plus récent**, avec son service OpenCode démarré.
La vérification porte sur OpenChamber 2.5.2 et le client OpenCode 2.2.0.

1. Ouvre **Réglages → Extensions → Ajouter une extension**.
2. Colle cette URL dans le champ URL :

   ```text
   https://github.com/sofianbll/openchamber-artifact-gallery
   ```

3. Vérifie les capacités **sessions** et **service local**, puis installe et active
   **Artifact Gallery**.
4. Ouvre son icône en haut à gauche, avant la recherche. Si la rangée manque de place,
   utilise **Pages d’extensions**. Un panneau latéral est aussi disponible.

OpenChamber clone le dépôt et charge les fichiers compilés inclus. **Aucun Bun,
npm install ou build n’est nécessaire.** Git doit être accessible à OpenChamber.
Le service local lit les sources avec les droits de ton compte ; consulte les
[limites de confidentialité](privacy.md).

## Mettre à jour

Utilise les commandes de mise à jour dans **Réglages → Extensions**. OpenChamber
conserve l’origine Git et compare la version sémantique du paquet distant : une
version supérieure déclenche la proposition de mise à jour, pas chaque commit.
Il ne télécharge pas les pièces jointes des releases. L’URL simple suit la branche par défaut.

Pour fixer une version, ajoute son tag :

```text
https://github.com/sofianbll/openchamber-artifact-gallery#v0.3.0
```

Un tag fixé reste sur cette version. Pour revenir à une ancienne version, désactive
et retire l’enregistrement actuel, puis installe le tag ou dossier souhaité.
Retirer l’extension ne supprime pas les conversations ou livrables sources.

## Alternative : une archive

Télécharge le `.tar.gz` des [Releases GitHub](https://github.com/sofianbll/openchamber-artifact-gallery/releases/latest),
vérifie si souhaité son SHA-256 publié et décompresse-le dans un dossier permanent.
Sélectionne ce dossier dans **Ajouter une extension**. Pour le mettre à jour,
désactive l’extension, remplace le dossier et réactive-la. Garde l’ancien dossier
pour revenir en arrière.

::: tip Version 0.2.0
Son archive de release est installable, mais son tag Git n’inclut pas les bundles.
Utilise **0.2.1 ou plus récent** pour l’installation par URL.
:::

Le [guide de développement en anglais](../development.md) explique la compilation
d’un checkout modifié. Agent-OS n’est pas nécessaire.
