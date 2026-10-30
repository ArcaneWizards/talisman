export const TALISMAN_LAB_APP_NAME = 'Talisman MIDI Lab';

export const STRINGS = {
  title: TALISMAN_LAB_APP_NAME,
  debugger: 'Debug Tools & Log',
  connectionError: `Disconnected from ${TALISMAN_LAB_APP_NAME} Server`,
  reconnect: 'Reconnect',
  openInNewWindow: 'Open in new window',
  toggle: (text: string) => `Toggle ${text}`,
  close: (text: string) => `Close ${text}`,
} as const;
