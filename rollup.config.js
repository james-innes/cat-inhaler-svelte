import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import babel from "rollup-plugin-babel";
import dotenv from "dotenv";

dotenv.config();
const production = !process.env.ROLLUP_WATCH;

export default {
	input: "src/main.js",
	preserveEntrySignatures: false,
	output: {
		sourcemap: !production,
		format: "iife",
		name: "app",
		file: "public/build/bundle.js",
	},
	plugins: [
		svelte({
			preprocess: sveltePreprocess({
				sourceMap: !production,
				defaults: { style: "scss" },
				postcss: {
					plugins: [require("autoprefixer")()],
				},
				replace: [
					["SQUARE_APP", process.env.SQUARE_APP],
					["SQUARE_LOCATION", process.env.SQUARE_LOCATION],
					["ADDRESS", process.env.ADDRESS],
				],
			}),
			dev: !production,
			css: css => css.write("bundle.css", !production),
			onwarn: (warning, handler) => {
				if (warning.code.includes("a11y")) return;
				handler(warning);
			},
		}),
		resolve({
			browser: true,
			dedupe: ["svelte"],
		}),
		commonjs(),
		production &&
			babel({
				extensions: [".js", ".mjs", ".html", ".svelte"],
				runtimeHelpers: true,
				exclude: ["node_modules/@babel/**", "node_modules/core-js/**"],
				presets: [
					[
						"@babel/preset-env",
						{
							useBuiltIns: "entry",
							corejs: 3,
						},
					],
				],
				plugins: [
					"@babel/plugin-syntax-dynamic-import",
					"@babel/plugin-proposal-optional-chaining",
					"@babel/plugin-proposal-object-rest-spread",
				],
			}),
		!production && serve(),
		!production && livereload("public"),
		production && terser(),
	],
	watch: {
		clearScreen: false,
	},
};

function serve() {
	let server;
	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require("child_process").spawn(
				"npm",
				["run", "start", "--", "--dev"],
				{
					stdio: ["ignore", "inherit", "inherit"],
					shell: true,
				}
			);
			process.on("SIGTERM", toExit);
			process.on("exit", toExit);
		},
	};
}
