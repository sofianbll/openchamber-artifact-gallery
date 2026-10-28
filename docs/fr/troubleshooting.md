# Résoudre un problème

## Installation : « Missing build »

Utilise l’URL actuelle ou un tag **v0.2.1 ou plus récent**. Le tag 0.2.0 n’inclut pas
les fichiers compilés ; son archive de release était installable. Pour un checkout
modifié, lance `bun run build` avant d’enregistrer le dossier.

## Icône absente

Vérifie qu’**Artifact Gallery** est active dans Réglages → Extensions et
qu’OpenChamber est au moins en 2.5.2. Regarde avant la recherche en haut à gauche,
ou sous **Pages d’extensions** si la rangée manque de place.

## Galerie vide

1. Une nouvelle session n’a pas d’artefact. Essaie **Projet / Chats** ou **Tout**.
2. Efface recherche, type et filtre d’espace explicite.
3. Clique sur **Actualiser** et laisse le scan finir.
4. Vérifie que le service OpenCode et celui de l’extension sont disponibles.

Seuls les livrables explicites sont reconnus. Un dossier inconnu ne compte pas
comme Chats. Si l’hôte refuse la lecture de la racine Chats, la galerie conserve
une classification indisponible au lieu de deviner.

## Aperçu indisponible

Ouvre la conversation source. Le message ou fichier peut avoir été déplacé ou
supprimé, dépasser les limites ou nécessiter le lecteur natif. L’index ne conserve
pas de copie du contenu.

## Mauvais brouillon destinataire

La destination est la **conversation active**, indiquée par **Ajout au brouillon**.
Explorer un autre projet ne change que les sources. Change de conversation active
avant d’ajouter la référence.

## Apparence non synchronisée

Rouvre la galerie après un changement de police ou de rayon. Échelle et espacement
ne font pas partie du contrat SDK 2.5.2. [Détails](appearance.md).

## Reconstruire l’index

Désactive l’extension, déplace uniquement `index-v1.json` de côté, puis réactive
et actualise. Consulte son [emplacement](privacy.md#ce-qui-reste-sur-ta-machine).
Garde l’ancien fichier jusqu’à la fin du scan ; ne supprime pas les sources.

## Signaler un problème

[Ouvre une issue](https://github.com/sofianbll/openchamber-artifact-gallery/issues)
avec versions, système, méthode d’installation, étapes et résultat attendu.
Utilise un exemple fictif et masque les informations privées des captures.
Ne joins jamais historique de sessions, index privé, identifiants ou jetons.
