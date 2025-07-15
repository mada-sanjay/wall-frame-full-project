 # Draft Update Feature

## Overview
The Wall Frame Designer now supports updating existing drafts instead of always creating new ones.

## How It Works

### 1. **Loading a Draft**
- When you click "Load" on any saved draft, it loads the design and tracks that draft's ID
- A "Draft Loaded" indicator appears in the top-left corner
- The "Save Draft" button changes to "Update Draft"

### 2. **Updating vs Creating**
- **If a draft is loaded**: Clicking "Update Draft" will update the existing draft
- **If no draft is loaded**: Clicking "Save Draft" will create a new draft

### 3. **Starting Fresh**
- Click "New Design" to clear everything and start a fresh design
- This clears the current draft tracking and resets all design elements

### 4. **Visual Indicators**
- **"Draft Loaded" badge**: Shows when a draft is currently loaded
- **Button text changes**: "Save Draft" → "Update Draft" when editing an existing draft

## Backend Changes

### New API Endpoint
- `PUT /api/update-session/:id` - Updates an existing session/draft

### Database Operations
- Updates the `session_data` field for the specified session ID
- Validates user ownership before allowing updates

## Frontend Changes

### New State
- `currentDraftId` - Tracks which draft is currently loaded

### Enhanced Functions
- `loadDraft()` - Now accepts session ID and sets current draft tracking
- `handleSaveDraft()` - Checks if updating existing or creating new
- `handleNewDesign()` - Clears all state and starts fresh
- `deleteDraft()` - Clears current draft ID if deleting the loaded draft

## User Experience

1. **Load a draft** → Make changes → **Update Draft** → Changes saved to same draft
2. **Start fresh** → Make design → **Save Draft** → Creates new draft
3. **Load draft** → **New Design** → Start completely fresh

This prevents creating multiple drafts when you just want to update an existing one!