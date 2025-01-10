import fs from 'fs';
import path from 'path';
import vine from '@vinejs/vine';


async function file(value, options, field) {
  if (typeof value !== 'string' || !fs.existsSync(value)) {
    field.report('The file is required field.', 'file.exists', field);
    return;
  }

  try {
    // Validate file size
    const stats = fs.statSync(value);
    if (options.maxSize && stats.size > options.maxSize) {
      field.report(
        `The file size exceeds the allowed limit of ${options.maxSize} bytes.`,
        'file.size',
        field
      );
      return;
    }

    // Validate file extension
    const ext = path.extname(value).toLowerCase();
    if (options.allowedExtensions && !options.allowedExtensions.includes(ext)) {
      field.report(
        `The file extension ${ext} is not allowed. Allowed extensions: ${options.allowedExtensions.join(
          ', '
        )}.`,
        'file.extension',
        field
      );
      return;
    }

  } catch (error) {
    console.error('File validation error:', error);
    field.report('An error occurred during file validation.', 'file.error', field);
  }
}

export const fileRule = vine.createRule(file);
