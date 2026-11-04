# Talisman MIDI Arcade

<p align="center">
  <img src="../../packages/talisman-assets/assets/logo-animated.svg" alt="Talisman Arcade Logo" height="200">
</p>

This application open-source and is part of the
[Talisman MIDI Project](https://github.com/ArcaneWizards/talisman).

It contains a number of arcade-like games that can be played on compatible
MIDI controllers.

## Headless / CLI Version

[![](https://img.shields.io/npm/v/@arcanewizards/talisman-arcade)](https://www.npmjs.com/package/@arcanewizards/talisman-arcade)

This application can be installed and run via NPM, allowing the application UI to be accessed via a browser on any device on the same network.

For example, you can have Talisman Lab running on a Headless Mac Mini.

Make sure you have Node v22 or higher installed, and then use `npx` to download and install the desired version:

```sh
npx @arcanewizards/talisman-arcade@latest
```

Or use `pnpm`, `npm`, or `yarn` to install the package `@arcanewizards/talisman-arcade` globally,
and then run the app:

```sh
npm install -g @arcanewizards/talisman-arcade@latest
talisman-arcade
```

## Contributing

We encourage contributions to this repository,
in particular to add or improve support for different MIDI devices,
given that it will be impossible for the maintainers to build & test support for
all MIDI devices, as there are simply too many of them!

Please check out our [contributing guidelines](https://github.com/ArcaneWizards/talisman/blob/main/CONTRIBUTING.md)
before submitting any pull requests though,
in particular we require you to have an issue already assigned to you by a
maintainer before you submit any pull requests.

In addition to code contributions,
please feel to [open an issue](https://github.com/ArcaneWizards/open-source/issues)
with any feedback that you have,
or any devices that you'd like to see us add support for.

## Community & Support

We have a [discussion board open](https://github.com/ArcaneWizards/talisman/discussions),
where you can share ideas, or showcase how you've been using the app.

If there's a particular device you are having issues with,
or would like to think about integrating into Arcane,
feel free to start a discussion [on the MIDI Devices board](https://github.com/ArcaneWizards/talisman/discussions/categories/midi-devices).

If you need any help using the app,
please feel free to ask [on the dedicated Help & Support board](https://github.com/ArcaneWizards/talisman/discussions/categories/help-support).

Beyond this,
we also have a [discord community](https://arcanewizards.com/discord),
where you are free to discuss anything and everything MIDI & Arcane.

## License

MIT License

Copyright (c) 2026 Arcane Wizards Ltd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
