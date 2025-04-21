# Shop System

The Shop System provides an in-game interface for purchasing weapon and player upgrades between waves in roguelike game modes. It offers a modal/overlay UI that appears after wave completion, allowing players to spend Credits and XP on various upgrades.

## Core Components

### ShopManager

The central component that manages the shop UI and coordinates between game systems.

```javascript
// Create a shop manager
const shopManager = new ShopManager(scene, player, weapon, rng);
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `scene` | `Phaser.Scene` | Reference to the game scene |
| `player` | `Player` | Reference to the player object |
| `weapon` | `Object` | Reference to the player's weapon object |
| `rng` | `Object` | Random number generator for upgrade generation |
| `upgradeManager` | `UpgradeManager` | Manager for generating and applying upgrades |
| `shopOverlay` | `Phaser.GameObjects.Container` | Container for shop UI elements |
| `isShopOpen` | `boolean` | Whether the shop is currently open |

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `openShop()` | None | Opens the shop interface and generates upgrades |
| `closeShop()` | None | Closes the shop interface and resets reroll count |
| `onNextWaveStart()` | None | Handles starting the next wave after shopping |
| `handleReroll()` | None | Handles rerolling available upgrades |
| `purchaseWeaponUpgrade(upgrade, card, index)` | Upgrade object, card container, index | Processes weapon upgrade purchase |
| `purchasePlayerUpgrade(upgrade, button, index)` | Upgrade object, button container, index | Processes player upgrade purchase |

### UpgradeManager

Responsible for generating, storing, and applying upgrades to the player and weapons.

```javascript
// Create an upgrade manager
const upgradeManager = new UpgradeManager(player, weapon, rng);
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `player` | `Player` | Reference to the player object |
| `weapon` | `Object` | Reference to the player's weapon object |
| `rng` | `Object` | Random number generator |
| `rerollCost` | `number` | Base cost for rerolling upgrades |
| `rerollCount` | `number` | Number of times upgrades have been rerolled |

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `generateUpgrades()` | None | Generate a set of random weapon and player upgrades |
| `getRandomWeaponUpgrades(count)` | Number of upgrades | Generate random weapon upgrades |
| `getRandomPlayerUpgrades(count)` | Number of upgrades | Generate random player upgrades |
| `applyUpgrade(upgrade, type)` | Upgrade object, type string | Apply an upgrade to player or weapon |
| `reroll()` | None | Regenerate all upgrades |
| `getRerollCost()` | None | Calculate cost for rerolling based on reroll count |
| `resetReroll()` | None | Reset the reroll counter |
| `calculateWeaponCost(index)` | Index | Calculate cost for a weapon upgrade |

## Shop UI Layout

The shop interface consists of the following UI elements:

1. **Weapon Upgrade Cards (Left Side)**
   - 3 upgrade cards with red borders
   - Each displays: Name, Category (Melee/Ranged/AoE), Rarity (Common/Rare/Epic), and Cost

2. **Player Upgrade Buttons (Right Side)**
   - 3 upgrade buttons with green borders
   - Each displays: Type (Health, Armor, Speed) and Cost

3. **Control Buttons (Right Side)**
   - Reroll button to refresh all upgrade options (cost increases with each use)
   - Start Next Wave button to close the shop and begin the next wave

4. **Stats Panels (Bottom)**
   - Player Stats: HP, Level, XP, Speed, Credits
   - Weapon Stats: Type, Damage, Fire Rate, Pierce, DPS

## Integration with Game Systems

### Wave System Integration

The shop system integrates with the WaveManager:

```javascript
// Listen for wave completed events
EventBus.on('wave-completed', this.onWaveCompleted, this);
```

When a wave is completed:
1. The "Start Next Wave" button changes to "Open Shop" 
2. Clicking this button opens the shop interface
3. After shopping, clicking "Start Next Wave" closes the shop and begins the next wave

### Economy Integration

The shop system integrates with two resource systems:

1. **Credits System**: Used for weapon upgrades and rerolls
   ```javascript
   // Process credit payment
   this.player.credits -= upgrade.cost;
   EventBus.emit('cash-updated', { cash: this.player.credits });
   ```

2. **XP System**: Used for player upgrades
   ```javascript
   // Process XP payment
   this.scene.xpManager.spendXP(upgrade.cost);
   ```

## Example Usage

```javascript
// In your scene's create method:
setupShopManager() {
  const rng = {
    pick: (array) => array[Math.floor(Math.random() * array.length)],
    range: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  };

  const weapon = {
    type: this.weaponType || 'Standard',
    damage: this.player.bulletDamage || 10,
    fireRate: this.player.fireRate || 0.1,
    pierce: this.player.bulletPierce || 1
  };

  this.shopManager = new ShopManager(this, this.player, weapon, rng);
}
```

## Troubleshooting

- **Shop doesn't open**: Ensure EventBus is properly listening for 'wave-completed'
- **Upgrades don't apply**: Check that UpgradeManager.applyUpgrade() correctly modifies properties
- **UI layout issues**: Verify that screen dimensions are properly passed to the createOverlay method

## Future Enhancements

- Support for special/legendary upgrade rarities
- Add persistent upgrade effects that stack across waves
- Implement special/limited-time offers between specific waves
- Add shop themes based on level environment