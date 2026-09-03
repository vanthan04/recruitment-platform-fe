/**
 * Narrows a raw query-string value to a known union member, or returns
 * undefined if it doesn't match one of `allowed` — for validating
 * unchecked route searchParams before treating them as an enum type
 * (a raw `value as SomeUnion` cast would happily "type-check" garbage).
 */
export function parseEnumParam<T extends string>(
  value: string | undefined | null,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}
