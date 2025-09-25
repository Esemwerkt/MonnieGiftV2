/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Force dynamic rendering to avoid build issues
  trailingSlash: false
}

module.exports = nextConfig