# Privacy & limits

## What stays on your machine

The gallery has no separate account, cloud sync or model call. Its host-managed
local service reads OpenCode sessions and explicitly referenced files. It does not
crawl the filesystem or start/restart OpenCode.

The metadata index contains IDs, titles, paths, dates and provenance, not HTML or
attachment bytes. It is a reconstructible cache in native `host.storage`, isolated
by OpenChamber instance and removed by the host on uninstall. Sources stay in
OpenCode and their original files. Do not publish private cache metadata.

The service keeps at most 400 KiB of serialized metadata, evicting oldest updated
sessions first and skipping oversized sessions. The panel restores before scanning
and saves completed scans, including background scans while it remains open.
Closing it can leave the previous cache; reopening reconnects to the service and
saves its completed state. Storage failures explicitly show memory-only mode;
scanning and previews remain available.

Chunks stay at or below 48 KiB of UTF-8 JSON per value. The manifest is committed
last, then old chunks are cleaned. Two generations, JSON escaping and the separate
`preferences` key fit below the 2 MiB host quota. A renewable service lease
serializes panels; this is not a storage transaction. Abandoned chunks are cleaned
on a subsequent save.

The former `$XDG_DATA_HOME/agent-os/gallery/index-v1.json` (default
`~/.local/share/agent-os/gallery/index-v1.json`) is never read, migrated or deleted
automatically. Its private metadata remains until you remove that old file yourself.

## Two different boundaries

Project icons are best effort and memory-only, never part of the metadata index or
disk cache. The panel calls the authenticated local service's `/project-icon` route,
not the host API directly. The service only requests one known project's image on
the local origin received during sync, without credentials or redirects. Host
401/403/404 responses keep initials; no credential lookup or extra permission is
used. **Gallery settings → Project icons** disables loading and releases cached
object URLs, ignoring late responses. SVG is displayed only as an image, not HTML.

**The local service is not an OS sandbox.** It runs with your user account's access,
behind authenticated loopback requests managed by OpenChamber. Its purpose is to
read session history and referenced deliverables.

**HTML previews are sandboxed.** They run in an opaque frame with network access
blocked. Inline local images use the native renderer's 10 MiB/image and 25 MiB/page
limits. External and relative HTML assets are not fetched.

## Loading is bounded

- 12 or 24 visible cards per page, replacing the previous page.
- At most six active thumbnails and two simultaneous source reads.
- Offscreen, hidden-document and modal-background thumbnails unload.
- Temporary preview bytes expire after two minutes, within a 64 MiB cache budget.
- Standalone images allow 10 MiB; documents allow 20 MiB. Encoded attachments have
  a separate limit before decoding.
- Unchanged index responses omit rows using a version token.

These are loading bounds, **not a total process RAM/CPU guarantee**. The
[technical reference](reference.md#measurements-and-verification) documents the
1,000-reference synthetic comparison and its measurement limits.

## References are not backups

Every preview checks the source again. Deleted messages, moved files or missing
attachments can make an artifact unavailable. Removing the extension does not
delete the original conversations or deliverables.

Only local OpenChamber has been qualified. Safari, Firefox, remote hosts, physical
mobile devices and VS Code hosts have not been qualified.
