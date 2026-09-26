# QVAC Sentiment Analyzer

Paste any text and an on-device AI classifies its sentiment (positive, negative, neutral, or mixed) with a one-sentence explanation.

## Run

```bash
npm install
npm start
```

Then open http://localhost:29515

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads a local model with `loadModel()`, runs analysis with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

## License

MIT
