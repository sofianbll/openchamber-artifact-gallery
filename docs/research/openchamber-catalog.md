# OpenChamber community-directory publication research

Checked: **2026-10-28**. Primary sources only. No submission, product-code change, installation into a real host, or production access was performed.

## Decision

**Request a listing by email to `feedback@openchamber.dev`.** The official [Extensions community directory](https://openchamber.dev/extensions/) explicitly says: “Send us the repository link and a line about what it does. We'll add it to this list.” Its **Send your extension** button supplies a more detailed email template. There is no published certification checklist on that page.

Artifact Gallery already has the essential distribution structure, public repository, license, documentation, screenshots, and an actual GitHub release. No demonstrated directory requirement is missing. Before advertising a new build, finish the ongoing storage/documentation changes, regenerate and verify bundles, and publish a higher version if runtime behavior changes. Those are release-quality recommendations, **not additional directory submission rules**.

## 1. Exact submission channel and payload

Source: [live official directory](https://openchamber.dev/extensions/), section **Built an extension?** and its button's HTML `href`. The Cloudflare-protected address was decoded directly from that first-party HTML (first hex byte is the XOR key); the HTML entity `&#38;` becomes `&` between subject and body.

```text
To: feedback@openchamber.dev
Subject: OpenChamber extension for the directory

Extension name:
Repository URL:
Category (Workflow / Usage / Monitoring / Preview & files / DevOps /
          Providers / Memory / Agent setup / Themes):
What it does:
```

- **Explicit prose request:** repository link and one-line explanation.
- **Explicit button-template fields:** extension name, repository URL, category, what it does. Complete all four to minimize follow-up; the page does not describe a formal mandatory-field validator.
- **Not requested:** screenshot attachments, icon files, a banner, package submission, npm publication, fees, a signed build, a security questionnaire, minimum stars/downloads, or a release tag. No dimensions or asset-format rules are published there.
- **No issue/PR/form is named as the listing route.** The button is an email link, not a registration endpoint. Do not substitute an upstream feature issue or a `registry.json` PR for it.
- No public SLA, acceptance guarantee beyond the page's wording, review process, ranking algorithm, contractual approval conditions, or takedown policy was found in the inspected directory/SDK/contribution sources. Ask the maintainer if any unpublished condition matters; do not invent one.

Suggested content, **not sent**:

```text
Extension name: Artifact Gallery
Repository URL: https://github.com/sofianbll/openchamber-artifact-gallery
Category: Preview & files
What it does: Browse pages, images and deliverables from OpenChamber sessions,
preview their originals, and add provenance references to the current draft
without sending a message.
```

Optional context: local OpenChamber 2.5.2+, sessions and local-service approval, English/French documentation, and the README screenshots. Clearly state the local-service trust boundary; none of these additions is an explicit directory field.

## 2. Four different mechanisms — do not conflate them

Upstream source snapshot used below: [`openchamber/openchamber@10d63fed35e671bf8044afbdc06d5bdeaeff6f83`](https://github.com/openchamber/openchamber/tree/10d63fed35e671bf8044afbdc06d5bdeaeff6f83), the resolved `main` at inspection.

| Mechanism | Verified behavior | Publication implication |
|---|---|---|
| **Public website community directory** | The live page lists 42 extensions, mostly community-authored, linking directly to authors' repositories; team entries have an **Official** label. Submission is by email. | This is the requested target. A listing is not bundled installation, automatic approval, or an official endorsement of authorship. |
| **Application Settings → Integrations catalog cards** | [`catalogExtensions.ts:6–41`](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/ui/src/components/sections/integrations/catalogExtensions.ts#L6-L41) describes extensions “the team publishes”; the hard-coded array contains Excalidraw and Resource Monitor. Cards specify `guestId`, Git URL, homepage, translated names/descriptions, and logo. Installation uses ordinary Git install. | No evidence that an email directory listing adds one of these cards. Adding a community extension here is a separate app/product decision, not the documented website listing process. |
| **App-owned built-in registry** | [`packages/extensions/registry.json:1–4`](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/extensions/registry.json#L1-L4) currently has an empty `extensions` array. [`DOCUMENTATION.md:5–28`](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/extensions/DOCUMENTATION.md#L5-L28) reserves `openchamber-builtin-`, binds authority to an app-owned root, derives grants automatically, and prevents separate removal/Git updates. | This is app-bundled code. **Do not add Artifact Gallery here for a community listing or rename its ID into the reserved namespace.** Twelve-locale/build requirements in this document concern built-ins, not all listed community extensions. |
| **A hypothetical general marketplace/store** | The inspected public directory is a repository-link directory, and the app catalog above is a curated static list. The [installation docs](https://docs.openchamber.dev/extensions/) describe folder, ZIP, and Git sources. | No separate public store submission API, developer account, package-upload process, payment flow, or certification scheme was identified in these sources. This is an evidence limit, not a claim that no future/private store exists. |

The public monorepo tree and [organization repository listing](https://api.github.com/orgs/openchamber/repos?per_page=100) did not expose an obvious source repository/configuration for the `openchamber.dev` directory. The live first-party HTML is therefore the authority for its listing fields; no speculative catalog-file PR route is asserted.

## 3. Categories, assets, and observed listed-extension practices

The live site's exact categories are **Workflow, Usage, Monitoring, Preview & files, DevOps, Providers, Memory, Agent setup, Themes**. **Preview & files** is the closest existing category for Artifact Gallery; that classification is a recommendation, not a category assigned by maintainers.

The current directory cards show category, title, short description, author identity/avatar, repository link, and sometimes **Official**. The card images are author avatars under paths such as `/extensions/p4rthpat3l.png`, not feature screenshots. The page does not tell submitters to provide avatar files or asset dimensions; how maintainers obtain them is unverified.

First-party repositories of extensions already linked from the directory provide useful precedents, **not binding policy**:

| Listed example / source | Directly observable practice |
|---|---|
| Official [Docker README](https://github.com/openchamber/openchamber-extension-docker/blob/main/README.md), sections Install, Build, License | Documents local-service and Small Model permissions, minimum host and CLI requirements, unsupported surfaces, prebuilt committed bundles, version-driven updates, MIT license. Supports the same Git installation approach as Gallery. |
| [Canvas README](https://github.com/P4rthPat3l/openchamber-canvas/blob/main/README.md), sections Install, Requirements and limits, License | Closely related gallery already listed under Preview & files. Documents service approval, separate MCP setup, screenshots, local-only restriction, untrusted-HTML sandbox, tests, no telemetry, MIT. Listing is demonstrably compatible with a local service and additional setup. Gallery should explain that it reuses existing session artifacts rather than requiring this companion MCP workflow. |
| [Files README](https://github.com/PylotLight/openchamber-files-ext/blob/main/README.md), sections Install, Development, License | Git URL install, project-files and broad home filesystem permissions, committed IIFE, version-driven updates, build/validate/test commands, MIT. A listed extension can request substantial file access; this is **not** evidence of a security audit or a recommended permission scope. |
| [Live directory](https://openchamber.dev/extensions/) entries Open With, Git Manager, Translator, Claude Account Switcher | Some entries explicitly require release archives/specific branches, are Chinese-only, or support only selected OSes. Thus default-branch Git installation, English UI, all-host/all-OS support, and zero external prerequisites are not universal observed listing prerequisites. |

## 4. Actual platform contract relevant to Gallery

These are executable/documented **host requirements**, not a separate website editorial checklist:

1. **Package:** ship `package.json` with `openchamber`, semver `version`, `apiVersion: 1`, unique kebab-case panel ID, valid icon and package-local entries. A declared host floor rejects older hosts. See [SDK README:31–101](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/sdk/README.md#L31-L101) and [parser](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/sdk/src/parse.ts).
2. **Prebuilt distribution:** the host does not compile TypeScript. The panel must use classic/IIFE JavaScript, not browser ES modules. The service must also ship built JavaScript. A Git origin needs those files in the installed branch/tag; a source-only repository is insufficient. [SDK README:31–45](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/sdk/README.md#L31-L45).
3. **Approval:** `sessions` exposes project/worktree/session metadata and operations; it does **not** grant conversation content through that API. Declaring a service adds its own `service` approval. An update expanding permissions remains off until reviewed. [User docs:38–51](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/docs/content/docs/extensions.mdx#L38-L51).
4. **Service trust boundary:** `runtime: "host"`; bind only `127.0.0.1`; use the supplied port/token; authenticate **all** requests including health; provide `GET /health` returning 200. `exec`/`sockets` declarations are advisory intent, **not an OS sandbox**. An empty permissions object does not make service access restricted. The host supplies the runtime; a user's own Node installation is unnecessary. [Service contract:25–29,83–95,128–168](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/sdk/GUEST_SERVICES.md#L25-L29).
5. **Sandbox/remote assets:** extension frames are opaque-origin sandboxes. Bundle required code/assets rather than relying on undeclared remote resources; do not assume access to host React internals or arbitrary host APIs from the frame. [SDK scope:265–267](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/sdk/README.md#L265-L267), [runtime documentation:75–91](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/sdk/DOCUMENTATION.md#L75-L91).
6. **Updates:** Git updates compare package versions; bump semver for runtime changes. Branch/tag fragments choose the channel. ZIP/folder installations are manually replaced. The native archive installer accepts **ZIP**, not a `.tar.gz` directly; extracting a tarball and selecting its folder is valid. [User docs:18–30,81–89](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/docs/content/docs/extensions.mdx#L18-L30).
7. **Compatibility:** web and desktop load extensions; VS Code and the mobile app do not. Browser UI at narrow width is not equivalent to support for the mobile app. [SDK README:7](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/sdk/README.md#L7).
8. **Storage:** SDK instance storage is extension-owned, server-side JSON without an additional file grant; uninstall removes its namespace. Device storage is a separate opt-in and is not secret storage. Do not claim that unrelated filesystem data is deleted by SDK namespace removal. [Runtime storage:40](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/sdk/DOCUMENTATION.md#L40), [user docs:57](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/packages/docs/content/docs/extensions.mdx#L57).

### Upstream contribution rules have a different scope

If requesting an **app** behavior change rather than a website listing, upstream [CONTRIBUTING.md:8–43,164–218](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/CONTRIBUTING.md#L8-L43) requires an Ideas discussion and maintainer go-ahead before implementing product decisions; focused PRs and applicable validation follow. The [issue config](https://github.com/openchamber/openchamber/blob/10d63fed35e671bf8044afbdc06d5bdeaeff6f83/.github/ISSUE_TEMPLATE/config.yml) routes ideas to Discussions and disables blank issues. React/Tailwind/host-monorepo style and test rules there are not automatically imposed on an independently maintained extension. No extension-listing form/template was found among the inspected upstream issue templates.

## 5. Artifact Gallery audit

Local baseline: HEAD `e6403311fed5e07a1bfeeb8fc81b7f3eae05e9ff`. The checkout already contained unrelated ongoing edits before this research; storage implementation and public presentation were changing during inspection. References below describe the inspected files, not an immutable release. Public `v0.2.1` resolves separately to `44552e5f81c1802a362791a76dc3e96b42c8468a`.

| Surface | Evidence | Assessment |
|---|---|---|
| Manifest/package | `package.json:1–40`: semver 0.2.1, MIT, protocol 1, floor >=2.5.2, `artifact-gallery`, image icon, panel + page, sessions, host service with `{}` permissions, exact SDK/client pins. | **Pass verified:** installed SDK 2.5.2 `parseManifestJson` returned `ok: true`. `private: true` prevents npm publication, not Git installation; npm publication is not requested. `description`, `repository`, `homepage`, `author`, keywords are absent, but not required by the inspected directory/host contract. |
| GitHub installation | `README.md:41–66`, `docs/installation.md:8–55`, `build.ts:5–16`, tracked `panel/main.js`, `service/main.js`, `panel/index.html:7–9`. Public tag tree confirms both compiled bundles exist in v0.2.1. | **Present:** direct URL, fixed-tag alternative, correct IIFE/Node ESM build targets, no consumer install/build. Docs explicitly warn that v0.2.0's Git tag lacks bundles. This research did not perform a fresh host Git installation. |
| Release distribution | `package.ts:8–32`, `.github/workflows/release.yml:17–35`; [latest release](https://github.com/sofianbll/openchamber-artifact-gallery/releases/tag/v0.2.1) is published and has `.tar.gz` plus SHA-256. | **Present:** allowlisted dependency-free release folder, manifest assertion, exclusive writes, checksum, version/tag check, bundle-freshness check. Tarball is a folder-delivery alternative, not a directly installable native ZIP. A ZIP release asset is an optional convenience, not required for listing. |
| Permissions and conversation access | `package.json:26–30`, `src/library.ts:32–59,82–120`, `src/service.ts:14–19,50–60`. | **Disclosed high-trust design:** sessions API metadata comes through the SDK, but conversation content is read by the service directly through local OpenCode discovery. Explain that **service** approval, not `sessions` alone, authorizes an unrestricted process. Empty `permissions` is consistent with no declared CLI/socket need, not a filesystem deny rule. |
| Service authentication | `src/service.ts:6–19,38–57,59–60`. | **Source-level pass:** required token/port, constant-time bearer comparison before routes, authenticated health, loopback binding, payload/filter validation, generic unexpected-error message. No runtime penetration test performed. |
| File access and privacy | `src/library.ts:174–219`: previews re-read the original message; files are opened only through extracted source references and subject to size/type checks. `docs/privacy.md:23–29` acknowledges unrestricted service access. | **Residual risk:** referenced paths/symlinks are not fenced to project roots; this follows the unrestricted service design. Do not claim project-only access or that untrusted message content is a filesystem permission boundary. Source references and local OpenCode are trusted inputs to this design. No arbitrary filesystem crawler was found in these paths. |
| HTML isolation | `src/panel.ts:257–258`, `src/preview.ts:18–26`, `vendor/README.md:3–20`. | **Source-level pass:** nested `sandbox="allow-scripts"` without same-origin, no-referrer, restrictive CSP denies network/forms/objects, bundled renderer provenance/notices. HTML can execute local inline scripts; “sandboxed” does not mean inert. Browser regression/security checks exist but were not rerun here. |
| Storage/data lifecycle | At inspection, `src/cache.ts:5–24,56–88`, `src/panel.ts:31–62,343–353`, `src/library.ts:75–81,115–120` implement bounded metadata snapshots through `host.storage` and a shared service lease. Meanwhile `docs/privacy.md:9–19` still describes a 0600 file under `agent-os/gallery/index-v1.json`. | **In-progress mismatch:** reconcile documentation, installed bundles, uninstall behavior, and treatment of the old private index before publishing the new storage behavior. Do not silently delete/migrate that historical data. This is not proof the released v0.2.1 documentation is wrong: its storage implementation is a different snapshot. |
| README/package assets | Working README `README.md:1–3` references `docs/public/icon.svg`; `package.ts:17–23` does not include that file. | **Presentation gap for new README:** add the icon to the release allowlist or use an asset actually shipped when finalizing this work. `test/package.ts:16–22` checks Markdown links, not HTML `<img src>`, so that check alone will miss this broken archive README image. Not a directory blocker. |
| License/attribution | `LICENSE:1–21`, `package.json:4`, `assets/LICENSE`, `vendor/LICENSE`, `vendor/OPENCODE-LICENSE`, `vendor/README.md:3–21`, packaging allowlist. | **Present:** MIT project license and vendored/source/font notices. A license is good distribution hygiene; no specific license requirement is published by the directory. This is not a legal audit. |
| Documentation/support | `README.md:96–137`, `CONTRIBUTING.md:3–59`, guides, troubleshooting, privacy, compatibility, changelog, issue templates and EN/FR docs. | **Present, stronger than explicit listing minimum.** Independent-community status is stated. Existing public instructions should stay truthful about local-only qualification, engine floor, permissions, data retention and supported surfaces. |
| Compatibility/maintenance | `docs/compatibility.md:3–40,73–90`, `.github/workflows/compatibility.yml`, pinned SDK/client and exact-version SDK patch in `package.json:34–40`. | **Present with limits:** baseline + latest-candidate workflow, host-service and synthetic-host UI checks. Not proof of every future host or Electron/OS combination. SDK patch/vendored renderer need ongoing regression maintenance; no explicit directory ban on either was found. |
| Screenshots/assets | `README.md:17–20,75–89`, tracked `docs/assets/host-*.png`, `CONTRIBUTING.md:48–49`. | **Present:** host/context/preview/reuse/light/settings/French/narrow examples, documented fictional fixtures. Screenshot bytes were not visually inspected in this research; the synthetic-data claim is documented and has fixture sources, not independently privacy-certified here. No directory screenshot requirement found. |
| Tests and release evidence | `.github/workflows/checks.yml:17–41`, `test/package.ts:10–49`; public Actions records below. | **Evidence exists:** manifest/bundle-freshness/docs/browser/package checks in CI. This session only reran manifest parsing, not all suites or rebuilds; existing CI success does not validate concurrent dirty changes. |

### Public verification records observed

- [Checks success for e6403311](https://github.com/sofianbll/openchamber-artifact-gallery/actions/runs/40677070026).
- [Compatibility success for e6403311](https://github.com/sofianbll/openchamber-artifact-gallery/actions/runs/40677069866).
- [Pages success for e6403311](https://github.com/sofianbll/openchamber-artifact-gallery/actions/runs/40677070101).
- [Release success for 44552e5f / v0.2.1](https://github.com/sofianbll/openchamber-artifact-gallery/actions/runs/40625865274).
- [Public v0.2.1 tree](https://github.com/sofianbll/openchamber-artifact-gallery/tree/v0.2.1): contains `panel/main.js` and `service/main.js`; release assets are independently visible on the release page. Checksum contents/archive bytes were not downloaded and revalidated here.

## 6. Minimal next actions and boundaries

1. **For listing only:** email the four fields above. No code change, registry PR, npm publish, new framework, new permissions, twelve-language translation, or store account is justified by the published directory process.
2. **For a new public runtime build:** finish the ongoing storage work; reconcile privacy/installation docs and assets; regenerate tracked bundles; run focused tests, packaging/link checks and host compatibility checks; bump semver and publish an immutable tag if behavior changes. Do not describe unreleased working-tree behavior as v0.2.1 behavior.
3. Offer the existing README/site and synthetic screenshots as helpful optional context. Keep limitations explicit rather than claiming broad remote/mobile/OS support.
4. Ask maintainers about app integration-catalog placement separately only if that becomes a distinct goal. Directory email is not consent to modify upstream app catalog or built-ins.

**Not checked:** full independent security audit, dependency-vulnerability scan, archive checksum/content revalidation, fresh Git installation, visual screenshot privacy inspection, or full browser/OS qualification. **Not done:** email, issue, PR, release, data mutation, production operation, or changes to existing product files.
