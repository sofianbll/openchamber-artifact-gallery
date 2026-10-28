# Gallery guide

## Scopes and navigation

- **Session** matches the active conversation by ID. A new session stays empty.
- **Project / Chats** follows that conversation's space.
- **All** includes projects, managed Chats and identifiable unclassified sources.
- **All projects** excludes Chats and unclassified sources.

Changing conversation preserves the scope. Search, type, page and expanded preview
reset; an explicit space filter under All stays selected. Unknown directories are
never inferred to be Chats or a shared current project.

Chats roots come from the local host's `/api/fs/home` endpoint, including custom,
legacy and canonical roots. This is a version-specific host route, not a public
SDK workspace API. If access is refused, classification stays unavailable; no
credential lookup is attempted to circumvent that refusal.

The full page has a space explorer. Panel and narrow views expose it through
**Explore** under All. The SDK's project objects have no custom icons, so initials
are used. Dates use the device's local timezone.

## Reusing an artifact

**Add to message** uses `host.attach` to add a provenance reference to the current
composer, without sending. Browsing another space does not retarget the draft.
The chip carries identifiers and a source link, not HTML or file contents. Clicking
it reopens the artifact through `host.onItem` and the service's `/item` route.
OpenChamber owns each session's draft.

Dragging from the sandboxed frame into the real host composer did not work in the
host check; the verified add button is the supported path. Full-content attachment
and cross-harness mentions are not implemented.

## Appearance and language

The gallery uses `@openchamber/sdk/ui` and the theme supplied by `HostReadyContext`:
colors, font stacks, light/dark mode and corner radius. Its typography matches the
host's default semantic sizes: 14px headings, 13.5px labels, 12.5px metadata and 12px
small text at a 16px root. Geist Sans is embedded so authenticated guest asset URLs
do not prevent the default font from loading.

The gallery corrects the SDK's `.875rem` root assignment, which otherwise shrinks
rem-based labels twice. It does **not** access the parent DOM or private settings.

**Known host-contract limits in OpenChamber 2.5.2:**

- Interface scale and custom padding are not sent to extensions.
- Font/radius-only changes are not explicit dependencies of the host's ready
  snapshot. Reopening may be necessary to receive new values.
- Nonbundled CDN fonts are unavailable in the offline frame. Installed fonts and
  the received fallback stack still work; Geist Sans is included.

These require upstream host/SDK support for complete synchronization. The gallery
does not advertise full appearance parity.

**Automatic / English / Français** lives in gallery Settings. Automatic follows
`ready.locale` (French locales → French, others → English); an explicit choice wins
across reloads. Returning to Automatic follows the current host locale again.
User-authored titles and artifacts are not translated. The host's extension entry
uses its fixed manifest label **Galerie**.

## Storage and boundaries

- A scan runs on opening. While visible, automatic refresh scans changed sessions
  roughly once a minute. Refresh requests a scan immediately; an in-flight scan may
  finish after the page closes. Turning automatic refresh off stops periodic scans.
- All session/message pages are traversed, including history before folder moves.
  Unchanged sessions skip message reads. Failed reads preserve existing references.
- Recognized sources: `render.page`, interrupted answer pages, browser captures,
  `file.open`, assistant Markdown links to local deliverables, image/PDF attachments.
  Code patches and incidental tool logs are excluded. This is not a filesystem crawl.
- The metadata index stores IDs, titles, paths, dates and provenance, never HTML or
  attachment bytes. For compatibility with the initial local release, it lives at
  `$XDG_DATA_HOME/agent-os/gallery/index-v1.json`, defaulting to
  `~/.local/share/agent-os/gallery/index-v1.json`. Writes are atomic, mode `0600`.
  This historical directory name does not require an Agent-OS installation.
- Each preview rechecks the source message and reads the current file. Deleted or
  moved sources can become unavailable. References are not backups.
- Resource bytes are temporary: keys expire after two minutes, with a 64 MiB cache
  budget. Two source reads run concurrently; six visible thumbnails stay active.
  Hidden-document, offscreen and modal-background thumbnails unload.
- Pagination replaces cards. The index endpoint returns a page of metadata, and a
  version token omits unchanged rows. These are loading bounds, not total RAM caps.
- The service uses authenticated loopback requests and `Service.discover()`. It
  never starts/reloads OpenCode or calls a model. OpenChamber owns its lifecycle.

HTML previews use the native renderer in an opaque, network-blocked iframe. Saved
answers remain readable; old requests cannot be submitted. Inline local images
use the native 10 MiB/image and 25 MiB/page limits. Standalone images allow 10 MiB;
documents allow 20 MiB, with a separate encoded-attachment limit before decoding.

Markdown, text and CSV/TSV render as text. HTML files can render locally; external
and relative assets are not loaded. PDF/Office files link to their source session
for the native reader. Only the local instance is supported; narrow-viewport tests
do not establish support for the mobile or VS Code extension hosts.

## Measurements and verification

Synthetic comparison on 2026-10-28: 1,000 references, ten pages of 24 cards,
1440×900 Chromium viewport, same observation window. The default page size is 12.

| Measurement | Initial 0.1.0 | Contextual implementation |
| --- | ---: | ---: |
| Mounted cards after ten pages | 240 | 24 |
| Active thumbnail iframes | 20 | 6 |
| Guest DOM nodes | 1,964 | 343 |
| Initial index response | 331,769 B | 8,848 B |
| Unchanged index response | 331,769 B | 376 B |

The final appearance/language run observed 100 preview reads and 13,228,693 bytes
of guest JS heap; the initial baseline observed 206 and 19,196,353 respectively.
Heap/read counts vary by run. No total process RAM/CPU ceiling has been measured.

Verified locally: ten backend tests / 41 assertions; compiled browser checks for
scope retention, cross-space attachments, chip reopening, persisted preferences,
locale priority, loaded fonts, theme tokens, isolation, stale answers, filters and
desktop/mobile overflow. Real OpenChamber checks observed the running service,
gallery navigation, provenance attachment without sending, and corrected 13.5px
titles with Geist loaded. Chip reopening is covered by the fixture bridge.

No Safari, Firefox, physical-device or remote-host qualification. The built-in
extension registry is maintainer-controlled; publication does not imply listing.

## Disable, update or remove

Disable **Galerie** in Settings → Extensions before replacing its installed folder.
Re-enable after updating. Keep an older release folder to roll back. Remove
unregisters the extension; it does not delete conversations or deliverables.

To rebuild the derived index, disable the gallery and move only `index-v1.json`
aside, then enable it again. Keep private index files out of issue reports.
