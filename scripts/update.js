#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const component = args[0];

if (!component) {
  console.log('Usage: npm run update <component>');
  console.log('Available components:');
  console.log('  - calculations');
  console.log('  - validation');
  console.log('  - dashboard');
  console.log('  - forms');
  process.exit(1);
}

const componentMap = {
  calculations: 'src/utils/calculations.js',
  validation: 'src/utils/validation.js',
  dashboard: 'src/components/Dashboard.jsx',
  forms: 'src/components/FormSteps.jsx'
};

const filePath = componentMap[component];
if (!filePath) {
  console.log(`Unknown component: ${component}`);
  process.exit(1);
}

console.log(`Ready to update: ${filePath}`);
console.log('Share this file path with Claude to work on this component.');