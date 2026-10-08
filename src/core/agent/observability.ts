export type AgentToolEvent =
  | {
      type: 'tool-start';
      name: string;
      input: unknown;
    }
  | {
      type: 'tool-end';
      name: string;
      input: unknown;
      success: boolean;
      durationMs: number;
      data?: unknown;
      error?: string;
    };

export interface AgentObserver {
  onToolEvent(event: AgentToolEvent): void;
}

export const noopAgentObserver: AgentObserver = {
  onToolEvent: () => undefined,
};
