export default function IconBadge({
  icon: Icon,
  colorClass = 'text-slate-600',
  size = 'md',
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`flex items-center justify-center rounded-full border shadow-inner ${className}`}>
      {Icon && <Icon className={`${sizeClasses[size]} ${colorClass}`} />}
    </div>
  );
}
