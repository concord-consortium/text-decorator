import parse5, { DefaultTreeNode as Node,
                DefaultTreeParentNode as ParentNode,
                DefaultTreeTextNode as TextNode, 
                Location, ParserOptions } from 'parse5';
import * as React from 'react';
type ReactElement = React.ReactElement<any>;
type ReactNode = React.ReactNode;
type ReactNodeArray = React.ReactNodeArray;

// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
  // import "core-js/fn/array.find"
  // ...

interface ITextRun {
  start: number;
  end: number;
}

interface IDecorateOptions {
  words: string[];
}

export interface IDecorateHtmlOptions extends IDecorateOptions {
  replace: string;
}

export interface IDecorateReactOptions extends IDecorateOptions {
  replace: string | ReactElement;
}

function hasUnbalancedBrackets(str: string) {
  let bracketCount = 0;
  for (let i = 0; i < str.length; ++i) {
    const c = str.charAt(i);
    if (c === '[') {
      ++bracketCount;
    }
    else if (c === ']') {
      if (bracketCount <= 0) return true;
      --bracketCount;
    }
  }
  return bracketCount !== 0;
}

// based on https://stackoverflow.com/a/6969486
function escapeRegExp(str: string) {
  const regex = hasUnbalancedBrackets(str)
                    // allow '.', '?', but escape brackets
                  ? /[\-\[\]\/\{\}\(\)\*\+\\\^\$\|]/g
                    // allow '.', '?', '[', ']'
                  : /[\-\/\{\}\(\)\*\+\\\^\$\|]/g;
  return str.replace(regex, "\\$&");
}

function generateRegEx(words: string[]) {
  const escaped = words.map(expr => escapeRegExp(expr))
                      .filter(expr => !!expr);
  return new RegExp(`(?:^|\\b)(${escaped.join('|')})(?=\\b|$)`, 'gi');
}

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
export function decorateHtml(input: string, options: IDecorateHtmlOptions) {
  const textRuns: ITextRun[] = [];
  // regex for matching glossary words
  const regex = generateRegEx(options.words);
  const parseOptions: ParserOptions = { sourceCodeLocationInfo: true };
  const fragment: Node = parse5.parseFragment(input, parseOptions) as Node;

  const identifyTextRuns = (node: Node) => {
    const nodeAsParent = node as any as ParentNode;
    if (node.nodeName === '#text') {
      const textNode = node as any as TextNode;
      const location = textNode.sourceCodeLocation as Location;
      textRuns.push({ start: location.startOffset, end: location.endOffset });
    }
    else if (nodeAsParent.childNodes && nodeAsParent.childNodes.length) {
      nodeAsParent.childNodes.forEach((node) => identifyTextRuns(node));
    }
    return node;
  };
  identifyTextRuns(fragment);

  // replace text in text runs where appropriate
  let result = input;
  for (let i = textRuns.length - 1; i >= 0; --i) {
    const textRun = textRuns[i];
    const text = result.substring(textRun.start, textRun.end);
    const newText = text.replace(regex, options.replace);
    if (newText !== text) {
      const prefix = textRun.start > 0 ? result.substring(0, textRun.start) : '';
      const suffix = textRun.end < result.length ? result.substring(textRun.end) : '';
      result = `${prefix}${newText}${suffix}`;
    }
  }
  return result;
}

interface IEventListener {
  type: string;
  listener: (evt: Event) => void;
}

type IEventListeners = IEventListener | IEventListener[];

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
export function addEventListeners(className: string, listeners: IEventListeners,
                                  container: Element | Document = document) {
  const arrayListeners = Array.isArray(listeners) ? listeners : [listeners];
  const elements = container.getElementsByClassName(className);
  Array.prototype.forEach.call(elements, (elt: Element) => {
    arrayListeners.forEach(listener => {
      elt.addEventListener(listener.type, listener.listener);
    });
  });
}

export function removeEventListeners(className: string, listeners: IEventListeners,
                                      container: Element | Document = document) {
  const arrayListeners = Array.isArray(listeners) ? listeners : [listeners];
  const elements = container.getElementsByClassName(className);
  Array.prototype.forEach.call(elements, (elt: Element) => {
    arrayListeners.forEach(listener => {
      elt.removeEventListener(listener.type, listener.listener);
    });
  });
}

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
export function decorateReact(input: ReactNode, options: IDecorateReactOptions): ReactNode {
  // regex for matching glossary words
  const regex = generateRegEx(options.words);
  // generates replacement React element for matched words
  const replaceElement = (match: string, replace: ReactElement, index: number = 0) => {
    const children = replace.props.children;
    const newChildren = (children == null) || (children.length === 0)
                          ? match
                          : (typeof children === 'string'
                              ? match.replace(regex, children)
                              : children);
    return React.cloneElement(replace, { key: `${match}-${index}` }, newChildren);
  };
  // recursively scans React nodes, replacing glossary words
  const decorateNode = (node: ReactNode): ReactNode => {
    const nodeType = typeof node;
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
      const nodeStr = node as string;
      if (typeof options.replace === 'string') {
        // simple string replacement
        return nodeStr.replace(regex, options.replace);
      }
      // ReactElement replacement
      const matches: ITextRun[] = [];
      const nodes: ReactNode[] = [];
      let match;
      // tslint:disable-next-line:no-conditional-assignment
      while (match = regex.exec(nodeStr)) {
        // cf. https://stackoverflow.com/a/2295943
        matches.push({ start: match.index, end: match.index + match[0].length });
      }
      // if no matches, return the original node
      if (!matches.length) { return node; }
      // handle complete match
      if ((matches.length === 1) && (matches[0].start === 0) && (matches[0].end === nodeStr.length)) {
        return replaceElement(nodeStr, options.replace);
      }
      // handle partial matches
      matches.forEach((match, index) => {
        const prevMatch = index > 0 ? matches[index - 1] : { start: -1, end: 0 };
        // add text before match
        if (match.start > prevMatch.end) {
          nodes.push(nodeStr.substring(prevMatch.end, match.start));
        }
        // replace the match
        const matchStr = nodeStr.substring(match.start, match.end);
        nodes.push(replaceElement(matchStr, options.replace as ReactElement, index));
      });
      // add text after the last match
      if (matches[matches.length - 1].end < nodeStr.length) {
        nodes.push(nodeStr.substring(matches[matches.length - 1].end));
      }
      return nodes;
    }
    /*
      * array nodes
      */
    if (Array.isArray(node)) {
      const nodeArray = node as ReactNodeArray;
      // map each node and flatten the result
      const newArray = nodeArray.reduce<ReactNodeArray>((prev, item) => {
                                  const newNode = decorateNode(item);
                                  if (Array.isArray(newNode)) {
                                    prev.push(...newNode);
                                  }
                                  else {
                                    prev.push(newNode);
                                  }
                                  return prev;
                                }, []);
      if ((newArray.length === nodeArray.length) &&
          newArray.every((item, index) => { return item === nodeArray[index]; })) {
        // all items are unchanged -- reuse original node
        return node;
      }
      return newArray;
    }
    /*
      * ReactElement nodes
      */
    const elt = node as ReactElement;
    if (elt.props && elt.props.children) {
      const newChildren = decorateNode(elt.props.children);
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
export function decorateReactHOC(options: IDecorateReactOptions) {
  return <P extends object>(WrappedComponent: React.ComponentClass<P>) => {
    return class DecoratedWrappedComponent extends WrappedComponent {
      render() {
        return decorateReact(super.render(), options);
      }
    };
  };
}

/*
* DecorateChildren
* 
* React component which decorates any text among its children.
* decorateOptions must be passed in props.
* cf. https://medium.com/@franleplant/react-higher-order-components-in-depth-cf9032ee6c3e
* Appendix B for discussion of parent component versus higher-order component wrapper.
*/
interface IProps {
  decorateOptions: IDecorateReactOptions;
}
export const DecorateChildren: React.SFC<IProps> = (props) => {
  const { children, decorateOptions } = props;
  return decorateReact(children, decorateOptions) as ReactElement;
};
