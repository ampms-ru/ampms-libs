import { Component, JsonFile, Project, javascript, typescript } from "projen";

export class Vitest extends Component {
  public static of(project: Project): Vitest | undefined {
    const isVitest = (o: Component): o is Vitest => o instanceof Vitest;
    return project.components.find(isVitest);
  }

  constructor(project: typescript.TypeScriptProject) {
    super(project);

    if (project.jest) {
      removeNode(project.jest.node.id, project);
    }

    project.addDevDeps("vitest", "@vitest/coverage-v8");

    project.testTask.reset("vitest --globals", { receiveArgs: true });

    const compilerOptions = project.tsconfig?.compilerOptions as any;

    if (compilerOptions) {
      compilerOptions.types = [
        ...(compilerOptions.types ?? []),
        "vitest/globals",
      ];
    }

    new JsonFile(project, "vitest.workspace.json", {
      obj: ["packages/*"],
      omitEmpty: true,
    });
  }

  preSynthesize(): void {
    this.project.subprojects.forEach((subproject) => {
      if (subproject instanceof typescript.TypeScriptProject) {
        if (subproject.jest) {
          removeNode(subproject.jest.node.id, subproject);
        }

        subproject.addDevDeps("vitest");
        subproject.testTask.exec("vitest run --globals", { receiveArgs: true });
        subproject.addTask("test:watch", {
          description: "Run tests in watch mode",
          exec: "vitest --globals --passWithNoTests --reporter verbose",
        });
      }
    });
  }
}

function removeNode(nodeId: string, project: javascript.NodeProject) {
  project.node.tryRemoveChild(nodeId);
  resetProjectJestState(project);
}

function resetProjectJestState(project: javascript.NodeProject) {
  unannotateGenerated.call(project.root, "*.snap");
  project.deps.removeDependency("jest");
  project.deps.removeDependency("jest-junit");
  project.deps.removeDependency("@types/jest");
  project.deps.removeDependency("ts-jest");
  project.gitignore.removePatterns(
    "# jest-junit artifacts",
    "/test-reports/",
    "junit.xml",
    "/coverage/",
  );
  project.npmignore?.removePatterns(
    "# jest-junit artifacts",
    "/test-reports/",
    "junit.xml",
    "/coverage/",
  );
  delete project.manifest.jest;
  if (project.jest?.file) {
    project.node.tryRemoveChild(project.jest.file.node.id);
    project.npmignore?.removePatterns(`/${project.jest.file.path}`);
  }
  project.testTask.removeStep(0);
  project.removeTask("test:watch");
}

function unannotateGenerated(this: Project, glob: string): void {
  removeAttributes.call(this.gitattributes, glob, "linguist-generated");
}

function removeAttributes(this: any, glob: string, ...attributes: string[]) {
  if (!this.attributes.has(glob)) {
    return;
  }
  const set = this.attributes.get(glob)!;
  for (const attribute of attributes) {
    set.delete(attribute);
  }
  if (set.size === 0) {
    this.attributes.delete(glob);
  }
}
