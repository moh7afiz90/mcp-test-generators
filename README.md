# MCP React Test Generator

[![npm version](https://badge.fury.io/js/mcp-react-test-generator.svg)](https://badge.fury.io/js/mcp-react-test-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MCP React Test Generator** is a Model Context Protocol (MCP) server that automatically generates comprehensive test cases for React components using Jest and React Testing Library.

## 🚀 Features

- Automatic test generation for React components
- TypeScript support
- React Testing Library integration
- Props and event testing
- Accessibility testing
- MCP integration for AI assistants

## 📦 Installation

```bash
npm install -g mcp-react-test-generator
```

**Prerequisites:**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

## ⚙️ Configuration

Add to your Cursor MCP settings (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "react-test-generator": {
      "command": "/path/to/your/mcp-test-generator", // cloned project
      "args": [],
      "cwd": "/path/to/your/project"
    }
  }
}
```

## 🛠️ Usage

### Via AI Assistant

```
Generate tests for src/components/Button.tsx
Analyze component structure for src/components/Header.tsx
```

### API Tools

- **`analyze_component`** - Analyze React component structure
- **`generate_tests`** - Generate comprehensive test cases

## 📋 Generated Tests Include

- Component rendering
- Props validation
- Event handling
- Conditional rendering
- Accessibility tests

## 📄 Example

**Input:**
```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}>
    {label}
  </button>
);
```

**Generated Test:**
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../Button";

describe("Button Component", () => {
  it("should render and handle click", () => {
    const mockClick = jest.fn();
    render(<Button onClick={mockClick} label="Test" />);
    
    fireEvent.click(screen.getByRole("button"));
    expect(mockClick).toHaveBeenCalled();
  });
});
```