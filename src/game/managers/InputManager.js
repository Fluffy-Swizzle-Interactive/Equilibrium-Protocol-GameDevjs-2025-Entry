import Phaser from 'phaser'

/**
 * Named input actions. Use these constants when calling isDown() or justDown().
 */
export const INPUT_ACTIONS = {
  MOVE_UP:    'MOVE_UP',
  MOVE_DOWN:  'MOVE_DOWN',
  MOVE_LEFT:  'MOVE_LEFT',
  MOVE_RIGHT: 'MOVE_RIGHT',
  PAUSE:      'PAUSE',
  DASH:       'DASH',
  SHIELD:     'SHIELD',
}

const GAMEPAD_DEADZONE = 0.5

/**
 * Abstracts keyboard and gamepad input behind named actions.
 * Created once per WaveGame scene. Player reads from scene.inputManager.
 */
export class InputManager {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene
    const K = Phaser.Input.Keyboard.KeyCodes

    /** @type {Record<string, Phaser.Input.Keyboard.Key>} */
    this.keys = {
      [INPUT_ACTIONS.MOVE_UP]:    scene.input.keyboard.addKey(K.W),
      [INPUT_ACTIONS.MOVE_DOWN]:  scene.input.keyboard.addKey(K.S),
      [INPUT_ACTIONS.MOVE_LEFT]:  scene.input.keyboard.addKey(K.A),
      [INPUT_ACTIONS.MOVE_RIGHT]: scene.input.keyboard.addKey(K.D),
      [INPUT_ACTIONS.PAUSE]:      scene.input.keyboard.addKey(K.SPACE),
      [INPUT_ACTIONS.DASH]:       scene.input.keyboard.addKey(K.Q),
      [INPUT_ACTIONS.SHIELD]:     scene.input.keyboard.addKey(K.E),
    }

    scene.input.gamepad.once('connected', (pad) => {
      console.log('[InputManager] Gamepad connected:', pad.id)
    })
  }

  /**
   * Returns true while the action is held (keyboard OR gamepad).
   * @param {string} action - One of INPUT_ACTIONS values
   * @returns {boolean}
   */
  isDown(action) {
    if (this.keys[action]?.isDown) return true
    return this._isGamepadActionDown(action)
  }

  /**
   * Returns true only on the first frame the action is pressed.
   * @param {string} action - One of INPUT_ACTIONS values
   * @returns {boolean}
   */
  justDown(action) {
    const keyJustDown = this.keys[action]
      ? Phaser.Input.Keyboard.JustDown(this.keys[action])
      : false
    if (keyJustDown) return true
    return this._isGamepadActionDown(action)
  }

  /**
   * @private
   */
  _isGamepadActionDown(action) {
    const pad = this.scene.input.gamepad?.getPad(0)
    if (!pad) return false

    switch (action) {
      case INPUT_ACTIONS.MOVE_UP:
        return pad.up || pad.leftStick.y < -GAMEPAD_DEADZONE
      case INPUT_ACTIONS.MOVE_DOWN:
        return pad.down || pad.leftStick.y > GAMEPAD_DEADZONE
      case INPUT_ACTIONS.MOVE_LEFT:
        return pad.left || pad.leftStick.x < -GAMEPAD_DEADZONE
      case INPUT_ACTIONS.MOVE_RIGHT:
        return pad.right || pad.leftStick.x > GAMEPAD_DEADZONE
      case INPUT_ACTIONS.PAUSE:
        return pad.isButtonDown(9)  // Start / Menu
      case INPUT_ACTIONS.DASH:
        return pad.isButtonDown(0)  // A / Cross
      case INPUT_ACTIONS.SHIELD:
        return pad.isButtonDown(1)  // B / Circle
      default:
        return false
    }
  }
}
