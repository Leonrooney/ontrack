import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function key(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  const all = await prisma.exercise.findMany();

  const groups: Record<string, typeof all> = {};

  for (const e of all) {
    (groups[key(e.name)] ||= []).push(e);
  }

  let removed = 0;
  let merged = 0;

  for (const list of Object.values(groups)) {
    if (list.length <= 1) continue;

    // Keep the best media (prefer GIF), then longest instructions
    list.sort((a, b) => {
      const ag = a.mediaUrl?.toLowerCase().includes('.gif') ? 1 : 0;
      const bg = b.mediaUrl?.toLowerCase().includes('.gif') ? 1 : 0;
      if (bg !== ag) return bg - ag;
      const al = a.instructions?.length ?? 0;
      const bl = b.instructions?.length ?? 0;
      return bl - al;
    });

    const keep = list[0];
    const drop = list.slice(1);

    for (const d of drop) {
      const bodyPart = keep.bodyPart ?? d.bodyPart ?? null;
      const equipment = keep.equipment ?? d.equipment ?? null;
      const instructions = keep.instructions ?? d.instructions ?? null;
      const mediaUrl = keep.mediaUrl ?? d.mediaUrl ?? null;

      await prisma.exercise
        .update({
          where: { id: keep.id },
          data: { bodyPart, equipment, instructions, mediaUrl },
        })
        .catch(() => {});

      await prisma.exercise
        .delete({ where: { id: d.id } })
        .then(() => removed++)
        .catch(() => {});
    }
    merged++;
  }

  console.log(`Dedupe complete. Groups merged: ${merged}, rows removed: ${removed}`);
}

main().finally(() => prisma.$disconnect());

