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
  enableFilterClass?: string;
  words: string[];
}

export interface IDecorateHtmlOptions extends IDecorateOptions {
  replace: string;
}

export interface IDecorateReactOptions extends IDecorateOptions {
  replace: string | ReactElement;
}

export default class TextDecorator {

  static decorateHtml(input: string, options: IDecorateHtmlOptions) {
    const textRuns: ITextRun[] = [];
    const regex = new RegExp(`(?:^|\\b)(${options.words.join('|')})(?=\\b|$)`, 'gi');
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

  static decorateReact(input: ReactNode, options: IDecorateReactOptions): ReactNode {
    // regex for matching glossary words
    const regex = new RegExp(`(?:^|\\b)(${options.words.join('|')})(?=\\b|$)`, 'gi');
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
        return TextDecorator.decorateReact(super.render(), options);
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
  return TextDecorator.decorateReact(children, decorateOptions) as ReactElement;
};
