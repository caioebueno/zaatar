"use client";

import clsx from "clsx";
import { FiImage } from "react-icons/fi";

type TProductImage = {
  alt: string;
  className?: string;
  iconClassName?: string;
  src?: string | null;
};

const ProductImage: React.FC<TProductImage> = ({
  alt,
  className,
  iconClassName,
  src,
}) => {
  if (src) {
    return <img src={src} alt={alt} className={className} />;
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
