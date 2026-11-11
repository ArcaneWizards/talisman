# Contributing Guidelines

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

## Adding support for a new device

### What devices can I add / request profiles for?

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

### Can I produce a profile for a device I don't own / can't test with

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
