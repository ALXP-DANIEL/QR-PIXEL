import { cn } from "@/lib/utils";

export function PixelMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 5 5"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      className={cn("text-foreground", className)}
    >
      <path fillRule="evenodd" d="M0 0h5v5H0zM1 1h3v3H1z" />
      <path d="M2 2h1v1H2z" />
    </svg>
  );
}
