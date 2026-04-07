"use client";

import clsx from "clsx";
import Image from "next/image";
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

const ProductImage: React.FC<TProductImage> = ({
  alt,
  className,
  iconClassName,
  priority,
  quality,
  sizes,
  src,
}) => {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={1200}
        priority={priority}
        quality={quality}
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
