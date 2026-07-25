// Data-format conversion (CSV / JSON / YAML / XML).
//
// Pure-JS, fully client-side — no WASM, no network, no eval. This module is
// dynamically imported by ./engine.ts, so papaparse + js-yaml + fast-xml-parser
// only ship to the data pages and never weigh down the image converters.
//
// All three libraries are same-origin bundled and CSP-safe with the site's
// existing policy: papaparse only touches the network/Workers when you pass
// `download:true` / `worker:true` (we never do), js-yaml and fast-xml-parser
// are plain parsers. So — unlike the HEIC/WASM path — this needed no CSP change.

import Papa from "papaparse";
// js-yaml 5.x is ESM with named exports (no default).
import { load as yamlLoad, dump as yamlDump } from "js-yaml";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";

import type { Conversion, DataFormat } from "./registry";
import type { ConversionResult } from "./engine";

/** Swap a filename's extension, preserving the rest of the name. */
function withExtension(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.${ext}`;
}

// A friendly label for error messages.
const FORMAT_LABEL: Record<DataFormat, string> = {
  csv: "CSV",
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
};

const XML_ATTR_PREFIX = "@_";

// --- parsing (text -> JS value) -------------------------------------------

function parseInput(text: string, format: DataFormat): unknown {
  switch (format) {
    case "json":
      try {
        return JSON.parse(text);
      } catch (err) {
        throw new Error(`Invalid JSON: ${(err as Error).message}`);
      }

    case "yaml":
      try {
        return yamlLoad(text);
      } catch (err) {
        // js-yaml's YAMLException message already includes line/column.
        throw new Error(`Invalid YAML: ${(err as Error).message}`);
      }

    case "csv": {
      const result = Papa.parse<Record<string, unknown>>(text.trim(), {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      const fatal = result.errors?.find((e) => e.type !== "FieldMismatch");
      if (fatal) {
        const where = fatal.row != null ? ` (row ${fatal.row + 1})` : "";
        throw new Error(`Invalid CSV: ${fatal.message}${where}`);
      }
      return result.data;
    }

    case "xml": {
      const check = XMLValidator.validate(text);
      if (check !== true) {
        const { msg, line } = check.err;
        throw new Error(`Invalid XML: ${msg} (line ${line})`);
      }
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: XML_ATTR_PREFIX,
        ignoreDeclaration: true,
        parseTagValue: true,
        trimValues: true,
      });
      return parser.parse(text);
    }
  }
}

// --- shaping helpers for the tabular formats ------------------------------

/**
 * Find the array of records inside a parsed value. Arrays pass through; a
 * single object becomes a one-row array; wrapper objects (typical of XML,
 * e.g. `{ rows: { row: [...] } }`) are unwrapped down to the inner array.
 */
function findRecords(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 1) {
      const inner = (value as Record<string, unknown>)[keys[0]];
      if (Array.isArray(inner)) return inner;
      if (inner && typeof inner === "object") return findRecords(inner);
    }
    return [value];
  }
  return [value];
}

/** Wrap a value so it has a single XML root element. */
function wrapForXml(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return { root: { item: value } };
  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 1) return value as Record<string, unknown>;
    return { root: value };
  }
  return { root: value };
}

// --- serialising (JS value -> text) ---------------------------------------

function toCsv(value: unknown): string {
  const records = findRecords(value).map((r) =>
    r && typeof r === "object" && !Array.isArray(r)
      ? (r as Record<string, unknown>)
      : { value: r }
  );
  if (records.length === 0) return "";
  // Union of every record's keys, so no column is silently dropped.
  const fields = [...new Set(records.flatMap((r) => Object.keys(r)))];
  return Papa.unparse({ fields, data: records });
}

function serializeOutput(
  value: unknown,
  to: DataFormat,
  from: DataFormat
): string {
  switch (to) {
    case "json":
      return JSON.stringify(value, null, 2) + "\n";

    case "yaml":
      return yamlDump(value, { lineWidth: -1, noRefs: true });

    case "csv":
      return toCsv(value);

    case "xml": {
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: XML_ATTR_PREFIX,
        format: true,
        indentBy: "  ",
      });
      // CSV rows read most naturally as <rows><row>…; anything else gets a
      // generic single root wrapper.
      const tree =
        from === "csv"
          ? { rows: { row: findRecords(value) } }
          : wrapForXml(value);
      return builder.build(tree);
    }
  }
}

/** Convert a text-data file according to a "data" registry entry. */
export async function convertData(
  file: File,
  conversion: Conversion
): Promise<ConversionResult> {
  if (!conversion.data) {
    throw new Error("Missing data conversion spec");
  }
  const { from, to } = conversion.data;

  const text = await file.text();
  if (!text.trim()) {
    throw new Error(`Nothing to convert — paste or drop some ${FORMAT_LABEL[from]}`);
  }

  const value = parseInput(text, from);
  const output = serializeOutput(value, to, from);

  const blob = new Blob([output], { type: `${conversion.targetMime};charset=utf-8` });
  return { blob, filename: withExtension(file.name, conversion.targetExt) };
}
