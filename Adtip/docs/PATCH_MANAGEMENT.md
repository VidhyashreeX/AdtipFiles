# 🔧 Patch Management Guide

## Overview

This project uses `patch-package` to maintain custom modifications to third-party npm packages. This ensures that your custom changes persist across npm installs and updates.

## Current Patches

### react-native-callkeep@4.3.3

**File**: `patches/react-native-callkeep+4.3.3.patch`

**Changes Made**:
- Modified `RNCallKeepModule.java` to use custom method names
- Changed `displayIncomingCall` to `basicdisplayIncomingCall`
- Changed `startCall` to `basicstartCall`

**Purpose**: Custom CallKeep implementation for Adtip's specific requirements

## How It Works

### Automatic Application
The patch is automatically applied when you run:
```bash
npm install
```

This is configured in `package.json`:
```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

### Manual Application
You can manually apply patches by running:
```bash
npm run postinstall
# or
npx patch-package
```

## Creating New Patches

### Step 1: Modify the Package
1. Navigate to the package in `node_modules`
2. Make your changes to the source files
3. Test your changes

### Step 2: Generate the Patch
```bash
npx patch-package package-name
```

Example:
```bash
npx patch-package react-native-callkeep
```

### Step 3: Commit the Patch
The patch file will be created in the `patches/` directory. Commit this file to your repository.

## Updating Patches

### When Package Version Changes
If you update a package version, you'll need to recreate the patch:

1. Update the package version
2. Apply your changes to the new version
3. Generate a new patch file
4. Remove the old patch file
5. Commit the new patch file

### Modifying Existing Patches
1. Make changes to the files in `node_modules`
2. Run `npx patch-package package-name` again
3. The patch file will be updated with your new changes

## Troubleshooting

### Patch Fails to Apply
If a patch fails to apply (usually after a package update):

1. **Check the error message** - it will tell you which files failed
2. **Manually resolve conflicts**:
   ```bash
   # Remove the failing patch temporarily
   mv patches/package-name+version.patch patches/package-name+version.patch.backup
   
   # Install the package clean
   npm install
   
   # Manually apply your changes
   # Then regenerate the patch
   npx patch-package package-name
   ```

### Build Directory Issues
If you get "filename too long" errors:
```bash
# Clean build directories before creating patches
Remove-Item -Recurse -Force "node_modules\package-name\android\build" -ErrorAction SilentlyContinue
npx patch-package package-name
```

### Verifying Patches
Check if patches are applied correctly:
```bash
# This should show "✔" for each applied patch
npx patch-package --check
```

## Best Practices

### 1. Document Your Changes
- Always document why you made the changes
- Include the purpose and expected behavior
- Update this file when adding new patches

### 2. Test Thoroughly
- Test your changes before creating the patch
- Verify the patch applies correctly on fresh installs
- Test on different environments (dev, staging, production)

### 3. Minimal Changes
- Make the smallest possible changes to achieve your goal
- Avoid reformatting or unnecessary modifications
- This makes patches more likely to apply successfully after updates

### 4. Version Control
- Always commit patch files to your repository
- Include patch files in your deployment process
- Don't ignore the `patches/` directory in `.gitignore`

## File Structure

```
patches/
├── react-native-callkeep+4.3.3.patch    # CallKeep customizations
└── [other-package+version.patch]         # Future patches
```

## Integration with CI/CD

### GitHub Actions / CI
Ensure your CI/CD pipeline runs `npm install` which will automatically apply patches:

```yaml
- name: Install dependencies
  run: npm install  # This automatically runs postinstall and applies patches
```

### Production Deployment
Patches are applied automatically during the build process, so no special deployment steps are needed.

## Monitoring

### Check Patch Status
```bash
# See which patches are applied
npx patch-package --check

# See detailed information about patches
npx patch-package --list
```

### Package Updates
When updating packages that have patches:

1. **Before updating**: Note which patches exist
2. **After updating**: Check if patches still apply
3. **If patches fail**: Recreate them for the new version

## Security Considerations

- **Review patches carefully** - they modify third-party code
- **Keep patches minimal** - reduce attack surface
- **Document security implications** of any changes
- **Test security features** after applying patches

## Support

If you encounter issues with patches:

1. Check this documentation
2. Review the patch file contents
3. Test on a clean environment
4. Check package changelogs for breaking changes
5. Consider alternative approaches if patches become too complex

---

**Last Updated**: Auto-generated during patch creation
**Patch Count**: 1 active patch
**Status**: All patches applying successfully ✅
