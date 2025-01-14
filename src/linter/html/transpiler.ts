import {ReadStream} from "node:fs";
import {extractHTMLTags} from "./parser.js";
import HtmlReporter from "./HtmlReporter.js";
import LinterContext, {ResourcePath, TranspileResult} from "../LinterContext.js";
import {taskStart} from "../../utils/perf.js";
import {MESSAGE} from "../messages.js";
import {Tag, Attribute} from "sax-wasm";
import {deprecatedLibraries, deprecatedThemes} from "../../utils/deprecations.js";

export default async function transpileHtml(
	resourcePath: ResourcePath, contentStream: ReadStream, context: LinterContext
): Promise<TranspileResult | undefined> {
	try {
		const taskEnd = taskStart("Transpile HTML", resourcePath, true);
		const report = new HtmlReporter(resourcePath, context);
		const {scriptTags, stylesheetLinkTags} = await extractHTMLTags(contentStream);

		const bootstrapTag = findBootstrapTag(scriptTags);

		if (bootstrapTag) {
			lintBootstrapAttributes(bootstrapTag, report);
		}

		scriptTags.forEach((tag) => {
			// Tags with src attribute do not parse and run inline code
			const hasSrc = tag.attributes.some((attr) => {
				return attr.name.value.toLowerCase() === "src";
			});
			if (!hasSrc && tag.textNodes?.length > 0) {
				report.addMessage(MESSAGE.CSP_UNSAFE_INLINE_SCRIPT, tag);
			}
		});

		stylesheetLinkTags.forEach((tag) => {
			const href = tag.attributes.find((attr) =>
				attr.name.value.toLowerCase() === "href");
			if (href) {
				deprecatedThemes.forEach((themeName) => {
					if (href.value.value.includes(`/themes/${themeName}/`)) {
						report.addMessage(MESSAGE.DEPRECATED_THEME, {themeName}, href.value);
					}
				});
			}
		});

		taskEnd();
		return {source: "", map: ""};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		context.addLintingMessage(resourcePath, MESSAGE.PARSING_ERROR, {message});
		return;
	}
}

function findBootstrapTag(tags: Tag[]): Tag | undefined {
	// First search for script tag with id "sap-ui-bootstrap"
	for (const tag of tags) {
		for (const attr of tag.attributes) {
			if (attr.name.value.toLowerCase() === "id" &&
				attr.value.value.toLowerCase() === "sap-ui-bootstrap") {
				return tag;
			}
		}
	}

	// Fallback to script tag with src attribute pointing to bootstrap script
	const rBootScripts = /^([^?#]*\/)?(?:sap-ui-(?:core|custom|boot|merged)(?:-[^?#/]*)?|jquery.sap.global|ui5loader(?:-autoconfig)?)\.js(?:[?#]|$)/;
	for (const tag of tags) {
		for (const attr of tag.attributes) {
			if (attr.name.value.toLowerCase() === "src") {
				const url = attr.value.value.toLowerCase();
				if (rBootScripts.exec(url)) {
					return tag;
				}
			}
		}
	}
}

const oldToNewAttr = new Map([
	["data-sap-ui-compatversion", "data-sap-ui-compat-version"],
	["data-sap-ui-flexibilityservices", "data-sap-ui-flexibility-services"],
	["data-sap-ui-frameoptions", "data-sap-ui-frame-options"],
	["data-sap-ui-evt-oninit", "data-sap-ui-on-init"],
	["data-sap-ui-oninit", "data-sap-ui-on-init"],
	["data-sap-ui-resourceroots", "data-sap-ui-resource-roots"],
]);

const aliasToAttr = new Map([
	["data-sap-ui-bindingsyntax", "data-sap-ui-binding-syntax"],
	["data-sap-ui-xx-bindingsyntax", "data-sap-ui-binding-syntax"],
	["data-sap-ui-xx-binding-syntax", "data-sap-ui-binding-syntax"],
	["data-sap-ui-xx-preload", "data-sap-ui-preload"],
	["data-sap-ui-xx-noless", "data-sap-ui-xx-no-less"],
]);

function lintBootstrapAttributes(tag: Tag, report: HtmlReporter) {
	const attributes = new Set();
	for (const attr of tag.attributes) {
		let attributeName = attr.name.value.toLowerCase();
		if (oldToNewAttr.has(attributeName)) {
			attributeName = oldToNewAttr.get(attributeName)!;
			report.addMessage(MESSAGE.SPELLING_BOOTSTRAP_PARAM, {
				oldName: attr.name.value,
				newName: attributeName,
			}, attr.name);
		} else if (aliasToAttr.has(attributeName)) {
			attributeName = aliasToAttr.get(attributeName)!;
		}
		if (attributes.has(attributeName)) {
			report.addMessage(MESSAGE.DUPLICATE_BOOTSTRAP_PARAM, {
				name: attributeName,
				value: attr.name.value,
			}, attr.name);
		}
		attributes.add(attributeName);
		switch (attributeName) {
			case "data-sap-ui-theme":
				checkThemeAttr(attr, report);
				break;
			case "data-sap-ui-libs":
				checkLibraryAttr(attr, report);
				break;
			case "data-sap-ui-modules":
				checkLibraryAttr(attr, report, true);
				break;
			case "data-sap-ui-async":
				checkAsyncAttr(attr, report);
				break;
			case "data-sap-ui-compat-version":
				checkCompatVersionAttr(attr, report);
				break;
			case "data-sap-ui-on-init":
				checkOnInitAttr(attr, report);
				break;
			case "data-sap-ui-binding-syntax":
			case "data-sap-ui-preload":
				report.addMessage(MESSAGE.REDUNDANT_BOOTSTRAP_PARAM, {
					name: attr.name.value,
				}, attr.name);
				break;
			case "data-sap-ui-xx-no-less":
				report.addMessage(MESSAGE.ABANDONED_BOOTSTRAP_PARAM, {
					name: attr.name.value,
				}, attr.name);
				break;
		}
	}

	if (!attributes.has("data-sap-ui-async")) {
		report.addMessage(MESSAGE.MISSING_BOOTSTRAP_PARAM, {
			name: "data-sap-ui-async",
			details: `{@link topic:91f2d03b6f4d1014b6dd926db0e91070 Configuration Options and URL Parameters}`,
		}, tag);
	}
	if (!attributes.has("data-sap-ui-compat-version")) {
		report.addMessage(MESSAGE.MISSING_BOOTSTRAP_PARAM, {
			name: "data-sap-ui-compat-version",
			details: `{@link topic:9feb96da02c2429bb1afcf6534d77c79 Compatibility Version Information (deprecated)}`,
		}, tag);
	}
}

function checkThemeAttr(attr: Attribute, report: HtmlReporter) {
	const themeName = attr.value.value.toLowerCase();
	if (deprecatedThemes.includes(themeName)) {
		report.addMessage(MESSAGE.DEPRECATED_THEME, {
			themeName,
		}, attr.value);
	}
}

function checkLibraryAttr(attr: Attribute, report: HtmlReporter, modulesSyntax = false) {
	const libraries = attr.value.value.toLowerCase().split(",");
	for (let libraryName of libraries) {
		libraryName = libraryName.trim();
		if (modulesSyntax) {
			// The syntax in data-sap-ui-modules is slightly different, the library name
			// is always followed by ".library" to specify the "library module".
			// This string needs to be removed to match the deprecated libraries list:
			// sap.ui.commons.library => sap.ui.commons
			libraryName = libraryName.replace(/\.library$/, "");
		}
		if (deprecatedLibraries.includes(libraryName)) {
			report.addMessage(MESSAGE.DEPRECATED_LIBRARY, {
				libraryName,
			}, attr.value);
		}

		if (libraryName.includes("sap.ui.core.plugin.declarativesupport")) {
			report.addMessage(MESSAGE.DEPRECATED_DECLARATIVE_SUPPORT, attr.value);
		}

		if (libraryName.includes("sap.ui.core.plugin.lesssupport")) {
			report.addMessage(MESSAGE.DEPRECATED_LESS_SUPPORT, attr.value);
		}
	}
}

function checkAsyncAttr(attr: Attribute, report: HtmlReporter) {
	if (attr.value.value.toLowerCase() === "false") {
		report.addMessage(MESSAGE.DEPRECATED_BOOTSTRAP_PARAM, {
			name: "data-sap-ui-async",
			value: "false",
			details: `{@link topic:91f2d03b6f4d1014b6dd926db0e91070 Configuration Options and URL Parameters}`,
		}, attr.value);
	}
}

function checkCompatVersionAttr(attr: Attribute, report: HtmlReporter) {
	if (attr.value.value !== "edge") {
		report.addMessage(MESSAGE.DEPRECATED_BOOTSTRAP_PARAM, {
			name: "data-sap-ui-compat-version",
			value: attr.value.value,
			details: `{@link topic:9feb96da02c2429bb1afcf6534d77c79 Compatibility Version Information (deprecated)}`,
		}, attr.value);
	}
}

function checkOnInitAttr(attr: Attribute, report: HtmlReporter) {
	const value = attr.value.value.toLowerCase().trim();
	if (!value.startsWith("module:")) {
		// Check whether value is a valid function/variable name.
		// Anything that can't be a global function (accessible via "window[value]")
		// should be reported as deprecated. E.g. "my.init-function" or "alert('Hello')"
		// This is a very basic check and might report false positives for function assigned the global scope using
		// string literals, e.g. window["my.init.function"] = function() {}
		const validFunctionName = /^[$_\p{ID_Start}][$_\p{ID_Continue}]*$/u;
		if (!validFunctionName.test(value)) {
			report.addMessage(MESSAGE.DEPRECATED_BOOTSTRAP_PARAM, {
				name: "data-sap-ui-on-init",
				value,
				details: `{@link topic:91f2d03b6f4d1014b6dd926db0e91070 Configuration Options and URL Parameters}`,
			}, attr.value);
		}
	}

	if (value.includes("sap/ui/core/plugin/declarativesupport")) {
		report.addMessage(MESSAGE.DEPRECATED_DECLARATIVE_SUPPORT, attr.value);
	}
}
