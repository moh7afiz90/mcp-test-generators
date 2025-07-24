# MCP React Test Generator

[![npm version](https://badge.fury.io/js/mcp-react-test-generator.svg)](https://badge.fury.io/js/mcp-react-test-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MCP React Test Generator** is a Model Context Protocol (MCP) server that automatically generates comprehensive test cases for React components using Jest and React Testing Library. It integrates seamlessly with AI assistants like Cursor to provide intelligent test generation capabilities.

## 🚀 Features

- **Automatic Test Generation**: Analyzes React components and generates comprehensive test suites
- **TypeScript Support**: Full TypeScript analysis and test generation
- **React Testing Library**: Generates tests using modern testing practices
- **Accessibility Testing**: Includes keyboard navigation and ARIA attribute tests
- **Props Coverage**: Tests all component props including edge cases
- **Event Handling**: Comprehensive event handler testing
- **CSS Module Support**: Handles CSS modules and styling
- **MCP Integration**: Works with Cursor and other MCP-compatible AI assistants

## 📦 Installation

### Global Installation
```bash
npm install -g mcp-react-test-generator
```

### Local Installation
```bash
npm install --save-dev mcp-react-test-generator
```

### Prerequisites
Your project should have these dependencies:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

## ⚙️ Configuration

### For Cursor IDE

Add the following configuration to your Cursor MCP settings file (usually `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "react-test-generator": {
      "command": "mcp-react-test-generator",
      "args": [],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### For Local Usage

Create a configuration file or use the server directly:

```json
{
  "mcpServers": {
    "react-test-generator": {
      "command": "node",
      "args": ["/path/to/node_modules/mcp-react-test-generator/dist/index.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

## 🛠️ Usage

### Via MCP-Compatible AI Assistant

Once configured, you can use natural language commands:

```
Generate tests for src/components/common/button/index.tsx
Analyze the component at src/components/forms/input/TextField.tsx
Create comprehensive test cases for src/widgets/modal/Modal.tsx
```

### Direct API Usage

The server provides three main tools:

#### `analyze_component`
Analyze a React component to understand its structure:
```json
{
  "filePath": "src/components/common/button/index.tsx",
  "projectRoot": "/path/to/your/project"
}
```

#### `generate_tests`
Generate comprehensive test cases for a component:
```json
{
  "filePath": "src/components/common/button/index.tsx",
  "projectRoot": "/path/to/your/project",
  "outputPath": "src/components/__tests__/button.test.tsx"
}
```

#### `read_component`
Read and display component content:
```json
{
  "filePath": "src/components/common/button/index.tsx",
  "projectRoot": "/path/to/your/project"
}
```

### Programmatic Usage

```javascript
import { spawn } from 'child_process';

const server = spawn('mcp-react-test-generator', [], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: '/path/to/your/project'
});

// Send MCP request
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'generate_tests',
    arguments: {
      filePath: 'src/components/Button.tsx',
      projectRoot: process.cwd()
    }
  }
};

server.stdin.write(JSON.stringify(request) + '\n');
```

## 📋 Generated Test Structure

The server generates tests that include:

### Basic Tests
- Component rendering without crashing
- Default props validation
- Required props handling

### Props Tests
- Boolean prop toggling (e.g., `disabled`, `loading`)
- String prop display (e.g., `label`, `text`)
- Enum/Union type variations (e.g., `size="sm|md|lg"`)

### Event Tests
- Click handlers (`onClick`)
- Event prevention when disabled
- Custom event handlers

### Conditional Rendering
- Loading states
- Icon rendering
- Content variations

### Accessibility Tests
- Keyboard navigation support
- ARIA attributes
- Focus management

## 🏗️ Development

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-react-test-generator.git
cd mcp-react-test-generator
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Test locally:
```bash
npm start
```

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the server
npm start
```

## 📄 Example

### Input Component
```tsx
// src/components/Button.tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  label, onClick, disabled, size = 'md', theme = 'primary' 
}) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`button button--${size} button--${theme}`}
    >
      {label}
    </button>
  );
};
```

### Generated Test
```tsx
// src/components/__tests__/button.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "../src/components/Button";

describe("Button Component", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("should render Button component with label", () => {
    render(<Button onClick={mockOnClick} label="Test Button" />);
    
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Test Button")).toBeInTheDocument();
  });

  it("should call onClick handler when clicked", () => {
    render(<Button onClick={mockOnClick} label="Click Me" />);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  // ... more comprehensive tests
});
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/)

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/mcp-react-test-generator/issues) page
2. Create a new issue with detailed information
3. For urgent matters, contact [your.email@example.com](mailto:your.email@example.com)

---

**Made with ❤️ for the React testing community** 