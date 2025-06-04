// middleware/roleMiddleware.js
import { ApiError } from "../utils/ApiError.js";

export const requireRole = (roles) => {
  return (req, res, next) => {       
    const userRoles = req.user?.roles.map(role => role.role_id.role_name) || [];   
    const hasRole = roles.some(role => userRoles.includes(role));
    if (!hasRole) {
      return next(res.json(new ApiError(403, null, "Access Denied: You do not have the required role")));
    }
    next();
  };
};
