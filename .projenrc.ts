import {
  Husky,
  PmsMonorepoProject,
  TypeScriptLibProject,
  Vitest,
} from "./projenrc";

const project = new PmsMonorepoProject({
  name: "pms-libs",
});

new Vitest(project);

new Husky(project, {
  huskyHooks: {
    "pre-push": ["CI=true pnpm test"],
  },
});

project.addGitIgnore(".vscode/settings.json");

// const commonDeps: string[] = ["effect", "@effect/schema"];

// const commonDevDeps = [
//   "@effect/vitest",
//   "@fast-check/vitest",
//   "@fluffy-spoon/substitute",
//   "fast-check",
// ];

new TypeScriptLibProject({
  parent: project,
  name: "effect-boerse-frankfurt",
});

// project.package.addPackageResolutions(
//   "@aws-cdk/aws-cognito-identitypool-alpha@2.147.1-alpha.0"
// );

project.synth();
