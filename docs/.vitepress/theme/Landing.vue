<script setup>
import { computed, ref } from 'vue';
import { useData, withBase } from 'vitepress';
import galleryImage from '../../assets/host-gallery.png';
import frenchImage from '../../assets/host-french.png';
import previewImage from '../../assets/host-preview.png';
import reuseImage from '../../assets/host-reuse.png';
import lightImage from '../../assets/host-light.png';
import settingsImage from '../../assets/host-settings.png';
const { lang } = useData();
const french = computed(() => lang.value === 'fr');
const prefix = computed(() => french.value ? '/fr' : '');
const url = 'https://github.com/sofianbll/openchamber-artifact-gallery';
const copied = ref(false), copyFailed = ref(false), selected = ref(0);
async function copy() {
  try { await navigator.clipboard.writeText(url); copied.value = true; copyFailed.value = false; }
  catch { copyFailed.value = true; }
}
const text = computed(() => french.value ? {
  title: 'Le travail continue après la conversation.',
  intro: 'Pages, images et livrables méritent mieux qu’un long défilement. Retrouve-les dans OpenChamber et réutilise-les dans ton prochain message.',
  install: 'Installer la galerie', guide: 'Lire le guide', note: 'Extension communautaire gratuite. Locale. Open source.',
  shots: ['Explorer', 'Prévisualiser', 'Réutiliser', 'Thème clair', 'Réglages'],
  captions: ['Une bibliothèque dans OpenChamber, avec les projets et conversations à portée de main.', 'Ouvre la page et retrouve sa conversation, sa date et son origine.', 'Une référence dans le brouillon. Le contenu reste dans sa source jusqu’à ce que tu en aies besoin.', 'La même galerie dans le thème clair d’OpenChamber.', 'Choisis la langue, les aperçus et la taille des pages.'],
  fictional: 'Interface OpenChamber réelle, avec données fictives dans un environnement isolé.',
  flowTitle: 'Du résultat d’hier au message d’aujourd’hui.',
  steps: [
    ['Retrouver', 'Commence par la session, élargis au projet ou explore tous tes espaces. Titres, types et dates t’aident à retrouver le bon résultat.', '/browse'],
    ['Prévisualiser', 'Ouvre une page, une image ou un tableau. Sa provenance reste visible, et la conversation source est toujours accessible.', '/reuse'],
    ['Réutiliser', 'Ajoute une référence au message en cours. Rien n’est envoyé ; explorer un autre projet ne change pas ton brouillon.', '/reuse'],
  ],
  quietTitle: 'Les outils habituels. Une mémoire visuelle en plus.',
  quietText: 'Les agents continuent d’utiliser render.page, les captures et les liens vers des fichiers. La galerie rassemble les résultats identifiables, sans étape de publication supplémentaire.',
  facts: [['Local', 'Un index de références sur ta machine. Aucun service cloud ajouté.'], ['À la demande', 'Le contenu entre dans le contexte de l’agent seulement lorsque tu le demandes.'], ['Chargement borné', '12 ou 24 cartes par page, six vignettes actives au maximum.']],
  installTitle: 'Une URL. Et tu es chez toi.', installText: 'Dans OpenChamber, ouvre Réglages → Extensions et colle cette URL pour ajouter l’extension. Active ensuite Artifact Gallery.',
  copy: 'Copier l’URL', copied: 'URL copiée', copyFailed: 'Sélectionne et copie l’URL ci-dessus.',
  requirement: 'OpenChamber local 2.5.2 ou plus récent. Bundles prêts à l’emploi, sans compilation.',
  limits: 'L’échelle et l’espacement personnalisés de l’hôte ne sont pas encore transmis par le SDK.',
  more: 'Comprendre les limites',
} : {
  title: 'The work outlives the conversation.',
  intro: 'Pages, images and deliverables deserve better than a long scroll. Find them inside OpenChamber. Bring them into your next message.',
  install: 'Install the gallery', guide: 'Read the guide', note: 'Free community extension. Local. Open source.',
  shots: ['Explore', 'Preview', 'Reuse', 'Light theme', 'Settings'],
  captions: ['A library inside OpenChamber, with your projects and conversations close at hand.', 'Open the original page, with its conversation, time and source still attached.', 'A reference in your draft. The content stays at its source until you need it.', 'The same gallery in OpenChamber’s light theme.', 'Choose your language, preview behavior and page size.'],
  fictional: 'Real OpenChamber interface, with fictional data in an isolated environment.',
  flowTitle: 'From yesterday’s result to today’s message.',
  steps: [
    ['Find it', 'Start with the session, widen to a project, or explore every space. Titles, types and dates help you find the right result.', '/browse'],
    ['Take a look', 'Open a page, image or table. Its provenance stays visible, and the source conversation is always within reach.', '/reuse'],
    ['Use it again', 'Add a reference to your current message. Nothing sends automatically; exploring another project keeps your draft where it belongs.', '/reuse'],
  ],
  quietTitle: 'The tools you know. A visual memory alongside them.',
  quietText: 'Agents keep using render.page, screenshots and file links. The gallery gathers identifiable results without another publishing step.',
  facts: [['Local', 'A reference index on your machine. No extra cloud service.'], ['On demand', 'Artifact content enters the agent’s context only when you ask for it.'], ['Bounded loading', '12 or 24 cards per page. At most six active thumbnails.']],
  installTitle: 'One URL. Right at home.', installText: 'In OpenChamber, open Settings → Extensions and paste this URL to add the extension. Then enable Artifact Gallery.',
  copy: 'Copy URL', copied: 'URL copied', copyFailed: 'Select and copy the URL above.',
  requirement: 'Local OpenChamber 2.5.2 or newer. Ready-to-use bundles, no build step.',
  limits: 'Custom host interface scale and padding are not yet supplied by the SDK.',
  more: 'Understand the limits',
});
const images = computed(() => [french.value ? frenchImage : galleryImage, previewImage, reuseImage, lightImage, settingsImage]);
</script>

<template>
  <div class="gallery-home">
    <section class="gallery-hero">
      <h1>{{ text.title }}</h1>
      <div class="hero-aside"><p>{{ text.intro }}</p>
        <div class="hero-actions"><a class="gallery-button" :href="withBase(prefix + '/installation.html')">{{ text.install }}</a><a class="text-link" :href="withBase(prefix + '/guide.html')">{{ text.guide }}</a></div>
        <small>{{ text.note }}</small>
      </div>
    </section>
    <section class="product-view" :aria-label="french ? 'La galerie en images' : 'See the gallery'">
      <div class="view-tabs" role="group" :aria-label="french ? 'Captures d’écran' : 'Screenshots'">
        <button v-for="(name, i) in text.shots" :key="name" :aria-pressed="selected === i" @click="selected = i">{{ name }}</button>
      </div>
      <figure>
        <a :href="images[selected]" target="_blank" rel="noopener" :aria-label="french ? 'Ouvrir la capture en grand' : 'Open full-size screenshot'">
          <img :src="images[selected]" :alt="text.captions[selected]" width="1440" height="960" fetchpriority="high">
        </a>
        <figcaption><span>{{ text.captions[selected] }}</span><small>{{ text.fictional }}</small></figcaption>
      </figure>
    </section>
    <section class="gallery-flow">
      <h2>{{ text.flowTitle }}</h2>
      <ol><li v-for="(step, i) in text.steps" :key="step[0]"><span class="step-number">{{ i + 1 }}</span><h3><a :href="withBase(prefix + step[2] + '.html')">{{ step[0] }}</a></h3><p>{{ step[1] }}</p></li></ol>
    </section>
    <section class="gallery-principles">
      <div><h2>{{ text.quietTitle }}</h2><p>{{ text.quietText }}</p><a class="text-link" :href="withBase(prefix + '/privacy.html')">{{ text.more }}</a></div>
      <dl><div v-for="fact in text.facts" :key="fact[0]"><dt>{{ fact[0] }}</dt><dd>{{ fact[1] }}</dd></div></dl>
    </section>
    <section class="gallery-install" id="install">
      <h2>{{ text.installTitle }}</h2><p>{{ text.installText }}</p>
      <div class="copy-repository"><code>{{ url }}</code><button class="gallery-button" @click="copy">{{ copied ? text.copied : text.copy }}</button></div>
      <p class="copy-feedback" aria-live="polite">{{ copyFailed ? text.copyFailed : copied ? text.copied : '' }}</p>
      <small>{{ text.requirement }}</small>
      <p class="appearance-note">{{ text.limits }} <a :href="withBase(prefix + '/appearance.html')">{{ text.more }}</a>.</p>
    </section>
  </div>
</template>
