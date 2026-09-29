// Minimal JSON Schema (draft 2020-12 subset) validator.
//
// Self-contained on purpose: the repository ships with no dependencies, and the
// test suite must run with a bare `node test/run-tests.mjs`. This validator
// covers exactly the keywords used by skills/resume-copilot/schemas/*.json:
//   type, required, properties, additionalProperties, enum, const, items,
//   minItems, uniqueItems, minLength, minimum, maximum, anyOf, $ref, $defs,
//   default (ignored for validation).
//
// Unsupported keywords are ignored rather than silently "passing" the whole
// schema, so the suite stays honest about what it does and does not check.

import fs from 'node:fs';
import path from 'node:path';

function decodePointerPart(part) {
  return part.replace(/~1/g, '/').replace(/~0/g, '~');
}

function resolvePointer(root, pointer) {
  if (pointer === '' || pointer === '#') return root;
  const clean = pointer.replace(/^#/, '');
  const parts = clean.split('/').filter((p) => p.length > 0).map(decodePointerPart);
  let current = root;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function matchesType(value, type) {
  switch (type) {
    case 'null':
      return value === null;
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    default:
      return false;
  }
}

/**
 * Create a validator bound to a schema directory (for cross-file $ref).
 * @param {string} schemaDir absolute path to the schemas/ folder
 */
export function createValidator(schemaDir) {
  const cache = new Map();

  function loadSchema(file) {
    const abs = path.isAbsolute(file) ? file : path.join(schemaDir, file);
    if (cache.has(abs)) return cache.get(abs);
    if (!fs.existsSync(abs)) {
      throw new Error(`Cannot resolve $ref schema file: ${file}`);
    }
    const schema = JSON.parse(fs.readFileSync(abs, 'utf8'));
    cache.set(abs, schema);
    return schema;
  }

  /**
   * @param {object} schema
   * @param {*} data
   * @param {{root:object, errors:Array<{path:string,message:string}>, path:string}} ctx
   */
  function walk(schema, data, ctx) {
    if (schema == null) return;

    if (typeof schema.$ref === 'string') {
      const ref = schema.$ref;
      let targetRoot = ctx.root;
      let pointer = '#';
      if (ref.includes('.json')) {
        const [file, ptr] = ref.split('#');
        targetRoot = loadSchema(file);
        pointer = ptr ? `#${ptr}` : '#';
      } else {
        pointer = ref;
      }
      const target = resolvePointer(targetRoot, pointer);
      if (target === undefined) {
        ctx.errors.push({ path: ctx.path, message: `Unresolvable $ref: ${ref}` });
        return;
      }
      walk(target, data, { ...ctx, root: targetRoot });
      return;
    }

    if (Array.isArray(schema.anyOf)) {
      const branchErrors = [];
      for (const branch of schema.anyOf) {
        const local = [];
        walk(branch, data, { ...ctx, errors: local });
        if (local.length === 0) return; // one branch matched
        branchErrors.push(local);
      }
      ctx.errors.push({
        path: ctx.path,
        message: `Does not match any anyOf branch (${branchErrors.length} tried)`,
      });
      return;
    }

    if (Array.isArray(schema.enum)) {
      const ok = schema.enum.some((candidate) => JSON.stringify(candidate) === JSON.stringify(data));
      if (!ok) {
        ctx.errors.push({
          path: ctx.path,
          message: `Value ${JSON.stringify(data)} is not one of enum [${schema.enum
            .map((e) => JSON.stringify(e))
            .join(', ')}]`,
        });
      }
    }

    if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(data)) {
      ctx.errors.push({
        path: ctx.path,
        message: `Value ${JSON.stringify(data)} !== const ${JSON.stringify(schema.const)}`,
      });
    }

    if (schema.type) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (!types.some((t) => matchesType(data, t))) {
        ctx.errors.push({
          path: ctx.path,
          message: `Expected type ${types.join('|')}, got ${typeOf(data)}`,
        });
        // Type mismatch: deeper checks would be noise.
        return;
      }
    }

    if (typeof data === 'string' && typeof schema.minLength === 'number') {
      if (data.length < schema.minLength) {
        ctx.errors.push({
          path: ctx.path,
          message: `String length ${data.length} < minLength ${schema.minLength}`,
        });
      }
    }

    if (typeof data === 'number') {
      if (typeof schema.minimum === 'number' && data < schema.minimum) {
        ctx.errors.push({ path: ctx.path, message: `${data} < minimum ${schema.minimum}` });
      }
      if (typeof schema.maximum === 'number' && data > schema.maximum) {
        ctx.errors.push({ path: ctx.path, message: `${data} > maximum ${schema.maximum}` });
      }
    }

    if (Array.isArray(data)) {
      if (typeof schema.minItems === 'number' && data.length < schema.minItems) {
        ctx.errors.push({
          path: ctx.path,
          message: `Array length ${data.length} < minItems ${schema.minItems}`,
        });
      }
      if (schema.uniqueItems === true) {
        const seen = new Set();
        data.forEach((item, i) => {
          const key = JSON.stringify(item);
          if (seen.has(key)) {
            ctx.errors.push({ path: `${ctx.path}[${i}]`, message: 'Duplicate item (uniqueItems)' });
          }
          seen.add(key);
        });
      }
      if (schema.items) {
        data.forEach((item, i) => {
          walk(schema.items, item, { ...ctx, path: `${ctx.path}[${i}]` });
        });
      }
    }

    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      if (Array.isArray(schema.required)) {
        for (const key of schema.required) {
          if (!(key in data)) {
            ctx.errors.push({ path: ctx.path, message: `Missing required property "${key}"` });
          }
        }
      }
      const props = schema.properties || {};
      for (const [key, value] of Object.entries(data)) {
        if (key in props) {
          walk(props[key], value, { ...ctx, path: `${ctx.path}.${key}` });
        } else if (schema.additionalProperties === false) {
          ctx.errors.push({
            path: `${ctx.path}.${key}`,
            message: `Additional property "${key}" is not allowed`,
          });
        } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
          walk(schema.additionalProperties, value, { ...ctx, path: `${ctx.path}.${key}` });
        }
      }
    }
  }

  /**
   * Validate `data` against a schema object (or schema file name).
   * @returns {Array<{path:string, message:string}>} errors (empty = valid)
   */
  function validate(schemaOrFile, data) {
    const schema = typeof schemaOrFile === 'string' ? loadSchema(schemaOrFile) : schemaOrFile;
    const errors = [];
    walk(schema, data, { root: schema, errors, path: '$' });
    return errors;
  }

  return { validate, loadSchema };
}
