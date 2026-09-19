import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Route modules are routing, and nothing else.
 *
 * A route file that carries its whole view — inline components, local helpers, `useState` —
 * makes the page impossible to render without a router. Views live under
 * `src/features/<feature>/components/` (or `src/components/pages/` for static pages), and these
 * assertions stop the next one from being written back into a route file: nothing else in the
 * suite would notice, because a page that renders correctly renders correctly wherever it is
 * declared.
 *
 * The checks are textual on purpose. They are about where a declaration sits, which is a property
 * of the file rather than of the running application, and a file read is the cheapest way to hold
 * a boundary that no amount of rendering can.
 */
const routesDir = path.resolve(process.cwd(), "src/routes");

function routeModules(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return routeModules(fullPath);
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [fullPath] : [];
  });
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

/** A top-level `function`/`const`/`class`/`type` declaration, by the name it binds. */
const TOP_LEVEL_DECLARATION =
  /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;

/** React state and lifecycle — a route module reaching for these is rendering, not routing. */
const VIEW_HOOK =
  /\buse(?:State|Effect|LayoutEffect|Ref|Memo|Callback|Reducer|Transition|ImperativeHandle)\s*\(/;

/** Where a page view is allowed to live: a feature's components, or a static shared page. */
const VIEW_IMPORT =
  /from\s*["'](?:#\/features\/[^"']+\/components\/[^"']+|#\/components\/pages\/[^"']+)["']/;

/** A shared layout/UI import, which only the root route may make. */
const SHARED_COMPONENT_IMPORT = /from\s*["']#\/components\/(?!pages\/)/;

describe("Route module boundaries", () => {
  const allRoutes = routeModules(routesDir);
  // The rendering routes. API handlers under `routes/api/` and the crawler formats are `.ts`,
  // declare no view, and keep their own request-handling helpers.
  const renderingRoutes = allRoutes.filter(filePath => filePath.endsWith(".tsx"));

  it("finds the route modules to hold", () => {
    expect(renderingRoutes.length).toBeGreaterThan(0);
  });

  renderingRoutes.forEach(filePath => {
    const relPath = relative(filePath);
    const content = fs.readFileSync(filePath, "utf-8");

    it(`${relPath} declares the route and nothing else`, () => {
      const declared = content
        .split("\n")
        .map(line => TOP_LEVEL_DECLARATION.exec(line)?.[1])
        .filter((name): name is string => name !== undefined);

      expect(declared).toEqual(["Route"]);
    });

    it(`${relPath} keeps view state out of the route`, () => {
      expect(VIEW_HOOK.test(content)).toBe(false);
    });
  });

  it("imports every page view from a feature's components directory or components/pages", () => {
    const offenders = renderingRoutes
      // `__root.tsx` renders the document shell and the two boundaries around it rather than a
      // page view, so its components come from `src/components/` by design.
      .filter(filePath => path.basename(filePath) !== "__root.tsx")
      .filter(filePath => {
        const content = fs.readFileSync(filePath, "utf-8");
        // A pathless layout route (`_authenticated.tsx`) renders nothing of its own.
        return /\bcomponent:/.test(content) && !VIEW_IMPORT.test(content);
      });

    expect(offenders.map(relative)).toEqual([]);
  });

  it("keeps shared components out of every route module but the root", () => {
    const offenders = allRoutes
      .filter(filePath => path.basename(filePath) !== "__root.tsx")
      .filter(filePath => SHARED_COMPONENT_IMPORT.test(fs.readFileSync(filePath, "utf-8")));

    expect(offenders.map(relative)).toEqual([]);
  });
});
