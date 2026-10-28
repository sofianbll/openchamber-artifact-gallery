import { buildHtmlRenderDocument, htmlRenderTheme, htmlRenderThemeMessage } from '../vendor/htmlRender';
import type { HostReadyContext } from '@openchamber/sdk';
declare const GALLERY_FONT_CSS: string;
export const fontCss = GALLERY_FONT_CSS;

function themeFor(context: HostReadyContext) {
  const t = context.theme.tokens;
  return htmlRenderTheme({ metadata: { variant: context.theme.mode }, colors: {
    surface: { background: t.background, foreground: t.foreground, elevated: t.elevated, elevatedForeground: t.elevatedForeground, muted: t.mutedSurface, mutedForeground: t.muted },
    primary: { base: t.primary, foreground: t.primaryForeground },
    interactive: { border: t.border, hover: t.hover, active: t.active, selection: t.selection, selectionForeground: t.selectionForeground, focusRing: t.focus },
    status: { success: t.success, warning: t.warning, error: t.error, info: t.info, successBackground: t.background, warningBackground: t.background, errorBackground: t.background, infoBackground: t.background },
    syntax: { base: { background: t.subtle, foreground: t.foreground } },
  } } as any, { rem: 16, text: 14, sans: t.font, mono: t.mono });
}
export const previewThemeMessage = (context: HostReadyContext) => htmlRenderThemeMessage(themeFor(context));

export function previewDocument(html: string, context: HostReadyContext, answer: unknown = null) {
  const theme = themeFor(context);
  const doc = new DOMParser().parseFromString(buildHtmlRenderDocument(html, theme, { contained: true, answerState: { waiting: false, answer: answer as any } }), 'text/html');
  const policy = doc.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:; media-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  doc.head.prepend(policy);
  const fonts = doc.createElement('style'); fonts.textContent = fontCss; doc.head.append(fonts);
  return '<!doctype html>' + doc.documentElement.outerHTML;
}
