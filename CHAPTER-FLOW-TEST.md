# Chapter Game Flow - Testing Guide

## Overview
This document outlines the complete chapter memorization flow that needs to be tested.

## Game Requirements
- **Chapters**: Always require **2 games per day**
- **Regular Verses**: Require **3 games per day** (levels 1-4) or **1 game** (level 5)

## Games Used for Chapters
- **Single Verse Games** (when only 1 verse unlocked):
  - `progressive-reveal` 
  - `flashcard`
  
- **Multi-Verse Games** (when 2+ verses unlocked):
  - `verse-order`
  - `progressive-review`

## Complete Flow

### Day 1: Start Chapter
**Initial State:**
- Chapter added to progress
- 1 verse unlocked (verse 0)
- difficultyLevel: 1
- currentDayGames: ['progressive-reveal', 'flashcard']
- completedGamesToday: 0

**User Actions:**
1. Click chapter in "My Progress"
2. See "Today's Games" showing 0/2
3. Play "progressive-reveal" (Game 1)
4. Complete game → completedGamesToday: 1
5. Play "flashcard" (Game 2)
6. Complete game → completedGamesToday: 2

**Expected Result:**
- Status shows "Level 1 Complete!"
- Button shows "Continue to Next Level" (optional)
- Completing both games unlocks verse 1 (if user doesn't click continue)
- OR clicking "Continue" immediately unlocks verse 1

### Day 2: Multiple Verses Unlocked
**Initial State:**
- 2 verses unlocked (verses 0, 1)
- difficultyLevel: 1 (or 2 if advanced)
- currentDayGames: ['verse-order', 'progressive-review']
- completedGamesToday: 0

**User Actions:**
1. Click chapter in "My Progress"
2. See "Today's Games" showing 0/2
3. Play "verse-order" (Game 1) - tests order of verses 0 and 1
4. Complete game → completedGamesToday: 1
5. Play "progressive-review" (Game 2) - tests recall of both verses
6. Complete game → completedGamesToday: 2

**Expected Result:**
- Status shows "Level 1 Complete!"
- Completing both games unlocks verse 2
- Now have 3 verses unlocked

### Day 3+: Continue Pattern
**Pattern Repeats:**
- Each day: complete 2 games (verse-order, progressive-review)
- Each completion: unlocks next verse
- Continue until all verses in chapter are unlocked

### Final State: All Verses Unlocked
**When Last Verse is Unlocked:**
- Continue playing 2 games per day
- All games test the entire chapter
- Track progress toward mastery
- chapterProgress.isComplete: true (when all verses mastered)

## Key Test Cases

### Test 1: First Day with 1 Verse
✓ Only see progressive-reveal and flashcard games
✓ Show "0/2 today" initially
✓ After game 1, show "1/2 today"
✓ After game 2, show "2/2 today" 
✓ After completing both, unlock verse 1
✓ Games don't reset to regular verse games

### Test 2: Second Day with 2+ Verses
✓ See verse-order and progressive-review games
✓ Show "0/2 today"
✓ verse-order includes all unlocked verses
✓ progressive-review tests all unlocked verses
✓ After completing both, unlock next verse
✓ Games remain as chapter games (don't switch to flashcard/fill-blank/etc)

### Test 3: Progress Display
✓ Chapter shows in "My Progress" with correct reference
✓ Shows "(X verses)" in the reference
✓ Shows first verse text as preview
✓ Progress percentage updates correctly
✓ "X/2 today" badge shows correctly

### Test 4: Game List Display
✓ "Today's Games" section shows 2 games
✓ Correct game names appear (not errors)
✓ Checkmarks appear after completing games
✓ Can click play button to start games

### Test 5: Edge Cases
✓ Completing game doesn't switch to level-up games for regular verses
✓ Chapter stays at difficulty level 1 (doesn't advance like verses)
✓ Required games always shows 2, never 3
✓ Unlocking works correctly even with multiple chapters

## Bug Fixes Applied

### Issue 1: Wrong Required Games Count
**Problem**: `completeGameSession` used 3 required games for chapters at level 1
**Fix**: Added check for `isChapter` flag → use 2 games for chapters

### Issue 2: Inconsistent Required Games Checks
**Problem**: Different screens used different logic for required games
**Fix**: Standardized to: `isChapter ? 2 : (difficultyLevel === 5 ? 1 : 3)`

### Issue 3: Game Reset After Completion
**Problem**: After completing games, `currentDayGames` switched to regular verse games
**Fix**: Added logic to preserve chapter games based on unlocked verse count:
- 1 verse unlocked → single-verse games
- 2+ verses unlocked → multi-verse games

### Issue 4: Starting with Wrong Games
**Problem**: New chapters started with verse-order despite having only 1 verse
**Fix**: Initialize with `CHAPTER_SINGLE_VERSE_GAMES` when creating new chapter progress

## Testing Checklist

- [ ] Add new chapter to progress
- [ ] Verify 2 games appear (progressive-reveal, flashcard)
- [ ] Complete first game
- [ ] Verify counter shows 1/2
- [ ] Complete second game  
- [ ] Verify counter shows 2/2
- [ ] Verify "Level 1 Complete" message
- [ ] Check that verse 1 unlocks
- [ ] Next day: verify games are now verse-order and progressive-review
- [ ] Complete both multi-verse games
- [ ] Verify verse 2 unlocks
- [ ] Continue for several days
- [ ] Verify games never switch to regular verse games (flashcard/fill-blank/word-order)
- [ ] Verify required games always stays at 2
- [ ] Test with multiple chapters simultaneously

## Expected Behavior Summary

**Chapters should:**
- Always require 2 games per day
- Start with single-verse games (1 verse unlocked)
- Switch to multi-verse games (2+ verses unlocked)
- Never use regular verse games (flashcard/fill-blank/word-order for verses)
- Stay at difficulty level 1 throughout
- Unlock one new verse per day after completing 2 games
- Display correctly in all progress screens

