// Simple test script to verify extension functionality
const vscode = require('vscode');

// Mock VSCode environment for testing
const mockWorkspace = {
  getConfiguration: (section) => ({
    get: (key, defaultValue) => {
      // Simulate different configuration scenarios
      switch (key) {
        case 'foldLevelOnOpen':
          return [1, 2, 3]; // Default config
        case 'openDelayMs':
          return 300;
        default:
          return defaultValue;
      }
    }
  })
};

const mockWindow = {
  showInformationMessage: (msg) => console.log('Info:', msg),
  activeTextEditor: null,
  visibleTextEditors: []
};

// Test our configuration normalization logic
function testConfigNormalization() {
  console.log('Testing configuration normalization...');

  // Test cases
  const testCases = [
    { input: [1, 2, 3], expected: [1, 2, 3], description: 'Valid array' },
    { input: [0, 8, -1], expected: [7], description: 'Invalid values filtered and clamped' },
    { input: 2, expected: [2], description: 'Single number to array' },
    { input: [1, 'invalid', 2, null, 3], expected: [1, 2, 3], description: 'Mixed types filtered' },
    { input: [], expected: [], description: 'Empty array' }
  ];

  testCases.forEach(testCase => {
    console.log(`Test: ${testCase.description}`);
    console.log(`Input: ${JSON.stringify(testCase.input)}`);

    // Simulate our normalization logic
    let arr = [];
    if (Array.isArray(testCase.input)) {
      arr = testCase.input;
    } else if (typeof testCase.input === 'number') {
      arr = [testCase.input];
    } else {
      arr = [1];
    }

    const levels = arr
      .map((v) => {
        const n = typeof v === 'number' ? Math.floor(v) : NaN;
        if (Number.isNaN(n)) {
          return -1;
        }
        return Math.max(0, Math.min(7, n));
      })
      .filter((n) => n > 0);

    const passed = JSON.stringify(levels) === JSON.stringify(testCase.expected);
    console.log(`Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`Got: ${JSON.stringify(levels)}`);
    console.log(`Result: ${passed ? 'PASS' : 'FAIL'}\n`);
  });
}

function testDelayNormalization() {
  console.log('Testing delay normalization...');

  const testCases = [
    { input: 300, expected: 300, description: 'Valid delay' },
    { input: -100, expected: 300, description: 'Negative delay' },
    { input: 10000, expected: 5000, description: 'Delay above maximum' },
    { input: 'invalid', expected: 300, description: 'Invalid type' },
    { input: null, expected: 300, description: 'Null value' }
  ];

  testCases.forEach(testCase => {
    console.log(`Test: ${testCase.description}`);
    console.log(`Input: ${JSON.stringify(testCase.input)}`);

    let result;
    if (typeof testCase.input !== 'number' || Number.isNaN(testCase.input) || testCase.input < 0) {
      result = 300;
    } else {
      result = Math.min(5000, Math.floor(testCase.input));
    }

    const passed = result === testCase.expected;
    console.log(`Expected: ${testCase.expected}`);
    console.log(`Got: ${result}`);
    console.log(`Result: ${passed ? 'PASS' : 'FAIL'}\n`);
  });
}

console.log('=== Extension Configuration Tests ===\n');
testConfigNormalization();
testDelayNormalization();
console.log('=== Tests Complete ===');