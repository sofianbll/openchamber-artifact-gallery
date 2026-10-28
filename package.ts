// Build an allowlisted, dependency-free folder for OpenChamber's folder installer.
import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { createHash } from 'node:crypto';
import { parseManifestJson } from '@openchamber/sdk/schemas';

const output = process.argv[2];
assert(output && isAbsolute(output), 'Usage: bun package.ts /absolute/path/to/a-new-folder');
process.chdir(import.meta.dir);
await import('./build');
await mkdir(output); // Refuse to replace any existing delivery or user directory.
const source = JSON.parse(await readFile('package.json', 'utf8'));
const manifest = { name: source.name, version: source.version, private: true, type: 'module', ...(source.license ? { license: source.license } : {}), openchamber: source.openchamber };
assert(parseManifestJson(JSON.stringify(manifest)).ok, 'Invalid distribution manifest');
await writeFile(join(output, 'package.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
const files = ['README.md', 'CHANGELOG.md', 'docs/guide.md', 'docs/fr.md', 'docs/development.md', 'docs/assets/gallery-dark.png', 'docs/assets/gallery-light.png', 'docs/assets/gallery-mobile.png', 'panel/index.html', 'panel/main.js', 'panel/styles.css', 'service/main.js', 'assets/LICENSE', 'vendor/LICENSE', 'vendor/OPENCODE-LICENSE', 'vendor/README.md'];
if (await Bun.file('LICENSE').exists()) files.push('LICENSE');
for (const file of files) { await mkdir(dirname(join(output, file)), { recursive: true }); await copyFile(file, join(output, file)); }
const shipped = await readdir(output, { recursive: true, withFileTypes: true });
assert.equal(shipped.filter(entry => entry.isFile()).length, files.length + 1);
assert(!shipped.some(entry => ['node_modules', 'index-v1.json', '.env', 'auth.json'].includes(entry.name)));
const tar = Bun.spawn(['tar', '-czf', '-', '-C', dirname(output), basename(output)], { stdout: 'pipe', stderr: 'inherit' });
const archive = Buffer.from(await new Response(tar.stdout).arrayBuffer());
assert.equal(await tar.exited, 0, 'Archive creation failed');
await writeFile(output + '.tar.gz', archive, { flag: 'wx' });
await writeFile(output + '.tar.gz.sha256', `${createHash('sha256').update(archive).digest('hex')}  ${basename(output)}.tar.gz\n`, { flag: 'wx' });
console.log(`Installable folder: ${output}\nArchive: ${output}.tar.gz (${archive.length} bytes)`);
