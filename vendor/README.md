# OpenChamber renderer sources

Unmodified MIT-licensed sources from `openchamber/openchamber` tag **v2.5.2**:

- `htmlRender.ts`: `packages/ui/src/components/chat/message/parts/htmlRender.ts`
- `previewFrameHost.ts`: `packages/ui/src/lib/browser/previewFrameHost.ts`
- `readableColors.ts`, `color.ts`: `packages/ui/src/lib/theme/`

`build.ts` resolves the renderer's two runtime alias imports locally. Type-only
host imports disappear during bundling. The gallery uses the native document
builder with `waiting: false`, inside an opaque sandbox with an additional
network-denying CSP. No host annotation or submission bridge is connected.

These sources keep the native page classes, theme and saved-answer behavior;
they are not the extension's UI kit (that comes from the pinned SDK package).

The built panel also includes `@openchamber/sdk` 2.5.2 under the same MIT notice
(`LICENSE`). The local service bundles `@opencode/client` 2.2.0's service discovery
code; `OPENCODE-LICENSE` is its upstream notice from
<https://github.com/anomalyco/opencode/blob/v2.2.0/LICENSE>.
Geist Sans 5.2.5 is covered separately by `../assets/LICENSE` (SIL OFL 1.1).
