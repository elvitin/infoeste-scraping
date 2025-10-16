import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { readdir, rm, unlink } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const targets = [
  'apps/web/dist',
  'apps/web/public/events.json',
  'apps/scraper/dist',
  'packages/core/dist',
  'packages/infrastructure/dist'
];

const artifactRoots = ['packages/core/src', 'packages/infrastructure/src'];

const generatedSuffixes = ['.js', '.js.map', '.d.ts'];

async function clean() {
  for (const target of targets) {
    const absolutePath = join(projectRoot, target);
    try {
      await rm(absolutePath, { recursive: true, force: true });
      console.log(`Removed ${target}`);
    } catch (error) {
      console.error(`Failed to remove ${target}:`, error);
      process.exitCode = 1;
    }
  }

  await Promise.all(artifactRoots.map(root => removeGeneratedArtifacts(root)));
}

async function removeGeneratedArtifacts(root) {
  const absoluteRoot = join(projectRoot, root);
  try {
    await traverseAndCleanup(absoluteRoot);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.error(`Failed to clean artifacts in ${root}:`, error);
      process.exitCode = 1;
    }
  }
}

async function traverseAndCleanup(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map(async entry => {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await traverseAndCleanup(entryPath);
        return;
      }

      if (generatedSuffixes.some(suffix => entry.name.endsWith(suffix))) {
        await unlink(entryPath);
        console.log(`Removed generated ${relative(projectRoot, entryPath)}`);
      }
    })
  );
}

clean();
