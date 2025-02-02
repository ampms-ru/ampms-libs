import { Husky, Changesets } from "@floydspace/projen-components";
import { MonorepoProject, TypeScriptLibProject, Vitest } from "./projenrc";

const project = new MonorepoProject({
  name: "ampms-libs",
  authorEmail: "ifloydrose@gmail.com",
  authorName: "Victor Korzunin",
  devDeps: ["@floydspace/projen-components@next"],
});

new Vitest(project);

new Husky(project, {
  huskyHooks: {
    "pre-push": ["CI=true pnpm test"],
  },
});

new Changesets(project, {
  repo: "ampms-ru/ampms-libs",
});

project.addGitIgnore(".vscode/settings.json");

const commonDevDeps = ["@effect/vitest"];

new TypeScriptLibProject({
  parent: project,
  name: "effect-boerse-frankfurt",
  devDeps: [
    ...commonDevDeps,
    "@effect/platform@>=0.69.0 <1.0.0",
    "effect@^3.10.0",
  ],
  peerDeps: ["@effect/platform@>=0.69.0 <1.0.0", "effect@>=3.10.0 <4.0.0"],
  peerDependencyOptions: { pinnedDevDependency: false },
});

project.synth();
