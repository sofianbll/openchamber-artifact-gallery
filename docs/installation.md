# Install & update

## Install from GitHub

Use **local OpenChamber 2.5.2 or newer**, with its OpenCode service running. The
extension was verified against OpenChamber 2.5.2 and OpenCode client 2.2.0.

1. Open **Settings → Extensions → Add extension** in OpenChamber.
2. Paste the repository URL into the URL input:

   ```text
   https://github.com/sofianbll/openchamber-artifact-gallery
   ```

3. Review the **sessions** and **local service** capabilities, then install and
   enable **Artifact Gallery**.
4. Open its icon in the **upper-left sidebar row, before search**. If that row is
   crowded, look under **Extension pages**. You can also open it as a side panel.

OpenChamber clones the repository and loads the included compiled entries.
**You do not need Bun, npm install or a build command.** Git must be available to
OpenChamber for a repository install.

The local service can read session history and explicitly referenced files with
your account's access. [Read the privacy boundaries](privacy.md).

## Update a URL installation

Use OpenChamber's update controls in **Settings → Extensions**. OpenChamber retains
the Git origin and compares the remote package version; it offers an update when
that semantic version is newer, not for every commit. It does not download release assets.
The plain URL follows the repository's default branch.

To install a fixed release, append its tag:

```text
https://github.com/sofianbll/openchamber-artifact-gallery#v0.3.0
```

A pinned tag stays on that release. If returning to an older version, disable and
remove the current registration before installing the chosen tag or release folder.
Removing the extension does not delete source conversations or deliverables.

## Alternative: a release folder

Download the `.tar.gz` from [GitHub Releases](https://github.com/sofianbll/openchamber-artifact-gallery/releases/latest),
optionally verify its published SHA-256, and extract it into a permanent folder.
Choose that folder in **Add extension**. It contains the same ready-to-run entries.

For folder updates, disable the extension, replace the folder with the new release,
and re-enable it. Keep the previous folder if you need to roll back.

::: tip Already using version 0.2.0?
Its release archive works, but its repository tag lacks the compiled entries for
URL installation. Use **0.2.1 or newer** for the GitHub URL path.
:::

## Developer checkout

Clone the repository, install its pinned development dependencies and rebuild after
source edits. The [development guide](development.md) covers builds and checks.
An Agent-OS checkout is not required.
