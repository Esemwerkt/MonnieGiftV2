/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Force dynamic rendering to avoid build issues
  trailingSlash: false,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
}

module.exports = nextConfig