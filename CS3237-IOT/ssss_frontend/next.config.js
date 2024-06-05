/** @type {import('next').NextConfig} */
const nextConfig = {};

//Add https://iotsecuresystem.s3.amazonaws.com as a domain to allow images to be loaded from it
nextConfig.images = {
  domains: ["iotsecuresystem.s3.amazonaws.com"],
};

module.exports = nextConfig;
