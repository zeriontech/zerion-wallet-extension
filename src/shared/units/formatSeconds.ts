export function formatSeconds(seconds: number) {
  const wholeMinutes = Math.floor(seconds / 60);
  const trailingSeconds = seconds - wholeMinutes * 60;

  if (seconds < 120) {
    return `${seconds} sec`;
  } else if (trailingSeconds === 0) {
    return `${wholeMinutes} min`;
  } else {
    return `${wholeMinutes} min ${trailingSeconds} sec`;
  }
}
