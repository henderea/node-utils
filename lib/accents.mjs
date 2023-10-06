const mappings = [];

export const stripAccents = (str) => mappings.reduce((s, [replacement, pattern]) => s.replace(pattern, replacement), str);
