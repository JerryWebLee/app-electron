# Vue 3 + Electron + Node.js Project

This project is a desktop application framework built with Vue 3, Electron, and Node.js.

## Project Setup

### Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### Development

To start the application in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

## Building for Production

### Build for Current Platform

To build the application for your current operating system:

```bash
npm run build
```

### Cross-Platform Build

#### macOS

To build for macOS (creates `.dmg` and `.zip`):

```bash
npm run build:mac
```

_Note: Building for macOS typically requires running on a macOS machine._

#### Windows

To build for Windows (creates `.exe` and `.nsis` installer):

```bash
npm run build:win
```

_Note: You can build for Windows from macOS/Linux, but Wine may be required for some features._

#### Linux

To build for Linux (creates `.AppImage`, `.deb`, etc.):

```bash
npm run build:linux
```

## Project Structure

- `electron/`: Main process and preload scripts.
- `src/`: Renderer process (Vue 3 application).
- `dist/`: Output directory for the renderer build.
- `dist-electron/`: Output directory for the main process build.
- `release/`: Output directory for the packaged application installers.
