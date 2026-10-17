import { Link } from 'react-router'

export function Logo({ className = 'text-3xl', para = '/' }: { className?: string; para?: string }) {
  return (
    <Link to={para} className={`titulo leading-none ${className}`} aria-label="caisUp — início">
      cais<span className="text-rosa">Up</span>
    </Link>
  )
}
