import { isDbConnected } from "../config/db.js";

export const requireDb = (req, res, next) => {
  if (isDbConnected()) return next();
  return res.status(503).json({
    message: "Database unavailable. Check MongoDB Atlas Network Access whitelist and connection string.",
    hint: "Add your current public IP to Atlas Network Access, then restart the backend."
  });
};
