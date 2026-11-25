import type { PrismaClient } from "@/generated/prisma/client";
import { BUILT_IN_THEMES } from "@/lib/themes";

/**
 * Creates what every installation needs: the built-in themes. Safe to run on
 * every start: they're kept in sync with BUILT_IN_THEMES (src/lib/themes.ts).
 * Themes that left the built-in list are unmarked and deleted (the trigger
 * only blocks deleting rows that are still built-in). An empty profile and
 * default settings need no rows.
 */
export async function seedBuiltIns(db: PrismaClient): Promise<void> {
  const keep = BUILT_IN_THEMES.map((theme) => theme.id);

  await db.$transaction(async (tx) => {
    for (const { id, ...theme } of BUILT_IN_THEMES) {
      await tx.theme.upsert({ where: { id }, create: { id, ...theme }, update: theme });
    }

    const obsolete = await tx.theme.findMany({
      where: { builtIn: true, id: { notIn: keep } },
      select: { id: true },
    });
    if (obsolete.length === 0) return;

    const obsoleteIds = obsolete.map((theme) => theme.id);
    // The delete trigger refuses built-in rows: clear the flag first.
    await tx.theme.updateMany({ where: { id: { in: obsoleteIds } }, data: { builtIn: false } });
    await tx.theme.deleteMany({ where: { id: { in: obsoleteIds } } });
  });
}
