export const isISODate = (value) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

export const formatDate = (value) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN");
};

export const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const valueFormatter = (field, value) => {
  if (!field) return value ?? "-";
  if (typeof value === "string" && isISODate(value)) {
    return formatDate(value);
  }
  return value ?? "-";
};
