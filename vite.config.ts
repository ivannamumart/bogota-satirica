import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';
// `npm run build` → sitio normal en dist/ ; `npm run build:single` → un único index.html autocontenido en dist-single/
export default defineConfig(({mode})=>({
  base:'./',
  server:{port:5173,open:true},
  plugins: mode==='single'?[viteSingleFile()]:[],
  build:{outDir: mode==='single'?'dist-single':'dist',target:'es2022',chunkSizeWarningLimit:1500}
}));
