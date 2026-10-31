export const mockScenarios = ['standard', 'empty', 'out-of-order', 'slow', 'failure', 'session-expired', 'payment-pending', 'payment-declined', 'timeout-after-order'] as const
export type MockScenario = (typeof mockScenarios)[number]
