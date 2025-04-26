# Shop System

## Overview
The shop system allows players to purchase upgrades between waves for both their character and weapons. It uses a clean separation of concerns between UI rendering and business logic.

## Architecture

The shop system consists of several interconnected components:

1. **ShopManager**: Business logic layer that handles purchases, rerolls, and upgrades
2. **ShopMenuScene**: UI layer that manages all visual elements of the shop
3. **UpgradeManager**: Handles the generation and application of upgrades
4. **Weapon/PlayerUpgrades**: Constants files defining all available upgrades and their properties

### Component Relationships

```
┌───────────────┐         ┌───────────────┐
│ WeaponUpgrades│─────────│PlayerUpgrades │
└───────┬───────┘         └───────┬───────┘
        │                         │
        │                         │
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│ UpgradeManager│◄────────┤  ShopManager  │
└───────┬───────┘         └───────┬───────┘
        │                         │
        │                         │
        └─────────────────────────┘
                    │   
                    ▼
           ┌───────────────┐
           │ ShopMenuScene │
           └───────────────┘
```

## Components

### ShopManager

Handles the business logic of the shop, including:
- Opening the shop when a wave is completed
- Processing purchases of upgrades
- Handling reroll requests
- Communicating with the player and weapon objects

### ShopMenuScene

Manages the UI elements of the shop, including:
- Displaying available upgrades
- Handling user interactions
- Visual effects for purchases and failures
- Displaying player and weapon stats

### UpgradeManager

Manages the generation and application of upgrades, including:
- Random generation of upgrade options
- Applying upgrade effects to player and weapon
- Tracking reroll counts and costs

### Constants Files

#### WeaponUpgrades.js
Defines all available weapon upgrades with:
- Stats and effects
- Visual properties
- Rarity and pricing
- Helper function for generating random selections

#### PlayerUpgrades.js 
Defines all available player upgrades with:
- Stats and effects
- Visual properties
- Pricing
- Helper function for generating random selections

## Flow

1. When a wave is completed, the WaveManager notifies the ShopManager
2. ShopManager updates the "Next Wave" button text to "Open Shop"
3. When the player clicks "Open Shop", the ShopManager:
   - Pauses the main game scene
   - Generates upgrade options with UpgradeManager
   - Launches the ShopMenuScene with the upgrade options
4. The ShopMenuScene displays the shop UI with available upgrades
5. When the player purchases an upgrade:
   - ShopMenuScene triggers ShopManager.purchaseWeaponUpgrade() or ShopManager.purchasePlayerUpgrade()
   - ShopManager processes the payment and applies the upgrade using UpgradeManager
   - An event is emitted to update the UI
6. When the player clicks "Start Next Wave":
   - ShopMenuScene closes and resumes the main game scene
   - ShopManager triggers the next wave via WaveManager

## Event Communication

The shop system uses the EventBus for communication between components:

- `shop-item-purchased`: When an upgrade is successfully purchased
- `shop-purchase-failed`: When a purchase fails (e.g., insufficient funds)
- `shop-rerolled`: When upgrades are rerolled
- `shop-reroll-failed`: When a reroll fails
- `weapon-upgraded`: When a weapon upgrade is applied
- `player-upgraded`: When a player upgrade is applied

## Adding New Upgrades

To add new upgrades:

1. Add the upgrade definition to the appropriate constants file (WeaponUpgrades.js or PlayerUpgrades.js)
2. Ensure the stats object contains properties that UpgradeManager can process
3. Define visual properties for proper display in the UI
4. No code changes are needed in ShopMenuScene or ShopManager