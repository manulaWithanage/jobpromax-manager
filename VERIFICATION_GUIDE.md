# Roadmap Phase Operations - Verification Guide

This guide shows you how to verify that data is being sent correctly to the backend and updated successfully.

## 🔍 What Was Added

I've added comprehensive logging at **three layers**:

1. **UI Layer** (`page.tsx`) - Shows what the user action triggered
2. **Context Layer** (`ProjectContext.tsx`) - Shows the data being passed to API
3. **API Layer** (`api.ts`) - Shows the actual HTTP request being sent

Plus **success alerts** so you know immediately when operations complete!

## 📋 How to Verify

### Step 1: Open Browser Console
1. Open your browser (Chrome/Edge)
2. Press `F12` to open Developer Tools
3. Click on the **Console** tab
4. Clear the console (click the 🚫 icon)

### Step 2: Test Creating a Phase

1. Go to `http://localhost:3000/manager/roadmap`
2. Click **"Create First Phase"** or **"Add Phase"**
3. Watch the console - you should see:

```
📤 Sending CREATE request to backend...
New phase data: {
  "phase": "New Phase",
  "date": "Q4 2025",
  "title": "Untitled Phase",
  ...
}
[ProjectContext] Calling API: addPhase
[ProjectContext] Phase data: {...}
[API] POST /api/roadmap
[API] Request body: {...}
[API] Response: {...}
[ProjectContext] Refreshing data...
[ProjectContext] Data refreshed
✅ Phase created successfully!
Waiting for roadmap to refresh...
```

4. The edit form should appear automatically
5. You should see an **alert**: "✅ Phase created successfully!"

### Step 3: Test Updating a Phase

1. Edit the phase details (change title, description, etc.)
2. Click **"Save Changes"**
3. Watch the console - you should see:

```
📤 Sending UPDATE request to backend...
Phase ID: 67589abc123...
Updated data: {
  "phase": "Q1 2024",
  "title": "My Updated Phase",
  ...
}
[ProjectContext] Calling API: updatePhase
[API] PATCH /api/roadmap/67589abc123...
[API] Request body: {...}
[API] Response: {...}
[ProjectContext] Refreshing data...
✅ Phase updated successfully!
```

4. You should see an **alert**: "✅ Phase updated successfully!"
5. The card should exit edit mode and show your updated data

### Step 4: Test Deleting a Phase

1. Click the **trash icon** on a phase card
2. Confirm the deletion
3. Watch the console - you should see:

```
🗑️ Sending DELETE request to backend...
Phase ID: 67589abc123...
[ProjectContext] Calling API: deletePhase
[API] DELETE /api/roadmap/67589abc123...
[API] Delete successful
[ProjectContext] Refreshing data...
✅ Phase deleted successfully!
```

4. You should see an **alert**: "✅ Phase deleted successfully!"
5. The card should disappear from the list

## ✅ What to Look For

### Success Indicators:
- ✅ Console shows all three layers logging (UI → Context → API)
- ✅ Request body matches what you entered
- ✅ Response shows the updated data
- ✅ Success alert appears
- ✅ UI updates to reflect the change

### Error Indicators:
- ❌ Console shows error messages
- ❌ Alert shows "Failed to..." message
- ❌ UI doesn't update
- ❌ Network tab shows 4xx or 5xx errors

## 🔧 Troubleshooting

If you see errors:

1. **Check the error message** in the alert - it will tell you what went wrong
2. **Check the console** for the full error stack trace
3. **Check Network tab** in DevTools to see the actual HTTP request/response
4. **Verify backend is running** - should be on `http://localhost:8000`

## 📊 Example Console Output

Here's what a successful create → update → delete cycle looks like:

```
// CREATE
📤 Sending CREATE request to backend...
[API] POST /api/roadmap
✅ Phase created successfully!

// UPDATE  
📤 Sending UPDATE request to backend...
[API] PATCH /api/roadmap/67589abc123...
✅ Phase updated successfully!

// DELETE
🗑️ Sending DELETE request to backend...
[API] DELETE /api/roadmap/67589abc123...
✅ Phase deleted successfully!
```

Each operation should complete in under 1 second if the backend is healthy.

## 🎯 Quick Test Script

You can also run this script to verify backend connectivity:

```bash
node scripts/verify-backend.js
```

This will test the full flow without using the UI.
