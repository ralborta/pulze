/** @type {import('next').NextConfig} */
const path = require('path')
const fs = require('fs')
const monorepoRoot = path.join(__dirname, '../../')
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  ...(fs.existsSync(path.join(monorepoRoot, 'pnpm-workspace.yaml')) && {
    outputFileTracingRoot: monorepoRoot,
  }),
}

module.exports = nextConfig
