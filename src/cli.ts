#!/usr/bin/env node

import { Command } from "commander";
import { createDts, init, patchIntrinsics } from "./cli-commands";
import { copyToLib, existsFilesAt, exitOnAlreadyDone, findCurrentTscPath } from "./file-utils";
import * as path from "path";
const program = new Command();

program.name("patch-ts").description("CLI to enhance the typescript compiler").version("1.0.0");

program
  .command("create-dts")
  .description("Create the d.ts file from the input")
  .option('-i, --input <value>', "The intrinsics JavaScript file.")
  .option('-o, --output <value>', "The path where the d.ts file will be generated to.")
  .action((options: {input: string, output: string}) => {
    createDts(options.input, options.output);
  })

program
  .command("patch")
  .description("Patch the typescript.js and tsc.js file")
  .option("-f, --force", "Force the patch operation")
  .option("-b, --bundled <value>", "Bundles the file at the path into the TypeScript compiler. Will not update the types when the source file is changed.")
  .option("-ue, --useEnv <value>", "Reads the intrinsic-file path from the environment variable which is passed. Example: --useEnv PATCH_TS")
  .option("-l, --libPath <value>", "Path to the lib. Uses the current lib for tsc when not specified.")
  .action(
    async (options: {
      intrinsicsFileName: string;
      force: boolean;
      libPath: string;
      bundled: string;
      useEnv: string;
    }) => {
      const bundledPath = options.bundled;
      const libPath = options.libPath || findCurrentTscPath();      
      if (!existsFilesAt(libPath)) {
        return;
      }

      exitOnAlreadyDone(libPath, options.force);

      console.log("Path to lib which will be patched: " + libPath);
      if (options.useEnv) {
        handleUseEnv(libPath, options.useEnv);
      } else if(bundledPath) {
        handleBundled(libPath, bundledPath);
      }
    }
  );

  async function handleBundled(libPath: string, bundledPath: string) {
    const targetPath = copyToLib(libPath, bundledPath);
        if(!targetPath) {
          console.log("Can't read JavaScript file from " + bundledPath);
          return;
        }
        const initializedTsFiles = await init(libPath);
        
        await patchIntrinsics(initializedTsFiles, libPath, undefined, targetPath);
  }

  async function handleUseEnv(libPath: string, envName: string) {
    const processPath = process.env.PATCH_TS;
    if (!processPath) {
      console.log("Env for PATCH_TS is not set. Please set it first and RESTART VSCODE COMPLETELY.");
      return;
    }
    const initializedTsFiles = await init(libPath);
    await patchIntrinsics(initializedTsFiles, libPath, envName, undefined);
  }

program
  .command("show-lib")
  .description("Get the current lib path")
  .action(() => {
    const libPath = findCurrentTscPath();
    if (!existsFilesAt(libPath)) {
      return;
    }
    console.log(path.resolve(libPath, "..", "lib"));
  });

program
  .command("revert")
  .description("Revert changes made to typescript.js and tsc.js files")
  .action(async () => {
    const libPath = findCurrentTscPath();
    if (!existsFilesAt(libPath)) {
      return;
    }
    console.log("path to lib: " + libPath);
    await init(libPath);
  });

program.parse(process.argv);
