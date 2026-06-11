import { PixelMark } from "@/components/qr/pixel-mark";

export function Maintenance() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-5">
        <div className="glass-panel grid size-20 place-items-center rounded-[1.75rem]">
          <PixelMark className="size-9" />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            QR Pixel is under maintenance
          </h1>
          <p className="text-sm/relaxed text-muted-foreground">
            The generator is temporarily paused while updates are being applied.
            Please check back shortly.
          </p>
        </div>
      </div>
    </main>
  );
}
