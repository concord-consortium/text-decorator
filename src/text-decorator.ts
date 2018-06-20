import parse5, { DefaultTreeNode as Node,
                DefaultTreeParentNode as ParentNode,
                DefaultTreeTextNode as TextNode, 
                Location, ParserOptions } from 'parse5';

// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
  // import "core-js/fn/array.find"
  // ...

interface ITextRun {
  start: number;
  end: number;
}
export default class TextDecorator {

  static decorateHtml(input: string, words: string[], replaceStr: string) {
    const textRuns: ITextRun[] = [];
    const regex = new RegExp(`(?:^|\\b)(${words.join('|')})(?=\\b|$)`, 'gi');
    const options: ParserOptions = { sourceCodeLocationInfo: true };
    const fragment: Node = parse5.parseFragment(input, options) as Node;

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
      const newText = text.replace(regex, replaceStr);
      if (newText !== text) {
        const prefix = textRun.start > 0 ? result.substring(0, textRun.start) : '';
        const suffix = textRun.end < result.length ? result.substring(textRun.end) : '';
        result = `${prefix}${newText}${suffix}`;
      }
    }
    return result;
  }
}
