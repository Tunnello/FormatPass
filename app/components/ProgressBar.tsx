interface ProgressBarProps {
  progress: number
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full bg-surface-strong rounded-full h-2 mb-6 overflow-hidden">
      <div
        className="bg-accent h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
