import { test, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import os from "node:os";
import { listSkills } from "@/skills/load.ts";

// Test directories
const testUserDir = path.join(os.tmpdir(), `skills-agentid-test-${Date.now()}`);
const testProjectDir = path.join(os.tmpdir(), `skills-agentid-project-${Date.now()}`);

beforeEach(async () => {
  // Create test directories
  await fs.mkdir(testUserDir, { recursive: true });
  await fs.mkdir(testProjectDir, { recursive: true });

  // Initialize git repo in project directory
  await fs.mkdir(path.join(testProjectDir, ".git"), { recursive: true });
});

afterEach(async () => {
  // Clean up test directories
  await fs.rm(testUserDir, { recursive: true, force: true });
  await fs.rm(testProjectDir, { recursive: true, force: true });
});

test("listSkills with agentId - loads from user directory", async () => {
  const agentId = "test-agent";
  const userSkillsDir = path.join(testUserDir, ".deepagents", agentId, "skills");
  await fs.mkdir(path.join(userSkillsDir, "skill1"), { recursive: true });

  await fs.writeFile(
    path.join(userSkillsDir, "skill1", "SKILL.md"),
    `---
name: user-skill
description: A user-level skill
---

# Skill Content
This is a user skill.`
  );

  // Mock homedir
  const originalHome = os.homedir;
  Object.defineProperty(os, "homedir", {
    value: () => testUserDir,
    configurable: true,
  });

  try {
    const skills = await listSkills({
      agentId,
      workingDirectory: "/tmp", // Not a git repo
    });

    expect(skills).toHaveLength(1);
    expect(skills[0]?.name).toBe("user-skill");
    expect(skills[0]?.description).toBe("A user-level skill");
    expect(skills[0]?.source).toBe("user");
  } finally {
    Object.defineProperty(os, "homedir", {
      value: originalHome,
      configurable: true,
    });
  }
});

test("listSkills with agentId - loads from project directory", async () => {
  const agentId = "test-agent";
  const projectSkillsDir = path.join(testProjectDir, ".deepagents", "skills");
  await fs.mkdir(path.join(projectSkillsDir, "skill1"), { recursive: true });

  await fs.writeFile(
    path.join(projectSkillsDir, "skill1", "SKILL.md"),
    `---
name: project-skill
description: A project-level skill
---

# Skill Content
This is a project skill.`
  );

  // Mock homedir to return empty directory
  const originalHome = os.homedir;
  Object.defineProperty(os, "homedir", {
    value: () => path.join(os.tmpdir(), "nonexistent"),
    configurable: true,
  });

  try {
    const skills = await listSkills({
      agentId,
      workingDirectory: testProjectDir,
    });

    expect(skills).toHaveLength(1);
    expect(skills[0]?.name).toBe("project-skill");
    expect(skills[0]?.description).toBe("A project-level skill");
    expect(skills[0]?.source).toBe("project");
  } finally {
    Object.defineProperty(os, "homedir", {
      value: originalHome,
      configurable: true,
    });
  }
});

test("listSkills with agentId - project skills override user skills", async () => {
  const agentId = "test-agent";

  // Create user skill
  const userSkillsDir = path.join(testUserDir, ".deepagents", agentId, "skills");
  await fs.mkdir(path.join(userSkillsDir, "skill1"), { recursive: true });
  await fs.writeFile(
    path.join(userSkillsDir, "skill1", "SKILL.md"),
    `---
name: shared-skill
description: User version
---

# User version`
  );

  // Create project skill with same name
  const projectSkillsDir = path.join(testProjectDir, ".deepagents", "skills");
  await fs.mkdir(path.join(projectSkillsDir, "skill1"), { recursive: true });
  await fs.writeFile(
    path.join(projectSkillsDir, "skill1", "SKILL.md"),
    `---
name: shared-skill
description: Project version
---

# Project version`
  );

  const originalHome = os.homedir;
  Object.defineProperty(os, "homedir", {
    value: () => testUserDir,
    configurable: true,
  });

  try {
    const skills = await listSkills({
      agentId,
      workingDirectory: testProjectDir,
    });

    // Should only have one skill (project overrides user)
    expect(skills).toHaveLength(1);
    expect(skills[0]?.name).toBe("shared-skill");
    expect(skills[0]?.description).toBe("Project version");
    expect(skills[0]?.source).toBe("project");
  } finally {
    Object.defineProperty(os, "homedir", {
      value: originalHome,
      configurable: true,
    });
  }
});

test("listSkills with agentId - loads multiple skills", async () => {
  const agentId = "test-agent";

  // Create multiple user skills
  const userSkillsDir = path.join(testUserDir, ".deepagents", agentId, "skills");
  await fs.mkdir(path.join(userSkillsDir, "skill1"), { recursive: true });
  await fs.mkdir(path.join(userSkillsDir, "skill2"), { recursive: true });

  await fs.writeFile(
    path.join(userSkillsDir, "skill1", "SKILL.md"),
    `---
name: user-skill-1
description: First user skill
---
Content`
  );

  await fs.writeFile(
    path.join(userSkillsDir, "skill2", "SKILL.md"),
    `---
name: user-skill-2
description: Second user skill
---
Content`
  );

  // Create project skill
  const projectSkillsDir = path.join(testProjectDir, ".deepagents", "skills");
  await fs.mkdir(path.join(projectSkillsDir, "skill3"), { recursive: true });
  await fs.writeFile(
    path.join(projectSkillsDir, "skill3", "SKILL.md"),
    `---
name: project-skill-1
description: First project skill
---
Content`
  );

  const originalHome = os.homedir;
  Object.defineProperty(os, "homedir", {
    value: () => testUserDir,
    configurable: true,
  });

  try {
    const skills = await listSkills({
      agentId,
      workingDirectory: testProjectDir,
    });

    expect(skills).toHaveLength(3);

    const skillNames = skills.map(s => s.name).sort();
    expect(skillNames).toEqual([
      "project-skill-1",
      "user-skill-1",
      "user-skill-2",
    ]);

    // Verify sources
    expect(skills.find(s => s?.name === "user-skill-1")?.source).toBe("user");
    expect(skills.find(s => s?.name === "user-skill-2")?.source).toBe("user");
    expect(skills.find(s => s?.name === "project-skill-1")?.source).toBe("project");
  } finally {
    Object.defineProperty(os, "homedir", {
      value: originalHome,
      configurable: true,
    });
  }
});

test("listSkills with agentId - shows deprecation warning when used with skillsDir", async () => {
  // Capture console.warn
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (msg: string) => warnings.push(msg);

  try {
    await listSkills({
      agentId: "test-agent",
      userSkillsDir: "/some/path",
      projectSkillsDir: "/another/path",
      workingDirectory: "/tmp",
    });

    // Should show deprecation warning
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain("agentId parameter takes precedence");
    expect(warnings[0]).toContain("deprecated");
  } finally {
    console.warn = originalWarn;
  }
});

test("listSkills without agentId - uses legacy mode", async () => {
  // Create legacy skills directory
  const legacySkillsDir = path.join(testUserDir, "legacy-skills");
  await fs.mkdir(path.join(legacySkillsDir, "skill1"), { recursive: true });

  await fs.writeFile(
    path.join(legacySkillsDir, "skill1", "SKILL.md"),
    `---
name: legacy-skill
description: A legacy skill
---
Content`
  );

  const skills = await listSkills({
    projectSkillsDir: legacySkillsDir,
  });

  expect(skills).toHaveLength(1);
  expect(skills[0]?.name).toBe("legacy-skill");
  expect(skills[0]?.source).toBe("project");
});

test("listSkills with agentId - returns empty array when no skills exist", async () => {
  const agentId = "test-agent";

  const originalHome = os.homedir;
  Object.defineProperty(os, "homedir", {
    value: () => path.join(os.tmpdir(), "nonexistent"),
    configurable: true,
  });

  try {
    const skills = await listSkills({
      agentId,
      workingDirectory: "/tmp", // Not a git repo
    });

    expect(skills).toHaveLength(0);
  } finally {
    Object.defineProperty(os, "homedir", {
      value: originalHome,
      configurable: true,
    });
  }
});
