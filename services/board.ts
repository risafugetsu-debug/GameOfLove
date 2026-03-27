import { eq } from 'drizzle-orm';
import * as ImageManipulator from 'expo-image-manipulator';
import { db } from '@/db/client';
import { datePeople, dateEntries } from '@/db/schema';
import { clamp, milestoneAt, vibeToMovement } from '@/helpers/board';
import type { MoveResult, Vibe } from '@/types';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function logDate(
  personId: string,
  vibe: Vibe,
  note: string,
  targetPosition?: number,
): MoveResult {
  const [person] = db
    .select()
    .from(datePeople)
    .where(eq(datePeople.id, personId))
    .all();

  if (!person) throw new Error(`Person not found: ${personId}`);
  if (person.isEliminated) throw new Error(`Cannot log date for eliminated person: ${personId}`);

  if (targetPosition !== undefined) {
    if (vibe === 'eliminate') throw new Error('cannot eliminate with a targetPosition');
    if (targetPosition <= person.position) throw new Error('targetPosition must be greater than current position');
    if (targetPosition > 30) throw new Error('targetPosition cannot exceed 30');
  }

  let movement: number | null = null;
  const entryId = uuid();
  const now = new Date();

  let newPosition: number | null = null;
  let isEliminated = false;

  if (targetPosition !== undefined) {
    // Milestone jump: use full delta, skip vibeToMovement result
    movement = targetPosition - person.position;
    newPosition = targetPosition;

    db.transaction((tx) => {
      tx.insert(dateEntries).values({
        id: entryId,
        personId,
        note,
        vibe,
        movement,
        loggedAt: now,
      }).run();

      tx.update(datePeople)
        .set({ position: newPosition! })
        .where(eq(datePeople.id, personId))
        .run();
    });
  } else {
    movement = vibeToMovement(vibe);
    db.transaction((tx) => {
      tx.insert(dateEntries).values({
        id: entryId,
        personId,
        note,
        vibe,
        movement,
        loggedAt: now,
      }).run();

      if (vibe === 'eliminate') {
        tx.update(datePeople)
          .set({ isEliminated: true, eliminatedAt: now })
          .where(eq(datePeople.id, personId))
          .run();
        isEliminated = true;
      } else {
        newPosition = clamp(person.position + movement!);
        tx.update(datePeople)
          .set({ position: newPosition })
          .where(eq(datePeople.id, personId))
          .run();
      }
    });
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
  const id = uuid();

  db.insert(datePeople).values({
    id,
    name,
    colorHex,
    firstImpressionNote: firstImpressionNote ?? null,
    photoData: photoData ?? null,
    position: 0,
    isEliminated: false,
    createdAt: new Date(),
  }).run();
}

export async function editPerson(
  personId: string,
  name: string,
  photoUri?: string,
): Promise<void> {
  const photoData = photoUri ? await compressPhoto(photoUri) : undefined;

  db.update(datePeople)
    .set({
      name,
      ...(photoData !== undefined ? { photoData } : {}),
    })
    .where(eq(datePeople.id, personId))
    .run();
}

async function compressPhoto(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 400 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!result.base64) throw new Error('Photo compression failed: no base64 data');
  return result.base64;
}
