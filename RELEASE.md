# Release Guide

## How to Create a Release

1. **Update the version in `package.json`:**
   ```bash
   npm version patch  # 1.0.0 → 1.0.1 (bug fixes)
   npm version minor  # 1.0.0 → 1.1.0 (new features)
   npm version major  # 1.0.0 → 2.0.0 (breaking changes)
   ```
   This automatically creates a git commit and tag.

2. **Push the tag to trigger the build:**
   ```bash
   git push origin main --tags
   ```

3. **Wait for GitHub Actions to complete.**
   The workflow builds installers for all platforms and creates a GitHub Release.

4. **Find your release at:**
   `https://github.com/lizozom/yoto-playlist-maker/releases`

## What Gets Built

| Platform | File | Description |
|----------|------|-------------|
| Windows | `Yoto Playlist Maker-X.X.X-win.exe` | NSIS installer |
| macOS (Intel) | `Yoto Playlist Maker-X.X.X-mac-x64.dmg` | DMG image |
| macOS (Apple Silicon) | `Yoto Playlist Maker-X.X.X-mac-arm64.dmg` | DMG image |
| Linux | `Yoto Playlist Maker-X.X.X-linux.AppImage` | AppImage |

## Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

## Quick Commands

```bash
# Release a bug fix
npm version patch && git push origin main --tags

# Release a new feature
npm version minor && git push origin main --tags

# Release a breaking change
npm version major && git push origin main --tags
```
