const parseStyle = require('postcss-safe-parser'),
  entities = require('entities');

const property = p => o => o[p];
const isWhitespace = s => /^\s*$/.test(s);

// Rules that are safe to strip from nodes with no child text or only
// whitespace
const contentProps = new Set([
  'color'
  , 'font-family'
  , 'text-align'
  , 'font-weight'
  , 'vertical-align'
  , 'word-wrap'
  , '-webkit-hyphens'
  , '-moz-hyphens'
  , 'hyphens'
]);

const noContentProps = new Set([
  'font-size', 'line-height'
]);

// Rules that are safe to strip from nodes where these rules are
// overriden before they would be applied to any non-whitespace text.
const contentPropsSafe = new Set([
  'color'
  , 'font-family'
  , 'font-weight'
  , 'vertical-align'
  , 'word-wrap'
  , '-webkit-hyphens'
  , '-moz-hyphens'
  , 'hyphens'
]);

// Like contentPropsSafe except will only be removed if never gets
// applied to any text, whitespace or not
const contentPropsNoTextSafe = new Set([
  'text-decoration'
]);


function getText(tree) {
  return (tree.content || []).map(function (child) {
    if (typeof child === 'string') {
      return child;
    } else {
      return getText(child);
    }
  }).join('');
}

function isPropNeverAppliedToText_(targetProp, tree) {
  if (typeof tree === 'string') {
    return isWhitespace(tree);
  }
  if (!tree.content) {
    return true;
  }

  if (tree.attrs && tree.attrs.style) {
    const styles = parseStyle(tree.attrs.style).nodes;
    if (styles.some(function (s) { return s.prop === targetProp; })) {
      return true;
    }
  }

  return tree.content.every(function (child) {
    return isPropNeverAppliedToText(targetProp, child);
  });
}

// Same as the _ helper version, except don't check the first level
// for the targetProp style
function isPropNeverAppliedToText(targetProp, tree) {
  if (typeof tree === 'string' || tree.tag === 'img') {
    return false;
  }
  if (!tree.content) {
    return true;
  }

  return tree.content.every(function (child) {
    return isPropNeverAppliedToText_(targetProp, child)
  });
}

function postHtmlMinifyInlineCss(tree) {
  tree.match({}, function (node) {
    // Ignore text nodes
    if (!node.tag) {
      return node;
    }

    const text = node.content ? entities.decodeHTML(getText(node)) : '';

    if (isWhitespace(text) && node.attrs && node.attrs.style) {
      if (node.tag.toLowerCase() !== 'img') {
        const styles = parseStyle(node.attrs.style);
        styles.nodes = styles.nodes.filter(function (o) {
          return !contentProps.has(o.prop);
        });
        if (!node.content) {
          styles.nodes = styles.nodes.filter(function (o) {
            return !noContentProps.has(o.prop);
          });
        }
        node.attrs.style = styles.toString();
      }
    } else if (node.attrs && node.attrs.style) {
      const styles = parseStyle(node.attrs.style),
        props = new Set(styles.nodes.map(property('prop')));

      contentPropsSafe.forEach(function (cp) {
        if (props.has(cp) && isPropNeverAppliedToText(cp, node)) {
          styles.nodes = styles.nodes.filter(function (o) {
            return o.prop !== cp;
          });
        }
      });

      node.attrs.style = styles.toString();
    }

    if (node.attrs && node.attrs.style === '') {
      delete node.attrs.style;
    }

    return node;
  });
}

module.exports = function (options) {
  // Options not used; but may be later.
  return postHtmlMinifyInlineCss;
};
