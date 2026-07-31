import type { ImgHTMLAttributes } from "react";

interface PictureImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** srcset AVIF (import ...?responsive-avif) */
  avifSrcSet?: string;
  /** srcset WebP (import ...?responsive) */
  webpSrcSet?: string;
  /** Fallback src (import directo del .webp) */
  src: string;
  sizes?: string;
}

/**
 * <picture> con negociación AVIF → WebP → src original.
 * El navegador elige la primera fuente que soporta, así que Safari/Chrome
 * modernos bajan AVIF (más liviano) y el resto cae en WebP sin JS.
 */
const PictureImage = ({ avifSrcSet, webpSrcSet, src, sizes, ...imgProps }: PictureImageProps) => (
  <picture>
    {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
    {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
    <img src={src} srcSet={webpSrcSet} sizes={sizes} {...imgProps} />
  </picture>
);

export default PictureImage;
