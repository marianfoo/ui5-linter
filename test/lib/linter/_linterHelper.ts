import anyTest, {ExecutionContext, TestFn} from "ava";
import sinonGlobal, {SinonStub} from "sinon";
import util from "util";
import {readdirSync} from "node:fs";
import path from "node:path";
import esmock from "esmock";
import SourceFileLinter from "../../../src/linter/ui5Types/SourceFileLinter.js";
import {Program, SourceFile, TypeChecker} from "typescript";
import LinterContext, {LinterOptions, LintResult} from "../../../src/linter/LinterContext.js";
import {ApiExtract} from "../../../src/utils/ApiExtract.js";

util.inspect.defaultOptions.depth = 4; // Increase AVA's printing depth since coverageInfo objects are on level 4

const test = anyTest as TestFn<{
	sinon: sinonGlobal.SinonSandbox;
	lintFile: SinonStub<[LinterOptions], Promise<LintResult[]>>;
}>;

test.before(async (t) => {
	const {lintModule: {lintFile}} = await esmockDeprecationText();
	t.context.lintFile = lintFile;
});

// Mock getDeprecationText as we do not have control over the deprecated texts and they could
// change anytime creating false positive failing tests. That way is ensured consistent and testable behavior.
export async function esmockDeprecationText() {
	const typeLinterModule = await esmock("../../../src/linter/ui5Types/TypeLinter.js", {
		"../../../src/linter/ui5Types/SourceFileLinter.js":
			function (
				context: LinterContext, filePath: string, sourceFile: SourceFile,
				sourceMaps: Map<string, string> | undefined, program: Program,
				checker: TypeChecker,
				reportCoverage: boolean | undefined = false,
				messageDetails: boolean | undefined = false,
				apiExtract: ApiExtract,
				manifestContent?: string
			) {
				// Don't use sinon's stubs as it's hard to clean after them in this case and it leaks memory.
				const linter = new SourceFileLinter(
					context, filePath, sourceFile, sourceMaps, program, checker, reportCoverage,
					messageDetails, apiExtract, manifestContent
				);
				linter.getDeprecationText = () => "Deprecated test message";
				return linter;
			},
	});
	const lintWorkspaceModule = await esmock("../../../src/linter/lintWorkspace.js", {
		"../../../src/linter/ui5Types/TypeLinter.js": typeLinterModule,
	});

	const lintModule = await esmock("../../../src/linter/linter.js", {
		"../../../src/linter/lintWorkspace.js": lintWorkspaceModule,
	});

	return {lintModule};
}

// Helper function to compare file paths since we don't want to store those in the snapshots
export function assertExpectedLintResults(
	t: ExecutionContext, res: LintResult[], basePath: string, filePaths: string[]) {
	res.forEach((lintResult) => {
		if (!filePaths.includes(lintResult.filePath)) {
			t.fail(
				`Unexpected lint result for file ${lintResult.filePath}. Expected: ${filePaths.join(", ")}. ` +
				`Result: ${JSON.stringify(lintResult)}`
			);
		}
	});
}

// Helper function to create linting tests for all files in a directory
export function createTestsForFixtures(fixturesPath: string) {
	try {
		const testFiles = readdirSync(fixturesPath, {withFileTypes: true, recursive: true}).filter((dirEntries) => {
			return dirEntries.isFile() && dirEntries.name !== ".DS_Store";
		}).map((dirEntries) => {
			return path.posix.join(
				// Resolve relative path OS dependant, but do the join in POSIX format
				path.relative(fixturesPath, dirEntries.path),
				dirEntries.name
			);
		});
		if (!testFiles.length) {
			throw new Error(`Failed to find any fixtures in directory ${fixturesPath}`);
		}
		if (fixturesPath.includes("AsyncComponentFlags") || fixturesPath.includes("renderer")) {
			const dirName = path.basename(fixturesPath);
			testDefinition({
				testName: dirName,
				namespace: "mycomp",
				fileName: dirName,
				fixturesPath,
				filePaths: testFiles,
			});
		} else {
			for (const fileName of testFiles) {
				if (!fileName.endsWith(".js") &&
					!fileName.endsWith(".ts") &&
					!fileName.endsWith(".xml") &&
					!fileName.endsWith(".json") &&
					!fileName.endsWith(".html") &&
					!fileName.endsWith(".yaml")) {
					// Ignore non-JavaScript, non-TypeScript, non-XML, non-JSON, non-HTML and non-YAML files
					continue;
				}

				testDefinition({
					testName: fileName,
					fileName,
					fixturesPath,
					filePaths: [fileName],
				});
			}
		}
	} catch (err) {
		if (err instanceof Error) {
			throw new Error(
				`Failed to list files of directory ${fixturesPath}: ${err.message}`);
		}
		throw err;
	}
}

function testDefinition(
	{testName, fileName, fixturesPath, filePaths, namespace}:
	{testName: string; fileName: string; fixturesPath: string; filePaths: string[]; namespace?: string}) {
	let defineTest = test.serial;

	if (fileName.startsWith("_")) {
		// Skip tests for files starting with underscore
		defineTest = defineTest.skip as typeof test;
		testName = fileName.slice(1);
	} else if (fileName.startsWith("only_")) {
		// Only run test when file starts with only_
		defineTest = defineTest.only as typeof test;
		testName = fileName.slice(5);
	}
	// Executing linting in parallel might lead to OOM errors in the CI
	// Therefore always use serial
	defineTest(`General: ${testName}`, async (t) => {
		const {lintFile} = t.context;

		const res = await lintFile({
			rootDir: fixturesPath,
			namespace,
			filePatterns: filePaths,
			coverage: true,
			details: true,
		});
		assertExpectedLintResults(t, res, fixturesPath,
			filePaths.map((fileName) => namespace ? path.join("resources", namespace, fileName) : fileName));

		res.forEach((result) => {
			const resultFileName = path.basename(result.filePath);
			if (resultFileName === fileName) {
				// Use "clean" testName instead of the fileName which might contain modifiers like "only_"
				result.filePath = testName;
			} else {
				// Use only the file name without the directory (which might contain modifiers)
				result.filePath = resultFileName;
			}
		});
		t.snapshot(res);
	});
}

export function preprocessLintResultsForSnapshot(res: LintResult[]) {
	res.forEach((message) => {
		// Convert to posix paths to align snapshots across platforms
		message.filePath = message.filePath.replace(/\\/g, "/");
	});
	return res;
}

export function runLintRulesTests(filePath: string, fixturesPath?: string) {
	if (!fixturesPath) {
		const __dirname = path.dirname(filePath);
		const fileName = path.basename(filePath, ".ts");
		fixturesPath = path.join(__dirname, "..", "..", "..", "fixtures", "linter", "rules", fileName);
	}

	createTestsForFixtures(fixturesPath);
}
