import {
  // Husky,
  MonorepoProject,
  TypeScriptLibProject,
  Vitest,
} from "./projenrc";

const project = new MonorepoProject({
  name: "ampms-libs",
  authorEmail: "ifloydrose@gmail.com",
  authorName: "Victor Korzunin",
});

new Vitest(project);

// new Husky(project, {
//   huskyHooks: {
//     "pre-push": ["CI=true pnpm test"],
//   },
// });

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

project.synth();
