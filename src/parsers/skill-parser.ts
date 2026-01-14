/**
 * Skill Parser
 *
 * Extracts main skills and support gems from the <Skills> section
 */

import type { SkillSetup, SupportGem } from "../models/build.js";

/**
 * Parses skill data from PoB Skills section
 * @param skillsSection - PoB <Skills> XML section
 * @returns Array of SkillSetup entities
 */
export function parseSkills(skillsSection: any): SkillSetup[] {
  if (!skillsSection || !Array.isArray(skillsSection.Skill)) {
    return [];
  }

  const skills: SkillSetup[] = [];
  const skillArray = Array.isArray(skillsSection.Skill)
    ? skillsSection.Skill
    : [skillsSection.Skill];

  skillArray.forEach((skill: any, index: number) => {
    const skillSetup: SkillSetup = {
      id: `skill-${index + 1}`,
      skillName: skill.gem?.name || skill.name || "Unknown",
      gemLevel: parseInt(skill.gem?.level || skill.level || "1", 10),
      quality: parseInt(skill.gem?.quality || skill.quality || "0", 10),
      supports: parseSupportGems(skill),
      linkCount: calculateLinkCount(skill),
      isMainSkill: skill.mainActive || false,
    };

    skills.push(skillSetup);
  });

  return skills;
}

/**
 * Parses support gems from a skill
 */
function parseSupportGems(skill: any): SupportGem[] {
  if (!skill.gems || !Array.isArray(skill.gems.Gem)) {
    return [];
  }

  const gems = Array.isArray(skill.gems.Gem)
    ? skill.gems.Gem
    : [skill.gems.Gem];

  return gems
    .filter((gem: any) => gem.type === "Support")
    .map((gem: any) => ({
      name: gem.name || "Unknown",
      gemLevel: parseInt(gem.level || "1", 10),
      quality: parseInt(gem.quality || "0", 10),
    }));
}

/**
 * Calculates the number of linked sockets for a skill
 */
function calculateLinkCount(skill: any): number {
  // Count main skill + support gems
  const supportCount = skill.gems?.Gem
    ? Array.isArray(skill.gems.Gem)
      ? skill.gems.Gem.length
      : 1
    : 0;

  return supportCount + 1; // +1 for main skill
}
