declare module 'node:fs' {
  export const createReadStream: (...args: any[]) => any
  const fsDefault: any
  export default fsDefault
}

declare module 'node:fs/promises' {
  const fsPromises: any
  export default fsPromises
}

declare module 'node:path' {
  const pathApi: any
  export = pathApi
}

declare module 'node:crypto' {
  const cryptoApi: any
  export = cryptoApi
}

declare const process: any
declare const __dirname: string
