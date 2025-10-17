import { readdir, rm, unlink } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const targets = ['apps/web/dist', 'packages/core/dist', 'packages/backend/dist'];
const artifactRoots = ['packages/core/src', 'packages/backend/src'];
const generatedSuffixes = ['.js', '.js.map', '.d.ts'];


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

(async function clean() {
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
})();
