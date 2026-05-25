export const notFound = (req, res, next) => {
  const error = new Error(`Not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  if (res.headersSent) return;
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || "Server error",
    details: process.env.DEBUG_ERRORS === "true" ? error.stack : undefined
  });
};
