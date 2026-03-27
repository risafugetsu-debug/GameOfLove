# Milestone Jump Feature — Design Spec

**Date:** 2026-03-26
**Status:** Approved for implementation

---

## Overview

When a user taps a milestone dot on the board (positions 5, 10, 17, 24, 30), a single sheet appears showing the milestone's emoji, name, and description. The user selects an eligible player, picks a vibe, optionally adds a note, and saves. The player's position is set directly to the milestone position and a log entry is saved.

---

## Interaction Flow

1. User taps a milestone dot on the board
2. `MilestoneJumpSheet` opens showing:
   - Milestone emoji, name, description
   - Horizontal player chips (active players; greyed out and non-tappable if `position >= milestone.position`)
   - Vibe picker (🔥😊😐😬💔 — `eliminate` is intentionally excluded; jumping to a milestone moves a player forward, not out)
   - Note text input
   - "Log & Jump to [Milestone Name]" button (disabled until a player and vibe are both selected)
3. User selects a player, picks a vibe, optionally adds a note, taps save
4. Player's position is updated to the milestone position
5. A log entry is created and saved (milestone celebration runs as normal if `newPosition === 30`)
6. Sheet closes and the board reflects the new position

**Direction constraint:** Forward-only. Players whose `position >= milestone.position` are greyed out in the sheet. `logDate()` also enforces this server-side.

**Zero-eligible-players edge case:** If all active players are already at or past the milestone position, the milestone tap does nothing (no sheet opens). A short haptic feedback (`Haptics.notificationAsync(NotificationFeedbackType.Warning)`) is triggered instead to signal the tap was registered but no action is available.

---

## Components

### 1. `MilestoneJumpSheet` (new)

**Location:** `/components/sheets/MilestoneJumpSheet.tsx`

**Props:**
```typescript
interface MilestoneJumpSheetProps {
  isVisible: boolean
  onClose: () => void
}
```

The sheet reads `selectedMilestone` directly from `boardStore` (same pattern as all other sheets reading `selectedPersonId`).

**Layout (single sheet, top to bottom):**
- Sheet drag handle
- Milestone header: large emoji, name (bold), description (subtitle)
- Divider
- Section label: "Who reached this?"
- Horizontal scrolling player chips — each shows player avatar + name. Players with `position >= milestone.position` are dimmed (opacity 0.4) and non-tappable.
- Section label: "How did it go?"
- Vibe picker row: `fire | good | meh | stay | ouch` only. `eliminate` is excluded.
- Note text input (optional)
- Primary button: "Log & Jump to [milestone.name]" — disabled until both `selectedPersonId` and `selectedVibe` are non-null

**State:**
```typescript
const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null)
const [note, setNote] = useState('')
```

**State reset:** Reset all three fields to defaults (`null`, `null`, `''`) in a `useEffect` that depends on both `isVisible` and `milestone.position`. This ensures state resets correctly whether `isVisible` cycles `false → true` or the parent swaps to a different milestone without closing first.

```typescript
useEffect(() => {
  if (isVisible) {
    setSelectedPersonId(eligiblePlayers.length === 1 ? eligiblePlayers[0].id : null)
    setSelectedVibe(null)
    setNote('')
  }
}, [isVisible, milestone?.position])
```

If only one eligible player exists, auto-select them.

---

### 2. `boardStore` additions (modify `/store/boardStore.ts`)

Add `selectedMilestone` and its open/close actions — consistent with how all other sheets are wired:

```typescript
// State additions
selectedMilestone: Milestone | null;
showingMilestoneJumpSheet: boolean;

// Action additions
openMilestoneJumpSheet: (milestone: Milestone) => void;
closeMilestoneJumpSheet: () => void;
```

```typescript
// Initial values
selectedMilestone: null,
showingMilestoneJumpSheet: false,

// Implementations
openMilestoneJumpSheet: (milestone) => set({ selectedMilestone: milestone, showingMilestoneJumpSheet: true }),
closeMilestoneJumpSheet: () => set({ showingMilestoneJumpSheet: false }),
```

---

### 3. Board touch handling (modify `/components/board/BoardPathView.tsx`)

**Current state:** A single `Gesture.Tap()` (`tap`) iterates `hitAreas` (a `useMemo` of player piece centers) inside a `'worklet'`. `sectionCenter` is a JS-thread function and cannot be called from a worklet.

**Change:** Pre-compute milestone centers in a `useMemo` (same pattern as `hitAreas`), then add a second `Gesture.Tap()` (`milestoneTap`) that iterates these pre-computed values inside the worklet. Compose with `Gesture.Exclusive(milestoneTap, tap)` so milestone taps take priority when a player piece overlaps a milestone dot.

```typescript
// Pre-compute milestone centers (JS thread, same as hitAreas)
const milestoneCenters = useMemo(() =>
  MILESTONES.map((m) => ({
    milestone: m,
    ...sectionCenter(m.position, width, height),
  })),
  [width, height],
)

const milestoneTap = Gesture.Tap().onEnd((e) => {
  'worklet';
  const { x, y } = e;
  for (let i = 0; i < milestoneCenters.length; i++) {
    const { milestone, x: cx, y: cy } = milestoneCenters[i];
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (dist <= 20) {
      runOnJS(onMilestoneTap)(milestone);
      return;
    }
  }
});

const gesture = Gesture.Exclusive(milestoneTap, tap);
```

**Updated `Props` interface:**
```typescript
interface Props {
  width: number;
  height: number;
  people: PersonOnBoard[];
  onPieceTap: (personId: string) => void;
  onMilestoneTap: (milestone: Milestone) => void;  // new
}
```

---

### 4. `app/index.tsx` changes

Add `MilestoneJumpSheet` to the sheet stack (alongside the existing sheets). Wire `onMilestoneTap` to `boardStore`:

```typescript
const { openMilestoneJumpSheet, showingMilestoneJumpSheet, closeMilestoneJumpSheet } = useBoardStore()

// In JSX, alongside other sheets:
<MilestoneJumpSheet
  isVisible={showingMilestoneJumpSheet}
  onClose={closeMilestoneJumpSheet}
/>

// Pass to BoardPathView:
<BoardPathView
  ...
  onMilestoneTap={openMilestoneJumpSheet}
/>
```

Before calling `openMilestoneJumpSheet`, check if any eligible players exist using the `activePeople` array already present in `index.tsx`:

```typescript
onMilestoneTap={(milestone) => {
  const eligible = activePeople.filter(p => p.position < milestone.position);
  if (eligible.length === 0) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return;
  }
  openMilestoneJumpSheet(milestone);
}}
```

---

### 5. `logDate()` service (modify `/services/board.ts`)

Add optional `targetPosition?: number` parameter. Return type stays `MoveResult`.

```typescript
export function logDate(
  personId: string,
  vibe: Vibe,
  note: string,
  targetPosition?: number,
): MoveResult
```

**When `targetPosition` is provided:**
- If `targetPosition <= person.position`, throw: `new Error('targetPosition must be greater than current position')`
- Change the existing `const movement = vibeToMovement(vibe)` declaration to `let movement: number | null = vibeToMovement(vibe)` so it can be reassigned in the `targetPosition` branch
- In the `targetPosition` branch: `movement = targetPosition - person.position` (guaranteed positive by the guard; `vibeToMovement` result is discarded)
- `newPosition = targetPosition`
- `movement = 0` cannot occur — the guard prevents it
- `eliminate` vibe + `targetPosition` together: throw `new Error('cannot eliminate with a targetPosition')` to prevent misuse
- Milestone celebration check (`newPosition === 30`) still runs as normal
- All other db write logic unchanged; `MoveResult` shape is unchanged

---

## Data Changes

### `Milestone` type (modify `/types/index.ts`)

```typescript
interface Milestone {
  position: number
  emoji: string
  name: string
  description: string   // new
}
```

### `MILESTONES` constant (modify `/constants/theme.ts`)

```typescript
export const MILESTONES: Milestone[] = [
  { position: 5,  emoji: '💋', name: 'First Kiss',       description: "You finally kissed! Things are heating up." },
  { position: 10, emoji: '👫', name: 'Met the Friends',  description: "Big step — they're getting integrated into your world." },
  { position: 17, emoji: '🎶', name: 'Special Moment',   description: "A moment you'll both remember." },
  { position: 24, emoji: '❤️', name: 'Are We Official?', description: "Time to define the relationship." },
  { position: 30, emoji: '💝', name: 'The One',          description: "You found them." },
]
```

No database schema changes required.

---

## Files Changed

| File | Change |
|------|--------|
| `/types/index.ts` | Add `description` to `Milestone` interface |
| `/constants/theme.ts` | Add descriptions to `MILESTONES` array |
| `/store/boardStore.ts` | Add `selectedMilestone`, `showingMilestoneJumpSheet`, `openMilestoneJumpSheet`, `closeMilestoneJumpSheet` |
| `/services/board.ts` | Add optional `targetPosition` param; add forward-only and eliminate guards; skip `vibeToMovement` when `targetPosition` set |
| `/components/board/BoardPathView.tsx` | Add `onMilestoneTap` prop; pre-compute `milestoneCenters`; add `milestoneTap` gesture; compose with `Gesture.Exclusive` |
| `/components/sheets/MilestoneJumpSheet.tsx` | **New file** — full sheet component |
| `/app/index.tsx` | Wire `MilestoneJumpSheet`; pass `onMilestoneTap` to `BoardPathView`; zero-eligible-players haptic guard |

---

### 6. `handleSave` in `MilestoneJumpSheet`

Mirrors the `LogDateSheet.handleSave` pattern exactly:

```typescript
const handleSave = async () => {
  if (!selectedPersonId || !selectedVibe || !selectedMilestone) return;
  setSaving(true);
  try {
    const result = logDate(selectedPersonId, selectedVibe, note, selectedMilestone.position);
    invalidateBoard();
    onClose();
    setTimeout(() => setMoveResult(result), 700);  // triggers MoveCelebrationView
  } catch (e) {
    Alert.alert('Error', 'Something went wrong. Please try again.');
  } finally {
    setSaving(false);
  }
};
```

Key points:
- `setMoveResult` is called with a 700ms delay (same as `LogDateSheet`) to let the sheet animate closed before the celebration overlay appears
- `invalidateBoard()` is called to refresh the board
- `selectPerson(null)` is NOT called — `MilestoneJumpSheet` manages its own internal `selectedPersonId` state, not the store's `selectedPersonId`
- `delta` in `MoveResult` will be the full jump distance (e.g. +13 for a jump from position 2 to 15). `MoveCelebrationView` will display this as "Alex moved up 13! 🔥" — this is correct and intentional behavior for a milestone jump
- `dateEntries.movement` stores `targetPosition - currentPosition` (the actual delta), not `vibeToMovement(vibe)`. History views showing "+N" movement will display the full jump distance, which is accurate

---

## Data Changes

- Editing existing log entries (separate feature)
- Jumping backward via this flow (regular log handles backward movement)
- Non-milestone positions (only the 5 milestone dots are tappable for jumping)
- Adding `eliminate` to the milestone jump vibe picker
