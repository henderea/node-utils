# @henderea/node-utils

Some utility scripts written in NodeJS and distributed via NPM.

## Installing

```shell
npm install -g @henderea/node-utils
```

## Scripts

### xpath-get

Get a value from a file using xpath

#### Usage

```shell
xpath-get XML_FILENAME XPATH_EXPRESSION
```

```shell
xpath-get pom.xml "/project/dependencies/dependency[artifactId='log4j']/version/text()"
```

You can also call `xpath-get help`, `xpath-get --help`, or `xpath-get -h` to get usage info.

### xpath-set

Set a node's text content in a file using xpath

#### Usage

```shell
xpath-set [-y|--yes] XML_FILENAME XPATH_EXPRESSION NEW_VALUE
```

```shell
xpath-set pom.xml "/project/dependencies/dependency[artifactId='log4j']/version" "4.0.0"
```

You can also call `xpath-set help`, `xpath-set --help`, or `xpath-set -h` to get usage info.

You can pass `-y` or `--yes` to `xpath-set` to automatically confirm the change.

### moment-date

Format a date using MomentJS

#### Usage

```shell
moment-date [-o|--output-format|-f|--format OUTPUT_FORMAT] [-i|--input-format INPUT_FORMAT] [-d|--date DATE]
```

```shell
moment-date -f 'dddd, MMMM Do YYYY, h:mm:ss.SSS a'
```

Please see `moment-date help` for usage info (also available with `moment-date -h` and `moment-date --help`)