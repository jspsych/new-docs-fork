import type {Config} from '@docusaurus/types';
import {defineJspsychConfig} from '@jspsych/docusaurus-preset';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)
//
// The shared jsPsych family defaults (classic preset wiring, @jspsych/
// docusaurus-theme, brand CSS + self-hosted fonts, prism themes, color-mode,
// blog feed options, the branded footer skeleton, and the appended search /
// ecosystem-switcher / GitHub navbar items) all live in defineJspsychConfig.
// Only the facts specific to this site are spelled out below.

// Edit-this-page target. Points at this testing fork; change the org/repo when
// moving to the production jsPsych repo.
const editUrl = 'https://github.com/jodeleeuw/docusaurus-test/tree/main/docs/';

const config: Config = defineJspsychConfig({
  title: 'jsPsych',
  tagline: 'Build browser-ready experiments',
  favicon: 'img/jspsych-favicon.png',

  // Set the production url of your site here
  url: 'https://jodeleeuw.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/docusaurus-test/', // testing fork; change when moving to production

  // GitHub pages deployment config.
  organizationName: 'jodeleeuw', // Usually your GitHub org/user name.
  projectName: 'docusaurus-test', // Usually your repo name.

  // Social card
  image: 'img/docusaurus-social-card.jpg',

  // The factory appends the GitHub icon link to the right of the navbar.
  githubUrl: 'https://github.com/jspsych/jspsych',

  docs: {
    lastVersion: 'current',
    versions: {
      current: {
        label: 'Current Version',
        path: 'current',
      },
      '0.1': {
        label: 'Version 0.1',
        path: '0.1',
      },
      '0.0': {
        label: 'Version 0.0',
        path: '0.0',
      },
    },
    sidebarPath: './sidebars.ts',
    editUrl,
  },

  blog: {
    showReadingTime: true,
    feedOptions: {
      type: ['rss', 'atom'],
      xslt: true,
    },
    editUrl,
    // Useful options to enforce blogging best practices
    onInlineTags: 'warn',
    onInlineAuthors: 'warn',
    onUntruncatedBlogPosts: 'warn',
  },

  navbar: {
    title: 'jsPsych',
    // The theme's Logo component renders the animated brain mark, but it reads
    // this entry for the alt text and home href — keep it so the alt is preserved.
    logo: {
      alt: 'jsPsych Logo',
      src: 'img/jspsych-logo-no-text.svg',
    },
    // Only the site's own items here. The factory appends search + ecosystem
    // switcher + GitHub to the right in the family-standard order.
    items: [
      {
        type: 'docsVersionDropdown',
        versions: ['current', '0.1', '0.0'],
        position: 'right',
      },
      {
        // if a link is referenced in a sidebar, it will link to that page in
        // the corresponding docSidebar type
        type: 'docSidebar',
        sidebarId: 'gettingStarted',
        position: 'left',
        label: 'Getting Started',
      },
      {
        type: 'docSidebar',
        sidebarId: 'learn',
        position: 'left',
        label: 'Learn',
      },
      {
        type: 'docSidebar',
        sidebarId: 'extend',
        position: 'left',
        label: 'Extend',
      },
      {
        type: 'docSidebar',
        sidebarId: 'reference',
        position: 'left',
        label: 'References',
      },
      {
        type: 'docSidebar',
        sidebarId: 'community',
        position: 'left',
        label: 'Community',
      },
      {
        type: 'docSidebar',
        sidebarId: 'about',
        position: 'left',
        label: 'About',
      },
    ],
  },

  // The preset's shared Algolia defaults currently match these keys; kept
  // explicit here so the site's search is self-documenting. These will collapse
  // into the preset default once the shared ecosystem index exists.
  algolia: {
    appId: 'G73E906FBW',
    apiKey: '677a628d1fa8113d588d4e5c2ae9a83d',
    indexName: 'docusaurus_jspsych',
    contextualSearch: false,
  },

  footerLinks: [
    {
      title: 'Docs',
      items: [
        {
          label: 'Get Started',
          to: '/docs/current/getting-started/hello-world',
        },
        {
          label: 'Reference',
          to: '/docs/current/reference/core',
        },
        {
          label: 'Plugin Catalog',
          to: '/docs/current/reference/plugins',
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          label: 'Support',
          to: '/docs/current/community/support',
        },
        {
          label: 'GitHub Discussions',
          href: 'https://github.com/jspsych/jspsych/discussions',
        },
        {
          label: 'Contribute',
          href: 'https://github.com/jspsych/jspsych-contrib',
        },
      ],
    },
    {
      title: 'More',
      items: [
        {
          label: 'Blog',
          to: '/blog',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/jspsych/jspsych',
        },
      ],
    },
  ],
  copyright: `Copyright © ${new Date().getFullYear()} jsPsych contributors. Built with Docusaurus.`,

  extraConfig: {
    // This site links across doc versions in ways Docusaurus can't always
    // resolve at build time; downgrade broken links to warnings.
    onBrokenLinks: 'warn',
  },
});

export default config;
