import * as path from 'path';
import * as Lint from 'tslint';
import * as ts from 'typescript';

export const IMPORT_SEP = '/';

export interface PathMapping {
  prefix: string;
  allowSubdirectories: boolean;
}

export class Rule extends Lint.Rules.AbstractRule {
  pathMappings: PathMapping[];
  fileSplitWord = getName('src', 'app', 'routes');

  static readonly metadata: Lint.IRuleMetadata = {
    ruleName: 'use-path-mapping',
    description: `Importing the core directory in the router directory must use the \`@core\` prefix.`,
    descriptionDetails: `https://ng-alain.com/docs/styleguide#path-mapping`,
    options: {
      items: {
        type: 'string',
      },
      minLength: 0,
      type: 'array',
    },
    optionExamples: [true, ['@core', '@shared']],
    optionsDescription: Lint.Utils.dedent`
    `,
    rationale: `Consistent conventions make it easy to quickly identify and reference assets of different types.`,
    type: 'typescript',
    typescriptOnly: true,
    hasFix: true,
  };
  constructor(options: Lint.IOptions) {
    super(options);

    const args = this.getOptions().ruleArguments;
    let pathMapping = args[1] || ['@core', '@shared'];
    if (!(pathMapping instanceof Array)) {
      pathMapping = [pathMapping];
    }
    this.pathMappings = parseOptions(pathMapping);
  }

  apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(new Walker(sourceFile, this));
  }
}

function parseOptions(list: string[]): PathMapping[] {
  const res: PathMapping[] = [];
  list
    .filter(key => key.startsWith('@'))
    .forEach(key => {
      const sepArr = key.split(IMPORT_SEP);
      const item: PathMapping = {
        prefix: sepArr[0].substr(1),
        allowSubdirectories: sepArr.length > 1,
      };
      res.push(item);
    });
  return res;
}

// 默认所有 `getSourceFile` 会对所有路径使用 `/` 分隔符
function getName(...pathArr: string[]): string {
  return path.normalize(path.join(...pathArr)).replace(/\\/g, IMPORT_SEP);
}

function removeQuotes(value: string): string {
  // strip out quotes
  if (value.length > 1 && (value[0] === "'" || value[0] === '"')) {
    value = value.substr(1, value.length - 2);
  }
  return value;
}

function getMapping(key: string, pathMapping: PathMapping[]): PathMapping {
  return pathMapping.find(w => w.prefix === key) as PathMapping;
}

function getImportFilePath(sourceFile: string, text: string): string {
  const sourceFileValidPath = sourceFile.split(IMPORT_SEP).join(path.sep);
  return getName(path.resolve(sourceFileValidPath, text));
}

export const getFailureMessage = (newText: string): string => {
  return `Should be imported using \`${newText}\``;
};

class Walker extends Lint.RuleWalker {
  isValidRoutePath = false;
  sourceFilePath = '';
  constructor(sourceFile: ts.SourceFile, private rule: Rule) {
    super(sourceFile, rule.getOptions());
    this.sourceFilePath = sourceFile.fileName;
    this.isValidRoutePath = sourceFile.fileName.indexOf(this.rule.fileSplitWord) !== -1;
  }

  private getValidImportPath(text: string): string | null {
    let sepArr: string[];
    if (text[0] === '@') {
      // @core/index.ts
      sepArr = text.substr(1).split(IMPORT_SEP);
    } else {
      // ../core/index.ts
      const importPathSeqArr = getImportFilePath(this.sourceFilePath, text).split(this.rule.fileSplitWord);
      if (importPathSeqArr.length === 1) {
        return null;
      }
      sepArr = importPathSeqArr[1].split(IMPORT_SEP).filter(w => !!w);
    }
    const mapping = getMapping(sepArr[0], this.rule.pathMappings);
    if (!mapping || (sepArr.length > 1 && mapping.allowSubdirectories)) {
      return null;
    }
    const newText = `@${mapping.prefix}`;
    return newText === text ? null : newText;
  }

  private getFix(start: number, text: string, newText: string): Lint.Fix {
    const fix: Lint.Fix = [];
    fix.push(Lint.Replacement.deleteText(start + 1, text.length));
    fix.push(Lint.Replacement.appendText(start + 1, newText));
    return fix;
  }

  visitImportDeclaration(node: ts.ImportDeclaration): void {
    if (!this.isValidRoutePath) {
      return;
    }
    const text = removeQuotes(node.moduleSpecifier.getText());
    const newText = this.getValidImportPath(text);
    if (newText == null) {
      return;
    }

    const start = node.moduleSpecifier.getStart();
    const fix = this.getFix(start, text, newText);
    this.addFailureAt(start + 1, text.length, getFailureMessage(newText), fix);
  }
}
