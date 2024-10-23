import * as path from "path";
import * as fsSync from "fs";
import * as fsAsync from "fs/promises";
import * as which from "which";

type Email<A> = intrinsic;
//   ^?

type U = Email<'b'>;
//   ^?

export function exitOnAlreadyDone(libPath: string, force: boolean) {
  const alreadyDonePath = path.resolve(libPath, ".enhanced-init");
  if (force) {
    return false;
  }
  if (fsSync.existsSync(alreadyDonePath)) {
    console.log("Already patched the lib in " + libPath);
    process.exit(0);
  }
}

export function existsFilesAt(p: string | undefined): p is string {
  if(!p) {
    console.log("No path to the lib was found");
    return false;
  }
  let allExist = true;
  if(!fsSync.existsSync(path.resolve(p, "typescript.js"))) {
    allExist = false;
    console.log("typescript.js does not exist at: " + p);
  }
  if(!fsSync.existsSync(path.resolve(p, "tsc.js"))) {
    allExist = false;
    console.log("tsc.js does not exist at: " + p);
  }
  return allExist;
}

export function copyToLib(lib: string, bundlePath: string): string | undefined {
  if(!fsSync.existsSync(bundlePath) || fsSync.statSync(bundlePath).isDirectory()) {
    console.log("File at path does not exist: " + bundlePath);
    return undefined;
  }
  const file = fsSync.readFileSync(bundlePath, 'utf-8');
  const target = path.resolve(lib, "bundled_intrinsics.js");
  fsSync.writeFileSync(target, file);
  return target;
}

function copyLogged(from: string, to: string) {
  const fromLog = path.basename(from);
  const toLog = path.basename(to);
  console.log(`\u{2795} copying ${fromLog} to ${toLog}`);
  const copied = fsAsync.copyFile(from, to);
  console.log(`\u{2705} copied ${fromLog} to ${toLog}`);
  return copied;
}
export function createBackupOrRestores(normals: string[]): Promise<void[]> {
  const allFilePromises = normals.map((normal) => {
    const backup = normal + ".bak";
    if (fsSync.existsSync(backup)) {
      return copyLogged(backup, normal);
    } else if (fsSync.existsSync(normal)) {
      return copyLogged(normal, backup);
    }
    console.log(`neither ${backup} or ${normal} was found. Exiting`);
    process.exit(1);
  });

  return Promise.all(allFilePromises);
}

export function findCurrentTscPath(): string | undefined {
  const binPathString = which.sync("tsc");
  return binPathString ? path.resolve(path.dirname(binPathString), "..", "lib", "node_modules", "typescript", "lib") : undefined;
}
