hook.js:608  Server  [Server Action Error] Falha ao ler o cache: deputados-cache.json Error: ENOENT: no such file or directory, open 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\bancoDados\monitordespesas\congressoNacional\cache\deputados-cache.json'
    at <anonymous> (data-actions.ts:48:18)
    at getDeputados (data-actions.ts:101:21)
    at DeputadosV2Page (page.tsx:32:32)
    at resolveErrorDev (react-server-dom-turbopack-client.browser.development.js:3113:48)
    at getOutlinedModel (react-server-dom-turbopack-client.browser.development.js:2364:22)
    at parseModelString (react-server-dom-turbopack-client.browser.development.js:2563:15)
    at Object.<anonymous> (react-server-dom-turbopack-client.browser.development.js:4457:18)
    at JSON.parse (<anonymous>)
    at initializeModelChunk (react-server-dom-turbopack-client.browser.development.js:1779:26)
    at getOutlinedModel (react-server-dom-turbopack-client.browser.development.js:2269:11)
    at parseModelString (react-server-dom-turbopack-client.browser.development.js:2659:15)
    at Array.<anonymous> (react-server-dom-turbopack-client.browser.development.js:4457:18)
    at JSON.parse (<anonymous>)
    at initializeModelChunk (react-server-dom-turbopack-client.browser.development.js:1779:26)
    at resolveConsoleEntry (react-server-dom-turbopack-client.browser.development.js:3404:13)
    at processFullStringRow (react-server-dom-turbopack-client.browser.development.js:4320:11)
    at processFullBinaryRow (react-server-dom-turbopack-client.browser.development.js:4216:7)
    at processBinaryChunk (react-server-dom-turbopack-client.browser.development.js:4429:15)
    at progress (react-server-dom-turbopack-client.browser.development.js:4700:9)
overrideMethod @ hook.js:608
react-dom-client.development.js:5528 Uncaught Error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <LoadingBoundary name="deputados/" loading={null}>
      <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
        <RedirectBoundary>
          <RedirectErrorBoundary router={{...}}>
            <InnerLayoutRouter url="/gastos/de..." tree={[...]} params={{}} cacheNode={{lazyData:null, ...}} ...>
              <SegmentViewNode type="page" pagePath="/packages/...">
                <SegmentTrieNode>
                <DeputadosV2Page>
                  <DeputadosClient deputados={[...]} total={0} partidos={[...]} ufs={[...]} stats={{total:0, ...}} ...>
                    <div className="container ...">
                      <div>
                      <div className="grid grid-...">
                        <_c>
                        <_c>
                          <div ref={null} className="rounded-2x...">
                            <_c8 className="pt-6">
                              <div ref={null} className="p-6 pt-6">
                                <div className="text-2xl font-bold">
+                                 R$ 0
-                                 R$ 0,0
                                ...
                        ...
                      ...
              ...
            ...

    at throwOnHydrationMismatch (react-dom-client.development.js:5528:11)
    at prepareToHydrateHostInstance (react-dom-client.development.js:5624:21)
    at completeWork (react-dom-client.development.js:12910:15)
    at runWithFiberInDEV (react-dom-client.development.js:984:30)
    at completeUnitOfWork (react-dom-client.development.js:19037:19)
    at performUnitOfWork (react-dom-client.development.js:18918:11)
    at workLoopConcurrentByScheduler (react-dom-client.development.js:18895:9)
    at renderRootConcurrent (react-dom-client.development.js:18877:15)
    at performWorkOnRoot (react-dom-client.development.js:17739:11)
    at performWorkOnRootViaSchedulerTask (react-dom-client.development.js:20288:7)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:45:48)
