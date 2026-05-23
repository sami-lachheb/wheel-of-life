export default function Card({
  title,
  description,
  score,
  color = 'green',
  children,
  className = '',
}) {
  const colorStyles = {
    green: 'border-green-500',
    gold: 'border-gold',
    gray: 'border-gray-300',
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${colorStyles[color]} ${className}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-primary">{title}</h3>
          {score !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Score:</span>
              <span className="text-2xl font-bold text-gold">{score}/10</span>
            </div>
          )}
        </div>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        {children}
      </div>
    </div>
  );
}
