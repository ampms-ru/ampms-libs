import { MonorepoTsProject, MonorepoTsProjectOptions } from "@aws/pdk/monorepo";
import pdkPackage from "@aws/pdk/package.json";
import { TextFile } from "projen";
import { NodePackageManager } from "projen/lib/javascript";

type PredefinedProps = "packageManager" | "clobber" | "depsUpgrade";
export type MonorepoProjectOptions = Omit<
  MonorepoTsProjectOptions,
  PredefinedProps
>;

export class MonorepoProject extends MonorepoTsProject {
  constructor(options: MonorepoProjectOptions) {
    super({
      packageManager: NodePackageManager.PNPM,
      clobber: false, // enable it and run `pnpm default && pnpm clobber`, if you need to reset the project
      depsUpgrade: false, // enable it and run `pnpm default && pnpm upgrade` to upgrade projen and monorepo deps
      monorepoUpgradeDeps: false,
      npmProvenance: false,
      typescriptVersion: "~5.5.4",
      ...options,
      devDeps: [...(options.devDeps ?? []), "only-allow"],
    });

    this.addScripts({
      preinstall: `npx only-allow ${this.package.packageManager}`,
    });

    // pdk set it as latest which leads to peer warnings, so we need to set as matching the pdk peer version
    this.addDeps(
      `@aws-cdk/aws-cognito-identitypool-alpha@${pdkPackage.peerDependencies["@aws-cdk/aws-cognito-identitypool-alpha"]}`,
    );

    const period =
      options.copyrightPeriod ?? new Date().getFullYear().toString();
    const owner = options.copyrightOwner ?? options.authorName;

    if (!owner) {
      throw new Error(
        `The ${this.package.license} license requires "copyrightOwner" to be specified`,
      );
    }

    new TextFile(this, "NOTICE", {
      lines: [this.name, `Copyright ${period}, ${owner}`],
    });
  }
}
