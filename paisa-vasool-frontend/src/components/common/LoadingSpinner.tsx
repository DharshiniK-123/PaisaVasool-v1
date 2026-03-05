interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
export default function LoadingSpinner({ fullScreen, size = 'md' }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div
      className={`${sizes[size]} border-2 border-transparent border-t-[var(--color-accent)] rounded-full animate-spin`}
    />
  );
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg)]">
        {spinner}
      </div>
    );
  }
  return spinner;
}
