# Player Selection & Eligibility System

## Overview
This document describes the player selection and eligibility system implemented for the Picks grid.

## Features

### 1. Player Picker Modal
- Modal dialog that appears when clicking a grid cell
- Search functionality to filter players by name or team
- Shows player name, position, and team
- "Clear Selection" button to remove a player
- Responsive design with max height and scrolling

### 2. Position Eligibility Rules
The system enforces the following position restrictions:

- **QB Position**: Can only select QB players
- **RB Position**: Can only select RB players  
- **WR Position**: Can select WR or TE players
- **FLEX Position**: Can select RB, WR, or TE players
- **TEAM Position**: Reserved for defense/special teams (not yet implemented)

### 3. Player Availability
- Once a player is selected in ANY position or week for an entry, they become unavailable for all other positions/weeks in that same entry
- This prevents the same player from being used multiple times by the same participant
- Players remain available for other participants' entries

## Implementation Details

### Server Actions (`app/lib/actions.ts`)

#### `getEligiblePlayers(participantId, position, week)`
Returns a filtered list of players eligible for selection:
1. Retrieves all roster entries for the participant to identify used players
2. Filters players by position eligibility rules
3. Excludes players already used by this participant
4. Returns the filtered list

#### `updateRosterEntry(entryId, playerId, playerName)`
Updates a roster entry with the selected player:
- Stores both playerId (for database relationships) and playerName (for display)
- Updates the `updatedAt` timestamp

### Components

#### `PlayerPicker.tsx`
Client component that displays the player selection modal:
- Real-time search filtering
- Click to select player
- Cancel button to close without changes
- Clear selection button to remove current player

#### `PicksGrid.tsx`
Enhanced grid component:
- Click cell to open player picker
- Fetches eligible players when cell is clicked
- Updates database when player is selected
- Shows "Click to select" for empty cells (owners only)

## Usage

1. **As an entry owner**: Click any cell in the grid
2. **Search for players**: Type in the search box to filter by name or team
3. **Select a player**: Click on a player from the list
4. **Clear selection**: Click "Clear Selection" to remove the current player
5. **Cancel**: Click the X or outside the modal to close without changes

## Database Schema

The `rosterEntries` table stores:
- `playerId`: Foreign key to the players table
- `playerName`: Cached player name for display
- `position`: The roster position (QB, RB, WR, FLEX, TEAM)
- `week`: The week number (1-4)
- `participantId`: Reference to the participant/entry

## Future Enhancements

- [ ] Add team defense/special teams support for TEAM position
- [ ] Show player stats in the picker
- [ ] Add player photos/images
- [ ] Show which position/week a player is currently selected in
- [ ] Add confirmation dialog before clearing a selection
- [ ] Implement player scoring and weekly results
