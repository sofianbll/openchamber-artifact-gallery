# Compatibilité et maintenance

Le minimum déclaré est **OpenChamber 2.5.2**. La galerie embarque le **SDK 2.5.2**,
le **client OpenCode 2.2.0** et un moteur de rendu issu d’**OpenChamber v2.5.2**.
Tester un nouvel hôte ne met pas ces dépendances à jour. Une version future non
testée n’est pas garantie compatible.

Le [workflow Compatibility](https://github.com/sofianbll/openchamber-artifact-gallery/actions/workflows/compatibility.yml)
compare la version de référence 2.5.2 à la dernière stable publiée sur npm, à chaque
push/PR et chaque jour à 07:23 UTC. Son lancement manuel permet de choisir une version
précise. La version résolue apparaît dans le résumé ; les captures fictives sont
conservées 14 jours comme artefacts du run.

Les vérifications couvrent le manifeste officiel, le démarrage et l’arrêt du service
Node dans un HOME temporaire, puis le frontend officiel : galerie, aperçu, référence
dans le brouillon sans envoi, thèmes, langues et fenêtre étroite.

Les API du frontend sont **fictives** : ces contrôles ne prouvent pas le fonctionnement
du backend OpenCode complet, de l’application desktop ou de vraies conversations.
Un déplacement des modules internes de l’hôte peut aussi nécessiter une adaptation
du test. Les dépendances, le code et les releases ne sont jamais modifiés par ce workflow.

Consulte le [guide de maintenance complet en anglais](../compatibility.md) pour
reproduire les contrôles, analyser un échec et mettre à jour le SDK patché, le moteur
de rendu ou le client OpenCode. Active les notifications GitHub Actions du dépôt
pour suivre les échecs. Les contributions suivent le
[guide du dépôt](https://github.com/sofianbll/openchamber-artifact-gallery/blob/main/CONTRIBUTING.md).
