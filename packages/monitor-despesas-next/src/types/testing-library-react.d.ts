declare module '@testing-library/react' {
  // Basic shims to satisfy TypeScript when running tsc directly.
  // Vitest runtime provides the real implementation during tests.
  export const render: (...args: any[]) => any
  export const screen: any
  export const fireEvent: any
  export const waitFor: any
  export const renderHook: (...args: any[]) => any
  export const cleanup: () => void
  export const within: (...args: any[]) => any
}

declare module '@testing-library/user-event' {
  export interface UserEventInstance {
    click: (...args: any[]) => Promise<void>
    type: (...args: any[]) => Promise<void>
    hover: (...args: any[]) => Promise<void>
    unhover: (...args: any[]) => Promise<void>
    tab: (...args: any[]) => Promise<void>
  }

  export interface UserEventModule extends UserEventInstance {
    setup: (...args: any[]) => UserEventInstance
    paste: (...args: any[]) => Promise<void>
    keyboard: (...args: any[]) => Promise<void>
    clear: (...args: any[]) => Promise<void>
  }

  const userEvent: UserEventModule
  export default userEvent
}
