import { RefObject } from 'react';
import { advanceArtifact, Artifact } from './artifacts';
import { MidiDeviceConnectionStateReady } from './midi-device-connection';
import { isDefined } from '../shared/util';

export const createRenderInterval = (
  device: MidiDeviceConnectionStateReady,
  callback: (deltaMs: number) => void,
) => {
  let lastFrame = Date.now();
  return setInterval(() => {
    const deltaMs = Date.now() - lastFrame;
    callback(deltaMs);
    device.outputProfile.frameFinished();
    lastFrame = Date.now();
  }, 1000 / device.config.fps);
};

export const createArtifactInterval = (
  devices: MidiDeviceConnectionStateReady[],
  artifacts: RefObject<Artifact[]>,
) => {
  const maxFramerate = Math.max(...devices.map((d) => d.config.fps));
  let lastFrame = Date.now();
  return setInterval(() => {
    const deltaMs = Date.now() - lastFrame;

    artifacts.current = artifacts.current
      .map((a) => advanceArtifact(a, deltaMs))
      .filter(isDefined);

    lastFrame = Date.now();
  }, 1000 / maxFramerate);
};
