# pnpm Configuration Guide

This project has been successfully configured to use **pnpm** (v10.18.2) as the package manager.

## ✅ Configuration Completed

### 1. **`.npmrc` Configuration**
A `.npmrc` file has been created with the following settings to fix import linter errors:

```ini
# Enable hoisting to avoid import resolution issues with ESLint and TypeScript
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*typescript*
public-hoist-pattern[]=@typescript-eslint/*
public-hoist-pattern[]=vite
public-hoist-pattern[]=@vitejs/*

# Auto-install peer dependencies
auto-install-peers=true

# Strict peer dependencies - set to false for more lenient resolution
strict-peer-dependencies=false

# Dedupe peer dependents for smaller node_modules
dedupe-peer-dependents=true
```

**Why these settings?**
- `public-hoist-pattern`: Hoists ESLint, TypeScript, and Vite dependencies to the root `node_modules`, making them accessible to tools and preventing import resolution errors
- `auto-install-peers`: Automatically installs peer dependencies
- `strict-peer-dependencies=false`: More lenient peer dependency resolution
- `dedupe-peer-dependents`: Optimizes `node_modules` size

### 2. **`package.json` Update**
Added `packageManager` field to lock the project to pnpm:

```json
"packageManager": "pnpm@10.18.2"
```

This ensures:
- All team members use the same package manager
- Corepack can automatically use the correct pnpm version
- Prevents accidental use of npm or yarn

### 3. **Clean Installation**
- Removed old lock files (`package-lock.json`, `bun.lockb`)
- Generated fresh `pnpm-lock.yaml`
- Installed all dependencies successfully
- Approved build scripts for `@swc/core` and `esbuild`

## 🚀 Usage

### Basic Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Preview production build
pnpm preview
```

### Managing Dependencies

```bash
# Add a dependency
pnpm add <package-name>

# Add a dev dependency
pnpm add -D <package-name>

# Remove a dependency
pnpm remove <package-name>

# Update dependencies
pnpm update

# Update pnpm itself
pnpm self-update
```

## 🔧 Troubleshooting

### If you still experience import errors:

1. **Clear pnpm cache and reinstall:**
   ```bash
   pnpm store prune
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

2. **Use shamefully-hoist (last resort):**
   If issues persist, uncomment this line in `.npmrc`:
   ```ini
   shamefully-hoist=true
   ```
   This creates a flat `node_modules` structure like npm, but loses some benefits of pnpm's strict dependency resolution.

3. **Check TypeScript/ESLint configuration:**
   Make sure your `tsconfig.json` has proper module resolution:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "bundler"
     }
   }
   ```

## 📊 Benefits of pnpm

1. **Disk Space Efficiency**: Content-addressable storage saves disk space
2. **Faster Installations**: Symlinks packages from a global store
3. **Strict Dependency Resolution**: Prevents phantom dependencies
4. **Monorepo Support**: Better workspace management
5. **Security**: Only declared dependencies are accessible

## 🔄 Migration Notes

### From npm:
- Old `package-lock.json` has been removed
- Use `pnpm import` if you need to convert npm lockfile

### From bun:
- Old `bun.lockb` has been removed
- Scripts remain compatible (no changes needed)

## ⚠️ Important Notes

1. **Commit `.npmrc`**: The `.npmrc` file should be committed to version control
2. **Commit `pnpm-lock.yaml`**: Always commit the lockfile for reproducible builds
3. **Team Alignment**: Ensure all team members use pnpm (or have Corepack enabled)
4. **CI/CD**: Update your CI/CD pipelines to use pnpm instead of npm

### CI/CD Example (GitHub Actions):
```yaml
- uses: pnpm/action-setup@v2
  with:
    version: 10.18.2
- uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'pnpm'
- run: pnpm install --frozen-lockfile
- run: pnpm build
```

## 📝 Verification

✅ **Import errors resolved**: ESLint now correctly resolves all imports
✅ **Dependencies installed**: 588 packages installed successfully
✅ **Build scripts approved**: @swc/core and esbuild configured
✅ **Package manager locked**: pnpm@10.18.2 specified in package.json

## 📚 Resources

- [pnpm Official Documentation](https://pnpm.io/)
- [pnpm vs npm/yarn](https://pnpm.io/feature-comparison)
- [.npmrc Configuration](https://pnpm.io/npmrc)
- [Troubleshooting Guide](https://pnpm.io/faq)

---

**Setup completed on**: October 26, 2025
**pnpm version**: 10.18.2
**Node.js version**: Compatible with v18+
