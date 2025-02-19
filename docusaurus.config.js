// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Simon Painter',
  tagline: 'Somewhere to keep things',
  favicon: 'img/favicon.ico',

  url: 'https://www.simonpainter.com',
  baseUrl: '/',

  organizationName: 'simonpainter',
  projectName: 'my-website',

  // Change this to 'warn' temporarily to help debug
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false,
        blog: {
          editUrl: 'https://github.com/simonpainter/my-website/blob/main/',
          routeBasePath: '/',
          blogTitle: 'Simon Painter',
          blogDescription: 'A place to keep things',
          postsPerPage: 'ALL',
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
              
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      navbar: {
        title: 'A place to keep things',
        logo: {
          src: 'img/logo.svg',
          alt: 'Site Logo'
        },
        items: [
          {
            href: 'https://github.com/simonpainter',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: '/tags/azure',
            label: 'Azure',
            position: 'left',
          },
          {
            href: '/tags/aws',
            label: 'AWS',
            position: 'left',
          },
          {
            href: '/tags/business',
            label: 'Business',
            position: 'left',
          },
          {
            href: '/tags/programming',
            label: 'Programming',
            position: 'left',
          },
          {
            href: '/tags/security',
            label: 'Security',
            position: 'left',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'About me',
            items: [
              {
                label: 'Github',
                href: 'https://github.com/simonpainter',
              },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/in/sipainter/',
              },
            ],
          },
          {
            title: 'Activities',
            items: [
              {
                label: 'Refried Bean',
                href: 'https://www.refriedbean.uk',
              },
              {
                label: 'Connectivity Matters',
                href: 'https://www.connectivitymatters.uk',
              },
            ],
          }

        ],
        copyright: `Copyright © ${new Date().getFullYear()} Simon Painter`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};



export default config;
