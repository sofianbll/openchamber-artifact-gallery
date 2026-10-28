import { defineConfig } from 'vitepress';

const en = [
  { text: 'Start here', items: [{ text: 'Overview', link: '/guide' }, { text: 'Install & update', link: '/installation' }] },
  { text: 'Use the gallery', items: [{ text: 'Find an artifact', link: '/browse' }, { text: 'Preview & reuse', link: '/reuse' }, { text: 'Appearance & language', link: '/appearance' }] },
  { text: 'Under the hood', items: [{ text: 'Privacy & limits', link: '/privacy' }, { text: 'Troubleshooting', link: '/troubleshooting' }, { text: 'Development', link: '/development' }, { text: 'Technical reference', link: '/reference' }] },
];
const fr = [
  { text: 'Premiers pas', items: [{ text: 'Présentation', link: '/fr/guide' }, { text: 'Installer et mettre à jour', link: '/fr/installation' }] },
  { text: 'Utiliser la galerie', items: [{ text: 'Retrouver un artefact', link: '/fr/browse' }, { text: 'Prévisualiser et réutiliser', link: '/fr/reuse' }, { text: 'Apparence et langue', link: '/fr/appearance' }] },
  { text: 'Pour aller plus loin', items: [{ text: 'Confidentialité et limites', link: '/fr/privacy' }, { text: 'Résoudre un problème', link: '/fr/troubleshooting' }, { text: 'Développement', link: '/fr/development' }, { text: 'Référence technique', link: '/fr/reference' }] },
];
export default defineConfig({
  title: 'Artifact Gallery',
  description: 'Find, preview and reuse the artifacts your OpenChamber conversations made.',
  base: '/openchamber-artifact-gallery/',
  cleanUrls: false,
  lastUpdated: true,
  head: [['meta', { name: 'theme-color', content: '#171717' }]],
  locales: {
    root: { label: 'English', lang: 'en', themeConfig: { nav: [{ text: 'Guide', link: '/guide' }, { text: 'Install', link: '/installation' }], sidebar: en } },
    fr: { label: 'Français', lang: 'fr', link: '/fr/', themeConfig: {
      nav: [{ text: 'Guide', link: '/fr/guide' }, { text: 'Installer', link: '/fr/installation' }], sidebar: fr,
      docFooter: { prev: 'Précédent', next: 'Suivant' }, outline: { label: 'Sur cette page' },
      lastUpdated: { text: 'Mis à jour le' }, sidebarMenuLabel: 'Sommaire', returnToTopLabel: 'Haut de page', langMenuLabel: 'Changer de langue', darkModeSwitchLabel: 'Apparence',
      footer: { message: 'Extension communautaire indépendante pour OpenChamber. Licence MIT.', copyright: 'Par Sofian. Captures avec données fictives.' },
    } },
  },
  themeConfig: {
    siteTitle: 'Artifact Gallery',
    socialLinks: [{ icon: 'github', link: 'https://github.com/sofianbll/openchamber-artifact-gallery' }],
    search: { provider: 'local', options: { locales: { fr: { translations: {
      button: { buttonText: 'Rechercher', buttonAriaLabel: 'Rechercher dans la documentation' },
      modal: { noResultsText: 'Aucun résultat pour', resetButtonTitle: 'Effacer', footer: { selectText: 'sélectionner', navigateText: 'parcourir', closeText: 'fermer' } },
    } } } } },
    footer: { message: 'Independent community extension for OpenChamber. MIT licensed.', copyright: 'Built by Sofian. Screenshots use fictional data.' },
  },
});
