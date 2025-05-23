# ProForma App

A Real Estate Pro Forma Builder with automated GitHub integration.

## Quick Start

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

## Working with Claude

### To update a specific component:
```
npm run update calculations
```

This will tell you which file to share with Claude.

### Auto-commit changes:
```
npm run auto-commit
```

## Project Structure

```
/src
  /components   - UI components
  /utils        - Business logic & calculations
  /data         - Default configurations
  /styles       - CSS files
/scripts        - Automation tools
```

## Available Commands

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run update <component>` - Prepare to update a component
- `npm run auto-commit` - Automatically commit changes
