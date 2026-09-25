declare module 'text-encoding' {
  export class TextEncoder {
    readonly encoding: string
    encode(input?: string): Uint8Array
    encodeInto(input: string, destination: Uint8Array): TextEncoderEncodeIntoResult
  }

  export class TextDecoder {
    readonly encoding: string
    readonly fatal: boolean
    readonly ignoreBOM: boolean
    constructor(label?: string, options?: TextDecoderOptions)
    decode(input?: AllowSharedBufferSource, options?: TextDecodeOptions): string
  }
}
