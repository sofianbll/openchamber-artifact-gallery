# Référence technique

L’index runtime est un cache mémoire borné à 400 Kio, restauré avant le scan et
sauvegardé par le panneau dans `host.storage`, isolé par instance et supprimé à la
désinstallation. Les chunks restent sous 48 Kio de JSON UTF-8 ; un manifeste est
écrit en dernier, sans transaction garantie. Deux générations et les préférences
restent sous le quota de 2 Mio. Un bail service renouvelable sérialise les panneaux.
Les sessions les plus anciennes sont évincées sans toucher aux sources. Sans
stockage, scan et aperçus continuent en mode mémoire explicite. L’ancien fichier
`agent-os` n’est ni lu, ni migré, ni supprimé automatiquement.
Voir [confidentialité](privacy.md) pour les limites de fermeture du panneau.

La [référence complète en anglais](../reference.md) conserve les détails
d’architecture, les contrats de navigation, les limites du SDK et les mesures
synthétiques sur 1 000 références.

## Icônes des projets

Les icônes originales/personnalisées passent par la route interne authentifiée
`GET /project-icon?id=…&origin=…&theme=light|dark`, limitée aux projets du dernier
`/sync` et à son origine loopback validée. Elle appelle la route hôte interne
`/api/projects/{id encodé}/icon`, sans identifiants ni redirections : délai de 2,5 s,
5 Mio maximum, MIME PNG/JPEG/SVG/WebP/ICO uniquement, retour `{mime,data}` en base64
ou `null`. Tout échec, notamment 401/403, conserve l’initiale.

Le panneau utilise Blob → URL objet → `<img alt="">`, jamais du SVG injecté.
Cache mémoire : 200 entrées, 16 Mio d’octets image avant base64, deux requêtes
simultanées, clés origine/projet/thème. Les images affichées repassent à l’initiale
avant révocation des URL évincées. Les échecs et évictions restent mémorisés pour
éviter une nouvelle requête à chaque rendu. Changer d’origine/thème, rouvrir ou
basculer le réglage réinitialise ce cache. Désactiver **Icônes des projets**
(actif par défaut, préférence native) ignore les réponses tardives et libère les
URL ; la fermeture les libère aussi. Aucune image ne rejoint le disque ou l’index.
Ce budget ne plafonne ni la mémoire d’image décodée ni la RAM totale.

## Usages courants

- [Retrouver un artefact](browse.md) : portées, filtres et actualisation.
- [Prévisualiser et réutiliser](reuse.md) : provenance et brouillon destinataire.
- [Confidentialité et limites](privacy.md) : stockage local, isolation et chargement.
- [Développement](development.md) : bundles suivis et vérifications isolées.

Les mesures synthétiques ne garantissent pas la mémoire ou le processeur consommés
par l’ensemble d’OpenChamber dans un usage réel.
