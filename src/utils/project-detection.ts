import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Find the git root by walking up the directory tree.
 * Returns null if no .git directory is found.
 *
 * @param startPath - Starting directory (defaults to process.cwd())
 * @returns Absolute path to git root, or null if not in a git repository
 */
export async function findGitRoot(startPath?: string): Promise<string | null> {
  let current = path.resolve(startPath || process.cwd());
  const root = path.parse(current).root;

  while (current !== root) {
    try {
      const gitPath = path.join(current, '.git');
      const stat = await fs.stat(gitPath);

      if (stat.isDirectory()) {
        return current;
      }
    } catch {
      // .git doesn't exist at this level, continue upward
    }

    // Move up one directory
    current = path.dirname(current);
  }

  return null;
}
