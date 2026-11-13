export type Project = {
  name: string
  description: string
  url: string
}

export const about = {
  name: 'Diogo Ramos',
  introduction:
    'Toronto-based Computer Science student at Toronto Metropolitan University (TMU), with a full-stack web development diploma from Lighthouse Labs.',
  focus:
    'Builds passion projects with AI pair programming (Cursor agents) under his direction.',
} as const

export const projects: readonly Project[] = [
  {
    name: 'code-racer',
    description:
      'terminal-aesthetic TypeRacer for code snippets with WPM and accuracy, real-time multiplayer rooms planned',
    url: 'https://github.com/dioram-wq/code-racer',
  },
  {
    name: 'terminal-portfolio',
    description: 'this site, a terminal-style portfolio with a fake shell',
    url: 'https://github.com/dioram-wq/terminal-portfolio',
  },
  {
    name: 'pc-build-planner',
    description:
      'PC build planner with part compatibility checks (socket, RAM, PSU wattage, case clearance)',
    url: 'https://github.com/dioram-wq/pc-build-planner',
  },
  {
    name: 'algo-visualizer',
    description:
      'interactive algorithm and data structure visualizer for CS courses',
    url: 'https://github.com/dioram-wq/algo-visualizer',
  },
]
