
export const TYPE_ALIAS_INSTANTIATION = `
  if(typeKind > 4) {
      const typeValues = typeArguments?.map(t => t.value) || [];
      const intrinsicInfos = loaded[symbol.escapedName];
      const result = intrinsicInfos.fn(...typeValues);
      if(result === 'NEVER') {
        return neverType;
      }
      if(intrinsicInfos.type === 'boolean') {
          return result ? trueType : falseType;
      } else if(intrinsicInfos.type === 'number') {
          return getNumberLiteralType(result);
      } else {
          return getStringLiteralType(result + ''); 
      }
  }`;

export const CHECK_TYPE_ALIAS = `
      if(loaded[node.name.escapedText]?.fn.length !== typeParameterCount) {
          error2(node.type, Diagnostics.The_intrinsic_keyword_can_only_be_used_to_declare_compiler_provided_intrinsic_types);
      }`;

export const LOAD_TO_ADD_TEMPLATE = (env: string | undefined, bundledPath: string | undefined) => `
var myFs = require('fs');
var myPath = require('path');

var loaded;

var existingIntrinsic = {
  Uppercase: 0,
  Lowercase: 1,
  Capitalize: 2,
  Uncapitalize: 3,
  NoInfer: 4
};

function getExtension(h) {
  const bundledFile = ${bundledPath ? '"' + bundledPath + '"' : "undefined"};
  
  const pathToFile = bundledFile ?? process.env["${env}"];
  if(!myFs.existsSync(pathToFile)) {
    return {};
  }
  const readFile = myFs.readFileSync(pathToFile, 'utf-8');
  return eval(readFile);
}`;

export function initLoaded(argName: string) {
  return `
  if (!loaded) {
    loaded = getExtension(${argName});
  }
  const addedIntrinsics = Object.keys(loaded).reduce((acc, k, i) => ({
    ...acc,
    [k]: i + Object.keys(existingIntrinsic).length
  }), {});
  const intrinsicTypeKinds = new Map(Object.entries({
    ...existingIntrinsic,
    ...addedIntrinsics
  }));`;
}
