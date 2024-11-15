export function pushUnique<T>(arr: T[], item: T) {
  if (!arr.includes(item)) {
    arr.push(item);
  }
}

export function removeFromArray<T>(arr: T[], item: T) {
  const pos = arr.indexOf(item);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

export function bringToFront<T>(arr: T[], cb: (item: T) => boolean) {
  for (let i = 0; i < arr.length; i++) {
    if (cb(arr[i])) {
      const [item] = arr.splice(i, 1);
      arr.unshift(item);
      break;
    }
  }
  return arr;
}
