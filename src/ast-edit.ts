import { Node, FunctionDeclaration, SyntaxKind, Project, ScriptTarget, SourceFile } from "ts-morph";
import {
  CHECK_TYPE_ALIAS,
  initLoaded,
  LOAD_TO_ADD_TEMPLATE,
  TYPE_ALIAS_INSTANTIATION,
} from "./templates";
import * as path from "path";

export function getFunctionsByNameInOrder(names: string[], node: Node): FunctionDeclaration[] {
  const results: (FunctionDeclaration | undefined)[] = [...names].map(_ => undefined);

  for (const el of node.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)) {
    const foundIndex = names.findIndex((name) => el.getName() === name);
    if (foundIndex > -1) {
      results[foundIndex] = el;
      if (!results.includes(undefined)) {
        return results as FunctionDeclaration[];
      }
    }
  }
  
  throw new Error();
}

export function addFirstInIf(fn: FunctionDeclaration, addCode: string) {
  if (fn) {
    const intrinsicCheckIf = fn.getFirstDescendantByKind(SyntaxKind.IfStatement);
    if(intrinsicCheckIf) {
      const innerIf = intrinsicCheckIf.getFirstDescendantByKind(SyntaxKind.IfStatement);
      innerIf?.replaceWithText(`${addCode}\n${innerIf.getText()}`);
    }
  }
}

export function appendAfterNode(node: Node, code: string) {
  node?.replaceWithText(`${node.getText()}\n${code}`);
}

export function initProjectWithFiles(filePaths: string[]): SourceFile[] {
  const project = new Project({
    compilerOptions: {
      target: ScriptTarget.ESNext,
    },
  });
  return filePaths.map((fp) => project.addSourceFileAtPath(fp));
}

export async function patchFile(file: SourceFile, startNode: Node, envPath: string | undefined, bundledPath: string | undefined) {
  const fileLog = path.basename(file.getFilePath());
  const suffix = bundledPath ? "with fixed value from " + file.getFilePath() : "with dynamic value from " + file.getFilePath();
  console.log(`\u{1F58A}  Patching ${fileLog} ${suffix}`);
  const [isInstantiatedModule, createTypeChecker] = getFunctionsByNameInOrder(
    ["isInstantiatedModule", "createTypeChecker"],
    startNode
  );

  createTypeChecker?.insertStatements(0, initLoaded(createTypeChecker.getParameters().at(0)?.getText()!));

  appendAfterNode(isInstantiatedModule, LOAD_TO_ADD_TEMPLATE(envPath, bundledPath));

  const [getTypeAliasInstantiation, checkTypeAliasDeclaration] = getFunctionsByNameInOrder(
    ["getTypeAliasInstantiation", "checkTypeAliasDeclaration"],
    createTypeChecker
  );
  addFirstInIf(getTypeAliasInstantiation, TYPE_ALIAS_INSTANTIATION);
  addFirstInIf(checkTypeAliasDeclaration, CHECK_TYPE_ALIAS);
  await file.save();
  console.log(`\u{2705} Done Patching ${fileLog}`);
}
