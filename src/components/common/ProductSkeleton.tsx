import { Skeleton } from "@/components/ui/skeleton";

interface ProductSkeletonProps {
  count?: number;
}

export function ProductSkeleton({ count = 6 }: ProductSkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          {/* Product Image */}
          <Skeleton className="aspect-square w-full rounded-lg" />
          
          {/* Product Title */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Price */}
          <Skeleton className="h-5 w-1/3" />
          
          {/* Add to Cart Button */}
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function CategorySkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          {/* Category Image */}
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          
          {/* Category Title */}
          <Skeleton className="h-5 w-full" />
          
          {/* Product Count */}
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}