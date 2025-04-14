# Copilot Instructions for Fluffy Swizz Interactive Gamejam1

Goal
Maintain well-documented, modular, and production-ready code across the entire stack using Copilot's context-aware suggestions and auto-documentation capability.

🔄 File Update Rules
When Copilot writes new classes, functions, game systems, or mechanics, it must:

Append or update entries in /docs/ProjectDoc(VS).md.

Include relevant signatures, descriptions, and usage notes.

Organize documentation sections using markdown headers.

Copilot Rule:
When: New code is generated (class, method, variable, game system)
Then: Update /docs/ProjectDoc(VS).md accordingly

🧱 Tech Stack
Use only the following technologies unless directed otherwise:

Front-End: React.js (Vite)

Game Engine: Phaser.js

Build Tool: Vite

Dev Tools: ESLint, Prettier, (Optional: TypeScript)

Copilot should prefer React templating and Vite modules for scaffolding.

All assets should be linked using Vite's asset management and module resolution.

🧠 Code Architecture
Follow strict OOP principles for all core systems:

Use classes for all entities (e.g. Player, Enemy, Bullet, UIManager)

Encapsulate logic in reusable modules

Favor composition over inheritance when possible

Use access modifiers (where applicable)

Each module should have a single responsibility

🔀 Branching Strategy
Branches:

main: Production-ready code only

dev: Active development

feature/*: Short-lived feature branches

Rules:

All merges to main must go through dev

No direct commits to main

Feature branches should be merged to dev only after testing and review

🚀 CI/CD Rules
Maintain current GitHub Actions CI/CD setup:

Every push to dev or main triggers tests and build validation

Deployments only happen from main after successful pipeline

All assets and game scenes must load correctly before merging

Copilot Rule:
Do not break .github/workflows/deploy.yml or .env.production behavior

✅ End-of-Prompt Checklist
At the end of a generation:

 Did you update /docs/ProjectDoc(VS).md?

 Is the code OOP-compliant and modular?

 Is the stack consistent with React + Phaser + Vite?

 Did you respect the dev → main flow?

 Will the GitHub CI/CD pipeline pass?