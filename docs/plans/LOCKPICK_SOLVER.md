# Lockpick Solver Plan

## Overview
The lockpick solver is a tool for Gothic 1 Remake that helps players solve lockpicking puzzles by visualizing tumbler positions and their relationships.

## Lockpick Puzzle Mechanics

### The Game's Lockpicking System
In Gothic 1 Remake, lockpicking involves manipulating a set of horizontal tumblers to align them so the center pin is raised on all tumblers. The center-most hole in the tumbler must align with the center of the lock and the left most hole in the tumbler must align with the left lock post:

- **Multiple tumblers** (typically 6, but configurable) arranged horizontally
- **Each tumbler has holes** (default 7) arranged from left to right
- **A center position** (hole 3 in a 7-hole tumbler) where the tumbler must align. In the game, the center pin will be raised from the hole, but in this tool, it is denoted by a filled-in circle.
- **Links between tumblers** that cause movement in one tumbler to affect others

### The Goal
The player must align all tumblers so the center pins align with the center of the tumblers simultaneously. When all tumblers are correctly aligned, the lock opens.

### How the Solver Tool Works

1. **Visualization**: The tool displays each tumbler horizontally with holes shown left-to-right (matching the game). The center pin always remains at the center of the display (hole 3 for 7 holes). The tumbler material (filled portion) shifts based on its position value. For example, if position is 6, the tumbler extends to the left such that holes 1-5 are filled. The tumbler extends 2 positions beyond the left edge (off-screen).

2. **Manual Movement**: Players can click left/right arrows on each tumbler to move it one position at a time. When a tumbler moves, its directly linked tumblers also move one step (based on the link's direction setting).

3. **Link System**: Links define relationships between tumblers:
   - Normal link: Moving tumbler A moves linked tumbler B in the same direction
   - Reversed link: Moving tumbler A moves linked tumbler B in the opposite direction
   - Links are one-way (A → B), not bidirectional

4. **Position Model**: The current position (0-6 for 7 holes) represents where the center pin is located on the tumbler. Position 3 is the correct/center alignment (center pin at the center of the lock). The tumbler extends to the left from the center pin position.

5. **Movement Constraints**: Tumblers can move left or right, but cannot move past the center pin. The tumbler stops when one of its ends reaches the center position.

### Future: Automatic Solver
The planned automatic solver will:
- Calculate the sequence of moves needed to align all tumblers to center
- Account for link constraints (moving one tumbler affects others)
- Show step-by-step instructions to the player
- Allow the player to execute the solution manually or have the tool demonstrate it

## Current State

### Completed Features
- **Lock Management System**
  - Lock interface with metadata (name, description, location)
  - Configurable number of tumblers (1-10)
  - Configurable starting positions per lock
  - Lock save/load from localStorage
  - Lock list modal with load/delete functionality
  - Lock creation modal with full configuration

- **Tumbler Visualization**
  - Horizontal tumbler layout with left-to-right numbering (configurable number of positions, left to right)
  - Bolt indicator on left of each tumbler
  - There should be a dot in the center of each tumbler.
  - The center dot should be filled in when the center hole aligns with the center of the lock.
  - Left/right arrow buttons for tumbler movement
  - Configurable number of holes per tumbler, default to 7.
  - The position should be indicated by filling in all the holes to the right of the current position.
  - All holes to the left of the position should not be visible

- **Link System**
  - Links between tumblers with direction (reversed boolean)
  - Add/remove links via UI
  - Link validation (no self-links, no duplicates)
  - Active links display

- **Data Persistence**
  - Default locks loaded from `src/lib/data/locks.json`
  - User-created locks saved to localStorage
  - Lock state includes tumbler positions and links

### Data Model

```typescript
interface Lock {
  id: string;
  name: string;
  description: string;
  location: string;
  numTumblers: number;
  numHoles: number;
  startingPositions: number[];
  links: Array<{ from: number; to: number; reversed: boolean }>;
}
```

### Current Lock Data
- **Cavalorn's Cave** (default lock)
  - Location: Behind Cavalorn's hut
  - 6 tumblers
  - 7 holes per tumbler
  - Starting positions: [1, 3, 4, 6, 4, 4] (0-based)
  - 10 links with various reversed states

## Completed

### Tumbler Visualization Redesign
- **Status**: Complete
- **Changes**:
  - Added configurable `numHoles` to Lock interface
  - Updated visualization to show holes left-to-right (matching the game)
  - Holes to the right of current position are shown (bordered and filled)
  - Holes to the left of current position are hidden (not bordered or filled)
  - The only dot that should be shown is in the center of each tumbler so it forms a vertical line
  - Center dot is filled when the center hole aligns with the center of the lock
  - Center dot is empty when not aligned
  - Move arrows aligned to the right side of each tumbler row
  - Arrow direction fixed (left arrow moves right/decrements, right arrow moves left/increments)
  - Updated all position clamping to use `currentLock.numHoles`
  - Converted starting positions from 1-based to 0-based

### Direction Model Migration
- **Status**: Complete
- **Change**: Migrated from `direction: "left" | "right"` to `reversed: boolean`
- **Completed**:
  - Updated Lock interface
  - Updated locks.json data
  - Updated link creation logic
  - Updated tumbler movement logic
  - Replaced UI direction buttons with reversed checkbox
  - Updated link display to show "(reversed)"

### Default Lock Loading
- **Status**: Complete
- **Changes**:
  - Updated `loadLocks()` to merge default locks from JSON with user locks from localStorage
  - User locks with same ID as default locks take precedence
  - Falls back to default locks if localStorage is empty or on error
  - Initial `locks` state starts empty and is populated by `loadLocks()`

## Pending Features

### High Priority
1. **Testing**
   - Test lock loading from JSON
   - Test lock creation and saving
   - Test tumbler movement with links
   - Test link creation and removal
   - Verify localStorage persistence

### Medium Priority
3. **Lockpick Solver Algorithm**
   - Implement automatic solver that finds correct tumbler positions
   - Consider link constraints when solving
   - Show solution steps to user
   - Allow user to step through solution

4. **E2E Tests**
   - Test lock creation workflow
   - Test lock loading workflow
   - Test tumbler movement
   - Test link creation/removal
   - Test localStorage persistence

5. **Additional Locks**
   - Add more default locks from Gothic 1 Remake
   - Verify lock data accuracy against game

## Technical Decisions

### Left-to-Right Numbering
- Tumbler holes are numbered 0 (left) to 6 (right)
- This matches the game's visual representation
- Position 3 is the center/correct position for all tumblers

### Reversed Boolean vs Direction String
- Changed from `"left" | "right"` to `reversed: boolean`
- Simplifies the data model
- `reversed: true` means movement is opposite to normal direction
- Normal direction: moving tumbler A moves linked tumbler B in same direction
- Reversed direction: moving tumbler A moves linked tumbler B in opposite direction

### Default Locks from JSON
- Default locks are bundled with the application
- User locks are stored in localStorage
- This allows for pre-configured locks while still supporting user customization

## Known Issues

### Lint Errors
- Missing `@sveltejs/adapter-auto` package (not critical for dev)
- Unknown CSS rules in app.css (Tailwind v4 syntax, expected)
- Layout component type errors (separate issue, not blocking)

### UI Improvements Needed
- Direction buttons need to be replaced with reversed checkbox
- Link display needs to show reversed status clearly
- Consider adding visual indicators for linked tumblers

## File Structure

```
src/
├── lib/
│   └── data/
│       └── locks.json          # Default lock data
└── routes/
    └── lockpick/
        └── +page.svelte        # Lockpick solver UI
```

## Next Steps

1. Complete direction migration (update UI)
2. Test current functionality end-to-end
3. Implement solver algorithm
4. Add E2E tests
5. Add more default locks
