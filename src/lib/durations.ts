import { END_KEY, START_KEY, toMonthKey, fromMonthKey } from "./data";

export type DurationPreset = {
  id: string;
  label: string;
  fromKey: number;
  toKey: number;
};

export function lastNMonths(n: number): [number, number] {
  return [Math.max(START_KEY, END_KEY - n + 1), END_KEY];
}

export function yearToDate(): [number, number] {
  const { y } = fromMonthKey(END_KEY);
  return [toMonthKey(y, 1), END_KEY];
}

export function fullYear(y: number): [number, number] {
  return [toMonthKey(y, 1), toMonthKey(y, 12)];
}

export function presets(): DurationPreset[] {
  const [l12f, l12t] = lastNMonths(12);
  const [l36f, l36t] = lastNMonths(36);
  const [ytdF, ytdT] = yearToDate();
  return [
    { id: "l12", label: "Last 12 months", fromKey: l12f, toKey: l12t },
    { id: "l36", label: "Last 3 years", fromKey: l36f, toKey: l36t },
    { id: "ytd", label: "Year to date (2026)", fromKey: ytdF, toKey: ytdT },
    { id: "since2010", label: "Since inception (2010-2026)", fromKey: START_KEY, toKey: END_KEY },
    { id: "decade", label: "Last 10 years", fromKey: lastNMonths(120)[0], toKey: lastNMonths(120)[1] },
    ];
}
