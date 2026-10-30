export const mockScenarios = ['standard', 'payment-declined', 'timeout-after-order', 'session-expired', 'slow', 'failure'] as const
export type MockScenario = (typeof mockScenarios)[number]
