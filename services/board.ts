import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';
import { db } from '@/db/client';
import { datePeople, dateEntries } from '@/db/schema';
import { clamp, milestoneAt, vibeToMovement } from '@/helpers/board';
import type { MoveResult, Vibe } from '@/types';

export async function logDate(
  personId: string,
  vibe: Vibe,
  note: string,
): Promise<MoveResult> {
  const [person] = await db
    .select()
    .from(datePeople)
    .where(eq(datePeople.id, personId));

  if (!person) throw new Error(`Person not found: ${personId}`);
  if (person.isEliminated) throw new Error(`Cannot log date for eliminated person: ${personId}`);

  const movement = vibeToMovement(vibe);
  const entryId = Crypto.randomUUID();
  const now = new Date();

  await db.insert(dateEntries).values({
    id: entryId,
    personId,
    note,
    vibe,
    movement,
    loggedAt: now,
  });

  let newPosition: number | null = null;
  let isEliminated = false;

  if (vibe === 'eliminate') {
    await db
      .update(datePeople)
      .set({ isEliminated: true, eliminatedAt: now })
      .where(eq(datePeople.id, personId));
    isEliminated = true;
  } else {
    newPosition = clamp(person.position + movement!);
    await db
      .update(datePeople)
      .set({ position: newPosition })
      .where(eq(datePeople.id, personId));
  }

  const milestone = newPosition !== null ? milestoneAt(newPosition) : null;
  const isTheOne = newPosition === 30;

  return {
    personName: person.name,
    delta: isEliminated ? null : movement,
    newPosition: isEliminated ? null : newPosition,
    milestone,
    isEliminated,
    isTheOne,
  };
}

export async function addPerson(
  name: string,
  colorHex: string,
  firstImpressionNote?: string,
  photoUri?: string,
): Promise<void> {
  const photoData = photoUri ? await compressPhoto(photoUri) : undefined;
  const id = Crypto.randomUUID();

  await db.insert(datePeople).values({
    id,
    name,
    colorHex,
    firstImpressionNote: firstImpressionNote ?? null,
    photoData: photoData ?? null,
    position: 0,
    isEliminated: false,
    createdAt: new Date(),
  });
}

export async function editPerson(
  personId: string,
  name: string,
  photoUri?: string,
): Promise<void> {
  const photoData = photoUri ? await compressPhoto(photoUri) : undefined;

  await db
    .update(datePeople)
    .set({
      name,
      ...(photoData !== undefined ? { photoData } : {}),
    })
    .where(eq(datePeople.id, personId));
}

async function compressPhoto(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 400 } }], // single dimension preserves aspect ratio
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  return result.base64!;
}
