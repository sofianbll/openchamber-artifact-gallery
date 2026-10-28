# Développement

Le [guide de développement complet en anglais](../development.md) décrit les
sources, la compilation et les vérifications. Utilise Bun **1.4.3** et les
dépendances verrouillées du dépôt.

```sh
bun install --frozen-lockfile --ignore-scripts
bun test src/gallery.test.ts
bun run build
bun run docs:build
```

Les bundles générés `panel/main.js` et `service/main.js` sont suivis dans Git pour
permettre l’installation par URL. Le site VitePress est généré dans
`docs/.vitepress/dist` ; ce dossier n’est pas une source à modifier.

Les captures publiques utilisent `test/host-screenshots.ts` avec un paquet
`@openchamber/web@2.5.2` isolé, fourni par `OPENCHAMBER_PACKAGE`. Le frontend est
réel ; les API, projets, conversations et artefacts sont fictifs. Aucune connexion
à l’instance personnelle n’est nécessaire ni autorisée pour ces captures.
