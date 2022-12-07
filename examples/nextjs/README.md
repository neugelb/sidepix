# Next.js SSG example

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app), with a couple of modifications to make sidepix work.

## How to run

Export the site and serve it:
```
$ yarn export && yarn serve
```

There are two pages:

- `<picture>` example: [http://localhost:8080](http://localhost:8080)
- `next/image` example: [http://localhost:8080/next-image](http://localhost:8080/next-image)

Images will be processed in development mode, too. Just reload until they're generated and cached.
```
$ yarn dev
```

## Notable configuration

### Make `PictureConf` available to the processing server

sidepix's optimization server needs to import a `PictureConf` object at runtime, so we have to compile it separately from Next.js's bundles.

Add a `build-conf` script to `package.json`:
```json
"build-conf": "tsc --skipLibCheck src/components/PictureConf.ts --outDir conf",
"build": "yarn build-conf && next build",
```

### Strip Node.js code from the frontend bundle

In `next.config.js`:
```typescript
webpack: (config, { defaultLoaders }) => {
  config.module.rules.push({
    test: /node_modules\/sidepix\/.*\.js$/,
    use: defaultLoaders.babel,
  });

  return config;
},
```

### Wait for optimization jobs to complete before exporting

Call `sidepix-wait` after `next build`:
```json
"build": "yarn build-conf && next build && sidepix-wait",
```

### Handle SSR

In a [custom server](https://nextjs.org/docs/advanced-features/custom-server) `server.ts`:

```typescript
if (pathname?.startsWith('/media/')) {
  await waitImage('public' + pathname);
}

await handle(req, res, parsedUrl);
```

Call the custom server instead of `next dev` or `next start`:
```json
"dev": "yarn build-conf && yarn build-custom-server && node server.js",
"start": "NODE_ENV=production node server.js",
```
