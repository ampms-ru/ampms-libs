import path from "path";
import { DependencyType, JsonFile } from "projen";
import { NodeProject, TypeScriptModuleResolution } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";

type PredefinedProps = "defaultReleaseBranch" | "authorName" | "authorEmail";
type TypeScriptBaseProjectOptions = Omit<
  TypeScriptProjectOptions,
  PredefinedProps
> &
  Partial<Pick<TypeScriptProjectOptions, PredefinedProps>>;

class TypeScriptBaseProject extends TypeScriptProject {
  constructor({ jestOptions, ...options }: TypeScriptBaseProjectOptions) {
    const parent = options.parent as NodeProject;
    super({
      defaultReleaseBranch: "master",
      authorEmail: parent.package.manifest.author.email,
      authorName: parent.package.manifest.author.name,
      packageManager: parent.package.packageManager,
      package: false,
      licensed: false,
      eslint: true,
      prettier: true,
      projenVersion: parent.deps.getDependency("projen").version,
      outdir: `packages/${options.name}`,
      jest: false,
      depsUpgrade: false,
      ...options,
      name: `@pms/${options.name}`,
    });

    this.tsconfigDev?.addInclude("**/*.ts");
  }

  getPeerDeps() {
    return this.deps.all
      .filter((dep) => dep.type === DependencyType.PEER)
      .map((dep) => dep.name);
  }
}

export type TypeScriptLibProjectOptions = TypeScriptBaseProjectOptions & {
  exportAliases?: Record<string, string>;
};

export class TypeScriptLibProject extends TypeScriptBaseProject {
  constructor({ exportAliases, ...options }: TypeScriptLibProjectOptions) {
    super({
      ...options,
      tsconfig: {
        ...options.tsconfig,
        compilerOptions: {
          moduleResolution: TypeScriptModuleResolution.NODE,
          lib: ["es2020", "dom"],
          target: "ES2020",
          skipLibCheck: true,
        },
      },
    });

    // Add tsconfig for esm
    new JsonFile(this, `${path.dirname(this.srcdir)}/tsconfig.esm.json`, {
      obj: {
        extends: "./tsconfig.json",
        compilerOptions: {
          outDir: "./lib/esm",
          module: "es6", // esm
          resolveJsonModule: false, // JSON modules are not supported in esm
          declaration: false, // Declaration are generated for cjs
        },
      },
    });

    // Reference to esm index for root imports
    this.package.addField("module", "lib/esm/index.js");
    this.package.addField("sideEffects", []);

    // Add export aliases for additional imports
    for (const alias in exportAliases) {
      new JsonFile(this, `${path.dirname(this.srcdir)}/${alias}/package.json`, {
        obj: {
          name: alias,
          main: `../lib/${exportAliases[alias]}.js`,
          module: `../lib/esm/${exportAliases[alias]}.js`,
          types: `../lib/${exportAliases[alias]}.d.ts`,
          sideEffects: [],
        },
      });
    }

    // Build both cjs and esm
    this.compileTask.reset("tsc -b ./tsconfig.json ./tsconfig.esm.json");
  }
}
