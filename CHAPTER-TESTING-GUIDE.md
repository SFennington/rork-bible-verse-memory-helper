# Chapter Game Flow Testing Guide

## Summary of Fixes Applied

### 1. **Verse Unlocking** ✅
- Automatically unlocks next verse when completing all games with 80%+ accuracy
- Marks current verse as mastered when advancing
- Updates game list (single-verse → multi-verse games) automatically

### 2. **Progress Tracking** ✅
- Single-verse games (progressive-reveal, flashcard) pass `?chapterId=X` parameter
- Multi-verse games (verse-order, progressive-review) use chapter ID directly
- All progress is recorded under chapter ID, not individual verse IDs

### 3. **Color Scheme** ✅
- **Green** = Mastered verse
- **Yellow/Orange** = Unlocked but not mastered
- **Gray** = Locked (not yet unlocked)

### 4. **UI Improvements** ✅
- Chapter progress card is collapsible (collapsed by default)
- Shows "Learning verse X of Y" with progress bar
- Expand to see detailed verse grid

---

## Expected Chapter Flow

### **Day 1: First Verse (Verse 1)**
1. Add chapter to progress
2. **Current state:**
   - Unlocked: Verse 1 (yellow)
   - Mastered: None
   - Locked: All other verses (gray)
3. **Games available:** 2 single-verse games
   - Progressive Reveal (for current verse)
   - Flashcard (for current verse)
4. **After completing both games with 80%+ accuracy:**
   - Verse 1 marked as mastered (turns green)
   - Verse 2 unlocked (turns yellow)
   - Game list updates to multi-verse games

### **Day 2: Two Verses (Verses 1-2)**
1. **Current state:**
   - Unlocked: Verses 1-2
   - Mastered: Verse 1 (green)
   - Current: Verse 2 (yellow with blue border)
   - Locked: Remaining verses (gray)
2. **Games available:** 2 multi-verse games
   - Verse Order (arrange verses 1-2)
   - Progressive Review (type each verse)
3. **After completing both games with 80%+ accuracy:**
   - Verse 2 marked as mastered (turns green)
   - Verse 3 unlocked (turns yellow)

### **Day 3+: Continue Pattern**
- Each day, complete 2 games for current verse
- When completed with good accuracy, unlock next verse
- Games alternate between:
  - **Single-verse games** when only 1 verse unlocked
  - **Multi-verse games** when 2+ verses unlocked

### **Final Verse**
- When you complete the final verse, the chapter is marked complete
- All verses should be green (mastered)

---

## Testing Checklist

### Initial Setup
- [ ] Add a chapter with multiple verses to progress
- [ ] Verify only verse 1 is unlocked (yellow)
- [ ] Verify chapter progress card shows "Learning verse 1 of X"
- [ ] Verify progress bar shows appropriate progress

### First Verse Tests
- [ ] Verify 2 games available: Progressive Reveal, Flashcard
- [ ] Click on Progressive Reveal
  - Should load the individual verse (not chapter)
  - Should show correct verse text
- [ ] Complete Progressive Reveal with good accuracy
  - Should mark game as complete
  - Should return to verse detail page
- [ ] Complete Flashcard game
  - Should complete second game for today
- [ ] **After both games:** Check if verse 2 is unlocked
  - Verse 1 should be green (mastered)
  - Verse 2 should be yellow (unlocked)

### Second Verse Tests  
- [ ] Verify 2 games available: Verse Order, Progressive Review
- [ ] Click on Verse Order
  - Should show all unlocked verses (1 and 2)
  - Should allow ordering them
- [ ] Complete Verse Order successfully
- [ ] Complete Progressive Review
- [ ] **After both games:** Check if verse 3 is unlocked

### Progress Tracking
- [ ] No separate verse entries should appear in "My Progress"
- [ ] Only the chapter should be visible
- [ ] Games should be marked complete under the chapter
- [ ] Progress bar should advance appropriately

### UI Tests
- [ ] Chapter progress card collapsed by default
- [ ] Click to expand shows verse grid
- [ ] Colors correct: green=mastered, yellow=unlocked, gray=locked
- [ ] Current verse has blue border
- [ ] Legend shows correct labels

### Navigation Tests
- [ ] Completing a game returns to chapter detail page (not verse page)
- [ ] Play button on progress screen launches correct game
- [ ] Chapter ID (not verse ID) is used for progress tracking

### Error Tests
- [ ] No "verse not found" errors
- [ ] No "verse not in progress" errors
- [ ] Check logs for detailed error messages if any issues occur

---

## Debugging

If issues occur:
1. Check console logs for:
   - "✅ Chapter verse completed with good accuracy! Unlocking next verse..."
   - "✅ Completing game session for: [chapterId] Game: [gameType]"
   - "❌ Verse not in progress:" (with available IDs)

2. Verify URL parameters:
   - Single-verse games should have `?chapterId=X`
   - Multi-verse games should just use chapter ID

3. Check AsyncStorage (if needed):
   - Progress should be stored under chapter ID
   - No separate entries for individual verses from chapters

---

## Known Behavior

- **Accuracy Threshold:** Must achieve 80%+ average accuracy on both games to unlock next verse
- **Daily Reset:** Games reset each day, allowing continued practice
- **Game Count:** Always 2 games per day for chapters (unlike 3 for regular verses)
- **Completion:** Chapter complete when all verses are mastered

