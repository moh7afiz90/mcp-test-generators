#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { ComponentAnalyzer } from './component-analyzer.js';
import { TestGenerator } from './test-generator.js';

interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

class TestGeneratorServer {
  private componentAnalyzer: ComponentAnalyzer;
  private testGenerator: TestGenerator;

  constructor() {
    this.componentAnalyzer = new ComponentAnalyzer();
    this.testGenerator = new TestGenerator();
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: [
                {
                  name: 'analyze_component',
                  description: 'Analyze a React component file to extract its structure and props',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      filePath: {
                        type: 'string',
                        description: 'Path to the component file (e.g., src/components/common/button/index.tsx)',
                      },
                      projectRoot: {
                        type: 'string',
                        description: 'Root directory of the project',
                      },
                    },
                    required: ['filePath', 'projectRoot'],
                  },
                },
                {
                  name: 'generate_tests',
                  description: 'Generate comprehensive test cases for a React component',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      filePath: {
                        type: 'string',
                        description: 'Path to the component file',
                      },
                      projectRoot: {
                        type: 'string',
                        description: 'Root directory of the project',
                      },
                      outputPath: {
                        type: 'string',
                        description: 'Optional custom output path for the test file',
                      },
                    },
                    required: ['filePath', 'projectRoot'],
                  },
                },
                {
                  name: 'read_component',
                  description: 'Read and display the content of a component file',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      filePath: {
                        type: 'string',
                        description: 'Path to the component file',
                      },
                      projectRoot: {
                        type: 'string',
                        description: 'Root directory of the project',
                      },
                    },
                    required: ['filePath', 'projectRoot'],
                  },
                },
              ],
            },
          };

        case 'tools/call':
          return await this.handleToolCall(request);

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        },
      };
    }
  }

  private async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'analyze_component':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: await this.analyzeComponent(args.filePath, args.projectRoot),
        };

      case 'generate_tests':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: await this.generateTests(args.filePath, args.projectRoot, args.outputPath),
        };

      case 'read_component':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: await this.readComponent(args.filePath, args.projectRoot),
        };

      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Unknown tool: ${name}`,
          },
        };
    }
  }

  private async analyzeComponent(filePath: string, projectRoot: string) {
    const fullPath = path.resolve(projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Component file not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const analysis = this.componentAnalyzer.analyze(content, filePath);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  private async generateTests(filePath: string, projectRoot: string, outputPath?: string) {
    const fullPath = path.resolve(projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Component file not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const analysis = this.componentAnalyzer.analyze(content, filePath);
    let testCode = this.testGenerator.generate(analysis, filePath);

    // Determine output path
    const testFilePath = outputPath 
      ? path.resolve(projectRoot, outputPath)
      : this.getDefaultTestPath(fullPath, projectRoot);

    // Ensure test directory exists
    const testDir = path.dirname(testFilePath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    let iteration = 1;
    const maxIterations = 5;
    let allTestsPassed = false;
    let finalResult = '';

    while (!allTestsPassed && iteration <= maxIterations) {
      console.error(`🔄 Test iteration ${iteration}/${maxIterations}`);
      
      // Write current test file
      fs.writeFileSync(testFilePath, testCode, 'utf-8');

      // Run tests and check for errors
      const testResult = await this.runTests(testFilePath, projectRoot);
      
      if (testResult.success) {
        allTestsPassed = true;
        finalResult = `✅ All tests passed on iteration ${iteration}!\n\n${testCode}`;
      } else {
        console.error(`❌ Test iteration ${iteration} failed. Attempting to fix errors...`);
        
        // Try to fix the test code based on errors
        const fixedCode = await this.fixTestErrors(testCode, testResult.errors, analysis, filePath);
        
        if (fixedCode === testCode) {
          // No changes made, break to avoid infinite loop
          finalResult = `⚠️ Could not automatically fix test errors after ${iteration} iterations.\n\nLast errors:\n${testResult.errors}\n\n${testCode}`;
          break;
        }
        
        testCode = fixedCode;
        iteration++;
      }
    }

    if (!allTestsPassed && iteration > maxIterations) {
      finalResult = `⚠️ Maximum iterations (${maxIterations}) reached. Some tests may still have issues.\n\n${testCode}`;
    }

    // Write final test file
    fs.writeFileSync(testFilePath, testCode, 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: `📁 Test file generated at: ${testFilePath}\n\n${finalResult}`,
        },
      ],
    };
  }

  private async runTests(testFilePath: string, projectRoot: string): Promise<{success: boolean, errors: string, output: string}> {
    return new Promise((resolve) => {
      // Try different test commands in order of preference
      const testCommands = [
        ['npx', 'jest', testFilePath, '--no-coverage', '--verbose'],
        ['npm', 'test', '--', testFilePath],
        ['npx', 'vitest', 'run', testFilePath],
        ['yarn', 'test', testFilePath]
      ];

      let commandIndex = 0;

      const tryNextCommand = () => {
        if (commandIndex >= testCommands.length) {
          resolve({
            success: false,
            errors: 'No suitable test runner found. Please ensure Jest, Vitest, or npm test is available.',
            output: ''
          });
          return;
        }

        const [command, ...args] = testCommands[commandIndex];
        console.error(`🧪 Running: ${command} ${args.join(' ')}`);

        const testProcess = spawn(command, args, {
          cwd: projectRoot,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        testProcess.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        testProcess.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        testProcess.on('close', (code) => {
          const output = stdout + stderr;
          
          if (code === 0) {
            resolve({
              success: true,
              errors: '',
              output: output
            });
          } else if (output.includes('command not found') || output.includes('is not recognized')) {
            // Command not available, try next one
            commandIndex++;
            tryNextCommand();
          } else {
            resolve({
              success: false,
              errors: output,
              output: output
            });
          }
        });

        testProcess.on('error', (error) => {
          // Command failed to start, try next one
          commandIndex++;
          tryNextCommand();
        });
      };

      tryNextCommand();
    });
  }

     private async fixTestErrors(testCode: string, errors: string, analysis: any, filePath: string): Promise<string> {
     let fixedCode = testCode;

    // Apply fixes for Jest configuration errors
    if (errors.includes('Unknown option "moduleNameMapping"') || errors.includes('jest-environment-jsdom cannot be found')) {
      console.error('🔧 Detected Jest configuration issues - these should be fixed in package.json');
      // These are configuration issues, not test code issues
      return fixedCode;
    }

    // Apply fixes for JSX configuration errors
    if (errors.includes('--jsx') && errors.includes('is not set')) {
      console.error('🔧 Detected JSX configuration issues - updating Jest globals');
      // These are configuration issues that need to be handled in Jest config
      return fixedCode;
    }

    // Apply fixes for double-quoted prop values (e.g., "'small'" -> "small")
    if (errors.includes('is not assignable to type') && errors.includes('Did you mean')) {
      console.error('🔧 Fixing prop value syntax issues');
      // Fix double quotes in prop values
      fixedCode = fixedCode.replace(/="'([^']+)'"/g, '="$1"');
    }

    // Apply fixes for arrow function syntax errors
    if (errors.includes('Identifier expected') && errors.includes('onClick={() => {}}')) {
      console.error('🔧 Fixing arrow function syntax');
      // Fix arrow function syntax in JSX
      fixedCode = fixedCode.replace(/onClick={() => {}}/g, 'onClick={() => {}}');
      // Fix the malformed arrow function
      fixedCode = fixedCode.replace(/onClick={, () => {}}/g, 'onClick={() => {}}');
      fixedCode = fixedCode.replace(/onClick={() => ,}/g, 'onClick={() => {}}');
    }

    // Apply fixes for missing imports
    if (errors.includes('Cannot find module')) {
      const moduleMatches = errors.match(/Cannot find module.*['"]([^'"]+)['"]/g);
      if (moduleMatches) {
        for (const match of moduleMatches) {
          const moduleNameMatch = match.match(/['"]([^'"]+)['"]/);
          if (moduleNameMatch && moduleNameMatch[1].startsWith('.')) {
            const correctImport = this.testGenerator.getImportPath(filePath);
            fixedCode = fixedCode.replace(
              /import.*from ["']([^"']+)["']/,
              `import { ${analysis.componentName} } from "${correctImport}"`
            );
          }
        }
      }
    }

    // Apply fixes for component not found in exports
    if (errors.includes('was not found')) {
      const exportMatches = errors.match(/export '([^']+)' \(imported as '([^']+)'\) was not found/g);
      if (exportMatches) {
        for (const match of exportMatches) {
          const parts = match.match(/export '([^']+)' \(imported as '([^']+)'\) was not found/);
          if (parts) {
            const importName = parts[2];
            const importRegex = new RegExp(`import\\s*{[^}]*${importName}[^}]*}\\s*from`, 'g');
            fixedCode = fixedCode.replace(importRegex, `import ${importName} from`);
          }
        }
      }
    }

    // Apply fixes for getByRole element not found
    if (errors.includes('Unable to find an element with the role')) {
      const roleMatches = errors.match(/Unable to find an element with the role "([^"]+)"/g);
      if (roleMatches) {
        for (const match of roleMatches) {
          const roleMatch = match.match(/"([^"]+)"/);
          if (roleMatch) {
            const role = roleMatch[1];
            const roleQuery = `screen.getByRole("${role}")`;
            const testIdQuery = 'screen.getByTestId("button")';
            fixedCode = fixedCode.replace(new RegExp(roleQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), testIdQuery);
          }
        }
      }
    }

    // Apply fixes for missing required props
    if (errors.includes('Property') && errors.includes('is missing in type')) {
      const propMatches = errors.match(/Property '([^']+)' is missing in type/g);
      if (propMatches) {
        for (const match of propMatches) {
          const propMatch = match.match(/Property '([^']+)' is missing in type/);
          if (propMatch) {
            const propName = propMatch[1];
            const propsMatch = fixedCode.match(/render\(<[^>]+\s+([^>]*)\s*\/?>/) || fixedCode.match(/render\(<[^>]+\s+([^>]*)\s*>[^<]*<\/[^>]+>/);
            if (propsMatch && !propsMatch[1].includes(propName)) {
              const existingProps = propsMatch[1];
              const defaultValue = this.getDefaultPropValue(propName);
              const newProps = existingProps ? `${existingProps} ${propName}=${defaultValue}` : `${propName}=${defaultValue}`;
              fixedCode = fixedCode.replace(propsMatch[1], newProps);
            }
          }
        }
      }
    }

    // Apply fixes for incorrect class expectations
    if (errors.includes('toHaveClass') && errors.includes('Expected')) {
      // Replace generic class expectations with more specific ones based on actual component structure
      fixedCode = fixedCode.replace(/expect\(element\)\.toHaveClass\("disabled"\);/g, 'expect(element).toBeDisabled();');
      fixedCode = fixedCode.replace(/expect\(element\)\.toHaveClass\("loading"\);/g, 'expect(element).toHaveAttribute("aria-disabled", "true");');
      
      // Fix size and variant class expectations
      fixedCode = fixedCode.replace(/expect\(element\)\.toHaveClass\("size--([^"]+)"\);/g, 'expect(element).toHaveClass("btn--$1");');
      fixedCode = fixedCode.replace(/expect\(element\)\.toHaveClass\("variant--([^"]+)"\);/g, 'expect(element).toHaveClass("btn--$1");');
    }

    // Apply fixes for getByText not finding elements
    if (errors.includes('Unable to find an element with the text')) {
      // Replace text queries with more robust selectors
      fixedCode = fixedCode.replace(/screen\.getByText\(test([A-Z][a-z]+)\)/g, 'screen.getByTestId("$1".toLowerCase())');
    }

    // Apply fixes for getByRole status not found (loading indicators)
    if (errors.includes('Unable to find an element with the role "status"')) {
      fixedCode = fixedCode.replace(/screen\.getByRole\("status", \{ hidden: true \}\)/g, 'screen.getByTestId("loading-spinner")');
    }

    // Apply fixes for icon element queries
    if (errors.includes('Unable to find an element with the role "img"')) {
      fixedCode = fixedCode.replace(/screen\.getByRole\("img", \{ hidden: true \}\) \|\| screen\.getByTestId\("icon"\)/g, 'screen.getByTestId("icon")');
    }

    return fixedCode;
  }

  private getDefaultPropValue(propName: string): string {
    switch (propName) {
      case 'onClick':
      case 'onSubmit':
      case 'onChange':
        return '{() => {}}';
      case 'children':
        return '{"Test Content"}';
      case 'label':
      case 'title':
      case 'text':
        return `"Test ${propName}"`;
      case 'disabled':
      case 'loading':
      case 'visible':
        return '';
      default:
        if (propName.startsWith('on')) return '{() => {}}';
        return `"test-${propName}"`;
    }
  }

  private async readComponent(filePath: string, projectRoot: string) {
    const fullPath = path.resolve(projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Component file not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: `Content of ${filePath}:\n\n${content}`,
        },
      ],
    };
  }



  private getDefaultTestPath(componentPath: string, projectRoot: string): string {
    const relativePath = path.relative(projectRoot, componentPath);
    const parsedPath = path.parse(relativePath);
    
    // Convert src/components/common/button/index.tsx -> src/components/common/button/__tests__/index.test.tsx
    // Or src/components/Button.tsx -> src/components/__tests__/Button.test.tsx
    const dir = parsedPath.dir;
    const fileName = parsedPath.name;
    const ext = parsedPath.ext.replace(/\.tsx?$/, ''); // Remove .ts or .tsx extension
    
    const testFileName = `${fileName}.test.tsx`;
    const testDir = path.join(projectRoot, dir, '__tests__');
    
    return path.join(testDir, testFileName);
  }

  async run() {
    console.error('MCP Test Generator Server running on stdio');
    
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    
         process.stdin.on('data', async (chunk: string) => {
      buffer += chunk;
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const request: MCPRequest = JSON.parse(line);
            const response = await this.handleRequest(request);
            process.stdout.write(JSON.stringify(response) + '\n');
          } catch (error) {
            console.error('Error parsing request:', error);
          }
        }
      }
    });

    process.stdin.on('end', () => {
      console.error('MCP Test Generator Server shutting down');
      process.exit(0);
    });
  }
}

const server = new TestGeneratorServer();
server.run().catch(console.error); 