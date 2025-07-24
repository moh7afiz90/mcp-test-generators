import { ComponentAnalysis, PropDefinition } from './component-analyzer.js';

export class TestGenerator {
  generate(analysis: ComponentAnalysis, filePath: string): string {
    const componentName = analysis.componentName;
    const importPath = this.getImportPath(filePath);
    
    const testCases = this.generateTestCases(analysis);
    
    return this.buildTestFile(componentName, importPath, testCases, analysis);
  }

  public getImportPath(filePath: string): string {
    // Convert file path to import path for __tests__ directory structure
    // e.g., src/components/common/button/index.tsx -> ../index (when test is in src/components/common/button/__tests__/)
    // e.g., src/components/Button.tsx -> ../Button (when test is in src/components/__tests__/)
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const fileNameWithoutExt = fileName.replace(/\.(tsx?|jsx?)$/, '');
    
    // The test file will be in a __tests__ subdirectory, so we need to go up one level
    // and then reference the component file
    return `../${fileNameWithoutExt}`;
  }

  private generateTestCases(analysis: ComponentAnalysis): TestCase[] {
    const testCases: TestCase[] = [];
    
    // Basic rendering test
    testCases.push(this.createBasicRenderTest(analysis));
    
    // Props-based tests
    analysis.props.forEach(prop => {
      testCases.push(...this.createPropTests(prop, analysis));
    });
    
    // Event handler tests
    const eventProps = analysis.props.filter(prop => 
      prop.name.startsWith('on') || prop.type.includes('() => void')
    );
    
    eventProps.forEach(prop => {
      testCases.push(...this.createEventTests(prop, analysis));
    });
    
    // Conditional rendering tests
    testCases.push(...this.createConditionalRenderingTests(analysis));
    
    // Accessibility tests
    testCases.push(...this.createAccessibilityTests(analysis));
    
    return testCases;
  }

  private createBasicRenderTest(analysis: ComponentAnalysis): TestCase {
    const requiredProps = analysis.props
      .filter(prop => !prop.optional)
      .map(prop => {
        if (prop.type.includes('() => void')) {
          return `${prop.name}={() => {}}`;
        }
        return this.getDefaultPropValue(prop);
      })
      .join(' ');

    return {
      name: `should render ${analysis.componentName} component`,
      description: `Test that the ${analysis.componentName} component renders without crashing`,
      code: `
    it("should render ${analysis.componentName} component", () => {
        render(<${analysis.componentName} ${requiredProps} />);
        
        expect(screen.getByRole("${this.getExpectedRole(analysis)}")).toBeInTheDocument();
    });`
    };
  }

  private createPropTests(prop: PropDefinition, analysis: ComponentAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    
    // Test for boolean props
    if (prop.type === 'boolean') {
      tests.push({
        name: `should handle ${prop.name} prop`,
        description: `Test that the ${prop.name} boolean prop works correctly`,
        code: `
    it("should handle ${prop.name} prop", () => {
        const requiredProps = ${this.getRequiredPropsObject(analysis)};
        
        render(<${analysis.componentName} {...requiredProps} ${prop.name} />);
        
        const element = screen.getByRole("${this.getExpectedRole(analysis)}");
        expect(element).toHaveClass("${this.getExpectedClassName(prop.name)}");
    });`
      });
    }
    
    // Test for string props
    if (prop.type === 'string') {
      tests.push({
        name: `should display correct ${prop.name}`,
        description: `Test that the ${prop.name} string prop displays correctly`,
        code: `
    it("should display correct ${prop.name}", () => {
        const test${this.capitalize(prop.name)} = "Test ${prop.name}";
        const requiredProps = ${this.getRequiredPropsObject(analysis)};
        
        render(<${analysis.componentName} {...requiredProps} ${prop.name}={test${this.capitalize(prop.name)}} />);
        
        expect(screen.getByText(test${this.capitalize(prop.name)})).toBeInTheDocument();
    });`
      });
    }
    
    // Test for enum/union types
    if (prop.type.includes('|')) {
      const values = prop.type.split('|').map(v => v.trim().replace(/['"]/g, ''));
      values.forEach(value => {
        tests.push({
          name: `should handle ${prop.name} as ${value}`,
          description: `Test that the ${prop.name} prop works with ${value} value`,
          code: `
    it("should handle ${prop.name} as ${value}", () => {
        const requiredProps = ${this.getRequiredPropsObject(analysis)};
        
        render(<${analysis.componentName} {...requiredProps} ${prop.name}="${value}" />);
        
        const element = screen.getByRole("${this.getExpectedRole(analysis)}");
        expect(element).toHaveClass("${this.getExpectedClassName(prop.name + '--' + value)}");
    });`
        });
      });
    }
    
    return tests;
  }

  private createEventTests(prop: PropDefinition, analysis: ComponentAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    
    if (prop.name === 'onClick') {
      tests.push({
        name: 'should call onClick handler when clicked',
        description: 'Test that the onClick handler is called when the component is clicked',
        code: `
    it("should call onClick handler when clicked", () => {
        const handleClick = jest.fn();
        const requiredProps = ${this.getRequiredPropsObject(analysis, { onClick: 'handleClick' })};
        
        render(<${analysis.componentName} {...requiredProps} onClick={handleClick} />);
        
        const element = screen.getByRole("${this.getExpectedRole(analysis)}");
        fireEvent.click(element);
        
        expect(handleClick).toHaveBeenCalledTimes(1);
    });`
      });
      
      // Test disabled state doesn't trigger onClick
      const hasDisabled = analysis.props.some(p => p.name === 'disabled');
      if (hasDisabled) {
        tests.push({
          name: 'should not call onClick when disabled',
          description: 'Test that the onClick handler is not called when the component is disabled',
          code: `
    it("should not call onClick when disabled", () => {
        const handleClick = jest.fn();
        const requiredProps = ${this.getRequiredPropsObject(analysis, { onClick: 'handleClick' })};
        
        render(<${analysis.componentName} {...requiredProps} onClick={handleClick} disabled />);
        
        const element = screen.getByRole("${this.getExpectedRole(analysis)}");
        fireEvent.click(element);
        
        expect(handleClick).not.toHaveBeenCalled();
    });`
        });
      }
    }
    
    return tests;
  }

  private createConditionalRenderingTests(analysis: ComponentAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    
    // Test loading state if it exists
    const hasLoading = analysis.props.some(prop => prop.name === 'loading');
    if (hasLoading) {
      tests.push({
        name: 'should show loading state',
        description: 'Test that the loading state is displayed correctly',
        code: `
    it("should show loading state", () => {
        const requiredProps = ${this.getRequiredPropsObject(analysis)};
        
        render(<${analysis.componentName} {...requiredProps} loading />);
        
        expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
    });`
      });
    }
    
    // Test icon rendering if it exists
    const hasIcon = analysis.props.some(prop => prop.name === 'icon');
    if (hasIcon) {
      tests.push({
        name: 'should render with icon',
        description: 'Test that the icon is rendered when provided',
        code: `
    it("should render with icon", () => {
        const requiredProps = ${this.getRequiredPropsObject(analysis)};
        
        render(<${analysis.componentName} {...requiredProps} icon="test-icon" />);
        
        const iconElement = screen.getByRole("img", { hidden: true }) || screen.getByTestId("icon");
        expect(iconElement).toBeInTheDocument();
    });`
      });
    }
    
    return tests;
  }

  private createAccessibilityTests(analysis: ComponentAnalysis): TestCase[] {
    const tests: TestCase[] = [];
    
    // Test keyboard navigation
    tests.push({
      name: 'should be accessible via keyboard',
      description: 'Test that the component supports keyboard navigation',
      code: `
    it("should be accessible via keyboard", () => {
        const requiredProps = ${this.getRequiredPropsObject(analysis)};
        
        render(<${analysis.componentName} {...requiredProps} />);
        
        const element = screen.getByRole("${this.getExpectedRole(analysis)}");
        expect(element).not.toHaveAttribute("tabIndex", "-1");
    });`
    });
    
    // Test ARIA attributes
    const hasDisabled = analysis.props.some(prop => prop.name === 'disabled');
    if (hasDisabled) {
      tests.push({
        name: 'should have correct aria-disabled when disabled',
        description: 'Test that aria-disabled is set correctly when disabled',
        code: `
    it("should have correct aria-disabled when disabled", () => {
        const requiredProps = ${this.getRequiredPropsObject(analysis)};
        
        render(<${analysis.componentName} {...requiredProps} disabled />);
        
        const element = screen.getByRole("${this.getExpectedRole(analysis)}");
        expect(element).toBeDisabled();
    });`
      });
    }
    
    return tests;
  }

  private buildTestFile(
    componentName: string,
    importPath: string,
    testCases: TestCase[],
    analysis: ComponentAnalysis
  ): string {
    const imports = this.generateImports(importPath, componentName);
    const testSuite = testCases.map(test => test.code).join('\n');
    
    return `${imports}

/**
 * Test suite for the ${componentName} component.
 */
describe("${componentName} Component", () => {${testSuite}
});
`;
  }

  private generateImports(importPath: string, componentName: string): string {
    return `import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ${componentName} } from "${importPath}";`;
  }

  private getRequiredPropsObject(analysis: ComponentAnalysis, overrides: Record<string, string> = {}): string {
    const requiredProps = analysis.props.filter(prop => !prop.optional);
    
    if (requiredProps.length === 0) {
      return '{}';
    }
    
    const props = requiredProps.map(prop => {
      const value = overrides[prop.name] || this.getDefaultPropValue(prop, false);
      if (prop.type.includes('() => void')) {
        return `${prop.name}: () => {}`;
      }
      if (prop.type === 'boolean') {
        return `${prop.name}: true`;
      }
      if (prop.type === 'number') {
        return `${prop.name}: 0`;
      }
      return `${prop.name}: ${value}`;
    });
    
    return `{ ${props.join(', ')} }`;
  }

  private getDefaultPropValue(prop: PropDefinition, inline: boolean = true): string {
    const prefix = inline ? `${prop.name}=` : '';
    
    switch (prop.type) {
      case 'string':
        if (prop.name === 'label') return `${prefix}"Test Label"`;
        if (prop.name === 'text') return `${prefix}"Test Text"`;
        return `${prefix}"test-${prop.name}"`;
      
      case 'boolean':
        return inline ? prop.name : 'true';
      
      case 'number':
        return `${prefix}{0}`;
      
      default:
        if (prop.type.includes('() => void')) {
          return inline ? `${prop.name}={() => {}}` : '() => {}';
        }
        if (prop.type.includes('|')) {
          const firstValue = prop.type.split('|')[0].trim().replace(/["']/g, '');
          return `${prefix}"${firstValue}"`;
        }
        return `${prefix}"test-${prop.name}"`;
    }
  }

  private getExpectedRole(analysis: ComponentAnalysis): string {
    const componentName = analysis.componentName.toLowerCase();
    
    if (componentName.includes('button')) return 'button';
    if (componentName.includes('input')) return 'textbox';
    if (componentName.includes('select')) return 'combobox';
    if (componentName.includes('checkbox')) return 'checkbox';
    if (componentName.includes('radio')) return 'radio';
    if (componentName.includes('link')) return 'link';
    
    return 'button'; // Default fallback
  }

  private getExpectedClassName(name: string): string {
    return name.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

interface TestCase {
  name: string;
  description: string;
  code: string;
} 