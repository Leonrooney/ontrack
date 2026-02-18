# Fix: "Apply worktree to current branch" uses wrong path

## The error
```
Unable to write file '/Users/Code/FYP/ontrack/...' 
EACCES: permission denied, mkdir '/Users/Code'
```

Cursor is using **`/Users/Code/FYP/ontrack`** (missing your username).  
It should use **`/Users/leonrooney/Code/FYP/ontrack`**.

## Fix in Cursor

1. **Open Cursor Settings**
   - Mac: **Cursor → Settings** or **Cmd + ,**
   - Or: **File → Preferences → Settings**

2. **Search for worktree / main repo / project path**
   - In the settings search box, try: `worktree`, `main`, `repository path`, `project path`, or `ontrack`.

3. **Correct the path**
   - Find any field that shows `/Users/Code/FYP/ontrack` (or just `Code/FYP/ontrack`).
   - Change it to: **`/Users/leonrooney/Code/FYP/ontrack`**

4. **If you use "Cursor Projects"**
   - Check **File → Open Recent** or project switcher.
   - Remove any project that points at the wrong path.
   - Use **File → Open Folder** and manually select:
     **`/Users/leonrooney/Code/FYP/ontrack`**

5. **Restart Cursor** after changing the path.

## If the setting isn’t in Settings UI

The path may be stored in Cursor’s app data. On macOS you can search for it:

```bash
grep -r "Users/Code" ~/Library/Application\ Support/Cursor/ 2>/dev/null || true
```

If you find a file containing `Users/Code` (without `leonrooney`), edit it and replace with `Users/leonrooney/Code`.

## Workaround (no settings change)

- Don’t use “Apply worktree to current branch.”
- Open your main repo directly: **File → Open Folder →** `/Users/leonrooney/Code/FYP/ontrack`
- Do your work and commits there.
