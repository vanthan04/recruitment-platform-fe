// next/cache pulls in Next's server runtime internals (Request/Response/
// TextEncoder-dependent streaming helpers) that don't exist in jsdom.
// Server Actions call these for real in the app; tests never invoke the
// actions themselves, only render components that import them transitively.
export function revalidatePath(): void {}
export function revalidateTag(): void {}
