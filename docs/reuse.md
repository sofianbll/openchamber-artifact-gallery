# Preview & reuse

## Open the original

Select an artifact to expand it. The detail view keeps its date, source conversation
and provenance visible. Use the source link to return to the original message.

![Expanded artifact in OpenChamber with provenance](assets/host-preview.png)

| Format | Preview behavior |
| --- | --- |
| Rendered page / local HTML | Interactive, isolated HTML preview; external resources do not load. |
| Image / capture | Image preview, up to 10 MiB. |
| Markdown, text, CSV / TSV | Readable text; tables are shown as their source text. |
| PDF / Office | Source-session link for the host's native reader. |

Saved answers in old interactive pages remain readable. Expired requests cannot
be submitted again. Previews read the source at opening time, so removed or moved
files may no longer be available.

## Add it to your message

1. Keep the destination conversation active.
2. Find the artifact in any scope.
3. Choose **Add to message** on its card or expanded preview.
4. Review the reference chip in your composer, write your message and send when ready.

![An artifact reference in the OpenChamber composer](assets/host-reuse.png)

The chip contains identifiers and provenance, **not the full HTML or file bytes**.
It does not silently load the artifact into model context. Ask the agent to inspect
the referenced source when you want it to use the content.

Click the chip to reopen the artifact. OpenChamber owns the draft for each session.
Browsing another project never redirects that draft.

## Current boundaries

Use the **Add to message** button. Drag-and-drop from the sandboxed extension frame
is not supported. Full-content attachments and cross-harness mentions are not
implemented. [See storage and preview limits](privacy.md).
