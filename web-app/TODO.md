# Pinqoza Auto Logout Feature

## Task: Add auto logout feature for admin after 15 minutes of inactivity

### Steps to Complete:

- [x] 1. Analyze the codebase and understand admin authentication flow
- [x] 2. Modify Admin.js - Add inactivity timeout (15 min), warning modal, auto logout
- [x] 3. Modify api.js - Add 401 response interceptor for auto logout
- [x] 4. Modify auth.js - Add admin logout helper function

### Implementation Details:

1. **Admin.js:**
   - Add INACTIVITY_TIMEOUT = 900000ms (15 minutes)
   - Add activity event listeners (mousemove, keydown, click, scroll, touchstart)
   - Add countdown warning modal (shows at 2 minutes remaining)
   - Auto logout when timeout occurs

2. **api.js:**
   - Add response interceptor to handle 401 errors
   - Auto logout admin on 401 response

3. **auth.js:**
   - Add adminLogout helper function

---

## Progress Log:

- Step 1: Completed ✓
- Step 2: Completed ✓
- Step 3: Completed ✓
- Step 4: Completed ✓

All steps completed! ✅
