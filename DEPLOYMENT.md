# Deployment Guide

This guide walks you through deploying the MCP React Test Generator to npm.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **npm CLI**: Ensure you have npm installed and are logged in
3. **Git Repository**: Set up a GitHub repository (optional but recommended)

## Pre-Deployment Checklist

### 1. Update Package Information

Edit `package.json` and update these fields with your information:

```json
{
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/mcp-react-test-generator.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/mcp-react-test-generator/issues"
  },
  "homepage": "https://github.com/yourusername/mcp-react-test-generator#readme"
}
```

### 2. Choose Package Name

If `mcp-react-test-generator` is taken, update the name in `package.json`:

```json
{
  "name": "your-unique-package-name"
}
```

### 3. Verify Build

```bash
npm run build
```

### 4. Test Locally

```bash
npm start
# Test with a sample request to ensure it works
```

## Deployment Steps

### Step 1: Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

### Step 2: Check Package

Verify what will be published:

```bash
npm pack --dry-run
```

This shows which files will be included in the package.

### Step 3: Publish to npm

For first-time publication:

```bash
npm publish
```

For subsequent updates:

1. Update version in `package.json`:
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

2. Publish:
   ```bash
   npm publish
   ```

### Step 4: Verify Publication

Check your package on npm:
```
https://www.npmjs.com/package/your-package-name
```

Test installation:
```bash
npm install -g your-package-name
your-package-name --help
```

## GitHub Repository Setup (Recommended)

### 1. Create Repository

Create a new repository on GitHub named `mcp-react-test-generator`.

### 2. Initialize Git

```bash
git init
git add .
git commit -m "Initial commit: MCP React Test Generator"
git branch -M main
git remote add origin https://github.com/yourusername/mcp-react-test-generator.git
git push -u origin main
```

### 3. Add GitHub Actions (Optional)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Version Management

### Semantic Versioning

Follow semantic versioning (semver):

- **PATCH** (1.0.1): Bug fixes, no breaking changes
- **MINOR** (1.1.0): New features, backward compatible
- **MAJOR** (2.0.0): Breaking changes

### Release Process

1. Make changes and test thoroughly
2. Update version:
   ```bash
   npm version patch  # or minor/major
   ```
3. Push changes:
   ```bash
   git push && git push --tags
   ```
4. Publish:
   ```bash
   npm publish
   ```

## Post-Deployment

### 1. Update Documentation

- Update README with actual npm package name
- Add installation instructions
- Update GitHub repository description

### 2. Monitor Usage

- Check npm download statistics
- Monitor GitHub issues
- Respond to user feedback

### 3. Maintenance

- Keep dependencies updated
- Fix bugs promptly
- Add new features based on user requests

## Troubleshooting

### Common Issues

**Package name already exists:**
```bash
npm publish --tag beta  # Publish as beta version
# or change package name in package.json
```

**Permission denied:**
```bash
npm whoami  # Check if logged in
npm login   # Login again if needed
```

**Build fails:**
```bash
npm run build  # Check for TypeScript errors
```

**Package not executable:**
```bash
chmod +x dist/index.js  # Fix permissions
```

### Testing Before Publication

Create a test project and install locally:

```bash
cd ../test-project
npm install /path/to/mcp-react-test-generator
```

## Security Considerations

1. Never commit sensitive information
2. Use `.npmignore` to exclude development files
3. Regularly update dependencies for security patches
4. Consider using `npm audit` to check for vulnerabilities

## Support

After deployment, provide support through:

1. GitHub Issues
2. npm package page
3. Documentation updates
4. Community forums

---

**Ready to deploy? Run through this checklist and execute the deployment steps!** 