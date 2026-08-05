
import SkeletonBox from './SkeletonBox'; 

export default function Card({ title, children, loading }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800  shadow-lg">
      {loading ? (
        // --- ESTADO DE CARGA (ESQUELETO) ---
        <div className="animate-pulse space-y-4">
          <SkeletonBox className="h-6 w-1/3" />
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-5/6" />
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-5">{title}</h3>
          <div>{children}</div>
        </div>
      )}
    </div>
  );
}