#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Example of using the Enhanced MCP React Test Generator with automatic test running
async function testGenerator() {
  console.log('🚀 Testing Enhanced MCP React Test Generator with Auto-Test Running...\n');

  // Path to the compiled server
  const serverPath = path.join(__dirname, 'dist', 'index.js');
  
  // Start the MCP server
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });

  // Example component with intentional issues for testing error fixing
  const exampleComponent = `
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: string;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  disabled = false, 
  size = 'medium',
  variant = 'primary',
  icon,
  loading = false
}) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={\`btn btn--\${size} btn--\${variant} \${loading ? 'btn--loading' : ''}\`}
      data-testid="button"
      aria-disabled={disabled || loading}
    >
      {loading && <span data-testid="loading-spinner">Loading...</span>}
      {icon && <span data-testid="icon" className="icon">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export default Button;
`;

  // Create a temporary component file for testing
  const componentDir = path.join(__dirname, 'src', 'components');
  const componentFile = path.join(componentDir, 'Button.tsx');
  
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }
  
  fs.writeFileSync(componentFile, exampleComponent);

  console.log('📝 Created sample component with complex props structure');
  console.log('🔧 This will test the automatic error fixing and iteration capabilities\n');

  // Test generating tests for the component
  const generateTestsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'generate_tests',
      arguments: {
        filePath: 'src/components/Button.tsx',
        projectRoot: __dirname
      }
    }
  };

  server.stdin.write(JSON.stringify(generateTestsRequest) + '\n');

  server.stdout.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.result && response.result.content) {
        const content = response.result.content[0].text;
        console.log('📊 Test Generation Results:');
        console.log('=' .repeat(60));
        console.log(content);
        console.log('=' .repeat(60));
        
        if (content.includes('✅ All tests passed')) {
          console.log('\n🎉 SUCCESS: Tests generated and passed automatically!');
        } else if (content.includes('⚠️')) {
          console.log('\n⚠️  PARTIAL SUCCESS: Tests generated with some warnings');
        } else {
          console.log('\n❌ Some issues were detected during test generation');
        }
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error parsing response:', error);
    }
  });

  server.stderr.on('data', (data) => {
    const message = data.toString();
    if (message.includes('🔄') || message.includes('🧪') || message.includes('❌')) {
      // This is expected output from the test iteration process
      console.log('🔧 Test Process:', message.trim());
    } else {
      console.error('Server error:', message);
    }
  });

  // Handle timeout
  setTimeout(() => {
    console.log('\n⏰ Test process completed!');
    console.log('📁 Check src/components/__tests__/Button.test.tsx for the generated tests');
    server.kill();
    process.exit(0);
  }, 30000); // Increased timeout for test running
}

// Run the test if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  testGenerator().catch(console.error);
}

export default testGenerator; 