// Config is read and validated once, in each package's config module.
export function restrictProcessEnv(allowedFiles) {
  return [
    {
      rules: {
        "no-restricted-properties": [
          "error",
          {
            object: "process",
            property: "env",
            message: "Import the validated config instead.",
          },
        ],
      },
    },
    {
      files: allowedFiles,
      rules: {
        "no-restricted-properties": "off",
      },
    },
  ];
}
