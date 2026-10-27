// Match Next's single React runtime when rendering workspace UI with Node.
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const resolve = Module._resolveFilename;
const appModules = fileURLToPath(new URL("../node_modules", import.meta.url));
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === "react" || request.startsWith("react/") || request === "react-dom" || request.startsWith("react-dom/")) {
    return resolve.call(this, path.join(appModules, request), parent, ...rest);
  }
  return resolve.call(this, request, parent, ...rest);
};
