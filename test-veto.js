// Quick test to debug veto condition
const { ConflictResolver } = require('./dist/extensions/conflict-resolver/ConflictResolver');
const { PriorityMatrix } = require('./dist/extensions/conflict-resolver/PriorityMatrix');

const mockLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {}
};

async function testVeto() {
  const resolver = new ConflictResolver(mockLogger);
  const matrix = new PriorityMatrix();
  
  console.log('Security veto conditions:', matrix.getVetoConditions('security'));
  
  const personas = [
    { name: 'security' },
    { name: 'performance' }
  ];
  
  const context = {
    command: '/sc:deploy --skip-validation',
    flags: { skipValidation: true }
  };
  
  const result = await resolver.resolve(
    context.command,
    personas,
    context
  );
  
  console.log('Result strategy:', result.strategy);
  console.log('Result personas:', result.personas);
  console.log('Conflicts:', result.conflicts);
}

testVeto().catch(console.error);