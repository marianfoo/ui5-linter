# Snapshot report for `test/e2e/runtime.ts`

The actual snapshot is saved in `runtime.ts.snap`.

Generated by [AVA](https://avajs.dev).

## Run tests after autofix

> stderr

    ''

> stdout

    [
      {
        errorCount: 12,
        fatalErrorCount: 0,
        filePath: 'test/qunit/Configuration.qunit.js',
        messages: [
          {
            column: 2,
            line: 3,
            message: 'Import of deprecated module \'sap/ui/core/Configuration\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 27,
            line: 39,
            message: 'Call to deprecated function \'getAnimation\' of class \'Configuration\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 11,
              name: 'getAnimation',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 34,
            line: 41,
            message: 'Call to deprecated function \'getAnimation\' of class \'Configuration\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 11,
              name: 'getAnimation',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 28,
            line: 43,
            message: 'Call to deprecated function \'getAnimation\' of class \'Configuration\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 11,
              name: 'getAnimation',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 16,
            line: 48,
            message: 'Use of deprecated property \'AnimationMode\' (Configuration.AnimationMode)',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 12,
              name: 'AnimationMode',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 36,
            line: 141,
            message: 'Use of deprecated property \'AnimationMode\' (Configuration.AnimationMode.minimal)',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 12,
              name: 'AnimationMode',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 58,
            line: 142,
            message: 'Use of deprecated property \'AnimationMode\' (Configuration.AnimationMode.minimal)',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 12,
              name: 'AnimationMode',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 36,
            line: 144,
            message: 'Use of deprecated property \'AnimationMode\' (globalConfiguration.AnimationMode.full)',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 12,
              name: 'AnimationMode',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 58,
            line: 145,
            message: 'Use of deprecated property \'AnimationMode\' (Configuration.AnimationMode.full)',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 12,
              name: 'AnimationMode',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 36,
            line: 147,
            message: 'Use of deprecated property \'AnimationMode\' (Configuration.AnimationMode.none)',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 12,
              name: 'AnimationMode',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 58,
            line: 148,
            message: 'Use of deprecated property \'AnimationMode\' (globalConfiguration.AnimationMode.none)',
            ruleId: 'no-deprecated-api',
            severity: 2,
            ui5TypeInfo: {
              kind: 12,
              name: 'AnimationMode',
              parent: {
                kind: 2,
                name: 'Configuration',
                parent: {
                  kind: 0,
                  library: 'sap.ui.core',
                  name: 'sap/ui/core/Configuration',
                },
              },
            },
          },
          {
            column: 20,
            line: 221,
            message: 'Use of deprecated theme \'sap_belize\'',
            ruleId: 'no-deprecated-theme',
            severity: 2,
          },
        ],
        warningCount: 0,
      },
      {
        errorCount: 2,
        fatalErrorCount: 0,
        filePath: 'test/qunit/jQuery.sap.charToUpperCase.qunit.js',
        messages: [
          {
            column: 30,
            line: 14,
            message: 'Use of deprecated API \'jQuery.sap.charToUpperCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 30,
            line: 16,
            message: 'Use of deprecated API \'jQuery.sap.charToUpperCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
        ],
        warningCount: 0,
      },
      {
        errorCount: 8,
        fatalErrorCount: 0,
        filePath: 'test/qunit/jQuery.sap.endsWith.qunit.js',
        messages: [
          {
            column: 15,
            line: 13,
            message: 'Use of deprecated API \'jQuery.sap.endsWith\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 14,
            message: 'Use of deprecated API \'jQuery.sap.endsWith\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 15,
            message: 'Use of deprecated API \'jQuery.sap.endsWith\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 18,
            message: 'Use of deprecated API \'jQuery.sap.endsWith\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 36,
            message: 'Use of deprecated API \'jQuery.sap.endsWithIgnoreCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 37,
            message: 'Use of deprecated API \'jQuery.sap.endsWithIgnoreCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 38,
            message: 'Use of deprecated API \'jQuery.sap.endsWithIgnoreCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 41,
            message: 'Use of deprecated API \'jQuery.sap.endsWithIgnoreCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
        ],
        warningCount: 0,
      },
      {
        errorCount: 4,
        fatalErrorCount: 0,
        filePath: 'test/qunit/jQuery.sap.pad.qunit.js',
        messages: [
          {
            column: 16,
            line: 8,
            message: 'Use of deprecated API \'jQuery.sap.padLeft\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 16,
            line: 10,
            message: 'Use of deprecated API \'jQuery.sap.padLeft\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 16,
            line: 14,
            message: 'Use of deprecated API \'jQuery.sap.padRight\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 16,
            line: 16,
            message: 'Use of deprecated API \'jQuery.sap.padRight\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
        ],
        warningCount: 0,
      },
      {
        errorCount: 8,
        fatalErrorCount: 0,
        filePath: 'test/qunit/jQuery.sap.startsWith.qunit.js',
        messages: [
          {
            column: 15,
            line: 15,
            message: 'Use of deprecated API \'jQuery.sap.startsWith\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 16,
            message: 'Use of deprecated API \'jQuery.sap.startsWith\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 17,
            message: 'Use of deprecated API \'jQuery.sap.startsWith\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 20,
            message: 'Use of deprecated API \'jQuery.sap.startsWith\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 39,
            message: 'Use of deprecated API \'jQuery.sap.startsWithIgnoreCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 40,
            message: 'Use of deprecated API \'jQuery.sap.startsWithIgnoreCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 41,
            message: 'Use of deprecated API \'jQuery.sap.startsWithIgnoreCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
          {
            column: 15,
            line: 44,
            message: 'Use of deprecated API \'jQuery.sap.startsWithIgnoreCase\'',
            ruleId: 'no-deprecated-api',
            severity: 2,
          },
        ],
        warningCount: 0,
      },
    ]

> exitCode

    1
