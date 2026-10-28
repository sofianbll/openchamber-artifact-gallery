# Confidentialité et limites

## Ce qui reste sur ta machine

La galerie n’ajoute ni compte, ni synchronisation cloud, ni appel à un modèle.
Le service local géré par l’hôte lit les sessions et fichiers explicitement
référencés. Il ne parcourt pas tout le disque et ne redémarre pas OpenCode.

L’index conserve identifiants, titres, chemins, dates et provenance, sans HTML ni
octets de pièces jointes. Ce cache reconstructible utilise le stockage natif
`host.storage`, isolé par instance OpenChamber et supprimé par l’hôte à la
désinstallation. Les sources restent dans OpenCode et leurs fichiers d’origine.
Ne publie pas les métadonnées privées du cache.

Le service conserve au maximum 400 Kio de métadonnées sérialisées, évince d’abord
les sessions les plus anciennement modifiées et ignore celles trop grosses.
Le panneau restaure avant le scan et sauvegarde son état terminé, y compris un
scan en arrière-plan tant qu’il reste ouvert. Sa fermeture peut laisser le cache
précédent ; sa réouverture retrouve le service et sauvegarde son état terminé.
Une panne de stockage affiche un mode mémoire explicite, sans bloquer scan ni aperçus.

Les chunks restent sous 48 Kio de JSON UTF-8 par valeur. Le manifeste est écrit
en dernier, puis les anciens chunks sont nettoyés. Deux générations, l’échappement
JSON et la clé `preferences` séparée restent sous le quota hôte de 2 Mio.
Un bail renouvelable côté service sérialise les panneaux ; ce n’est pas une
transaction. Les chunks abandonnés sont nettoyés lors d’une sauvegarde suivante.

L’ancien `$XDG_DATA_HOME/agent-os/gallery/index-v1.json` (par défaut
`~/.local/share/agent-os/gallery/index-v1.json`) n’est jamais lu, migré ni supprimé
automatiquement. Ses métadonnées privées restent jusqu’à sa suppression manuelle.

## Service local et aperçu HTML

Les icônes de projets sont opportunistes et restent uniquement en mémoire, hors
index et cache disque. Le panneau appelle `/project-icon` sur le service local
authentifié, jamais directement l’API hôte. Le service demande une seule image d’un
projet connu, sur l’origine locale reçue au sync, sans identifiants ni redirections.
Les réponses 401/403/404 conservent l’initiale, sans recherche d’identifiants ni
permission supplémentaire. **Réglages → Icônes des projets** arrête les requêtes,
libère les URL objet et ignore les réponses tardives. Le SVG reste une image,
jamais du HTML injecté.

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
