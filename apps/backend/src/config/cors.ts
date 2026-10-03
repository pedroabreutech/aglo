import { CorsOptions } from "cors";
import { env } from "./env";

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || env.cors.allowedOrigins?.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

export default corsOptions;
