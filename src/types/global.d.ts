declare global {
  var testUtils: {
    createMockContext: () => any;
    createMockPersona: (name: string) => any;
    wait: (ms: number) => Promise<void>;
  };
}

export {};