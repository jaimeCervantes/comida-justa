const animatedIndicator =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shine_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-pw-white/60 dark:before:via-pw-white/20 before:to-transparent";

export default function FoodDetailSkeleton({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`${animatedIndicator} relative overflow-hidden rounded-xl bg-gray-100 dark:bg-pw-gray p-2 shadow-sm ${className}`}
    >
      <div className="h-[10%] w-full rounded-md bg-gray-200 dark:bg-gray-400 mb-4" />
      <div className="h-[63%] w-full rounded-md bg-gray-200 dark:bg-gray-400 mb-4" />
      <div className="h-[20%]">
        <div className="w-full rounded-md bg-gray-200 dark:bg-gray-400 h-[30%] mb-2" />
        <div className="w-full rounded-md bg-gray-200 dark:bg-gray-400 h-[30%] mb-2" />
        <div className="w-full rounded-md bg-gray-200 dark:bg-gray-400 h-[30%] mb-2" />
      </div>
    </div>
  );
}
