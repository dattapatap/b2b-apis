const convertSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")  // Remove special characters except spaces and hyphens
        .replace(/\s+/g, "-")           // Replace spaces with hyphens
        .replace(/-+/g, "-");           // Replace multiple hyphens with a single one
};

export { convertSlug };