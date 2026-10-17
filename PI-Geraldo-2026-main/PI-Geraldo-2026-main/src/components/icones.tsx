import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

const base = (props: Props): Props => ({
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...props,
})

export const IconeDashboard = (p: Props) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="8" height="10" rx="1.5" />
    <rect x="13" y="3" width="8" height="6" rx="1.5" />
    <rect x="13" y="11" width="8" height="10" rx="1.5" />
    <rect x="3" y="15" width="8" height="6" rx="1.5" />
  </svg>
)

export const IconeBusca = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
)

export const IconePerfil = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1z" />
  </svg>
)

export const IconeConversas = (p: Props) => (
  <svg {...base(p)}>
    <path d="M4 5h16v11H9l-5 4z" />
    <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" strokeWidth={2.4} />
  </svg>
)

export const IconePlanos = (p: Props) => (
  <svg {...base(p)}>
    <path d="M6 4h12l3 5-9 11L3 9z" />
    <path d="M3 9h18M9 4l3 16 3-16" />
  </svg>
)

export const IconeSair = (p: Props) => (
  <svg {...base(p)}>
    <path d="M14 4h5v16h-5" />
    <path d="M10 8l-4 4 4 4M6 12h10" />
  </svg>
)

export const IconeSino = (p: Props) => (
  <svg {...base(p)}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" />
    <path d="M10 21h4" />
  </svg>
)

export const IconeEnviar = (p: Props) => (
  <svg {...base(p)}>
    <path d="M4 12 20 4l-6 16-3-7z" />
  </svg>
)

export const IconeVoltar = (p: Props) => (
  <svg {...base(p)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)
