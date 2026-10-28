# Troubleshooting

## “Missing build” when installing

Use the current repository URL or tag **v0.2.1 or newer**. Version 0.2.0 did not
include the compiled entries in Git; its release archive was the installable path.
For a modified checkout, run `bun run build` before registering its folder.

## The gallery icon is missing

Check that **Artifact Gallery** is enabled in Settings → Extensions. Look in the
upper-left row before search, or under **Extension pages** when the row is crowded.
Confirm that OpenChamber is at least 2.5.2.

## The gallery is empty

1. A new **Session** has no artifacts. Try **Project / Chats** or **All**.
2. Clear the search, type filter and explicit space filter.
3. Click **Refresh** and let the scan finish.
4. Check that OpenCode and the extension's local service are available.

The gallery recognizes explicit deliverables, not every code change or tool output.
Unknown folders do not count as Chats. If the host denies the Chats-root lookup,
classification remains unavailable rather than guessing.

## An artifact is listed but its preview fails

Open its source conversation. The message or file may have moved or been deleted,
the file may exceed preview limits, or the format may require the native reader.
The index is a reference list; it does not preserve a copy of the content.

## The reference went to a different draft than expected

The destination is the **active conversation**, shown in the gallery's draft
destination label. Exploring another project changes the sources, not that destination.
Switch the active conversation before adding the reference.

## A font, radius or spacing setting did not update

Reopen the gallery after font/radius changes. Interface scale and padding are not
part of SDK 2.5.2's guest theme contract. [Appearance details](appearance.md).

## Rebuild the derived index

Disable the extension, move only `index-v1.json` aside, then enable the extension
and refresh. See its [location](privacy.md#what-stays-on-your-machine). Keep the old
file until the new scan is complete; do not delete source conversations or files.

## Report a problem

[Open an issue](https://github.com/sofianbll/openchamber-artifact-gallery/issues)
with OpenChamber/extension versions, OS, installation method, steps and expected
behavior. Use fictional examples and redact screenshots. Never attach your session
history, private index, credentials or tokens.
