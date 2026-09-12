import "dotenv/config";
import { createApp } from "./app";

// Vercel serverless entry point. This file is bundled by esbuild into
// `api/index.js` (see the `build:vercel-api` script and vercel.json) — it is
// NOT deployed as-is, and is not part of the local dev/production server
// (that's server/_core/index.ts). An Express app is a valid (req, res)
// handler, which is what Vercel's Node runtime expects as the default export.
const app = createApp();

export default app;
