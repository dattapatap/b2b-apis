import { ApiError } from "../utils/ApiError.js";

export const requireRole = (roles) => {
  return (req, res, next) => {    
    const userRoles = req.user?.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return next(new ApiError(403, null, "Access Denied: You do not have the required role"));
    }

    next();
  };
};
