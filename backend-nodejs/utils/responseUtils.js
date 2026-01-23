export const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
};

export const errorResponse = (message, statusCode = 400, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    errors,
  };
};

export const paginationData = (page = 1, limit = 10, total = 0) => {
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    skip,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
