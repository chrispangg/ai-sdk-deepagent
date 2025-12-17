/**
 * Metadata extracted from SKILL.md frontmatter.
 */
export interface SkillMetadata {
  /**
   * Unique skill name (kebab-case, e.g., 'web-research')
   */
  name: string;

  /**
   * Short description of what the skill does
   */
  description: string;

  /**
   * Absolute path to the SKILL.md file
   */
  path: string;

  /**
   * Source of the skill ('user' or 'project')
   * Project skills override user skills with same name
   */
  source: 'user' | 'project';
}

/**
 * Options for skill loading
 */
export interface SkillLoadOptions {
  /**
   * User-level skills directory (e.g., ~/.deepagents/skills/)
   */
  userSkillsDir?: string;

  /**
   * Project-level skills directory (e.g., ./.deepagents/skills/)
   */
  projectSkillsDir?: string;

  /**
   * Optional agent ID for loading agent-specific skills.
   * When provided, looks for skills in ~/.deepagents/{agentId}/skills/
   * and .deepagents/skills/ (project-level, shared across agents).
   */
  agentId?: string;

  /**
   * Optional working directory for detecting project root.
   * Only used when agentId is provided.
   */
  workingDirectory?: string;
}
