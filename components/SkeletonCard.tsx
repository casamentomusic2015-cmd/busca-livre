export function SkeletonCard() {
  return (
    <div className="bg-surface border border-borda rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-borda" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-borda rounded w-full" />
        <div className="h-3 bg-borda rounded w-3/4" />
        <div className="h-5 bg-borda rounded w-1/2 mt-3" />
        <div className="h-3 bg-borda rounded w-2/3" />
        <div className="h-8 bg-borda rounded w-full mt-2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
