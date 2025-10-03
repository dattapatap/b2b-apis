import { ApiError } from "../utils/ApiError.js";


export const requireRole = (roles) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles?.map(r => r?.role_id?._doc?.role_name).filter(Boolean) || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json(new ApiError(403, null, "Access Denied: You do not have the required role"));
    }
    next();
  };
};