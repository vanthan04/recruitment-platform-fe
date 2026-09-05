"use server";

const PROVINCES_API = "https://provinces.open-api.vn/api/v2/p";
// Administrative divisions barely change — cache aggressively.
const REVALIDATE_SECONDS = 60 * 60 * 24 * 30;

export interface LocationOption {
  code: number;
  name: string;
}

interface WardWire {
  code: number;
  name: string;
}

interface ProvinceWire {
  code: number;
  name: string;
  wards?: WardWire[];
}

// Read-only, best-effort — a flaky third-party API shouldn't crash the
// onboarding/company pages, just leave the select empty.
export async function getProvinces(): Promise<LocationOption[]> {
  try {
    const res = await fetch(PROVINCES_API, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return [];
    const data = (await res.json()) as ProvinceWire[];
    return data.map(({ code, name }) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  } catch {
    return [];
  }
}

export async function getWardsByProvince(provinceCode: number): Promise<LocationOption[]> {
  try {
    const res = await fetch(`${PROVINCES_API}/${provinceCode}?depth=2`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as ProvinceWire;
    return (data.wards ?? [])
      .map(({ code, name }) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  } catch {
    return [];
  }
}
