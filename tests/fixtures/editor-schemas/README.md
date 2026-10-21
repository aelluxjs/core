# Official editor schema snapshots

Downloaded on 2026-10-21 for offline validation of generated editor metadata.
Schema contents are retained unchanged. Updating a snapshot is an explicit maintenance operation, not part of a build or test run.

| Local schema | Upstream source | SHA-256 |
| --- | --- | --- |
| `html.schema.json` | [Microsoft HTML language service](https://raw.githubusercontent.com/microsoft/vscode-html-languageservice/main/docs/customData.schema.json) | `9f2027722b612e1891eff041cfa175fb6d9360fe491de6da70cdd004401397cc` |
| `css.schema.json` | [Microsoft CSS language service](https://raw.githubusercontent.com/microsoft/vscode-css-languageservice/main/docs/customData.schema.json) | `4a46627fec134667b24ffd8f5348f2deac79cfc8b1d011d6a66e7034703b886e` |
| `web-types.schema.json` | [JetBrains Web Types](https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json) | `521eb928fe4e25532f4dacba7242aaee71939985f9e381e49a7d0a97da955a32` |

Microsoft's schemas use the MIT license retained in `microsoft.LICENSE.txt` ([upstream](https://raw.githubusercontent.com/microsoft/vscode-html-languageservice/main/LICENSE.md)). JetBrains' schema uses Apache-2.0, retained in `jetbrains.LICENSE.txt` ([upstream](https://raw.githubusercontent.com/JetBrains/web-types/master/LICENSE)). These fixtures and their licenses are development files and are not shipped in the npm package.
