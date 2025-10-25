# Chapter Loading Debug Guide

## Problem
Chapters are not showing up in "My Progress" after being added.

## Debug System Installed

I've added comprehensive logging throughout the code to track exactly what happens when you add a chapter. This will help us identify where the problem is occurring.

## How to Test and Debug

### Step 1: Build and Install the App
```powershell
# Run the build script
./build-and-install.ps1
```

### Step 2: Start Viewing Logs
Open a **separate PowerShell window** and run:
```powershell
./view-logs.ps1
```

This will show all console logs from the app in real-time.

### Step 3: Test Adding a Chapter

1. Open the app
2. Go to the **Verses** tab
3. Switch to **Browse**
4. Find the "Add Custom Verse" button and add a new chapter:
   - Enter a book name (e.g., "Philippians")
   - Enter chapter number (e.g., "1")
   - Click "Fetch Chapter"
   - Click "Add Chapter"
5. Click on the newly created chapter to add it to your progress
6. Switch to the "My Progress" tab

### Step 4: Review the Logs

Watch the PowerShell window with logs. You should see output like this:

#### When Adding to Progress:
```
>>> verses.tsx: handleAddToProgress called with verseId: chapter-XXXXX
>>> verses.tsx: Total chapters available: X
>>> verses.tsx: Is this a chapter? true/false
=== ADD TO PROGRESS DEBUG START ===
1. Input verseId: chapter-XXXXX
2. Has verseOverride: false
3. Total chapters in state: X
4. Chapter IDs in state: [...]
5. Chapter override: NO/YES
6. Found chapter in state: NO/YES
7. Is chapter: true/false
8. Chapter data: { ... }
9. Chapter progress object created: { ... }
10. About to save to AsyncStorage...
11. AsyncStorage save completed
12. State should update now
=== ADD TO PROGRESS DEBUG END (chapter saved) ===
```

#### When Loading Progress Screen:
```
>>> COMPUTING versesInProgress <<<
Progress keys: [...]
AllVerses count: X
Chapters count: X
Looking for verseId: chapter-XXXXX, isChapter flag: true/false
Found chapter: Philippians 1 (or WARNING message)
Final versesInProgress count: X
>>> END COMPUTING versesInProgress <<<
```

## What to Look For

### Scenario 1: Chapter Not Found During Add
If you see:
```
6. Found chapter in state: NO
7. Is chapter: false
9. NOT A CHAPTER - processing as regular verse
```

**Problem**: The chapter isn't in the `chapters` state when trying to add it.

**Solution**: The issue is in how chapters are being stored or retrieved from state.

### Scenario 2: Chapter Not Found When Displaying Progress
If you see:
```
Looking for verseId: chapter-XXXXX, isChapter flag: true
WARNING: Chapter not found in chapters array: chapter-XXXXX
```

**Problem**: The chapter was saved to progress, but the `chapters` state doesn't have it when we try to display it.

**Solution**: The `chapters` state is not persisting or being loaded correctly.

### Scenario 3: isChapter Flag is False
If you see:
```
Looking for verseId: chapter-XXXXX, isChapter flag: false
```

**Problem**: The chapter was saved to progress but without the `isChapter` flag set correctly.

**Solution**: The `addToProgress` function didn't set `isChapter: true` in the progress object.

## Next Steps

After running the test:

1. **Save the complete log output** from the PowerShell window
2. Look for any **WARNING** or **ERROR** messages
3. Note which scenario (1, 2, or 3) matches what you see
4. Share the log output so we can identify the exact issue

## Common Issues and Quick Fixes

### If no logs appear:
```powershell
# Check if the device is connected
adb devices

# If no devices, reconnect your phone or emulator
```

### If logs are too cluttered:
The `view-logs.ps1` script filters for React Native logs only. If you still see too much output, you can further filter:
```powershell
adb logcat | Select-String -Pattern "===|>>>" -CaseSensitive
```

This will show only the debug markers we added.

## Alternative: Metro Bundler Logs

You can also check the Metro bundler console output which may show the same logs:
```powershell
# In the terminal where you ran the build, look for console.log output
```

## Emergency Debugging Commands

### View AsyncStorage Contents
To see what's actually stored:

1. Open the app
2. Add this code temporarily to see storage contents:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add this in a useEffect somewhere
AsyncStorage.getItem('chapters').then(data => {
  console.log('CHAPTERS IN STORAGE:', data);
});
AsyncStorage.getItem('verse_progress').then(data => {
  console.log('PROGRESS IN STORAGE:', data);
});
```

### Clear All Data
If you need to start fresh:
```javascript
AsyncStorage.clear().then(() => {
  console.log('All data cleared');
});
```

## Files Modified

The following files have enhanced logging:
- `contexts/VerseContext.tsx` - Main logic for adding chapters and displaying progress
- `app/(tabs)/verses.tsx` - UI for adding chapters to progress

## Removing Debug Logs

Once the issue is fixed, you can remove the debug logs by searching for:
- `console.log('>>>`
- `console.log('==='`

And removing those lines.

