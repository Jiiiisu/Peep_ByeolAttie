export const BUTTON_HEIGHT = 60;
export const VIEW_WIDTH = 300;
export const GAP = 12;
export const MERIDIEM_ITEMS = ['오전', '오후'];
export const HOUR_ITEMS = Array.from({length: 12}, (_, i) =>
  i.toString().padStart(2, '0'),
);
export const MINUTE_ITEMS = Array.from({length: 60}, (_, i) =>
  i.toString().padStart(2, '0'),
);
