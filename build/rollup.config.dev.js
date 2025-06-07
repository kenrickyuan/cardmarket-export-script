import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";

export default {
  input: "src/main.ts",
  output: {
    file: "dev-server/script.js",
    format: "iife",
    sourcemap: true,
    banner: `// MKM Helper Development Build
// Auto-reloaded from http://localhost:3000
// Build time: ${new Date().toISOString()}
console.log('🔥 MKM Helper (DEV) loaded');`,
  },
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("development"),
      preventAssignment: true,
    }),
    resolve({
      browser: true,
    }),
    typescript({
      sourceMap: true,
      declaration: false,
      tsconfig: "./tsconfig.json",
    }),
    serve({
      contentBase: "dev-server",
      port: 3000,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      verbose: true,
    }),
    livereload({
      watch: "dev-server",
      verbose: true,
      port: 35729,
    }),
  ],
  watch: {
    clearScreen: false,
  },
};
