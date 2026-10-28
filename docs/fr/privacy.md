# Confidentialité et limites

## Ce qui reste sur ta machine

La galerie n’ajoute ni compte, ni synchronisation cloud, ni appel à un modèle.
Le service local géré par l’hôte lit les sessions et fichiers explicitement
référencés. Il ne parcourt pas tout le disque et ne redémarre pas OpenCode.

L’index conserve identifiants, titres, chemins, dates et provenance, sans HTML ni
octets de pièces jointes. Il est écrit atomiquement avec les permissions `0600` :

```text
$XDG_DATA_HOME/agent-os/gallery/index-v1.json
# Par défaut : ~/.local/share/agent-os/gallery/index-v1.json
```

Le nom historique `agent-os` préserve la compatibilité ; Agent-OS n’est pas requis.
Cet index contient des métadonnées privées : ne le publie pas dans un rapport de bug.

## Service local et aperçu HTML

Le **service local n’est pas isolé par le système d’exploitation** : il utilise les
droits de ton compte, via des requêtes loopback authentifiées gérées par OpenChamber.

Les **aperçus HTML sont isolés** dans un cadre opaque sans accès réseau. Les images
locales intégrées suivent les limites natives de 10 Mio par image et 25 Mio par page.
Les ressources HTML externes et relatives ne sont pas chargées.

## Chargement borné

- 12 ou 24 cartes visibles, remplacées à chaque page.
- Six vignettes actives et deux lectures source simultanées au maximum.
- Déchargement des vignettes hors écran, document masqué ou derrière un dialogue.
- Ressources temporaires expirant après deux minutes, dans un cache de 64 Mio.
- Images seules jusqu’à 10 Mio ; documents jusqu’à 20 Mio. Les pièces jointes
  encodées ont une limite distincte avant décodage.
- Les réponses d’index inchangées omettent les lignes grâce à un jeton de version.

Ce ne sont **pas des garanties de RAM/CPU total**. Les mesures synthétiques sur
1 000 références sont dans la [référence technique anglaise](../reference.md#measurements-and-verification).

## Pas une sauvegarde

Chaque aperçu revérifie sa source. Une suppression ou un déplacement peut rendre
l’artefact indisponible. Retirer l’extension ne supprime pas les sources.

Seul OpenChamber local a été qualifié. Safari, Firefox, hôtes distants, appareils
mobiles physiques et hôtes VS Code ne l’ont pas été.
