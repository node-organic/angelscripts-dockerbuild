# angelscripts-dockerbuild

[organic-angel](https://github.com/node-organic/organic-angel) scripts for dockerizing organic-stem-cells respecting organic-stem-skeleton v2.1

## setup

```
npm install angelscripts-dockerbuild --save
```

## commands

### `angel build :mode :tag -- :runCmd`

Builds a container by doing `angel cp` of all (tracked) files within the cell working directory and related common dependencies by default only `cells/node_modules/lib` (can be extended via `packagejson.common_dependencies` :bulb:), generates a Dockerfile via `angel docker`.

Arguments:

* `mode` - either `production` || `development`, used for `npm install`
* `tag` - value representing the build container tagged locally, usually `packagejson.name:packagejson.version`.
* `runCmd` - value representing a command to be run on container start, usually `npm run start` or similar.

### `angel docker :mode -- :runCmd`

Outputs a `Dockerfile` contents when executed within a cell working directory. 

Arguments:

* `mode` - either `production` || `development`, used for `npm install`
* `runCmd` - value representing a command to be run on container start, usually `npm run start` or similar.

### `angel publish`

Publishes already build container to cell's registry.

### `angel cp :src :dest`

Does an recursive file and directory copy from `src` to `dest` by honoring `.gitignore` files and rules. It uses for `cwd` the stem skeleton repo's root, so `src` should be relative to that folder.

:warning: current implementation is lacking behind actual requirements and works only on git added files.
