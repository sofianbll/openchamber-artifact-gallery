# Appearance & language

## Follow OpenChamber

The gallery follows the host's light/dark theme, supplied colors, font stack and
corner radius. Geist Sans is bundled for reliable offline rendering. The extension
uses OpenChamber's default semantic text sizes.

![The gallery in the real OpenChamber light theme](assets/host-light.png)

::: info SDK 2.5.2 limits
Custom interface scale and padding are **not transmitted to extensions**. Font- or
radius-only changes may need the gallery to be reopened before the host sends new
values. Nonbundled web fonts can fall back to installed fonts. Complete appearance
synchronization requires host/SDK support.
:::

## Choose a language

Open **Gallery settings → Language**:

- **Automatic** follows OpenChamber: French locales use French; other locales use English.
- **English** or **Français** saves a persistent choice that overrides the host locale.

Return to Automatic to follow the host again. Artifact titles and source content
are never translated. The host's extension entry always uses the manifest label
**Artifact Gallery**. This website defaults to English independently of app language.

## Keep previews comfortable

![Gallery preferences inside OpenChamber](assets/host-settings.png)

Gallery Settings also controls automatic refresh, 12/24 cards per page and preview
loading. Choose **On opening only** if you want no live card thumbnails; expanded
previews still work.

The same gallery adapts to narrow windows. These viewport checks are not a claim
of support for OpenChamber's mobile or VS Code hosts.

![Gallery in a narrow OpenChamber window, with fictional data](assets/host-narrow.png)
