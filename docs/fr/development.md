# Développement

Le [guide de développement complet en anglais](../development.md) décrit les
sources, la compilation et les vérifications. Utilise Bun **1.4.3** et les
dépendances verrouillées du dépôt.

```sh
bun install --frozen-lockfile --ignore-scripts
bun test src/
bun run build
bun run docs:build
```

Les bundles générés `panel/main.js` et `service/main.js` sont suivis dans Git pour
permettre l’installation par URL. Le site VitePress est généré dans
`docs/.vitepress/dist` ; ce dossier n’est pas une source à modifier.

Les captures publiques utilisent `test/host-screenshots.ts` avec un paquet
`@openchamber/web` isolé, fourni par `OPENCHAMBER_PACKAGE`. Les sorties vont par défaut
dans `test-results/host-VERSION/` ; `GALLERY_TEST_OUTPUT` permet de choisir explicitement
`docs/assets/` pour les captures publiques. Le frontend est
réel ; les API, projets, conversations et artefacts sont fictifs. Aucune connexion
à l’instance personnelle n’est nécessaire ni autorisée pour ces captures.

Le [guide de compatibilité](compatibility.md) décrit les contrôles de la version
de référence et des prochaines versions. Le gestionnaire officiel de services est
testé sous Node 24.14.0, avec un HOME temporaire vide.
