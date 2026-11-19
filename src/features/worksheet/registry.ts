import type { Worksheet } from './types';

const modules = import.meta.glob<Worksheet>('../../content/worksheets/*.json', { eager: true, import: 'default' });

export const worksheets: Worksheet[] = Object.values(modules).sort((a, b) => a.slug.localeCompare(b.slug));

export function getWorksheet(slug: string): Worksheet | null {
  return worksheets.find((w) => w.slug === slug) ?? null;
}
