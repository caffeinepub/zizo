# ZIZO Deployment Guide

## Critical: Production Build Requirements

**The frontend canister MUST serve the Vite build output (`frontend/dist/`), NOT the source files.**

### Understanding the Build Process

1. **Development** (`npm start`):
   - Vite dev server runs on `localhost:3000`
   - Serves source files directly: `/src/main.tsx`
   - Hot module replacement enabled

2. **Production** (`npm run build`):
   - Vite builds to `frontend/dist/`
   - Transforms `index.html` to reference bundled assets: `/assets/index-[hash].js`
   - **This `dist/` directory is what must be deployed**

## Automated Deployment Workflow (Recommended)

Use the provided deployment script to ensure all verification steps are executed:

