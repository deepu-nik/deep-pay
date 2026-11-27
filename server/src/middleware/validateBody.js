import { badRequest } from "../utils/appError.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(badRequest("Request body is invalid.", details));
    }

    req.body = result.data;
    return next();
  };
}
