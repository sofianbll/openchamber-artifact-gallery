# Prévisualiser et réutiliser

## Ouvrir un artefact

Sélectionne une carte pour ouvrir son aperçu. Sa date, sa conversation et sa
provenance restent visibles. Le lien source ramène au message d’origine.

![Aperçu détaillé dans OpenChamber](../assets/host-preview.png)

| Format | Comportement |
| --- | --- |
| Page rendue / HTML local | Aperçu HTML isolé ; ressources externes bloquées. |
| Image / capture | Aperçu image, jusqu’à 10 Mio. |
| Markdown, texte, CSV / TSV | Texte lisible ; les tableaux affichent leur texte source. |
| PDF / Office | Lien vers la conversation pour le lecteur natif de l’hôte. |

Les anciennes réponses interactives restent lisibles, mais une demande expirée
ne peut pas être soumise à nouveau. La source est relue à l’ouverture : une
suppression ou un déplacement peut rendre l’aperçu indisponible.

## Ajouter au message

1. Garde la conversation destinataire active.
2. Retrouve l’artefact dans la portée souhaitée.
3. Clique sur **Ajouter au message** depuis sa carte ou son aperçu.
4. Vérifie la puce dans le compositeur, écris ton message et envoie quand tu es prêt.

![Référence dans le brouillon OpenChamber](../assets/host-reuse.png)

La puce contient des identifiants et la provenance, **pas le HTML ni les octets du
fichier**. Le contenu n’entre pas silencieusement dans le contexte du modèle.
Demande à l’agent de lire la source référencée lorsque tu en as besoin.

Clique sur la puce pour rouvrir l’artefact. Les brouillons appartiennent à
OpenChamber et restent liés à chaque session. Explorer un autre projet ne les déplace pas.

Utilise le bouton d’ajout : le glisser-déposer depuis le cadre isolé n’est pas
pris en charge. Les pièces jointes contenant tout l’artefact et les mentions entre
harnesses ne sont pas implémentées. [Limites de lecture](privacy.md).
