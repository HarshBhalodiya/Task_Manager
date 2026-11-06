import { useEffect, useState } from 'react'

/**
 * Fallback UI for React.lazy() / Suspense boundaries.
 *
 * The spinner is intentionally hidden for the first `delay` milliseconds so
 * that a chunk which loads quickly (cached / fast network) does not cause a
 * flash of loading UI. On slow connections the spinner appears after the
 * delay and gives the user meaningful feedback.
 */
function PageLoader({ label = 'Loading...', delay = 300 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  if (!visible) return null

  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export default PageLoader
