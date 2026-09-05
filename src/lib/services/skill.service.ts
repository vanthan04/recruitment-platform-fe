"use server";

import { api } from "@/lib/api";
import { CACHE_TAG } from "@/lib/constants/cache-tag";
import { SKILL_ENDPOINT } from "@/lib/constants/endpoint";
import type { Skill } from "@/lib/types/skill";

export async function getSkills(): Promise<Skill[]> {
  return api.get<Skill[]>(SKILL_ENDPOINT.LIST, {
    skipAuth: true,
    next: { tags: [CACHE_TAG.SKILLS_LIST] },
  });
}
