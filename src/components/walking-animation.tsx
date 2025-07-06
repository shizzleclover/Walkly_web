import { cn } from "@/lib/utils";
import { Footprints } from "lucide-react";

export function WalkingAnimation({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <style>
        {`
          @keyframes walk {
            0%, 100% { opacity: 0; transform: translateY(0) scale(1); }
            10% { opacity: 1; }
            50% { transform: translateY(-8px) scale(1.05); }
            90% { opacity: 1; }
          }
          .footprint-1 {
            animation: walk 2s ease-in-out infinite;
          }
          .footprint-2 {
            animation: walk 2s ease-in-out infinite;
            animation-delay: 1s;
          }
        `}
      </style>
      <div className="flex gap-4 text-primary h-16">
        <Footprints className="w-12 h-12 -scale-x-100 footprint-1" />
        <Footprints className="w-12 h-12 footprint-2" />
      </div>
    </div>
  );
}
