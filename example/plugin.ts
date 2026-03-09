import type { BunSolidPluginOptions } from "@purpleduck/bun-plugin-solid2";
import { solid_plugin } from "@purpleduck/bun-plugin-solid2";

const options: BunSolidPluginOptions = {
	dev: true,
	// ssr: false,
	hot: true,
};

export default solid_plugin(options);
