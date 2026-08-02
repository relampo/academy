import logoUrl from "../assets/performance-latam-logo.jpeg";

type BrandMarkProps = {
  size?: "normal" | "large";
};

export function BrandMark({ size = "normal" }: BrandMarkProps) {
  return (
    <img
      className={`brand-mark brand-mark-${size}`}
      src={logoUrl}
      alt="Performance LATAM"
    />
  );
}
