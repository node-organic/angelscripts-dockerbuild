# angelscripts-dockerbuild

[organic-angel](https://github.com/node-organic/organic-angel) scripts for dockerizing organic-stem-cells respecting organic-stem-skeleton v2.1

## setup

```
npm install angelscripts-dockerbuild --save
```

## commands

### `angel build :mode :tag -- :runCmd`

Builds a container.

Arguments:

* `mode` - either `production` || `development`, used for `npm install`
* `tag` - value representing the build container tagged locally, usually `packagejson.name:packagejson.version`.
* `runCmd` - value representing a command to be run on container start, usually `npm run start` or similar.

Controlling points:

* if defined `packagejson.scripts.compile` will be used to compile the cell into `/dist` output folder
* if `{cwd}/Dockerfile` or `{cwd}/Dockerfile.{mode}` is present it will be used instead to build the container

### `angel docker :mode -- :runCmd`

Outputs a `Dockerfile` contents when executed within a cell working directory. 

Arguments:

* `mode` - either `production` || `development`, used for `npm install`
* `runCmd` - value representing a command to be run on container start, usually `npm run start` or similar.

Controlling points:

* `packagejson.common_dependencies` Array of repo relative paths to be `npm install`-ed
* `packagejson.engines.node` String indicating node version to be used, defaults to `11.0.1`
* `cellDNA.cellKind` equal to `webcell` will render nginx:latest based Dockerfile

### `angel publish`

Publishes already build container to cell's registry.

Data points:

* `cellDNA.registry` String having value of registry to be published at

### `angel cp :src :dest`

Does an recursive file and directory copy from `src` to `dest` by honoring `.gitignore` files and rules. It uses for `cwd` the stem skeleton repo's root, so `src` should be relative to that folder.

:warning: current implementation is lacking behind actual requirements and works only on git added files.
