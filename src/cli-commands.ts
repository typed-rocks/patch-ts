import * as fsSync from "fs";
import * as path from "path";

import { createBackupOrRestores } from "./file-utils";
import { initProjectWithFiles, patchFile } from "./ast-edit";

export async function init(libPath: string) {
  const typescriptFilePath = path.resolve(libPath, "typescript.js");
  const tscFilePath = path.resolve(libPath, "tsc.js");
  const filePaths = [typescriptFilePath, tscFilePath];
  await createBackupOrRestores(filePaths);
  return filePaths;
}

export async function patchIntrinsics(
  filePaths: string[],
  libPath: string,
  envPath: string | undefined,
  bundled: string | undefined
) {
  const [typescriptFile, tscFile] = initProjectWithFiles(filePaths);

  const typescriptFileStartNode = typescriptFile.getChildren().at(0)!.getChildren().at(2)!;

  const patchTypescript = patchFile(typescriptFile, typescriptFileStartNode, envPath, bundled);
  const patchTsc = patchFile(tscFile, tscFile, envPath, bundled);
  await Promise.all([patchTypescript, patchTsc]);
  fsSync.writeFileSync(libPath + "/.enhanced-init", "initialized");
}

export async function createDts(filePath: string, outputPath: string) {
  if (!fsSync.existsSync(filePath) || fsSync.statSync(filePath).isDirectory()) {
    console.log("Path " + filePath + " is not a file");
    return undefined;
  }

  try {
    const obj = eval(fsSync.readFileSync(filePath, 'utf-8'));
    const isValid = validateObj(obj);
    if (isValid) {
      createDtsFile(obj, outputPath);
    }
  } catch (e) {
    console.log(e);
    console.log("Could not read object from path " + filePath);
  }
}

function createDtsFile(obj: object, outputPath: string) {
  const abc = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const types = Object.entries(obj).map(([key, value]) => {
    const argumentLength = value.fn.length;
    
    if(argumentLength) {
      const args = abc.slice(0, argumentLength).join(", ");
      return `type ${key}<${args}> = intrinsic;`
    }
  });
  const output = types.join("\n");

  fsSync.writeFileSync(outputPath, output);
  console.log(`Wrote types to ${outputPath}`);
}

function validateObj(obj: object): boolean {
  let allOkay = true;
  Object.entries(obj).forEach(([key, value]) => {
    if (!value.fn) {
      console.log(`Key ${key} has no function property 'fn', but it needs one.`);
      allOkay = false;
    }
    if (typeof value?.fn !== "function") {
      console.log(`'fn' property of ${key} is not a function`);
      allOkay = false;
    }
    if (value.type && !["number", "boolean", "string"].includes(value.type)) {
      console.log(`Property 'type' in ${key} needs to be either "number", "string" or "boolean" if set.`);
      allOkay = false;
    }
  });
  return allOkay;
}
