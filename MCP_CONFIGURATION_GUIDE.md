# MCP Configuration Guide

This guide helps you manage and troubleshoot your MCP (Model Context Protocol) server configuration.

## 📁 Configuration File Location

Your MCP configuration is located at:
```
~/.cursor/mcp.json
```

## 🔧 Configuration Structure

```json
{
  "mcpServers": {
    "server-name": {
      "command": "executable-command",
      "args": ["path/to/server", "additional-args"],
      "cwd": "/working/directory"
    }
  }
}
```

## 🎯 Current Configuration Explained

### test-generator Server

```json
"test-generator": {
  "command": "node",                    // Use Node.js to run the server
  "args": ["/path/to/dist/index.js"],   // Path to compiled TypeScript server
  "cwd": "/path/to/mcp-test-generator"  // Working directory for file resolution
}
```

### Why These Settings?

- **command: "node"**: The server is written in TypeScript, compiled to JavaScript
- **args**: Points to the compiled `index.js` file in the `dist/` directory
- **cwd**: Ensures relative file paths work correctly within the server

## 🚀 Usage in Cursor

Once configured, you can use these commands in Cursor:

```
Generate tests for src/components/common/button/index.tsx
Analyze the component at src/components/forms/input/TextField.tsx
Create test cases for src/widgets/modal/Modal.tsx
```

## 🔍 Troubleshooting

### Server Not Found

**Issue**: `command not found` or server fails to start

**Solutions**:
1. Verify the path in `args` is correct:
   ```bash
   ls /Users/m.elhag/Desktop/SallaApps/ui-store-ticketing-system/mcp-test-generator/dist/index.js
   ```

2. Ensure the file is executable:
   ```bash
   chmod +x /path/to/dist/index.js
   ```

3. Test the server manually:
   ```bash
   cd /path/to/mcp-test-generator
   node dist/index.js
   ```

### Build Issues

**Issue**: Server starts but doesn't work properly

**Solutions**:
1. Rebuild the TypeScript:
   ```bash
   cd mcp-test-generator
   npm run build
   ```

2. Check for TypeScript errors:
   ```bash
   npm run build 2>&1 | grep error
   ```

### Path Resolution Problems

**Issue**: Server can't find component files

**Solutions**:
1. Ensure `cwd` points to the correct directory
2. Use absolute paths for component analysis
3. Verify the project structure matches expected paths

## 🔄 After Deployment Changes

If you deploy the package to npm and want to use the global installation:

### Update Configuration

```json
{
  "mcpServers": {
    "test-generator": {
      "command": "mcp-react-test-generator",  // Use global command
      "args": [],                             // No args needed
      "cwd": "/path/to/your/react/project"    // Your project directory
    }
  }
}
```

### Benefits of Global Installation

- Simpler configuration
- Works from any project
- Automatic updates via npm
- No need to manage local paths

## 📋 Configuration Best Practices

### 1. Use Descriptive Names

```json
"react-test-generator": {  // Clear, descriptive name
  // configuration...
}
```

### 2. Add Comments

```json
{
  // Comments help explain complex configurations
  "mcpServers": {
    // Server for React component test generation
    "test-generator": {
      // configuration...
    }
  }
}
```

### 3. Keep Paths Absolute

```json
{
  "args": ["/full/path/to/server.js"],  // ✅ Good
  "args": ["./relative/path.js"]        // ❌ May break
}
```

### 4. Test Configuration Changes

After modifying the configuration:
1. Restart Cursor
2. Test with a simple command
3. Check Cursor's developer console for errors

## 🔧 Multiple Servers Example

```json
{
  "mcpServers": {
    // React test generation
    "react-test-generator": {
      "command": "mcp-react-test-generator",
      "args": [],
      "cwd": "/path/to/react/project"
    },
    
    // Python code analysis (example)
    "python-analyzer": {
      "command": "python",
      "args": ["/path/to/python-mcp-server.py"],
      "cwd": "/path/to/python/project"
    },
    
    // Custom documentation generator (example)
    "doc-generator": {
      "command": "node",
      "args": ["/path/to/doc-server/dist/index.js"],
      "cwd": "/path/to/doc-server"
    }
  }
}
```

## 📞 Support

If you encounter issues:

1. Check the server logs in Cursor's developer console
2. Test the server manually from the command line
3. Verify all paths and permissions
4. Restart Cursor after configuration changes

---

**Happy coding with your MCP React Test Generator!** 🚀 