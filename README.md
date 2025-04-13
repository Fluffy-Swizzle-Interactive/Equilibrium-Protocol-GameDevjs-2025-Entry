# Minigun Madness - Game Development

A top-down shooter game built with Phaser 3 and React.

## Game Overview

Players can choose between two weapon modes (minigun or shotgun) and must survive as long as possible against waves of increasingly difficult enemies.

## Development Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

## Building for Production

Build the game for production:
```bash
npm run build
```

The production build will be in the `dist` folder.

## Deployment to itch.io

### Automatic Deployment (CI/CD)

This project is configured with GitHub Actions for automatic deployment to itch.io when changes are pushed to the main branch.

#### Prerequisites:

1. Create an itch.io account at https://itch.io
2. Create a new game page on itch.io with project name: `GJG2`
3. Generate a Butler API key at https://itch.io/user/settings/api-keys
4. Add the API key as a GitHub secret named `BUTLER_API_KEY` in your repository settings

#### How it works:

- When changes are pushed to the `main` branch, GitHub Actions will:
  - Build the project
  - Deploy to itch.io using Butler
  - Channel will be set to `web` for browser-based play

### Manual Deployment

You can also deploy manually using npm scripts:

```bash
# Deploy to web channel
npm run deploy

# Deploy to windows-web channel
npm run deploy:win

# Deploy to all channels
npm run deploy:all
```

#### Prerequisites for manual deployment:

1. Install Butler: https://itch.io/docs/butler/installing.html
2. Log in to Butler:
```bash
butler login
```

## Project Structure

See `.ProjectDoc.md` for comprehensive documentation of the codebase structure, components, and interfaces.
