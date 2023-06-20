function isLocalhost(url: URL) {
  const { protocol, hostname } = url;
  const isHttp = protocol === 'https:' || protocol === 'http:';
  return (
    isHttp &&
    (hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === '127.0.0.1')
  );
}

export function isConnectableDapp(url: URL) {
  return url.protocol === 'https:' || isLocalhost(url);
}
