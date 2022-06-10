# Next.js SSG example

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app), with a couple of modifications to make **sidepix** work.

## Make `PictureConf` available to the processing server

**sidepix**'s optimization server needs to import a `PictureConf` object at runtime, so we have to compile it separately from Next.js's bundles.

In `package.json`:
```json
"build-conf": "tsc src/components/PictureConf.ts --outDir conf",
"build": "yarn build-conf && next build",
```

## Strip Node.js code from the frontend bundle

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

## Wait for optimization jobs to complete before exporting

In `package.json`:
```json
"export": "yarn build && sidepix-wait && next export",
```
