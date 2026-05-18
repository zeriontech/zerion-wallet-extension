![hero](https://github.com/zeriontech/zerion-wallet-extension/assets/2427087/a5afefae-9e00-47a6-bf66-a332757b3b1c)

## Zerion Extension

Your crypto wallet for everything onchain.

Built for a better Web3 browsing experience in a multichain world with advanced onchain security. Over 550K self-custodial humans trust Zerion each month to explore every layer of web3.

## Security Audits

Leading security firms have independently audited the Zerion Extension: [Cure-53](https://cure53.de/), [Secfault](https://secfault-security.com/), [SlowMist](https://www.slowmist.com/), and [Zokyo](https://www.zokyo.io/). [Learn more](https://zerion.io/security) about Zerion's commitment to security and user safety.

## Install

The Zerion Extension is [available](https://chrome.google.com/webstore/detail/zerion-wallet-for-web3-nf/klghhnkeealcohjjanjjdaeeggmfmlpl) for Chromium-based browsers.

You can also download the latest build of the Zerion Extension from [here](https://github.com/zeriontech/zerion-wallet-extension/releases/latest).

## Development

### Prerequisites

- Install [npm](https://www.npmjs.com/get-npm)

### 1. Set Up Node

This project requires Node.js version >=20.10 and npm >=11.10. If you don't have Node.js installed, download and install it from the [official website](https://nodejs.org/). After installation, you can verify the versions using the following commands:

```shell
node --version
npm --version
```

### 2. Install Project Dependencies

Run the following command to install all the required dependencies. This command reads the `package.json` file and installs the necessary packages.

```shell
npm install
```

### Supply-chain cooldown

To reduce exposure to npm supply-chain attacks, this project enforces a **15-day cooldown**: `npm install` will only resolve dependency versions that were published more than 15 days ago. Compromised "fresh" releases are usually detected and unpublished within that window.

This is configured via `min-release-age=15` in the project's `.npmrc` and requires **npm >=11.10** (older npm silently ignores it). It applies to every `npm install` here and in CI.

The cooldown only affects version _resolution_ (i.e. updating `package-lock.json`); a plain install from an existing lockfile is unaffected.

**Overriding for an urgent fix.** If you need a security patch newer than 15 days, bypass the window for a single install and commit the result:

```shell
npm install <package>@<version> --min-release-age=0
```

Then commit the updated `package-lock.json` with a note explaining why.

### 3. Set Up Your .env File

Copy the `.env.example` file:

```shell
cp .env.example .env
```

### 4. Run the Extension

Start the extension locally with:

```shell
npm start
```

This command will build the extension in development mode. The output files are written to the `./dist` folder.

### 5. Import Extension

1. **Enable Developer Mode in Chrome**: Go to `chrome://extensions` and enable Developer mode.
2. **Import the Extension**: Click on "Load unpacked" and select the build folder (`./dist` from the previous step).

## License

[GPL-3.0](LICENSE) License

## Contact Us

Got questions, feedback, or need help? Chat with us here: https://help.zerion.io
