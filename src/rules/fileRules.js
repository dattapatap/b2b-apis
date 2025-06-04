
const fileRule = (file, maxFileSize, allowedExtensions ) => {

  if (!file) {
    return { isValid: false, message: "Image is required field." };
  }

  const fileExtension = file.originalname.substring(file.originalname.lastIndexOf("."));
  if (!allowedExtensions.includes(fileExtension)) {
    return { isValid: false, message: "Invalid file extension. Only .jpg, .jpeg, and .png are allowed." };
  }

  if (file.size > maxFileSize) {
    return { isValid: false, message: "File size exceeds the 2MB limit." };
  }
  return { isValid: true };
};

const pdfRule = (file, maxFileSize, allowedExtensions ) => {

  if (!file) {
    return { isValid: false, message: "file is required field." };
  }

  const fileExtension = file.originalname.substring(file.originalname.lastIndexOf("."));
  if (!allowedExtensions.includes(fileExtension)) {
    return { isValid: false, message: "Invalid file extension. Only .pdf are allowed." };
  }

  if (file.size > maxFileSize) {
    return { isValid: false, message: `File size exceeds the ${maxFileSize} limit.` };
  }  
  return { isValid: true };
};


export { fileRule, pdfRule };
