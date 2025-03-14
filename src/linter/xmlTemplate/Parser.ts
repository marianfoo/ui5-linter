import {Attribute as SaxAttribute, Tag as SaxTag, Position as SaxPosition} from "sax-wasm";
import he from "he";
import ViewGenerator from "./generator/ViewGenerator.js";
import FragmentGenerator from "./generator/FragmentGenerator.js";
import JSTokenizer from "./lib/JSTokenizer.js";
import LinterContext from "../LinterContext.js";
import {TranspileResult} from "../LinterContext.js";
import AbstractGenerator from "./generator/AbstractGenerator.js";
import {getLogger} from "@ui5/logger";
import {MESSAGE} from "../messages.js";
import {ApiExtract} from "../../utils/ApiExtract.js";
const log = getLogger("linter:xmlTemplate:Parser");

export type Namespace = string;
export interface NamespaceDeclaration {
	localName: string | null; // null for default namespace
	namespace: Namespace;
}

// Parse the XML node by node. We only expect four types of node
// Once parsed, render the nodes as JavaScript code, starting with the leaves
export const enum NodeKind {
	Unknown = 0,
	Control = 1 << 0,
	Aggregation = 1 << 1,
	FragmentDefinition = 1 << 2,
	Template = 1 << 3,
	Xhtml = 1 << 4, // Should generally be ignored
	Svg = 1 << 5, // Should generally be ignored
}

export interface Position {
	line: number;
	column: number;
}

export interface NodeDeclaration {
	kind: NodeKind;
	name: string;
	namespace: Namespace;
	start: Position;
	end: Position;
}

export interface ControlDeclaration extends NodeDeclaration {
	kind: NodeKind.Control;
	properties: Set<PropertyDeclaration>;
	aggregations: Map<string, AggregationDeclaration>;
	variableName?: string; // Will be populated during generation phase
}

export interface AggregationDeclaration extends NodeDeclaration {
	kind: NodeKind.Aggregation;
	owner: ControlDeclaration;
	controls: ControlDeclaration[];
}

export interface FragmentDefinitionDeclaration extends NodeDeclaration {
	kind: NodeKind.FragmentDefinition;
	controls: Set<ControlDeclaration>;
}

// interface TemplateDeclaration extends NodeDeclaration {
// 	kind: NodeKind.Template
// }

interface AttributeDeclaration {
	name: string;
	value: string;
	localNamespace?: string;
	start: Position;
	end: Position;
}

type PropertyDeclaration = AttributeDeclaration;

export interface RequireExpression extends AttributeDeclaration {
	declarations: RequireDeclaration[];
}

export interface RequireDeclaration {
	moduleName: string;
	variableName?: string;
}

interface NamespaceStackEntry {
	namespace: NamespaceDeclaration;
	level: number;
}

const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const TEMPLATING_NAMESPACE = "http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1";
const FESR_NAMESPACE = "http://schemas.sap.com/sapui5/extension/sap.ui.core.FESR/1";
const SAP_BUILD_NAMESPACE = "sap.build";
const SAP_UI_DT_NAMESPACE = "sap.ui.dt";
const CUSTOM_DATA_NAMESPACE = "http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1";
const CORE_NAMESPACE = "sap.ui.core";
const PATTERN_LIBRARY_NAMESPACES = /^([a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)$/;

const enum DocumentKind {
	View,
	Fragment,
}

function determineDocumentKind(resourceName: string): DocumentKind | null {
	if (/\.view.xml$/.test(resourceName)) {
		return DocumentKind.View;
	} else if (/\.fragment.xml$/.test(resourceName)) {
		return DocumentKind.Fragment;
	} else if (/\.control.xml$/.test(resourceName)) {
		throw new Error(`Control XML analysis is currently not supported for resource ${resourceName}`);
	} else {
		return null;
	}
}

function toPosition(saxPos: SaxPosition): Position {
	return {
		line: saxPos.line,
		column: saxPos.character,
	};
}

export default class Parser {
	#resourceName: string;
	#xmlDocumentKind: DocumentKind;

	#context: LinterContext;
	#namespaceStack: NamespaceStackEntry[] = [];
	#nodeStack: NodeDeclaration[] = [];

	#generator: AbstractGenerator;
	#apiExtract: ApiExtract;

	constructor(resourceName: string, apiExtract: ApiExtract, context: LinterContext) {
		const xmlDocumentKind = determineDocumentKind(resourceName);
		if (xmlDocumentKind === null) {
			throw new Error(`Unknown document type for resource ${resourceName}`);
		}
		this.#resourceName = resourceName;
		this.#xmlDocumentKind = xmlDocumentKind;
		this.#generator = xmlDocumentKind === DocumentKind.View ?
			new ViewGenerator(resourceName) :
			new FragmentGenerator(resourceName);

		this.#apiExtract = apiExtract;
		this.#context = context;
	}

	pushTag(tag: SaxTag) {
		this.#nodeStack.push(this._createNode(tag));
	}

	popTag(_tag: SaxTag) { // No need to use the parsed tag, we rely on our nodeStack
		const level = this.#nodeStack.length;
		const closingNode = this.#nodeStack.pop();

		if (closingNode &&
			(closingNode.kind & (NodeKind.Control | NodeKind.FragmentDefinition))) {
			// Generate view code for this control
			// If this is the root control, export it
			if (level === 1) {
				// Actually closingNode might be a FragmentDefinitionDeclaration here
				// But that's tricky with the current generator signatures
				this.#generator.writeRootControl(closingNode as ControlDeclaration);
			} else {
				this.#generator.writeControl(closingNode as ControlDeclaration);
			}
		}
		// Cleanup stacks stacks
		this._removeNamespacesForLevel(level);
	}

	generate(): TranspileResult {
		const {source, map} = this.#generator.getModuleContent();
		return {
			source,
			map,
		};
	}

	_findParentNode(kindFilter: number): NodeDeclaration | null {
		for (let i = this.#nodeStack.length - 1; i >= 0; i--) {
			if (this.#nodeStack[i].kind & kindFilter) {
				return this.#nodeStack[i];
			}
		}
		return null;
	}

	_addNamespace(namespace: NamespaceDeclaration, level: number) {
		this.#namespaceStack.push({
			namespace,
			level,
		});
	}

	_resolveNamespace(localName: string | null): Namespace | undefined {
		// Search this.#namespaceStack in reverse order
		for (let i = this.#namespaceStack.length - 1; i >= 0; i--) {
			const ns = this.#namespaceStack[i];
			if (ns.namespace.localName === localName) {
				return ns.namespace.namespace;
			}
		}
	}

	_removeNamespacesForLevel(level: number) {
		// Remove all namespaces for the given level
		let i = this.#namespaceStack.length - 1;
		while (i >= 0 && this.#namespaceStack[i].level >= level) {
			this.#namespaceStack.pop();
			i--;
		}
	}

	_addDefaultAggregation(
		owner: ControlDeclaration, control: ControlDeclaration
	) {
		let aggregationName = this.#apiExtract.getDefaultAggregation(`${owner.namespace}.${owner.name}`);

		if (!aggregationName) {
			log.verbose(`Failed to determine default aggregation for control ${owner.name} used in ` +
				`resource ${this.#resourceName}. Falling back to 'dependents'`);
			// In case the default aggregation is unknown (e.g. in case of custom controls),
			// fallback to use the generic "dependents" aggregation
			// This is not correct at runtime, but it's the best we can do for linting purposes
			aggregationName = "dependents";
		}
		if (!owner.aggregations.has(aggregationName)) {
			const aggregation = {
				kind: NodeKind.Aggregation,
				name: aggregationName,
				owner,
				controls: [control],
				namespace: owner.namespace,
				start: control.start,
				end: control.end,
			} as AggregationDeclaration;
			owner.aggregations.set(aggregationName, aggregation);
		} else {
			owner.aggregations.get(aggregationName)!.controls.push(control);
		}
	}

	_parseRequireAttribute(attrValue: string): RequireDeclaration[] {
		try {
			// This is no well-formed JSON, therefore we have to parse it manually
			const requireMap = JSTokenizer.parseJS(attrValue);
			return Object.keys(requireMap).map((variableName) => {
				return {
					moduleName: requireMap[variableName],
					variableName,
				};
			});
		} catch (_) {
			throw new Error(`Failed to parse require attribute value ${attrValue} in resource ${this.#resourceName}`);
		}
	}

	_createNode(tag: SaxTag): NodeDeclaration {
		let tagName = tag.name;
		let tagNamespace = null; // default namespace

		// Extract optional namespace from attribute name
		if (tagName.includes(":")) {
			[tagNamespace, tagName] = tagName.split(":");
		}

		const attributes = new Set<AttributeDeclaration>();
		tag.attributes.forEach((attr: SaxAttribute) => {
			const attrName = attr.name.value;
			const attrValue = he.decode(attr.value.value);
			// Extract namespaces immediately so we can resolve namespaced attributes in the next go
			if (attrName === "xmlns") {
				// Declares the default namespace
				this._addNamespace({
					localName: null,
					namespace: attrValue,
				}, this.#nodeStack.length);
			} else if (attrName.startsWith("xmlns:")) {
				// Named namespace
				this._addNamespace({
					localName: attrName.slice(6), // Remove "xmlns:"
					namespace: attrValue,
				}, this.#nodeStack.length);
			} else if (attrName.includes(":")) {
				// Namespaced attribute
				const [attrNamespace, attrLocalName] = attrName.split(":");
				attributes.add({
					name: attrLocalName,
					value: attrValue,
					localNamespace: attrNamespace,
					start: toPosition(attr.name.start),
					end: toPosition({
						line: attr.value.end.line,
						character: attr.value.end.character + 1, // Add 1 to include the closing quote
					}),
				});
			} else {
				attributes.add({
					name: attrName,
					value: attrValue,
					start: toPosition(attr.name.start),
					end: toPosition({
						line: attr.value.end.line,
						character: attr.value.end.character + 1, // Add 1 to include the closing quote
					}),
				});
			}
		});

		// Note: Resolve namespace *after* evaluating all attributes, since it might have been defined
		// by one of them
		let namespace = this._resolveNamespace(tagNamespace);
		if (!namespace) {
			throw new Error(`Unknown namespace ${tagNamespace} for tag ${tagName} in resource ${this.#resourceName}`);
		} else if (namespace === SVG_NAMESPACE) {
			// Ignore SVG nodes
			this.#context.addLintingMessage(this.#resourceName,
				MESSAGE.SVG_IN_XML,
				undefined as never,
				{
					line: tag.openStart.line + 1, // Add one to align with IDEs
					column: tag.openStart.character,
				}
			);
			return {
				kind: NodeKind.Svg,
				name: tagName,
				namespace,
				start: toPosition(tag.openStart),
				end: toPosition(tag.openEnd),
			};
		} else if (namespace === XHTML_NAMESPACE) {
			// Ignore XHTML nodes for now
			this.#context.addLintingMessage(this.#resourceName,
				MESSAGE.HTML_IN_XML,
				undefined as never,
				{
					line: tag.openStart.line + 1, // Add one to align with IDEs
					column: tag.openStart.character,
				}
			);
			return {
				kind: NodeKind.Xhtml,
				name: tagName,
				namespace,
				start: toPosition(tag.openStart),
				end: toPosition(tag.openEnd),
			};
		} else if (namespace === TEMPLATING_NAMESPACE) {
			return {
				kind: NodeKind.Template,
				name: tagName,
				namespace,
				start: toPosition(tag.openStart),
				end: toPosition(tag.openEnd),
			};
		} else if (PATTERN_LIBRARY_NAMESPACES.test(namespace)) {
			const lastIdx = tagName.lastIndexOf(".");
			if (lastIdx !== -1) {
				// Resolve namespace prefix, e.g. "sap:m.Button"
				namespace += `.${tagName.slice(0, lastIdx)}`;
				tagName = tagName.slice(lastIdx + 1);
			}

			return this._handleUi5LibraryNamespace(tagName, namespace, attributes, tag);
		} else {
			return {
				kind: NodeKind.Unknown,
				name: tagName,
				namespace,
				start: toPosition(tag.openStart),
				end: toPosition(tag.openEnd),
			};
		}
	}

	_handleUi5LibraryNamespace(
		moduleName: string, namespace: Namespace, attributes: Set<AttributeDeclaration>,
		tag: SaxTag
	): ControlDeclaration | AggregationDeclaration | FragmentDefinitionDeclaration {
		const controlProperties = new Set<PropertyDeclaration>();
		const customDataElements: ControlDeclaration[] = [];
		attributes.forEach((attr) => {
			if (attr.localNamespace) {
				// Resolve namespace
				const resolvedNamespace = this._resolveNamespace(attr.localNamespace);
				if (!resolvedNamespace) {
					throw new Error(`Unknown namespace ${attr.localNamespace} for attribute ${attr.name} ` +
						`in resource ${this.#resourceName}`);
				}
				if ((resolvedNamespace === CORE_NAMESPACE ||
					resolvedNamespace === TEMPLATING_NAMESPACE) && attr.name === "require") {
					// sap.ui.core:require or template:require declaration
					let requireDeclarations: RequireDeclaration[];
					if (resolvedNamespace === TEMPLATING_NAMESPACE && !attr.value.startsWith("{")) {
						/* From: https://github.com/SAP/openui5/blob/959dcf4d0ac771aa53ce4f4bf02832356afd8c23/src/sap.ui.core/src/sap/ui/core/util/XMLPreprocessor.js#L1301-L1306
						 * "template:require" attribute may contain either a space separated list of
						 * dot-separated module names or a JSON representation of a map from alias to
						 * slash-separated Unified Resource Names (URNs). In the first case, the resulting
						 * modules must be accessed from the global namespace. In the second case, they are
						 * available as local names (AMD style) similar to <template:alias> instructions.
						 */
						requireDeclarations = [];
						attr.value.split(" ").map(function (sModuleName) {
							const requiredModuleName = sModuleName.replace(/\./g, "/");
							// We can't (and also really shouldn't) declare a global namespace for the imported
							// module, so we just use the module name as variable name
							const variableName = requiredModuleName.replaceAll("/", "_");
							requireDeclarations.push({
								moduleName: requiredModuleName,
								variableName,
							});
						});
					} else {
						// Common case: JSON-like representation
						requireDeclarations = this._parseRequireAttribute(attr.value);
					}
					const requireExpression = {
						name: attr.name,
						value: attr.value,
						declarations: requireDeclarations,
						start: attr.start,
						end: attr.end,
					} as RequireExpression;

					this.#generator.writeRequire(requireExpression);
				} else if (resolvedNamespace === FESR_NAMESPACE ||
					resolvedNamespace === SAP_BUILD_NAMESPACE || resolvedNamespace === SAP_UI_DT_NAMESPACE) {
					// Silently ignore FESR, sap.build and sap.ui.dt attributes
				} else if (resolvedNamespace === CUSTOM_DATA_NAMESPACE) {
					// Add custom data element and add it as an aggregation
					const customData: ControlDeclaration = {
						kind: NodeKind.Control,
						name: "CustomData",
						namespace: CORE_NAMESPACE,
						properties: new Set([
							{
								name: "key",
								value: attr.name,
								start: attr.start,
								end: attr.end,
							} as PropertyDeclaration,
							{
								name: "value",
								value: attr.value,
								start: attr.start,
								end: attr.end,
							} as PropertyDeclaration,
						]),
						aggregations: new Map(),
						start: attr.start,
						end: attr.end,
					};
					customDataElements.push(customData);
					// Immediately write the custom data element declaration to make it usable
					// in the control aggregation
					this.#generator.writeControl(customData);
				} else {
					log.verbose(`Ignoring unknown namespaced attribute ${attr.localNamespace}:${attr.name} ` +
						`for ${moduleName} in resource ${this.#resourceName}`);
				}
			} else {
				controlProperties.add(attr);
			}
		});

		const parentNode = this._findParentNode(
			NodeKind.Control | NodeKind.Aggregation | NodeKind.FragmentDefinition);

		if (/^[a-z]/.exec(moduleName)) {
			const aggregationName = moduleName;
			// TODO: Replace the above with a check against known controls. Even though there are
			// no known cases of lower case control names in the framework.
			// This node likely declares an aggregation
			if (!parentNode || parentNode.kind === NodeKind.FragmentDefinition) {
				if (this.#xmlDocumentKind !== DocumentKind.Fragment) {
					throw new Error(`Unexpected top-level aggregation declaration: ` +
						`${aggregationName} in resource ${this.#resourceName}`);
				}
				// In case of top-level aggregations in fragments, generate an sap.ui.core.Control instance and
				// add the aggregation's content to it's dependents aggregation
				const coreControl: ControlDeclaration = {
					kind: NodeKind.Control,
					name: "Control",
					namespace: CORE_NAMESPACE,
					properties: new Set(),
					aggregations: new Map(),
					start: toPosition(tag.openStart),
					end: toPosition(tag.openEnd),
				};
				return coreControl;
			} else if (parentNode.kind === NodeKind.Aggregation) {
				throw new Error(`Unexpected aggregation ${aggregationName} within aggregation ${parentNode.name} ` +
					`in resource ${this.#resourceName}`);
			}
			const owner = parentNode as ControlDeclaration;

			let ownerAggregation = owner.aggregations.get(aggregationName);
			if (!ownerAggregation) {
				// Create aggregation declaration if not already declared before
				// (duplicate aggregation tags are merged into the first occurrence)
				ownerAggregation = {
					kind: NodeKind.Aggregation,
					name: aggregationName,
					namespace,
					owner: parentNode as ControlDeclaration,
					controls: [],
					start: toPosition(tag.openStart),
					end: toPosition(tag.openEnd),
				};
				owner.aggregations.set(aggregationName, ownerAggregation);
			}
			return ownerAggregation;
		} else if (this.#xmlDocumentKind === DocumentKind.Fragment && moduleName === "FragmentDefinition" &&
			namespace === CORE_NAMESPACE) {
			// This node declares a fragment definition
			const node: FragmentDefinitionDeclaration = {
				kind: NodeKind.FragmentDefinition,
				name: moduleName,
				namespace,
				controls: new Set(),
				start: toPosition(tag.openStart),
				end: toPosition(tag.openEnd),
			};

			if (parentNode) {
				throw new Error(`Unexpected nested FragmentDefiniton in resource ${this.#resourceName}`);
			}
			return node;
		} else {
			// This node declares a control
			// Or a fragment definition in case of a fragment
			const node: ControlDeclaration = {
				kind: NodeKind.Control,
				name: moduleName,
				namespace,
				properties: controlProperties,
				aggregations: new Map(),
				start: toPosition(tag.openStart),
				end: toPosition(tag.openEnd),
			};
			if (customDataElements?.length) {
				node.aggregations.set("customData", {
					kind: NodeKind.Aggregation,
					name: "customData",
					namespace,
					owner: node,
					controls: customDataElements,
					start: toPosition(tag.openStart),
					end: toPosition(tag.openEnd),
				});
			}

			if (parentNode) {
				if (parentNode.kind === NodeKind.Control) {
					// Insert the current control in the default aggregation of the last control
					this._addDefaultAggregation(parentNode as ControlDeclaration, node);
				} else if (parentNode.kind === NodeKind.Aggregation) {
					const aggregationNode = parentNode as AggregationDeclaration;
					aggregationNode.controls.push(node);
				} else if (parentNode.kind === NodeKind.FragmentDefinition) {
					// Add the control to the fragment definition
					(parentNode as FragmentDefinitionDeclaration).controls.add(node);
				} else {
					throw new Error(`Unexpected node kind ${parentNode.kind} in resource ${this.#resourceName}`);
				}
			}
			return node;
		}
	}
}
