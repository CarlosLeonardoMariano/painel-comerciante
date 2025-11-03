/** @type {import('next').NextConfig} */
const nextConfig = {
  serverActions: {
    bodySizeLimit: '100mb', // aqui está certo!
  },
};

export default nextConfig;
