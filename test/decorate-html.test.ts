import TextDecorator, { IDecorateHtmlOptions } from "../src/text-decorator";
import parse5, { DefaultTreeDocumentFragment as DocumentFragment,
                  DefaultTreeElement as Element,
                  DefaultTreeTextNode as TextNode } from 'parse5';

/**
 * Dummy test
 */
describe("Parse5 tests", () => {
  it("parse5 is instantiable and parses HTML", () => {
    const html = '<div>Some Text</div>';
    const fragment: DocumentFragment = parse5.parseFragment(html) as DocumentFragment;
    const divNode: Element = fragment.childNodes[0] as Element;
    expect(divNode.tagName).toBe('div');
    expect(divNode.childNodes.length).toBe(1);
    const textNode: TextNode = divNode.childNodes[0] as TextNode;
    expect(textNode.nodeName).toBe('#text');
    expect(textNode.value).toBe('Some Text');
  });

  it("parse5 parses plain text", () => {
    const html = 'Some Text';
    const fragment: DocumentFragment = parse5.parseFragment(html) as DocumentFragment;
    const textNode: TextNode = fragment.childNodes[0] as TextNode;
    expect(textNode.nodeName).toBe('#text');
    expect(textNode.value).toBe('Some Text');
  });

  it("parse5 parses plain text with <span> tags", () => {
    const html = 'Some <span>More</span> Text';
    const fragment: DocumentFragment = parse5.parseFragment(html) as DocumentFragment;
    expect(fragment.childNodes.length).toBe(3);
    const [ someNode, moreNode, textNode ]: [TextNode, Element, TextNode] = fragment.childNodes as [TextNode, Element, TextNode];
    expect(someNode.nodeName).toBe('#text');
    expect(someNode.value).toBe('Some ');
    expect(moreNode.nodeName).toBe('span');
    expect(moreNode.childNodes.length).toBe(1);
    const moreTextNode: TextNode = moreNode.childNodes[0] as TextNode;
    expect(moreTextNode.nodeName).toBe('#text');
    expect(moreTextNode.value).toBe('More');
    expect(textNode.nodeName).toBe('#text');
    expect(textNode.value).toBe(' Text');
  });

  it("parse5 round-trip (parse/serialize) matches original", () => {
    const html = 'Some <span>More</span> Text';
    const fragment: DocumentFragment = parse5.parseFragment(html) as DocumentFragment;
    const result = parse5.serialize(fragment);
    expect(result).toBe(html);
  });
});

describe("TextDecorator.decorateHtml tests", () => {
  it("TextDecorator is instantiable", () => {
    expect(new TextDecorator()).toBeInstanceOf(TextDecorator);
  });

  it("TextDecorator.decorateHtml exists", () => {
    expect(TextDecorator.decorateHtml).toBeTruthy();
  });

  it("TextDecorator.decorateHtml returns input when not replacing", () => {
    const input = 'Some Text';
    const options: IDecorateHtmlOptions = { words: [], replace: '' };
    const result = TextDecorator.decorateHtml(input, options);
    expect(result).toBe(input);
  });

  it("Replaces strings when appropriate", () => {
    const input = 'Some Text';
    const options: IDecorateHtmlOptions = { words: ['Some'], replace: 'Other' };
    const result = TextDecorator.decorateHtml(input, options);
    expect(result).toBe('Other Text');
  });

  it("Replaces strings in nested nodes", () => {
    const input = 'Some <span>More</span> Text';
    const options: IDecorateHtmlOptions = { words: ['More'], replace: 'Other' };
    const result = TextDecorator.decorateHtml(input, options);
    expect(result).toBe('Some <span>Other</span> Text');
  });

  it("Ignores comments", () => {
    const input = 'Some <!-- More --> Text';
    const options: IDecorateHtmlOptions = { words: ['More'], replace: 'Other' };
    const result = TextDecorator.decorateHtml(input, options);
    expect(result).toBe(input);
  });

  it("Ignores invalid HTML", () => {
    const input = '<div></span></div>';
    const options: IDecorateHtmlOptions = { words: [], replace: '' };
    const result = TextDecorator.decorateHtml(input, options);
    expect(result).toBe('<div></span></div>');
  });

  it("Replaces multiple instances of a single string", () => {
    const input = 'Some Text<span>with</span>More Text';
    const options: IDecorateHtmlOptions = { words: ['Text'], replace: 'text' };
    const result = TextDecorator.decorateHtml(input, options);
    expect(result).toBe('Some text<span>with</span>More text');
  });

  it("Replaces with substitution", () => {
    const input = 'Some Text with more text';
    const options: IDecorateHtmlOptions = { words: ['More'], replace: '<span>$1</span>' };
    const result = TextDecorator.decorateHtml(input, options);
    expect(result).toBe('Some Text with <span>more</span> text');
  });

  it("Matches case-insensitive but substitutes case-sensitive", () => {
    const input = 'Some Text with more text';
    const options: IDecorateHtmlOptions = { words: ['More', 'Text'], replace: '<span>$1</span>' };
    const result = TextDecorator.decorateHtml(input, options);
    expect(result).toBe('Some <span>Text</span> with <span>more</span> <span>text</span>');
  });

  it("Only replaces text, not tags", () => {
    const input = 'span<span>div</span>';
    const options: IDecorateHtmlOptions = { words: ['span'], replace: '<span>$1</span>' };
    const result = TextDecorator.decorateHtml(input, options);
    expect(result).toBe(`<span>span</span><span>div</span>`);
  });
});
