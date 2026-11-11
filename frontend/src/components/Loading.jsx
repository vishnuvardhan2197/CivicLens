export function Loading({ message = 'Loading...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-spinner"></div>
        <p className="loading-text">{message}</p>
      </div>
    )
  }

  return (
    <div className="loading-inline">
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  )
}

export default Loading
