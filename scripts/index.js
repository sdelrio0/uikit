import { buildUiKitAST } from "./parser"

// Retrieve arguments
global.__ARGV__ = require("minimist")(process.argv.slice(2))

const srcPath = process.cwd() + "/app/components"
console.log("Generating components AST...");
const ast = buildUiKitAST(srcPath, "", ["js", "jsx"])

console.log("AST:")
console.log(JSON.stringify(ast, null, 2));