# Lockpick Solver Plan

## Overview
The lockpick solver is a tool for Gothic 1 Remake that helps players solve lockpicking puzzles by visualizing tumbler positions and their relationships.

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
  - Horizontal tumbler layout with bottom-to-top numbering (configurable number of positions, bottom to top)
  - Bolt indicator on left of each tumbler
  - There should be a dot in the center of each tumbler.
  - The center dot should be filled in when the tumbler is at the left-most position.
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
  - Updated visualization to show holes left-to-right (bottom to top)
  - Holes to the right of current position are shown (bordered and filled)
  - Holes to the left of current position are hidden (not bordered or filled)
  - The only dot that should be shown is in the center of each tumbler so it forms a vertical line
  - Center dot is filled when tumbler is at position 0 (left-most)
  - Center dot is empty when not at position 0
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

### Bottom-to-Top Numbering
- Tumbler holes are numbered 0 (bottom) to 6 (top)
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
