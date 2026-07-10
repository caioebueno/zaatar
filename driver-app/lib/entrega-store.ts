import type { DispatchEntity } from './dispatch-api';

let _selected: DispatchEntity | null = null;

export function setSelectedEntrega(dispatch: DispatchEntity) {
  _selected = dispatch;
}

export function getSelectedEntrega(): DispatchEntity | null {
  return _selected;
}
