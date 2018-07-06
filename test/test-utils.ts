/*
 * Utility functions for use in tests.
 */
export function dispatchSimulatedEvent(elt: HTMLElement, type: string) {
  // cf. https://stackoverflow.com/a/27557936
  const event = document.createEvent("HTMLEvents");
  event.initEvent(type, false, true);
  elt.dispatchEvent(event);
}
