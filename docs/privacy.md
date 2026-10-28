# Privacy & limits

## What stays on your machine

The gallery has no separate account, cloud sync or model call. Its host-managed
local service reads OpenCode sessions and explicitly referenced files. It does not
crawl the filesystem or start/restart OpenCode.

The metadata index contains IDs, titles, paths, dates and provenance, not HTML or
attachment bytes. It is written atomically with mode `0600` to:

```text
$XDG_DATA_HOME/agent-os/gallery/index-v1.json
# Default: ~/.local/share/agent-os/gallery/index-v1.json
```

The historical `agent-os` directory name preserves compatibility with the first
local release; you do not need Agent-OS installed. This index contains private
metadata. Do not include it in a public bug report.

## Two different boundaries

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
