/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://wp-plate.alliedengine.co.uk',
  generateRobotsTxt: true,
  exclude: ['/api/*'],
  robotsTxtOptions: {
    additionalSitemaps: [],
  },
};
