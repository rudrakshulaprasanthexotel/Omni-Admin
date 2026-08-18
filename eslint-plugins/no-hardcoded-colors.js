const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3,8})$/;
const RGB_REGEX = /^rgba?\s*\(/i;
const HSL_REGEX = /^hsla?\s*\(/i;

const COLOR_FUNCTION_REGEX = /(?:rgba?|hsla?)\s*\(/i;
const HEX_IN_STRING_REGEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;

const THEME_CONFIG_PATH = 'src/configs/theme.config.ts';

function isColorValue(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return (
    HEX_COLOR_REGEX.test(trimmed) ||
    RGB_REGEX.test(trimmed) ||
    HSL_REGEX.test(trimmed)
  );
}

function containsColor(value) {
  if (typeof value !== 'string') return false;
  return HEX_IN_STRING_REGEX.test(value) || COLOR_FUNCTION_REGEX.test(value);
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded color values. Colors must be defined in theme.config.ts only.',
    },
    messages: {
      noHardcodedColor:
        'Hardcoded color "{{value}}" is not allowed. Define colors in @src/configs/theme.config.ts and reference them from there.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (filename.includes(THEME_CONFIG_PATH)) {
      return {};
    }

    function report(node, value) {
      context.report({
        node,
        messageId: 'noHardcodedColor',
        data: { value },
      });
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string' && containsColor(node.value)) {
          report(node, node.value);
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          const raw = quasi.value.raw;
          if (containsColor(raw)) {
            report(node, raw.match(HEX_IN_STRING_REGEX)?.[0] || raw.match(COLOR_FUNCTION_REGEX)?.[0]);
          }
        }
      },
    };
  },
};

const plugin = {
  meta: {
    name: 'eslint-plugin-no-hardcoded-colors',
    version: '1.0.0',
  },
  rules: {
    'no-hardcoded-colors': rule,
  },
};

export default plugin;
