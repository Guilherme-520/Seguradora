export function Alert({ type = 'error', message, onDismiss }) {
  if (!message) return null

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  }

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="font-bold leading-none opacity-70 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-brand-600 ${sizes[size]}`} />
  )
}

export function LoadingOverlay({ text = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <Spinner size="lg" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
