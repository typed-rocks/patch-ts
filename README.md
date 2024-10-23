# Patch any TypeScript Compiler to add support of custom intrinsic types

`patch-ts` is a command-line interface (CLI) designed to enhance the TypeScript compiler by patching its the `checker.ts` file which creates the types. All changes can be found in the `templates.ts` file.

Input:

```javascript
module.exports = {
  Email: {
    fn: (str) => EMAILREGEX.test(str),
    type: "boolean",
  },
};
```
Output:

```typescript

type Email<S> = intrinsic;
type IsEmail = Email<'Hi'>;
//    ^? false

```

</div>
</div>


## Features

- **Patch TypeScript**: Apply modifications to enhance the TypeScript compiler with the ability to parse custom `intrinsic` types.
- **Create `.d.ts` file from intrinsics** Use the intrinsics.js file to create the corresponding `.d.ts` files.
- **Revert Changes**: Restore the original state of patched TypeScript files.

## Prerequisites

- Node.js (LTS version recommended)
- TypeScript installed globally or in your project

## Installation

Install it using npm:

```bash
npm i -g patch-ts
```

## Usage

1. Figure out the path of the TypeScript version you are currently using.
   For Example:

   ```bash
   patch-ts show-lib
   > /home/wrz/node/v22.2.0/lib/node_modules/typescript/lib
   ```

   This uses the currently installed `tsc` to check the library path.

2. Make sure that your IDE (VSCode for example) points to the same TypeScript compiler. Check it by running the command-palette command:

   ```bash
   Select TypeScript Version
   ```

3. If the paths do not align with the one from `patch-ts lib` you need to align it by setting it in your settings json:

   ```json
   {
     "typescript.tsdk": "/home/wrz/node/v22.2.0/lib/node_modules/typescript/lib"
   }
   ```

4. Use the [patch](#patch-command) command to patch your TypeScript installation with an intrinsics file by using the environment variable "PATCH_TS". First you need to set the environment variable for example in your `.bashrc` or `.zshrc`.

   ```bash
   export PATCH_TS=/path/to/your/intrinsics.js
   ```

   And then patch it:

   ```bash
   patch-ts patch --useEnv PATCH_TS
   ```

5. Now you can add your own [intrinsic types](#intrinsics-file-structure) to the `intrinsics.js` file.

6. **RESTART**: To apply the changes made to the `intrinsics.js` file you have to restart your ts-server using `Restart TS Server`.

7. If you want to, you can now also create the types from the intrinsics file: 

   ```bash
   patch-ts create-dts -i ./intrinsics.js -o ./my.d.ts
   ```

## Commands

### Patch Command

To patch TypeScript compiler files:

```bash
patch-ts patch [options]
```

#### Options

- `-f, --force`: Force the patch operation, even if already patched.
- `-l, --libPath <value>`: Specify the path to the TypeScript library. By default it uses the current lib `tsc` points to.
- `-ue, --useEnv`: If set, it will use the provided environment variable and the path behind it to determine the path to the `intrinsics.js` file. Needs a restart of VSCode to find the new environment variable.
- `-b, --bundled`: The file which will be bundled into the compiler. Will not be updated but only the current version is copied into the compiler.

### Show Lib

Use this command to get the lib which will get patched when calling `patch-ts`.

```bash
patch-ts show-lib
```

### Create Types File from intrinsics.js

```bash
patch-ts create-dts -i /path/to/intrisincs.js -o ./myfile.d.ts
```

Will use the file from the input path to create the TypeScript types file.

### Revert Command

To revert any changes made by the patch:

```bash
patch-ts revert
```

This command will revert the TypeScript files (`typescript.js` and `tsc.js`) to their original state before any patches applied by `patch-ts`.

### Examples

Patching with a custom lib path and using the PATCH_TS environment variable to figure out where the patch-file is. Will update when the file at PATCH_TS changes and the user restarts the ts server. Also forcing an update.

```bash
patch-ts patch --useEnv PATCH_TS --path /Users/wrz/IdeaProjects/TypeScript/built/local --force
```

Bundle a intrinsicts file into the compiler. Is only bundled **ONCE**.

```bash
patch-ts patch --bundled /path/to/custom-intrinsics.js
```

This command will use the `custom-intrinsics.js` file for patching the typescript compiler **ONCE**. It does not update when the file changes.

## intrinsics file structure

The JavaScript file has to have a single `module.exports` which exports a function which looks like that:

```javascript
module.exports = function () {
  return {
    Email: {
      fn: (str) => str.includes("@" ? str : "NEVER"),
    },
    Length: {
      fn: (str) => str.length,
      type: "number",
    },
    Add: {
      fn: (first, second) => first + second,
      type: "number",
    },
    IsNumber: {
      fn: nr => nr === +nr,
      type: "boolean"
    }
  };
};
```

The `fn` property is always needed. It maps the generics which we pass to the generic type and transform it. By default it will always return the result as a string representation. We can specify the `type` property as either `number`, `string` or `boolean` to transform the result into the corresponding type.

When `"NEVER"` is returned, it will be converted to the `never` type.

This will enable us to create these types:

```typescript
type Email<S> = intrinsic;
type Length<S> = intrinsic;
type Add<F, S> = intrinsic;

type WrongEmail = Email<"ab">;
//   ^? never
type CorrectEmail = Email<"a@b">;
//   ^? "a@b"
type TextLength = Length<"hi">;
//   ^? 2
type NumberCheck = IsNumber<1>;
//   ^? true
```

## Contributing

Contributions to `patch-ts` are welcome! Please read the contributing guidelines in the repository for more information on how to submit pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Support

For support, submit an issue in the GitHub repository or contact the project maintainers.
