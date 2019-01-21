## ng-alain-codelyzer

A set of tslint rules for static code analysis of [ng-alain](https://ng-alain.com) projects.

## How to use?

Install ng-alain-codelyzer:

```shell
# via npm
npm i ng-alain-codelyzer --save-dev
# via yarn
yarn add -D ng-alain-codelyzer
```

Using ng-alain-codelyzer from node_modules directory:

```json
{
  "rulesDirectory": [
    "node_modules/ng-alain-codelyzer"
  ],
  "rules": {
    "use-path-mapping": [true, ["@core", "@shared"]]
  }
}
```

Next you can create a component file in the `src/app/routes` directory with name component.ts and the following content:

```ts
import { I18NService } from '../core/i18n/i18n.service';
```

As last step you can execute all the rules against your code with tslint:

```shell
./node_modules/.bin/tslint -c tslint.json src/app/routes/component.ts
```

You should see the following output:

```text
ERROR: src/app/routes/component.ts[1, 30]: Should be imported using `@core`
```

## Subdirectories

If you want to support subdirectory import styles:

```ts
import { I18NService } from '@core/i18n/i18n.service';
```

Configured as:

```json
{
  "use-path-mapping": [true, ["@core/*", "@shared"]]
}
```

## License

MIT