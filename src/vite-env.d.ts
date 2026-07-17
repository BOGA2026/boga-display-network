/// <reference types="vite/client" />
/// <reference types="vite-imagetools/client" />

declare module "*?responsive" {
  const srcset: string;
  export default srcset;
}
declare module "*&responsive" {
  const srcset: string;
  export default srcset;
}
