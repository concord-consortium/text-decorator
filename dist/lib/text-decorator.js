"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var parse5_1 = require("parse5");
var React = require("react");
function hasUnbalancedBrackets(str) {
    var bracketCount = 0;
    for (var i = 0; i < str.length; ++i) {
        var c = str.charAt(i);
        if (c === '[') {
            ++bracketCount;
        }
        else if (c === ']') {
            if (bracketCount <= 0)
                return true;
            --bracketCount;
        }
    }
    return bracketCount !== 0;
}
// based on https://stackoverflow.com/a/6969486
function escapeRegExp(str) {
    var regex = hasUnbalancedBrackets(str)
        // allow '.', '?', but escape brackets
        ? /[\-\[\]\/\{\}\(\)\*\+\\\^\$\|]/g
        // allow '.', '?', '[', ']'
        : /[\-\/\{\}\(\)\*\+\\\^\$\|]/g;
    return str.replace(regex, "\\$&");
}
function generateRegEx(words) {
    var escaped = words.map(function (expr) { return escapeRegExp(expr); })
        .filter(function (expr) { return !!expr; });
    return new RegExp("(?:^|\\b)(" + escaped.join('|') + ")(?=\\b|$)", 'gi');
}
/*
 * decorateDOMClasses(textClasses: string | string[], options: IDecorateHtmlOptions,
 *                    wordClass?: string, listeners?: IEventListeners,
 *                    container: Element | Document = document)
 *
 * Parses the innerHTML of DOM elements with the specified classes, replacing instances of words
 * specified in the options.words argument with the replacement string specified in options.replace.
 * Handles HTML tags properly -- text will only be replaced in text, not in tags.
 * Allows '$1' in the replacement string so that 'word' with a replacement string
 * of '<span>"$1"</span>' would be replaced with '<span>"word"</span>'.
 * Adds the specified event handlers to all elements with the specified class, which will
 * correspond to each replaced word if the replacement string specifies an element with a class.
 *
 * If this function is called multiple times on the same DOM node, it will create extraneous DOM
 * element nesting and redundant addition of event listeners. It is best used in contexts where
 * it can be called immediately after the HTML content is rendered.
 *
 * textClasses: string | string[] - a class or array of classes whose contents are to be decorated.
 *                                  The individual array elements are passed to getElementsByClassName(),
 *                                  so multiple space-delimited classes are ANDed together, i.e. all
 *                                  classes must be present to match, while the array elements are ORed,
 *                                  i.e. matching any array element constitutes a match.
 * options:
 *  words: string[] - a list of words to be decorated. Word-matching is case-insensitive.
 *                    The words can include limited RegExp functionality:
 *                      '.' - represents a wildcard character ('*' is not supported)
 *                      '?' - makes the previous character optional
 *                      '[', ']' - represents a set of possible characters, e.g. [aeiou] for a vowel
 *  replace: string - the replacement string. Can include '$1' representing the matched word.
 * wordClass: string - the class used for the enclosing tag (e.g. 'cc-glossary-word')
 * listeners: IEventListeners - one or more { type, listener } tuples
 * container: Element | Document - the scope within which to search for elements
 *                                  defaults to the entire document
 */
function decorateDOMClasses(textClasses, options, wordClass, listeners, container) {
    if (container === void 0) { container = document; }
    // accept single class or array of classes
    var classes = Array.isArray(textClasses) ? textClasses : [textClasses];
    // decorate the text contained in the specified DOM elements
    classes.forEach(function (c) {
        var elements = document.getElementsByClassName(c);
        Array.prototype.forEach.call(elements, function (elt) {
            elt.innerHTML = decorateHtml(elt.innerHTML, options);
        });
    });
    // add any specified event listeners
    if (wordClass && listeners) {
        addEventListeners(wordClass, listeners, container);
    }
}
exports.decorateDOMClasses = decorateDOMClasses;
/*
 * decorateHtml(input: string, options: IDecorateHtmlOptions)
 *
 * Parses the specified HTML input, replacing instances of words specified in the
 * options.words argument with the replacement string specified in options.replace.
 * Handles HTML tags properly -- text will only be replaced in text, not in tags.
 * Allows '$1' in the replacement string so that 'word' with a replacement string
 * of '<span>"$1"</span>' would be replaced with '<span>"word"</span>'.
 *
 * input: the HTML to be decorated as a string
 * options:
 *  words: string[] - a list of words to be decorated. Word-matching is case-insensitive.
 *                    The words can include limited RegExp functionality:
 *                      '.' - represents a wildcard character ('*' is not supported)
 *                      '?' - makes the previous character optional
 *                      '[', ']' - represents a set of possible characters, e.g. [aeiou] for a vowel
 *  replace: string - the replacement string. Can include '$1' representing the matched word.
 */
function decorateHtml(input, options) {
    var textRuns = [];
    // regex for matching glossary words
    var regex = generateRegEx(options.words);
    var parseOptions = { sourceCodeLocationInfo: true };
    var fragment = parse5_1.default.parseFragment(input, parseOptions);
    var identifyTextRuns = function (node) {
        var nodeAsParent = node;
        if (node.nodeName === '#text') {
            var textNode = node;
            var location_1 = textNode.sourceCodeLocation;
            textRuns.push({ start: location_1.startOffset, end: location_1.endOffset });
        }
        else if (nodeAsParent.childNodes && nodeAsParent.childNodes.length) {
            nodeAsParent.childNodes.forEach(function (node) { return identifyTextRuns(node); });
        }
        return node;
    };
    identifyTextRuns(fragment);
    // replace text in text runs where appropriate
    var result = input;
    for (var i = textRuns.length - 1; i >= 0; --i) {
        var textRun = textRuns[i];
        var text = result.substring(textRun.start, textRun.end);
        var newText = text.replace(regex, options.replace);
        if (newText !== text) {
            var prefix = textRun.start > 0 ? result.substring(0, textRun.start) : '';
            var suffix = textRun.end < result.length ? result.substring(textRun.end) : '';
            result = "" + prefix + newText + suffix;
        }
    }
    return result;
}
exports.decorateHtml = decorateHtml;
/*
 * addEventListeners(className: string, listeners: IEventListeners,
 *                    container: Element | Document = document)
 * removeEventListeners(className: string, listeners: IEventListeners,
 *                      container: Element | Document = document)
 *
 * Since decorateHtml() is simply performing string replacement operations,
 * it cannot add or remove any event handlers. Once the resulting HTML
 * has been added to the DOM, addEventListeners() can be called to
 * add handlers for 'click' or other events and the removeEventListeners()
 * function can be used to remove those same event handlers.
 *
 * className: string - the class used for the enclosing tag (e.g. 'cc-glossary-word')
 * listeners: IEventListeners - one or more { type, listener } tuples
 * container: Element | Document - the scope within which to search for elements
 *                                  defaults to the entire document
 */
function addEventListeners(className, listeners, container) {
    if (container === void 0) { container = document; }
    var arrayListeners = Array.isArray(listeners) ? listeners : [listeners];
    var elements = container.getElementsByClassName(className);
    Array.prototype.forEach.call(elements, function (elt) {
        arrayListeners.forEach(function (listener) {
            elt.addEventListener(listener.type, listener.listener);
        });
    });
}
exports.addEventListeners = addEventListeners;
function removeEventListeners(className, listeners, container) {
    if (container === void 0) { container = document; }
    var arrayListeners = Array.isArray(listeners) ? listeners : [listeners];
    var elements = container.getElementsByClassName(className);
    Array.prototype.forEach.call(elements, function (elt) {
        arrayListeners.forEach(function (listener) {
            elt.removeEventListener(listener.type, listener.listener);
        });
    });
}
exports.removeEventListeners = removeEventListeners;
/*
 * decorateReact(input: ReactNode, options: IDecorateReactOptions): ReactNode
 *
 * Post-processes the specified React virtual DOM, replacing instances of words specified in
 * the options.words argument with the replacement string specified in options.replace.
 * Handles nested virtual DOM elements properly: text will only be replaced in text, not in tags.
 *
 * While this function can be called directly, it is anticipated that for most clients either
 * decorateReactHOC(), the higher-order component (HOC) wrapper, or DecorateChildren, the
 * parent component that supports decorating its children, will be more convenient.
 *
 * input: the virtual DOM to be decorated
 * options:
 *  words: string[] - a list of words to be decorated. Word-matching is case-insensitive.
 *                    The words can include limited RegExp functionality:
 *                      '.' - represents a wildcard character ('*' is not supported)
 *                      '?' - makes the previous character optional
 *                      '[', ']' - represents a set of possible characters, e.g. [aeiou] for a vowel
 *  replace: the string or virtual DOM element with which to replace each matched word.
 *           The replace element can be coded in JSX/TSX.
 *           The replacement can include '$1' representing the matched word.
 *           If the replacement is a single empty element without a '$1', the '$1' is inferred,
 *           i.e. <span></span> is treated like <span>$1</span>.
 *
 * Event listeners can be included in the replace argument in typical React fashion, so
 * the addEventListeners() and removeEventListeners() functions need/should not be called.
 */
function decorateReact(input, options) {
    // regex for matching glossary words
    var regex = generateRegEx(options.words);
    // generates replacement React element for matched words
    var replaceElement = function (match, replace, index) {
        if (index === void 0) { index = 0; }
        var children = replace.props.children;
        var newChildren = (children == null) || (children.length === 0)
            ? match
            : (typeof children === 'string'
                ? match.replace(regex, children)
                : children);
        return React.cloneElement(replace, { key: match + "-" + index }, newChildren);
    };
    // recursively scans React nodes, replacing glossary words
    var decorateNode = function (node) {
        var nodeType = typeof node;
        /*
          * simple nodes
          */
        if ((node == null) || (nodeType === 'boolean') || (nodeType === 'number')) {
            return node;
        }
        if (!options || !options.words || !options.words.length || (options.replace == null)) {
            return node;
        }
        /*
          * string nodes
          */
        if (nodeType === 'string') {
            var nodeStr_1 = node;
            if (typeof options.replace === 'string') {
                // simple string replacement
                return nodeStr_1.replace(regex, options.replace);
            }
            // ReactElement replacement
            var matches_1 = [];
            var nodes_1 = [];
            var match = void 0;
            // tslint:disable-next-line:no-conditional-assignment
            while (match = regex.exec(nodeStr_1)) {
                // cf. https://stackoverflow.com/a/2295943
                matches_1.push({ start: match.index, end: match.index + match[0].length });
            }
            // if no matches, return the original node
            if (!matches_1.length) {
                return node;
            }
            // handle complete match
            if ((matches_1.length === 1) && (matches_1[0].start === 0) && (matches_1[0].end === nodeStr_1.length)) {
                return replaceElement(nodeStr_1, options.replace);
            }
            // handle partial matches
            matches_1.forEach(function (match, index) {
                var prevMatch = index > 0 ? matches_1[index - 1] : { start: -1, end: 0 };
                // add text before match
                if (match.start > prevMatch.end) {
                    nodes_1.push(nodeStr_1.substring(prevMatch.end, match.start));
                }
                // replace the match
                var matchStr = nodeStr_1.substring(match.start, match.end);
                nodes_1.push(replaceElement(matchStr, options.replace, index));
            });
            // add text after the last match
            if (matches_1[matches_1.length - 1].end < nodeStr_1.length) {
                nodes_1.push(nodeStr_1.substring(matches_1[matches_1.length - 1].end));
            }
            return nodes_1;
        }
        /*
          * array nodes
          */
        if (Array.isArray(node)) {
            var nodeArray_1 = node;
            // map each node and flatten the result
            var newArray = nodeArray_1.reduce(function (prev, item) {
                var newNode = decorateNode(item);
                if (Array.isArray(newNode)) {
                    prev.push.apply(prev, newNode);
                }
                else {
                    prev.push(newNode);
                }
                return prev;
            }, []);
            if ((newArray.length === nodeArray_1.length) &&
                newArray.every(function (item, index) { return item === nodeArray_1[index]; })) {
                // all items are unchanged -- reuse original node
                return node;
            }
            return newArray;
        }
        /*
          * ReactElement nodes
          */
        var elt = node;
        if (elt.props && elt.props.children) {
            var newChildren = decorateNode(elt.props.children);
            // return original node if children haven't changed
            return newChildren === elt.props.children
                ? elt
                : React.cloneElement(elt, undefined, newChildren);
        }
        // otherwise, return the original node
        return node;
    };
    return decorateNode(input);
}
exports.decorateReact = decorateReact;
/*
* decorateReactHOC()
*
* Higher-order component which can be used to wrap another component,
* decorating text within the wrapped component.
*
* cf. https://medium.com/@franleplant/react-higher-order-components-in-depth-cf9032ee6c3e
* for discussion of "render highjacking" in a higher-order component using the
* "inheritance inversion" technique used here.
*
* cf. https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb
* for discussion of TypeScript types for higher-order components.
*
* Usage:
*  class MyClass {
*    render() { ... }
*  }
*  export default decorateReactHOC(options)(MyClass);
*/
function decorateReactHOC(options) {
    return function (WrappedComponent) {
        return /** @class */ (function (_super) {
            __extends(DecoratedWrappedComponent, _super);
            function DecoratedWrappedComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DecoratedWrappedComponent.prototype.render = function () {
                return decorateReact(_super.prototype.render.call(this), options);
            };
            return DecoratedWrappedComponent;
        }(WrappedComponent));
    };
}
exports.decorateReactHOC = decorateReactHOC;
exports.DecorateChildren = function (props) {
    var children = props.children, decorateOptions = props.decorateOptions;
    return decorateReact(children, decorateOptions);
};
//# sourceMappingURL=text-decorator.js.map