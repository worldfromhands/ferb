import logoUrl from "@/assets/ehxis-logo.jpeg";

export function EhxisLogo({
  className = "",
  color = "#ffffff",
}: {
  className?: string;
  color?: string;
}) {
  // Use the JPEG as a luminance mask so we can tint the white mark any color
  // (white pixels in the source become visible, black background drops out).
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: color,
        WebkitMaskImage: `url(${logoUrl})`,
        maskImage: `url(${logoUrl})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
