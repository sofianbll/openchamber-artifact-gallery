const fontCss = (await Promise.all([400, 500, 600].map(async weight => {
  const bytes = await Bun.file(`assets/geist-${weight}.woff2`).arrayBuffer();
  return `@font-face{font-family:'Geist Sans';src:url(data:font/woff2;base64,${Buffer.from(bytes).toString('base64')});font-weight:${weight};font-display:swap}`;
}))).join('');
for (const [entry, outfile, target, format] of [
  ['src/panel.ts', 'panel/main.js', 'browser', 'iife'],
  ['src/service.ts', 'service/main.js', 'node', 'esm'],
] as const) {
  const result = await Bun.build({ entrypoints: [entry], target, format, minify: true, define: { GALLERY_FONT_CSS: JSON.stringify(fontCss) }, plugins: [{
    name: 'upstream-renderer-imports',
    setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/(browser\/previewFrameHost|theme\/readableColors)$/ }, ({ path }) => ({ path: `${import.meta.dir}/vendor/${path.split('/').pop()}.ts` }));
    },
  }] });
  if (!result.success) throw new AggregateError(result.logs, `Build failed: ${entry}`);
  await Bun.write(outfile, result.outputs[0]);
  console.log(`${outfile}: ${result.outputs[0].size} bytes`);
}
