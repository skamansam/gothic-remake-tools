import path from "node:path";
import { fileURLToPath } from "node:url";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

const dirname =
	typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			twintrinsic: path.resolve(dirname, "../twintrinsic/src/lib"),
		},
	},
	server: {
		fs: {
			allow: [path.resolve(dirname, "..")],
		},
	},
	plugins: [sveltekit(), tailwindcss(), devtoolsJson()],
});
