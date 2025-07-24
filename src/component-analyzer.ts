import * as ts from 'typescript';

export interface ComponentAnalysis {
  componentName: string;
  componentType: 'functional' | 'class';
  props: PropDefinition[];
  exports: string[];
  imports: ImportInfo[];
  hasDefaultExport: boolean;
  filePath: string;
}

export interface PropDefinition {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  description?: string;
}

export interface ImportInfo {
  source: string;
  imports: string[];
  isDefault: boolean;
}

export class ComponentAnalyzer {
  analyze(content: string, filePath: string): ComponentAnalysis {
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const analysis: ComponentAnalysis = {
      componentName: '',
      componentType: 'functional',
      props: [],
      exports: [],
      imports: [],
      hasDefaultExport: false,
      filePath,
    };

    this.visit(sourceFile, analysis);
    
    return analysis;
  }

  private visit(node: ts.Node, analysis: ComponentAnalysis) {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        this.analyzeImport(node as ts.ImportDeclaration, analysis);
        break;
      
      case ts.SyntaxKind.InterfaceDeclaration:
        this.analyzeInterface(node as ts.InterfaceDeclaration, analysis);
        break;
      
      case ts.SyntaxKind.TypeAliasDeclaration:
        this.analyzeTypeAlias(node as ts.TypeAliasDeclaration, analysis);
        break;
      
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.ArrowFunction:
      case ts.SyntaxKind.FunctionExpression:
        this.analyzeFunction(node, analysis);
        break;
      
      case ts.SyntaxKind.VariableDeclaration:
        this.analyzeVariableDeclaration(node as ts.VariableDeclaration, analysis);
        break;

      case ts.SyntaxKind.ExportAssignment:
        this.analyzeExportAssignment(node as ts.ExportAssignment, analysis);
        break;
    }

    ts.forEachChild(node, child => this.visit(child, analysis));
  }

  private analyzeImport(node: ts.ImportDeclaration, analysis: ComponentAnalysis) {
    const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
    const imports: string[] = [];
    let isDefault = false;

    if (node.importClause) {
      if (node.importClause.name) {
        imports.push(node.importClause.name.text);
        isDefault = true;
      }

      if (node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach(element => {
            imports.push(element.name.text);
          });
        } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          imports.push(node.importClause.namedBindings.name.text);
        }
      }
    }

    analysis.imports.push({
      source: moduleSpecifier,
      imports,
      isDefault,
    });
  }

  private analyzeInterface(node: ts.InterfaceDeclaration, analysis: ComponentAnalysis) {
    const interfaceName = node.name.text;
    
    if (interfaceName.endsWith('Props')) {
      node.members.forEach(member => {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = member.name.getText();
          const optional = !!member.questionToken;
          const type = member.type ? member.type.getText() : 'any';
          
          analysis.props.push({
            name: propName,
            type,
            optional,
            description: this.getJSDocDescription(member),
          });
        }
      });
    }
  }

  private analyzeTypeAlias(node: ts.TypeAliasDeclaration, analysis: ComponentAnalysis) {
    // Handle type aliases that might define component props
    if (node.name.text.endsWith('Props') && node.type && ts.isTypeLiteralNode(node.type)) {
      node.type.members.forEach(member => {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = member.name.getText();
          const optional = !!member.questionToken;
          const type = member.type ? member.type.getText() : 'any';
          
          analysis.props.push({
            name: propName,
            type,
            optional,
            description: this.getJSDocDescription(member),
          });
        }
      });
    }
  }

  private analyzeFunction(node: ts.Node, analysis: ComponentAnalysis) {
    let functionName = '';
    
    if (ts.isFunctionDeclaration(node) && node.name) {
      functionName = node.name.text;
    } else if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
      functionName = node.parent.name.text;
    }

    // Check if this looks like a React component (starts with uppercase)
    if (functionName && /^[A-Z]/.test(functionName)) {
      analysis.componentName = functionName;
      analysis.componentType = 'functional';
      
      if (!analysis.exports.includes(functionName)) {
        analysis.exports.push(functionName);
      }
    }
  }

  private analyzeVariableDeclaration(node: ts.VariableDeclaration, analysis: ComponentAnalysis) {
    if (ts.isIdentifier(node.name)) {
      const name = node.name.text;
      
      // Check if this is a React component assignment
      if (/^[A-Z]/.test(name) && node.initializer) {
        if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
          analysis.componentName = name;
          analysis.componentType = 'functional';
          
          if (!analysis.exports.includes(name)) {
            analysis.exports.push(name);
          }
        }
      }
    }
  }

  private analyzeExportAssignment(node: ts.ExportAssignment, analysis: ComponentAnalysis) {
    if (ts.isIdentifier(node.expression)) {
      const exportName = node.expression.text;
      analysis.hasDefaultExport = true;
      
      if (!analysis.exports.includes(exportName)) {
        analysis.exports.push(exportName);
      }
    }
  }

  private getJSDocDescription(node: ts.Node): string | undefined {
    const jsDoc = (node as any).jsDoc;
    if (jsDoc && jsDoc.length > 0) {
      return jsDoc[0].comment;
    }
    return undefined;
  }
} 