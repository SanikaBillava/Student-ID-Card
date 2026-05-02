import ExcelJS from "exceljs";

const EXPORT_PAGE_SIZE = 500;
const IMAGE_CONCURRENCY = 6;
const FIELD_VALUE_CONCURRENCY = 10;
const PHOTO_COLUMN_WIDTH = 16;
const PHOTO_ROW_HEIGHT = 76;
const PHOTO_SIZE = 86;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.qobo.dev";
const API_KEY = import.meta.env.VITE_API_KEY;

const slugify = (value) =>
  String(value || "students")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getFieldValue = (fieldValues, studentId, field, valueFormatter) => {
  const values = fieldValues[studentId] || [];
  const fieldValue = values.find((value) => value.field_id === field.id);
  const rawValue = fieldValue?.value;

  if (valueFormatter) return valueFormatter(field, rawValue);
  return rawValue ?? "-";
};

const runWithConcurrency = async (items, limit, task) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await task(items[currentIndex], currentIndex);
      }
    },
  );

  await Promise.all(workers);
  return results;
};

const fetchAllStudents = async ({ api, batchId, knownTotal }) => {
  const firstResponse = await api.students.getAll({
    batch_id: batchId,
    page: 1,
    limit: knownTotal && knownTotal > 0 ? knownTotal : EXPORT_PAGE_SIZE,
  });

  if (!firstResponse.success) return [];

  const students = [...(firstResponse.data || [])];
  const totalPages = firstResponse.meta?.totalPages || 1;
  const limit = firstResponse.meta?.limit || EXPORT_PAGE_SIZE;

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await api.students.getAll({
      batch_id: batchId,
      page,
      limit,
    });

    if (response.success) students.push(...(response.data || []));
  }

  return students;
};

const fetchFieldValuesByStudent = async ({ api, students }) => {
  const fieldValues = {};

  await runWithConcurrency(
    students,
    FIELD_VALUE_CONCURRENCY,
    async (student) => {
      const response = await api.student_field_values.getAll({
        student_id: student.id,
      });

      if (response.success && response.data) {
        fieldValues[student.id] = response.data;
      }
    },
  );

  return fieldValues;
};

const getExcelImageExtension = (mimeType) => {
  const normalizedMimeType = (mimeType || "").toLowerCase().split(";")[0];

  switch (normalizedMimeType) {
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/jpeg":
    case "image/jpg":
      return "jpeg";
    default:
      return null;
  }
};

const getExcelImageExtensionFromUrl = (imageUrl) => {
  const pathname = imageUrl.split("?")[0].toLowerCase();
  const match = pathname.match(/\.([a-z0-9]+)$/);
  const extension = match?.[1];

  if (extension === "png" || extension === "gif") return extension;
  if (extension === "jpg" || extension === "jpeg") return "jpeg";
  return null;
};

const resolveImageUrl = (imageUrl) => {
  try {
    return new URL(imageUrl, `${API_BASE_URL}/`).toString();
  } catch (err) {
    console.error("Invalid student image URL:", err);
    return imageUrl;
  }
};

const fetchImageBlob = async (imageUrl, options = {}) => {
  const response = await fetch(imageUrl, options);
  if (!response.ok) return null;

  return {
    blob: await response.blob(),
    contentType: response.headers.get("Content-Type"),
  };
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchStudentImage = async ({ imageUrl }) => {
  if (!imageUrl) return null;

  const resolvedImageUrl = resolveImageUrl(imageUrl);
  const fetchAttempts = [
    {},
    API_KEY ? { headers: { "X-API-Key": API_KEY } } : null,
  ].filter(Boolean);

  for (const options of fetchAttempts) {
    try {
      const result = await fetchImageBlob(resolvedImageUrl, options);
      if (!result?.blob) continue;

      const extension =
        getExcelImageExtension(result.blob.type || result.contentType) ||
        getExcelImageExtensionFromUrl(resolvedImageUrl);

      if (!extension) return null;

      return {
        base64: await blobToBase64(result.blob),
        extension,
      };
    } catch (err) {
      console.error("Failed image fetch attempt:", err);
    }
  }

  return null;
};

const fetchStudentImages = async (students) => {
  const imageResults = {};

  await runWithConcurrency(students, IMAGE_CONCURRENCY, async (student) => {
    const imageFile = await fetchStudentImage({
      imageUrl: student.image_url,
    });

    if (imageFile) imageResults[student.id] = imageFile;
  });

  return imageResults;
};

const buildColumns = (fields) => [
  { header: "#", key: "serialNumber", width: 6 },
  { header: "Photo", key: "photo", width: PHOTO_COLUMN_WIDTH },
  { header: "Name", key: "name", width: 32 },
  // { header: "Student ID", key: "studentId", width: 18 },
  // { header: "Image URL", key: "imageUrl", width: 12 },
  ...fields.map((field) => ({
    header: field.field_name,
    key: `field_${field.id}`,
    width: /father|mother|guardian|parent|name/i.test(field.field_name)
      ? 32
      : 18,
  })),
  // { header: "Created At", key: "createdAt", width: 16 },
];

const buildStudentRow = ({
  student,
  index,
  fields,
  fieldValues,
  valueFormatter,
}) => {
  const row = {
    serialNumber: index + 1,
    photo: "",
    name: student.name || "",
    // studentId: student.id || "",
    // imageUrl: student.image_url || "",
    // createdAt: student.created_at
    //   ? new Date(student.created_at).toLocaleDateString("en-IN")
    //   : "",
  };

  fields.forEach((field) => {
    row[`field_${field.id}`] = getFieldValue(
      fieldValues,
      student.id,
      field,
      valueFormatter,
    );
  });

  return row;
};

const applyWorksheetStyle = (worksheet, columns) => {
  worksheet.columns = columns;
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.getRow(1).height = 24;
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF374151" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
};

const fitColumnWidths = (worksheet, columns) => {
  columns.forEach((column, columnIndex) => {
    const excelColumn = worksheet.getColumn(columnIndex + 1);
    let maxLength = column.header.length;

    excelColumn.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value;
      const text =
        value && typeof value === "object" && "text" in value
          ? value.text
          : value;
      maxLength = Math.max(maxLength, String(text ?? "").length);
    });

    excelColumn.width = Math.min(
      Math.max(column.width || 12, maxLength + 3),
      column.key === "imageUrl" ? 60 : 40,
    );
  });

  worksheet.getColumn("photo").width = PHOTO_COLUMN_WIDTH;
};

const addStudentImages = ({ workbook, worksheet, students, imageFiles }) => {
  students.forEach((student, index) => {
    const imageFile = imageFiles[student.id];
    if (!imageFile) return;

    const rowNumber = index + 2;
    const imageId = workbook.addImage({
      base64: imageFile.base64,
      extension: imageFile.extension,
    });

    worksheet.getRow(rowNumber).height = PHOTO_ROW_HEIGHT;
    worksheet.addImage(imageId, {
      tl: { col: 1.15, row: rowNumber - 0.92 },
      ext: { width: PHOTO_SIZE, height: PHOTO_SIZE },
      editAs: "oneCell",
    });
  });
};

const buildWorkbookFile = async ({
  students,
  fields,
  fieldValues,
  imageFiles,
  valueFormatter,
}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");
  const columns = buildColumns(fields);

  applyWorksheetStyle(worksheet, columns);

  students.forEach((student, index) => {
    const row = worksheet.addRow(
      buildStudentRow({
        student,
        index,
        fields,
        fieldValues,
        valueFormatter,
      }),
    );

    row.height = imageFiles[student.id] ? PHOTO_ROW_HEIGHT : 24;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });

  addStudentImages({ workbook, worksheet, students, imageFiles });
  fitColumnWidths(worksheet, columns);

  return workbook.xlsx.writeBuffer();
};

const downloadBlob = ({ blob, filename }) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadStudentsExcel = async ({
  api,
  school,
  batch,
  fields,
  valueFormatter,
  totalStudents,
}) => {
  if (!school?.id) throw new Error("Please select a school first.");
  if (!batch?.id) throw new Error("Please select a batch first.");

  const students = await fetchAllStudents({
    api,
    batchId: batch.id,
    knownTotal: totalStudents,
  });

  if (students.length === 0) {
    throw new Error("No students found for this school and batch.");
  }

  const [fieldValues, imageFiles] = await Promise.all([
    fetchFieldValuesByStudent({ api, students }),
    fetchStudentImages(students),
  ]);
  const workbookFile = await buildWorkbookFile({
    students,
    fields,
    fieldValues,
    imageFiles,
    valueFormatter,
  });

  downloadBlob({
    blob: new Blob([workbookFile], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename: `${slugify(school.name)}-${slugify(batch.name)}-students.xlsx`,
  });

  return students.length;
};
