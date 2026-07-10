"use client";

import clsx from "clsx";
import { FiImage } from "react-icons/fi";

type TProductImage = {
  alt: string;
  className?: string;
  iconClassName?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  src?: string | null;
};

function normalizeProductImageSrc(src: string): string {
  try {
    const parsed = new URL(src);
    if (parsed.pathname.startsWith("/api/bucket/")) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return src;
  } catch {
    return src;
  }
}

const ProductImage: React.FC<TProductImage> = ({
  alt,
  className,
  iconClassName,
  priority,
  sizes,
  src,
}) => {
  const normalizedSrc = src ? normalizeProductImageSrc(src) : null;

  if (normalizedSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={normalizedSrc}
        alt={alt}
        width={1200}
        height={1200}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        sizes={sizes || "(max-width: 1024px) 50vw, 33vw"}
        className={className}
      />
    );
  }

  return (
    <div
      aria-label={alt}
      role="img"
      className={clsx(
        "flex items-center justify-center bg-foreground text-lightText",
        className,
      )}
    >
      <FiImage className={clsx("h-8 w-8 opacity-60", iconClassName)} />
    </div>
  );
};

export default ProductImage;
