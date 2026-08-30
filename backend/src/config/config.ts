import { config as conf } from "dotenv";
conf();
const _config = {
  port: process.env.PORT || "3000",
  databaseUrl: process.env.MONGO_CONNECTED_STRING,
  env: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "default_jwt_secret_dev",
  cloudinary_cloud: process.env.CLOUDINARY_CLOUD,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  frontend_domain: process.env.FRONTEND_DOMAIN || "http://localhost:5173",

  // Configurable Rate Limit Thresholds
  rateLimitAuthMax: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10, // Max auth requests per 15 min
  rateLimitPublicMax: Number(process.env.RATE_LIMIT_PUBLIC_MAX) || 150, // Max public requests per 15 min
  rateLimitUserMax: Number(process.env.RATE_LIMIT_USER_MAX) || 300, // Max user actions per 15 min

  // Cloudinary Free Tier Explicit File Size Limits
  maxPdfSizeMb: 10,
  maxImageSizeMb: 3,
  maxAvatarSizeMb: 3,
  maxCoverBannerSizeMb: 5,
  maxPostImageSizeMb: 3,
  maxPostVideoSizeMb: 8,
};
export const config = Object.freeze(_config);
