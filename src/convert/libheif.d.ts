// Minimal typings for the deep ESM entry of libheif-js's WASM build.
// The package only ships a `main` field, so this deep `.mjs` path is untyped;
// we declare just the slice of the HeifDecoder API the engine actually uses.
declare module "libheif-js/libheif-wasm/libheif-bundle.mjs" {
  interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(
      imageData: ImageData,
      callback: (out: ImageData | null) => void
    ): void;
    free?(): void;
  }

  interface HeifDecoder {
    decode(data: Uint8Array): HeifImage[];
  }

  interface LibHeifModule {
    HeifDecoder: new () => HeifDecoder;
  }

  const factory: (options?: Record<string, unknown>) => Promise<LibHeifModule>;
  export default factory;
}
