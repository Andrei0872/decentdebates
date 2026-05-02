# Testing GitHub Actions locally with `act`

[`act`](https://nektosact.com) runs GitHub Actions workflows locally using Docker, without pushing to GitHub.

## Installation

See the [official docs](https://nektosact.com/installation/index.html) for all options. On macOS:

```bash
brew install act
```

## Running the CI workflow

```bash
act -W '.github/workflows/ci.yml' --artifact-server-path /tmp/artifacts
```

- `-W` points `act` at a specific workflow file.
- `--artifact-server-path` provides a local directory for the artifact server that backs `actions/upload-artifact` and `actions/download-artifact`. The path must exist beforehand (`mkdir -p /tmp/artifacts`).

To run a single job:

```bash
act -W '.github/workflows/ci.yml' -j checks-and-unit --artifact-server-path /tmp/artifacts
```

## Notes

- `act` uses a stripped-down Docker image (`catthehacker/ubuntu:act-22.04`) that is missing some tools present on real GitHub-hosted runners (e.g. the `psql` binary).
- Service containers (`services:`) are supported and their ports are mapped to the runner container's `localhost`, matching real GitHub Actions behaviour.
