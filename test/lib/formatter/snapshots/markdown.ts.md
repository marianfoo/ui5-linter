# Snapshot report for `test/lib/formatter/markdown.ts`

The actual snapshot is saved in `markdown.ts.snap`.

Generated by [AVA](https://avajs.dev).

## Default

> Snapshot 1

    `# UI5 Linter Report␊
    ## Summary␊
    ␊
    > 7 problems (5 errors, 2 warnings)  ␊
    > **2 fatal errors**␊
    > Run \`ui5lint --fix\` to resolve all auto-fixable problems␊
    ␊
    ␊
    ## Findings␊
    ### webapp/Component.js␊
    ␊
    | Severity | Rule | Location | Message |␊
    |----------|------|----------|---------|␊
    | Error | [rule1](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule1) | \`1:1\` | Error message |␊
    | Warning | [rule2](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule2) | \`2:2\` | Warning message |␊
    ␊
    ### webapp/Main.controller.js␊
    ␊
    | Severity | Rule | Location | Message |␊
    |----------|------|----------|---------|␊
    | Fatal Error | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`3:6\` | Another error message |␊
    | Fatal Error | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`12:3\` | Another error message |␊
    | Error | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`11:2\` | Another error message |␊
    | Error | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`11:3\` | Another error message |␊
    | Warning | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`12:3\` | Another error message |␊
    ␊
    **Note:** Use \`ui5lint --details\` to show more information about the findings.␊
    `

## Details

> Snapshot 1

    `# UI5 Linter Report␊
    ## Summary␊
    ␊
    > 7 problems (5 errors, 2 warnings)  ␊
    > **2 fatal errors**␊
    > Run \`ui5lint --fix\` to resolve all auto-fixable problems␊
    ␊
    ␊
    ## Findings␊
    ### webapp/Component.js␊
    ␊
    | Severity | Rule | Location | Message | Details |␊
    |----------|------|----------|---------|---------|␊
    | Error | [rule1](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule1) | \`1:1\` | Error message | Message details |␊
    | Warning | [rule2](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule2) | \`2:2\` | Warning message | Message details |␊
    ␊
    ### webapp/Main.controller.js␊
    ␊
    | Severity | Rule | Location | Message | Details |␊
    |----------|------|----------|---------|---------|␊
    | Fatal Error | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`3:6\` | Another error message | Message details |␊
    | Fatal Error | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`12:3\` | Another error message | Message details |␊
    | Error | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`11:2\` | Another error message | Message details |␊
    | Error | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`11:3\` | Another error message | Message details |␊
    | Warning | [rule3](https://github.com/UI5/linter/blob/v1.2.3/docs/Rules.md#rule3) | \`12:3\` | Another error message | Message details |␊
    ␊
    `

## No findings

> Snapshot 1

    `# UI5 Linter Report␊
    ## Summary␊
    ␊
    > 0 problems (0 errors, 0 warnings)  ␊
    ␊
    `
