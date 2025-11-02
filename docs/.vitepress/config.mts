import { createRequire } from 'module'
import { defineConfig, type DefaultTheme } from 'vitepress'

const require = createRequire(import.meta.url)
const pkg = require('vitepress/package.json')

export default defineConfig({
  base: '/tacozipw/',
  title: 'tacozip',
  lang: 'en-US',

  themeConfig: {
    nav: nav(),
    search: {
      provider: 'local',
    },
    sidebar: {
      '/en/python/': { 
        base: '/en/python/', 
        items: sidebarPython() 
      }
    },
    editLink: {
      pattern: 'https://github.com/tacofoundation/tacozipw/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tacofoundation/tacozip' },
      { icon: 'twitter', link: 'https://x.com/isp_uv_es' },
      { 
        icon: {
          svg: `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm8-7l8-5V6l-8 5l-8-5v2z"/></svg>`
        },
        link: 'mailto:csaybar@gamil.com'
      }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: '© 2025 tacozip | open source for a better tomorrow'
    }
  },
  vite: {
    css: {
      preprocessorOptions: {
        css: {
          additionalData: `@import "./custom.css";`
        }
      }
    }
  },
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: 'Python',
      link: '/en/python/overview/',
      activeMatch: '/en/python/'
    },
    {
      text: 'R',
      link: '#',
    },
    {
      text: 'Julia',
      link: '#',
    },
  ]
}


function sidebarPython(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'API Reference',
      items: [
        { text: 'Overview', link: 'overview' },
        { text: 'Getting started', link: 'getting-started' },
        { text: 'TACO header', link: 'header' },
        { text: 'Python client', link: 'client' },
        { text: 'Python API', link: 'python-api-reference' },
        { text: 'Use cases', link: 'use-cases' },
        { text: 'FAQ', link: 'faq' },
      
      ]
    },
    {
      // text: 'External',
      items: [
        { text: 'Changelog', link: 'CHANGELOG.md'},
        { text: 'Contributing', link: 'CONTRIBUTING.md'}
      
      ]
    }
  ]
}

