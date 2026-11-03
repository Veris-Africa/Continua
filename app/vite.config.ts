import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "node:url";
import {execFileSync} from 'node:child_process';

const appRoot = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  let revision='unknown';try{const value=execFileSync('git',['rev-parse','HEAD'],{cwd:appRoot,encoding:'utf8',windowsHide:true}).trim();if(/^[a-f0-9]{40}$/i.test(value))revision=value;}catch{/* Source archives explicitly report unknown. */}
  const publicEnv=loadEnv(mode,appRoot,'VITE_');
  if(mode==='production'&&(publicEnv.VITE_AUTH_PROVIDER!=='neon-managed'||!/^https:\/\/ep-(?:nameless-voice-b4ygobrp|purple-salad-b4qr5err)\.neonauth\.c-6\.us-east-2\.aws\.neon\.tech\/neondb\/auth$/.test(publicEnv.VITE_NEON_AUTH_BASE_URL??'')))throw Error('Production build requires the pinned Neon managed Auth provider and issuer');
  return {
  root: appRoot,
  envDir: appRoot,
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    cors: true,
    hmr: {
      clientPort: 443,
      protocol: "wss",
    },
  },
  define:{'import.meta.env.VITE_BUILD_REVISION':JSON.stringify(revision)},
  plugins: [react(),{name:'continua-release-metadata',generateBundle(){this.emitFile({type:'asset',fileName:'release.json',source:JSON.stringify({revision})});}}],
  resolve: {
    alias: {
      "@": path.resolve(appRoot, "src"),
    },
  },
};});
