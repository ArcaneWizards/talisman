# Contributing Guidelines

Thank you for your interest in contributing to the Talisman MIDI Project!

There are two main ways to help, depending on what you want to do:

| I want to...                                                                       | Go to                                                    |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Check that a profile works with my hardware (no coding or cloning the repo needed) | [Testing profiles](#testing-profiles)                    |
| Write a new profile, fix a bug, or otherwise change the code                       | [Developing code & profiles](#developing-code--profiles) |

If you just want to _use_ the libraries in your own software, see
[How to use Talisman](./USAGE.md) instead.

## BEFORE OPENING A PULL REQUEST

Make sure that you have discussed with the project maintainers,
and have been given the go-ahead & assigned a
[github issue](https://github.com/ArcaneWizards/talisman/issues) to work on the
task.

The only exceptions to this rule are pull requests that only:

- Update or correct documentation
- Add apps to the list of apps using Talisman
- Add people to the list of testers that have tested a specific profile.

We are a small team running this project,
and want to make sure that any contributions fit-in to our roadmap,
are designed in a consistent way,
and are not likely to be rejected outright.
This is particularly important given the ambitious nature of this project.

Ensuring that a potential contribution has been discussed beforehand,
and the approach has been agreed-upon,
will increase the chances of contributions being accepted.

## Testing profiles

Profiles are only marked as "production ready" once enough members of the
community have verified that they work well with real hardware,
so testing is one of the most valuable ways to help, and it doesn't require any
programming knowledge.

You **do not need to clone this repository** to test a profile,
simply use [Talisman MIDI Lab](./apps/lab/).

### Setting up

1. Download the latest version of **Talisman MIDI Lab** for your platform from the
   [Lab README](./apps/lab/README.md) (macOS Apple Silicon / Intel, or Windows).

   Prefer the command line, or testing on a headless machine?
   You can also run it with Node.js v22 or higher:

   ```sh
   npx @talisman-midi/lab@latest
   ```

2. Connect your MIDI device, and open the app.
3. Click **View supported devices** to see which profiles exist and whether
   they are `READY` or `UNTESTED`. Profiles that are `UNTESTED` are the ones
   that most need testers!

### What to check

Work through each of the following checks (and then repeat them for each
**sub-profile** the device has, if it has more than one):

#### 1. The correct profile is auto-selected

- Choose your device under **Input Device**, and check that the matching
  **Output Device** (if your device has one) is selected too.
  The app warns you if the names differ, which is usually (but not always)
  a sign that the wrong output is selected.
- Check that the **Profile** (and **Sub-Profile**) that gets selected
  automatically is the correct one for your device.
  If nothing is selected, or the wrong profile is selected, that's a bug in the
  profile's auto-selection that you should report
  (including the exact names of your input & output devices,
  and your operating system).
- If the profile warns that the device needs to be in a different mode
  (e.g. many Launchpads), use the **Switch Mode** button that appears,
  and check that the device ends up in a usable state.

> Some profiles (such as the **Generic** profile) are intentionally never
> auto-selected, you'll need to pick them manually.

#### 2. The test patterns display properly

If your device has LEDs, lights, or motorised faders:

- Try each of the **Pattern** options (_Solid Color_ & _Rainbow_),
  and the **Lightness** options (a solid value, and the moving
  _Wave Direction_, both horizontal & vertical).
- Check that every light on the device lights up, with colours that make sense:
  Devices with limited palettes won't match exactly,
  but the result should look reasonable & consistent,
  and not have any LEDs that stay dark, flicker, or show the wrong colour.
- Check that no lights are left on, or stuck in a strange state, when you
  close the app or switch to a different profile.

#### 3. The device responds to interaction

- Set **Button Interaction** to _Row + Column_, press each button,
  and check that the right row / column highlights on the preview and on the device.
  Then repeat with _Cell_, and check that only the pressed button responds.
- Move every fader, encoder & knob, and press every button on the device,
  checking that each one is shown reacting correctly in the app,
  and that none of them are missing.

#### 4. Messages are being interpreted correctly

Click **Monitor MIDI Messages** to open the message monitor,
which lists the messages that were **received** from your device,
and the messages that were **sent** to it. Now interact with the device, and check that:

- Every control you touch produces messages,
  and the description of each one makes sense (e.g. a button is described as a
  button press & release, not as an unknown message, and a fader reports a value
  that goes from minimum to maximum as you move it).
- Endless encoders report changes in the correct direction
  (turning clockwise should increase, and anticlockwise should decrease).
- Nothing is reported as being from the wrong control (e.g. buttons being
  mixed up with each other).
- The messages sent back to the device while a test pattern is running look
  sensible: they should match the sub-profile you selected, and shouldn't
  include a constant flood of unnecessary messages when nothing is changing.

### Reporting your results

Please let us know how you got on, whether the profile works perfectly or
not, by [opening an issue](https://github.com/ArcaneWizards/talisman/issues),
or by starting a discussion on the
[MIDI Devices board](https://github.com/ArcaneWizards/talisman/discussions/categories/midi-devices).
Include:

- The device name, model & firmware version (if known)
- Your operating system
- The **exact** names of the input & output devices shown in the app
- The profile & sub-profile that you tested
- For anything that didn't work: what you did, what you expected,
  and what happened instead, and a copy of the relevant messages from the
  message monitor if possible.

If everything passed, we'd love to credit you as a tester!
Add yourself to the `testing.community` list of the profile
(in [`packages/profiles/src/devices`](./packages/profiles/src/devices/))
in a pull request. No assigned issue is needed for this type of pull request:

```ts
testing: {
  ready: false,
  community: [
    {
      ghUsername: 'your-github-username',
      os: ['macos'], // 'macos' | 'windows' | 'linux'
      date: '2026-01-31', // The date you tested, as YYYY-MM-DD
    },
  ],
},
```

Maintainers will decide when there has been enough testing to change a profile
to `ready: true`.

## Developing code & profiles

### What can I work on?

This section is for anybody that wants to change the libraries or apps in this
repository, including adding support for a new device.

Before writing any code, [open an issue](https://github.com/ArcaneWizards/talisman/issues)
(or find an existing one), discuss your idea with the maintainers,
and wait to be assigned to it (see [above](#before-opening-a-pull-request)).

#### What devices can I add / request profiles for?

Before starting work on a new profile,
make sure you have opened a
[github issue](https://github.com/ArcaneWizards/talisman/issues) for it,
and been assigned to work on it by a maintainer.

For now, we're generally not accepting profiles for musical instruments,
synthesizers, etc... as these types of devices are already quite well-served
by existing projects, and don't tend to differ as much from device-to-device.
We will likely make an exception for musical instruments that have unique or
novel features in addition to their usual functionality
(such as LED feedback or button-pads).

Given that we're producing software for the live events & music industry,
and in particular Front-of-House applications,
our focus is mostly on control surfaces that are commonly used in these
types of environments.

If you're unsure if a particular device profile is wanted by the project,
feel free to open an issue to ask.

#### Can I produce a profile for a device I don't own / can't test with

The short answer: No.

Before a new profile is accepted into the codebase,
we need to ensure that the code is tested with a real device,
and can be easily debugged. If that's not possible,
at the very least there needs to be enough demand and interest from the
community that it's definitely going to be tested once it's available in
the [Talisman MIDI Lab](./apps/lab/).

Profiles will then only be marked as "production ready" once enough members
of the community have tested that it works well,
or after a maintainer or hardware manufacturer has tested the device themselves.

### Repository layout

This is a [pnpm](https://pnpm.io/) monorepo, using [Turborepo](https://turbo.build/)
to run tasks and [Changesets](https://github.com/changesets/changesets) for
versioning & releases.

| Path                                       | Contents                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [`packages/talisman`](./packages/talisman) | `@talisman-midi/talisman`: API types, base classes & device-agnostic utilities                  |
| [`packages/profiles`](./packages/profiles) | `@talisman-midi/profiles`: the device profiles themselves                                       |
| [`apps/lab`](./apps/lab)                   | Talisman MIDI Lab (and [`apps/lab-desktop`](./apps/lab-desktop), its Electron wrapper)          |
| [`apps/arcade`](./apps/arcade)             | Talisman MIDI Arcade (and [`apps/arcade-desktop`](./apps/arcade-desktop), its Electron wrapper) |
| [`examples/*`](./examples)                 | Example applications that show how the project API can be used                                  |

### Getting set up

You will need:

- [Node.js](https://nodejs.org/) v22 or higher (CI uses v24)
- [pnpm](https://pnpm.io/), which is easiest to get through
  [Corepack](https://nodejs.org/api/corepack.html), which will install the
  exact version pinned by the `packageManager` field in
  [`package.json`](./package.json) (if you don't have Corepack,
  `npm install -g corepack` will install it).
- Native build tooling for your OS may be needed, as the MIDI library used by
  the apps contains native code
  (e.g. Xcode Command Line Tools on macOS, or Visual Studio Build Tools on Windows)
  if `pnpm install` fails to build it.

Then fork & clone the repository, and:

```sh
corepack enable pnpm
pnpm install
pnpm build
```

### Running the apps

The best way to try out changes to a profile is to run **Talisman MIDI Lab**
from your clone of the repository, so that you can test your changes with real
hardware. In development mode the app's server uses the TypeScript source of
`@talisman-midi/talisman` and `@talisman-midi/profiles` directly,
and restarts automatically when it changes.
If a change doesn't appear to take effect, re-run `pnpm build` from the root of
the repository and restart the app.

**Lab (browser UI, hot-reloading):**

```sh
cd apps/lab
pnpm dev
```

The URL to open in your browser is printed to the console when the server starts.

**Lab (desktop app):**

```sh
cd apps/lab-desktop
pnpm start
```

This builds & launches the Electron app, so you will need to re-run it to see changes.

The same commands work in [`apps/arcade`](./apps/arcade) and
[`apps/arcade-desktop`](./apps/arcade-desktop) for the Arcade.
Running `pnpm dev` from the root of the repository will start the `dev` task of
every package that has one.

### Adding a new profile

1. Create a new file for your device in
   [`packages/profiles/src/devices`](./packages/profiles/src/devices/),
   exporting a `MidiProfileDefinition`.
   The existing profiles, for example
   [`akai-apcmini-mk2.ts`](./packages/profiles/src/devices/akai-apcmini-mk2.ts) (a grid controller with RGB feedback)
   or [`midi-fighter-twister.ts`](./packages/profiles/src/devices/midi-fighter-twister.ts) (encoders),
   are the best reference for how to describe items, their positions, natures,
   and feedback capabilities.
   The [Writing your own profile](./USAGE.md#writing-your-own-profile) section of
   the usage docs gives a short introduction.
2. Start with `testing: { ready: false }`, and make sure that `autoSelect`
   only matches your device (and not others with similar names).
   Only add yourself to `testing` once you have tested it on real hardware.
3. Register it in [`packages/profiles/src/index.ts`](./packages/profiles/src/index.ts),
   in `KNOWN_MIDI_PROFILES`.
4. Test it with your device in Lab, going through all of the checks in
   [Testing profiles](#testing-profiles).
5. Add unit tests for any non-trivial logic (see [Tests](#tests)).
6. Add a [changeset](#changesets).

### Avoiding duplicate code

Keeping the code base small & consistent is a big part of what makes it
possible to support lots of devices, so **please avoid duplicating code wherever
reasonably possible**.
Instead, introduce a utility function (or class) with an appropriate abstraction,
and put it in the right place:

| If the code...                                                                   | ...it belongs in                                                                                                                              |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| is useful for any device, or any application using the API (no device knowledge) | [`packages/talisman`](./packages/talisman/src/), e.g. `util.ts`, `color.ts`, `feedback.ts` or `profile.ts`                                    |
| is shared by several devices from the same manufacturer / family                 | A shared module in [`packages/profiles/src/devices/shared`](./packages/profiles/src/devices/shared/), e.g. `novation.ts` or `midi-fighter.ts` |
| is only relevant to a single device                                              | That device's own file                                                                                                                        |

Some guidelines:

- **Look before you write.** Search `talisman` and `profiles` for existing
  helpers before writing your own. For example:
  - [`createColorSpace`](./packages/talisman/src/color.ts) for mapping RGB colours to a device's palette
  - [`createBasicColorVelocityFeedbackProfile`](./packages/talisman/src/feedback.ts) for devices that take a note / CC velocity as colour
  - [`MidiProfileBasic`](./packages/talisman/src/profile.ts) for basic input profiles
  - the position helpers in [`util.ts`](./packages/talisman/src/util.ts) (`getPositions`, `getRowsAndColumns`, ...)
  - the palettes, colour-spaces & mode-switching in the [shared device modules](./packages/profiles/src/devices/shared/)
- **If you're about to copy & paste more than a few lines,** extract it
  instead, and use it in both places. If a second device needs something that
  already exists inside a first device's file, move it to
  a shared module (or to `talisman`) as part of the same change, rather than
  duplicating it.
- **Abstract concepts, not coincidences.** Two pieces of code that happen to
  look the same today but represent different things (for example,
  two manufacturers' protocols that happen to share a byte layout) may diverge,
  and don't need to be forced together.
  Abstractions should be named after what the code _means_,
  and should be generic enough to be reused,
  without requiring lots of flags or special cases.
- **Parameterise differences,** (e.g. grid size, note offsets, palettes, port
  names), rather than creating near-identical copies of whole profiles.
- **Refactoring existing profiles is welcome**
  (and is how we get to share more code), but make sure existing behaviour
  doesn't change: run the tests, and (if possible) re-check the device in Lab.
  If it's a big refactor, mention it in the issue first.
- **Changes to `talisman` are changes to a public API.**
  Keep new utilities generic, well-typed and documented with a short doc-comment,
  and flag [breaking changes](#changesets) clearly.
- **Test your shared code.** Utilities in `talisman` and the shared modules
  should have unit tests next to them.

### Tests, linting & formatting

These are all run in CI, and have to pass before a pull request can be merged.
Run them from the root of the repository to check everything:

```sh
pnpm build
pnpm check:types
pnpm lint:fix
pnpm format:fix
pnpm test
```

#### Tests

Tests use [Jest](https://jestjs.io/), and live next to the code that they test
(`*.test.ts`).
You can run the tests of a single package by running `pnpm test` from inside
its directory. Look at the existing tests in
[`packages/profiles/src/devices`](./packages/profiles/src/devices/)
for examples of testing profiles, such as checking that raw messages result in
the expected actions.

### Changesets

If your change affects a package that is published to NPM
(`@talisman-midi/talisman`, `@talisman-midi/profiles`, and the apps in `apps/lab` & `apps/arcade`),
add a [changeset](https://github.com/changesets/changesets) to describe it:

```sh
pnpm changeset
```

and commit the generated file in `.changeset/` with your pull request.
Choose the packages that you changed, and the version bump type
(`patch` for fixes, new profiles and non-breaking improvements, `minor` for
larger features).
Until the project reaches v1.0, mark any breaking API changes by starting the
description with `[breaking]`, and explain how users should migrate.

Documentation-only changes don't need a changeset.

### Opening your pull request

Once you have been assigned an issue and the checks above pass,
open a pull request that references the issue.
Please keep pull requests focused: one profile, or one logical change at a time.
And, if you tested your change with real hardware, tell us which device,
firmware & operating system you used.

## Questions

If you're stuck, or unsure about anything in this document,
please ask on the
[discussion boards](https://github.com/ArcaneWizards/talisman/discussions),
or on our [discord community](https://arcanewizards.com/discord).
