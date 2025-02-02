import {
  PnpmMonorepoProject,
  PnpmMonorepoProjectOptions,
} from "@floydspace/projen-components";
import { TextFile } from "projen";

type PredefinedProps = "clobber" | "depsUpgrade";
export type MonorepoProjectOptions = Omit<
  PnpmMonorepoProjectOptions,
  PredefinedProps
>;

export class MonorepoProject extends PnpmMonorepoProject {
  constructor(options: MonorepoProjectOptions) {
    super({
      pnpmVersion: "9.15.4",
      github: true,
      githubOptions: { mergify: false, pullRequestLint: false },
      buildWorkflow: false,
      pullRequestTemplate: false,
      workflowNodeVersion: "lts/*",
      workflowPackageCache: true,
      clobber: false, // enable it and run `pnpm default && pnpm clobber`, if you need to reset the project
      depsUpgrade: false, // enable it and run `pnpm default && pnpm upgrade` to upgrade projen and monorepo deps
      npmProvenance: false,
      typescriptVersion: "~5.5.4",
      ...options,
    });

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
