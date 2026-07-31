import { useEffect, useRef, useState, VideoHTMLAttributes, forwardRef, useImperativeHandle } from "react";
import { attemptAutoplay } from "@/lib/autoplay";

type Source = { src: string; type: string };

interface LazyVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, "src" | "children"> {
  sources: Source[];
  /** Root margin for IntersectionObserver. Default: load ~one viewport ahead. */
  rootMargin?: string;
  /** Optional poster shown before the sources are attached. */
  posterEl?: React.ReactNode;
}

/**
 * Video component that defers attaching <source> tags (and therefore the
 * network request) until the element is close to the viewport. This lets the
 * landing page carry many short demo clips without paying their bandwidth up
 * front. Once loaded, the video stays mounted so it plays normally.
 *
 * Usage mirrors <video>: pass autoPlay/muted/loop/etc. as props.
 */
const LazyVideo = forwardRef<HTMLVideoElement, LazyVideoProps>(function LazyVideo(
  { sources, rootMargin = "200px", posterEl, preload = "metadata", ...videoProps },
  externalRef
) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  useImperativeHandle(externalRef, () => localRef.current as HTMLVideoElement, []);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = localRef.current;
    if (!el || inView) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);

  // When the sources become attached we call load() so the browser picks them up,
  // then run the autoplay escalation (muted fallback + retry on interaction).
  useEffect(() => {
    if (!inView) return;
    const el = localRef.current;
    if (!el) return;
    try {
      el.load();
    } catch {
      /* noop */
    }
    if (!videoProps.autoPlay) return;
    return attemptAutoplay(el);
  }, [inView, videoProps.autoPlay]);

  return (
    <>
      {posterEl && !inView ? posterEl : null}
      <video ref={localRef} preload={inView ? preload : "none"} {...videoProps}>
        {inView
          ? sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)
          : null}
      </video>
    </>
  );
});

export default LazyVideo;
