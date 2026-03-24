export const gemFieldOrder = ["gems", "gems1", "gems2", "gems3", "gems4"];

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : item))
      .filter((item) => {
        if (item === null || item === undefined) return false;
        if (typeof item === "string") return item !== "";
        return Boolean(item);
      });
  }
  if (value === null || value === undefined) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!value) return [];
  return [value];
};

const uniqueOptions = (values) => {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    if (!value) return;
    const key = value.toString().trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(value);
  });

  return result;
};

export const getGemNodeOptions = (node) => {
  if (Array.isArray(node)) return node;
  if (node && typeof node === "object") return Object.keys(node);
  return [];
};

export const getGemOptionsForField = (
  fieldName,
  selections,
  hierarchy = {},
  topLevel = [],
) => {
  if (fieldName === "gems") {
    return Array.isArray(topLevel) && topLevel.length
      ? topLevel
      : Object.keys(hierarchy || {});
  }

  const fieldIndex = gemFieldOrder.indexOf(fieldName);
  if (fieldIndex <= 0) return [];

  const selectedParents = toArray(selections?.gems);
  if (!selectedParents.length) return [];

  let nodes = selectedParents
    .map((parent) => hierarchy?.[parent])
    .filter(Boolean);

  if (!nodes.length) return [];

  for (let i = 1; i < fieldIndex; i += 1) {
    const selectedValues = toArray(selections?.[gemFieldOrder[i]]);
    if (!selectedValues.length) return [];

    const nextNodes = [];

    nodes.forEach((node) => {
      if (Array.isArray(node)) {
        nextNodes.push(node);
        return;
      }

      selectedValues.forEach((selectedValue) => {
        const childNode = node?.[selectedValue];
        if (childNode) nextNodes.push(childNode);
      });
    });

    if (!nextNodes.length) return [];
    nodes = nextNodes;
  }

  return uniqueOptions(nodes.flatMap((node) => getGemNodeOptions(node)));
};

export const clearChildGemFields = (fieldName, target) => {
  const fieldIndex = gemFieldOrder.indexOf(fieldName);
  if (fieldIndex === -1) return target;

  const next = { ...target };
  for (let i = fieldIndex + 1; i < gemFieldOrder.length; i += 1) {
    next[gemFieldOrder[i]] = [];
  }
  return next;
};

export const hasGemSelection = (value) => {
  if (Array.isArray(value)) {
    return value.some((item) => {
      if (item === null || item === undefined) return false;
      if (typeof item === "string") return item.trim() !== "";
      return Boolean(item);
    });
  }

  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return Boolean(value);
};
