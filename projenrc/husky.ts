import { Component, TextFile } from "projen";
import { NodeProject } from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";

/**
 * Creates a union of the passed in Type and a function that returns Type.
 */
export type InnerDynamic<Type, Argument> =
  | Type
  | ((argument: Argument) => Type);

/**
 * Recursively creates a union of the passed in Type and a function that returns Type.
 */
export type Dynamic<Type, Argument> = {
  [Key in keyof Type]: InnerDynamic<Dynamic<Type[Key], Argument>, Argument>;
};

/**
 * Resolves the dynamic values in the passed in object.
 *
 * @param argument the argument to pass into the dynamic functions
 * @param dynamicValue the dynamic value to resolve
 * @returns the resolved dynamic value
 */
function innerResolve<Type, Argument>(
  argument: Argument,
  dynamicValue?: Dynamic<Type, Argument>,
): Type | undefined {
  return dynamicValue === undefined
    ? undefined
    : traverse(dynamicValue, (value) =>
        typeof value === "function" ? value(argument) : value,
      );
}

function is<C extends new (...args: any[]) => any>(
  Ctor: C,
  val: any,
): val is InstanceType<C> {
  return (
    val instanceof Ctor ||
    (val != null &&
      (val.constructor === Ctor ||
        (Ctor.name === "Object" && typeof val === "object")))
  );
}

function traverse<Type, Argument>(
  obj: Dynamic<Type, Argument>,
  cond: (value: any) => any,
): Type {
  const _traverse = (o: Dynamic<Type, Argument>): Type => {
    const isArray = (val: any) => is(Array, val);
    const isObjectLike = (val: any) => is(Object, val);
    const isNotFunction = (val: any) => !is(Function, val);
    const isObject = (val: any) => isObjectLike(val) && isNotFunction(val);
    const continueTraverse = (v: any) =>
      isArray(v) || isObject(v) ? _traverse(v) : cond(v);
    return (isArray(o)
      ? o.map(continueTraverse)
      : Object.entries(o).reduce((acc, [k, v]) => {
          return { ...acc, [k]: continueTraverse(v) };
        }, {})) as unknown as Type;
  };

  return _traverse(obj);
}

function mergeWithKey(fn: any, l: any, r: any) {
  var result: any = {};
  var k;
  l = l || {};
  r = r || {};

  for (k in l) {
    if (_has(k, l)) {
      result[k] = _has(k, r) ? fn(k, l[k], r[k]) : l[k];
    }
  }

  for (k in r) {
    if (_has(k, r) && !_has(k, result)) {
      result[k] = r[k];
    }
  }

  return result;
}

function _isObject(x: unknown) {
  return Object.prototype.toString.call(x) === "[object Object]";
}

function _has(prop: string, obj: Object) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function mergeDeepWithKey(fn: any, lObj: any, rObj: any) {
  return mergeWithKey(
    function (k: any, lVal: any, rVal: any) {
      if (_isObject(lVal) && _isObject(rVal)) {
        return mergeDeepWithKey(fn, lVal, rVal);
      } else {
        return fn(k, lVal, rVal);
      }
    },
    lObj,
    rObj,
  );
}

function mergeDeepRight(lObj: any, rObj: any) {
  return mergeDeepWithKey(
    function (_: any, __: any, rVal: any) {
      return rVal;
    },
    lObj,
    rObj,
  );
}

/**
 * Resolves the dynamic values in the passed in object.
 *
 * @param argument the argument to pass into the dynamic functions
 * @param dynamicValue the dynamic value to resolve
 * @param defaultValue the dynamic defaults values to merge with the resolved dynamicValue
 * @returns the resolved dynamic value
 */
export function resolve<
  Type extends object,
  Argument,
  DefaultType extends object,
>(
  argument: Argument,
  dynamicValue: Dynamic<Type, Argument> | Type | undefined,
  defaultValue: Dynamic<DefaultType, Argument> | DefaultType,
) {
  const resolvedValue = innerResolve(argument, dynamicValue);
  const resolvedDefaultValue = innerResolve(argument, defaultValue);
  return mergeDeepRight(
    resolvedDefaultValue ?? {},
    resolvedValue ?? {},
  ) as unknown as DefaultType & Type;
}

/**
 * like Required<T> but for the entire node hierarchy in the Type
 */
export type DeepRequired<Type> = {
  [Key in keyof Type]-?: Required<DeepRequired<Type[Key]>>;
};

/**
 * see https://git-scm.com/docs/githooks
 */
export type HuskyHook =
  | "applypatch-msg"
  | "pre-applypatch"
  | "post-applypatch"
  | "pre-commit"
  | "pre-merge-commit"
  | "prepare-commit-msg"
  | "commit-msg"
  | "post-commit"
  | "pre-rebase"
  | "post-checkout"
  | "post-merge"
  | "pre-push"
  | "pre-receive"
  | "update"
  | "proc-receive"
  | "post-receive"
  | "post-update"
  | "reference-transaction"
  | "push-to-checkout"
  | "pre-auto-gc"
  | "post-rewrite"
  | "sendemail-validate"
  | "fsmonitor-watchman"
  | "p4-changelist"
  | "p4-prepare-changelist"
  | "p4-post-changelist"
  | "p4-pre-submit"
  | "post-index-change";

/**
 * option to enable or disable husky and commands to run for each hook
 */
export type HuskyOptions = {
  /**
   * enable or disable husky
   *
   * @default true
   */
  husky?: boolean;
  huskyHooks?: Partial<Record<HuskyHook, string[]>>;
};

/**
 * adds husky to the project, which manages git hooks
 *
 * see https://typicode.github.io/ and https://git-scm.com/docs/githooks
 */
export class Husky extends Component {
  static defaultOptions: Dynamic<DeepRequired<HuskyOptions>, NodeProject> = {
    husky: true,
    huskyHooks: {
      "applypatch-msg": [],
      "pre-applypatch": [],
      "post-applypatch": [],
      "pre-commit": [],
      "pre-merge-commit": [],
      "prepare-commit-msg": [],
      "commit-msg": [],
      "post-commit": [],
      "pre-rebase": [],
      "post-checkout": [],
      "post-merge": [],
      "pre-push": (project: NodeProject) => {
        const lines = ["npm run test"];
        if (project instanceof TypeScriptProject && project.eslint) {
          lines.push("npm run eslint");
        }
        return lines;
      },
      "pre-receive": [],
      update: [],
      "proc-receive": [],
      "post-receive": [],
      "post-update": [],
      "reference-transaction": [],
      "push-to-checkout": [],
      "pre-auto-gc": [],
      "post-rewrite": [],
      "sendemail-validate": [],
      "fsmonitor-watchman": [],
      "p4-changelist": [],
      "p4-prepare-changelist": [],
      "p4-post-changelist": [],
      "p4-pre-submit": [],
      "post-index-change": [],
    },
  };
  options: DeepRequired<HuskyOptions>;
  hooks?: Partial<Record<HuskyHook, TextFile>>;

  /**
   * adds husky to the project
   *
   * @param project the project to add to
   * @param options - see `HuskyOptions`
   */
  constructor(
    project: NodeProject,
    options?: Dynamic<HuskyOptions, NodeProject>,
  ) {
    super(project);
    this.options = resolve(project, options, Husky.defaultOptions);
    if (this.options.husky) {
      project.addDevDeps("husky");
      project.addTask("prepare", {
        exec: "husky",
        description: "installs husky",
      });
    }
  }

  /**
   * adds husky to the project
   */
  preSynthesize(): void {
    if (this.options.husky) {
      this.hooks = {};
      for (const hookName in this.options.huskyHooks) {
        const hooks = this.options.huskyHooks[hookName as HuskyHook];
        if (hooks.length > 0) {
          this.hooks[hookName as HuskyHook] = new TextFile(
            this.project,
            `.husky/${hookName}`,
            { lines: [...hooks], marker: true },
          );
        }
      }
    }
  }

  /**
   * adds the lines to the specified hook
   *
   * @param hook to hook to add to
   * @param {...any} lines the new lines to add
   */
  addHook(hook: HuskyHook, ...lines: string[]): void {
    this.options.huskyHooks[hook].push(...lines);
  }

  /**
   * replaces the specified hook
   *
   * @param hook the hook to override
   * @param {...any} lines the new lines
   */
  overrideHook(hook: HuskyHook, ...lines: string[]): void {
    this.options.huskyHooks[hook] = lines;
  }

  /**
   * removes the specified hook
   *
   * @param hook the hook to delete
   */
  deleteHook(hook: HuskyHook): void {
    this.options.huskyHooks[hook] = [];
  }

  /**
   * get the list of all the hook names
   *
   * @returns the hook names
   */
  getHookNames(): string[] {
    return Object.keys(Husky.defaultOptions.huskyHooks);
  }
}
