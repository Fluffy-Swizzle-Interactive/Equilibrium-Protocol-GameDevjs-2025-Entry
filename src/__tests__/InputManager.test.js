import { InputManager, INPUT_ACTIONS } from '../game/managers/InputManager'

function makeMockKey(isDown = false) {
  return { isDown }
}

function makeMockScene(keyStates = {}) {
  const defaultState = {
    [INPUT_ACTIONS.MOVE_UP]: false,
    [INPUT_ACTIONS.MOVE_DOWN]: false,
    [INPUT_ACTIONS.MOVE_LEFT]: false,
    [INPUT_ACTIONS.MOVE_RIGHT]: false,
    [INPUT_ACTIONS.PAUSE]: false,
    [INPUT_ACTIONS.DASH]: false,
    [INPUT_ACTIONS.SHIELD]: false,
  }
  const state = { ...defaultState, ...keyStates }

  return {
    input: {
      keyboard: {
        addKey: vi.fn((keyCode) => {
          const codeMap = {
            87: INPUT_ACTIONS.MOVE_UP,
            83: INPUT_ACTIONS.MOVE_DOWN,
            65: INPUT_ACTIONS.MOVE_LEFT,
            68: INPUT_ACTIONS.MOVE_RIGHT,
            32: INPUT_ACTIONS.PAUSE,
            81: INPUT_ACTIONS.DASH,
            69: INPUT_ACTIONS.SHIELD,
          }
          const action = codeMap[keyCode]
          return makeMockKey(state[action] || false)
        }),
      },
      gamepad: {
        once: vi.fn(),
        getPad: vi.fn().mockReturnValue(null),
      },
    },
  }
}

vi.mock('phaser', () => ({
  default: {
    Input: {
      Keyboard: {
        KeyCodes: { W: 87, S: 83, A: 65, D: 68, SPACE: 32, Q: 81, E: 69 },
        JustDown: vi.fn((key) => key._justDown || false),
      },
    },
  },
}), { virtual: true })

describe('InputManager', () => {
  it('reports MOVE_UP as down when W is held', () => {
    const scene = makeMockScene({ [INPUT_ACTIONS.MOVE_UP]: true })
    const input = new InputManager(scene)
    expect(input.isDown(INPUT_ACTIONS.MOVE_UP)).toBe(true)
  })

  it('reports MOVE_UP as not down when no keys held', () => {
    const scene = makeMockScene()
    const input = new InputManager(scene)
    expect(input.isDown(INPUT_ACTIONS.MOVE_UP)).toBe(false)
  })

  it('reports false for unknown action', () => {
    const scene = makeMockScene()
    const input = new InputManager(scene)
    expect(input.isDown('NONEXISTENT')).toBe(false)
  })

  it('does not throw when no gamepad is connected', () => {
    const scene = makeMockScene()
    const input = new InputManager(scene)
    expect(() => input.isDown(INPUT_ACTIONS.MOVE_UP)).not.toThrow()
  })
})
