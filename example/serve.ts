import html from "./index.html";

Bun.serve({
	routes: {
		"/*": html,
		"/favicon.ico": new Response(null, { status: 200 }),
	},
	hostname: "0.0.0.0",
});
