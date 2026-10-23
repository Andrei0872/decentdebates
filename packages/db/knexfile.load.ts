import * as path from "path";
import config from "./knexfile";

export default {
  ...config,
  seeds: {
    ...config.seeds,
    directory: path.resolve(__dirname, "data/seeds-load"),
  },
};
