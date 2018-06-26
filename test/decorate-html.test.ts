import { decorateHtml, IDecorateHtmlOptions, addEventListeners, removeEventListeners } from "../src/text-decorator";
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

  it("TextDecorator.decorateHtml returns input when not replacing", () => {
    const input = 'Some Text';
    const options: IDecorateHtmlOptions = { words: [], replace: '' };
    const result = decorateHtml(input, options);
    expect(result).toBe(input);
  });

  it("Replaces strings when appropriate", () => {
    const input = 'Some Text';
    const options: IDecorateHtmlOptions = { words: ['Some'], replace: 'Other' };
    const result = decorateHtml(input, options);
    expect(result).toBe('Other Text');
  });

  it("Replaces strings in nested nodes", () => {
    const input = 'Some <span>More</span> Text';
    const options: IDecorateHtmlOptions = { words: ['More'], replace: 'Other' };
    const result = decorateHtml(input, options);
    expect(result).toBe('Some <span>Other</span> Text');
  });

  it("Ignores comments", () => {
    const input = 'Some <!-- More --> Text';
    const options: IDecorateHtmlOptions = { words: ['More'], replace: 'Other' };
    const result = decorateHtml(input, options);
    expect(result).toBe(input);
  });

  it("Ignores invalid HTML", () => {
    const input = '<div></span></div>';
    const options: IDecorateHtmlOptions = { words: [], replace: '' };
    const result = decorateHtml(input, options);
    expect(result).toBe('<div></span></div>');
  });

  it("Replaces multiple instances of a single string", () => {
    const input = 'Some Text<span>with</span>More Text';
    const options: IDecorateHtmlOptions = { words: ['Text'], replace: 'text' };
    const result = decorateHtml(input, options);
    expect(result).toBe('Some text<span>with</span>More text');
  });

  it("Replaces with substitution", () => {
    const input = 'Some Text with more text';
    const options: IDecorateHtmlOptions = { words: ['More'], replace: '<span>$1</span>' };
    const result = decorateHtml(input, options);
    expect(result).toBe('Some Text with <span>more</span> text');
  });

  it("Matches case-insensitive but substitutes case-sensitive", () => {
    const input = 'Some Text with more text';
    const options: IDecorateHtmlOptions = { words: ['More', 'Text'], replace: '<span>$1</span>' };
    const result = decorateHtml(input, options);
    expect(result).toBe('Some <span>Text</span> with <span>more</span> <span>text</span>');
  });

  it("Only replaces text, not tags", () => {
    const input = 'span<span>div</span>';
    const options: IDecorateHtmlOptions = { words: ['span'], replace: '<span>$1</span>' };
    const result = decorateHtml(input, options);
    expect(result).toBe(`<span>span</span><span>div</span>`);
  });

  it("supports '.' and '?' in words to match", () => {
    const input = 'Clouds make the sky cloudy.';
    const options: IDecorateHtmlOptions = { words: ['cloud.?'], replace: '<span>$1</span>' };
    const result = decorateHtml(input, options);
    expect(result).toBe(`<span>Clouds</span> make the sky <span>cloudy</span>.`);
  });

  it("escapes unsupported regex characters", () => {
    const input = 'Text';
    const options: IDecorateHtmlOptions = { words: ['}{)(^$*\\/|'], replace: '<span>$1</span>' };
    const result = decorateHtml(input, options);
    expect(result).toBe(`Text`);
  });

  it("supports balanced brackets (e.g. '[' and ']') in words to match", () => {
    const input = 'They then them';
    const options: IDecorateHtmlOptions = { words: ['the[ym]'], replace: '<span>$1</span>' };
    const result = decorateHtml(input, options);
    expect(result).toBe(`<span>They</span> then <span>them</span>`);
  });

  it("escapes unbalanced brackets (e.g. '[' and ']') in words to match", () => {
    const input = 'They then them';
    const options: IDecorateHtmlOptions = { words: ['the[ym', 'theym]', 'the]ym['], replace: '<span>$1</span>' };
    const result = decorateHtml(input, options);
    expect(result).toBe(`They then them`);
  });

  it("adds and removes a single event handler appropriately", () => {
    // Set up our document body
    document.body.innerHTML = `
      <div>
        <span id="cc-glossary-word" class="cc-glossary-word"/>
          Word
        </span>
      </div>`;
    let clickCount = 0;
    const onClick = { type: 'click', listener: (evt) => { ++clickCount; } };
    addEventListeners('cc-glossary-word', onClick);

    const elt = document.getElementById('cc-glossary-word');

    // cf. https://stackoverflow.com/a/27557936
    const event = document.createEvent("HTMLEvents");
    event.initEvent("click", false, true);

    elt.dispatchEvent(event);
    expect(clickCount).toBe(1);

    removeEventListeners('cc-glossary-word', onClick);

    elt.dispatchEvent(event);
    expect(clickCount).toBe(1);
  });

  it("adds and removes multiple event handlers appropriately", () => {
    // Set up our document body
    document.body.innerHTML = `
      <div>
        <span id="cc-glossary-word" class="cc-glossary-word"/>
          Word
        </span>
      </div>`;
    let eventCount = 0;
    const onMouseDown = { type: 'mousedown', listener: (evt) => { ++eventCount; } };
    const onMouseUp = { type: 'mouseup', listener: (evt) => { ++eventCount; } };
    addEventListeners('cc-glossary-word', [onMouseDown, onMouseUp]);

    const elt = document.getElementById('cc-glossary-word');

    // cf. https://stackoverflow.com/a/27557936
    const downEvent = document.createEvent("HTMLEvents");
    downEvent.initEvent("mousedown", false, true);
    const upEvent = document.createEvent("HTMLEvents");
    upEvent.initEvent("mouseup", false, true);

    elt.dispatchEvent(downEvent);
    elt.dispatchEvent(upEvent);
    expect(eventCount).toBe(2);

    removeEventListeners('cc-glossary-word', [onMouseDown, onMouseUp]);

    elt.dispatchEvent(downEvent);
    elt.dispatchEvent(upEvent);
    expect(eventCount).toBe(2);
  });
});

it("accepts a container element for adding/removing elements", () => {
  // Set up our document body
  document.body.innerHTML = `
    <div id="container">
      <span id="cc-glossary-word" class="cc-glossary-word"/>
        Word
      </span>
    </div>`;
  const container = document.getElementById('container');
  let clickCount = 0;
  const onClick = { type: 'click', listener: (evt) => { ++clickCount; } };
  addEventListeners('cc-glossary-word', onClick, container);

  const elt = document.getElementById('cc-glossary-word');

  // cf. https://stackoverflow.com/a/27557936
  const event = document.createEvent("HTMLEvents");
  event.initEvent("click", false, true);

  elt.dispatchEvent(event);
  expect(clickCount).toBe(1);

  removeEventListeners('cc-glossary-word', onClick, container);

  elt.dispatchEvent(event);
  expect(clickCount).toBe(1);
});
