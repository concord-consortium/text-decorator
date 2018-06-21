import TextDecorator, { IDecorateReactOptions } from "../src/text-decorator";
import * as React from 'react';
type ReactElement = React.ReactElement<any>;

/**
 * decorateReact tests
 */
describe("Test decorateReact (i.e. JSX/TSX)", () => {
  const kNullOptions: IDecorateReactOptions = { words: [], replace: '' };
  
  it("handles primitive values", () => {
    expect(TextDecorator.decorateReact(null, kNullOptions)).toBe(null);
    expect(TextDecorator.decorateReact(undefined, kNullOptions)).toBe(undefined);
    expect(TextDecorator.decorateReact(0, kNullOptions)).toBe(0);
    expect(TextDecorator.decorateReact(1, kNullOptions)).toBe(1);
    expect(TextDecorator.decorateReact(false, kNullOptions)).toBe(false);
    expect(TextDecorator.decorateReact(true, kNullOptions)).toBe(true);
  });

  it("substitutes simple strings", () => {
    const someOtherOptions: IDecorateReactOptions = { words: ['Some'], replace: 'Other' };
    const textDataOptions: IDecorateReactOptions = { words: ['text'], replace: 'data' };
    expect(TextDecorator.decorateReact("Some Text", kNullOptions)).toBe("Some Text");
    expect(TextDecorator.decorateReact("Some Text", someOtherOptions)).toBe("Other Text");
    expect(TextDecorator.decorateReact("Text TEXT text", textDataOptions)).toBe("data data data");
  });

  it("ignores unknown objects", () => {
    const empty = {};
    expect(TextDecorator.decorateReact(empty, kNullOptions)).toBe(empty);
  });

  it("handles arrays of simple values", () => {
    const input = [undefined, null, 0, 1, false, true, "Some Text"];
    const someMoreOptions: IDecorateReactOptions = { words: ['Some'], replace: 'More' };
    const result = TextDecorator.decorateReact(input, someMoreOptions);
    expect(JSON.stringify(result)).toBe(JSON.stringify(input).replace("Some", "More"));
  });

  it("works with compiled JSX/TSX", () => {
    const input = <div></div>;
    const options = { words: ['foo'], replace: '' };
    const result = TextDecorator.decorateReact(input, options);
    expect(JSON.stringify(result)).toBe(JSON.stringify(input));
  });

  it("works with compiled JSX/TSX", () => {
    const input = <div>bar</div>;
    const options = { words: ['foo'], replace: '' };
    const result = TextDecorator.decorateReact(input, options);
    expect(JSON.stringify(result)).toBe(JSON.stringify(input));
  });

  it("works with compiled JSX/TSX", () => {
    const input = <div>Some <span>Text</span></div>;
    const result = TextDecorator.decorateReact(input, kNullOptions);
    expect(JSON.stringify(result)).toBe(JSON.stringify(input));
  });

  it("replaces text in compiled JSX/TSX", () => {
    const input = <div>{["Some", "Text"]}</div>;
    const someMoreOptions: IDecorateReactOptions = { words: ['Some'], replace: 'More' };
    const result = TextDecorator.decorateReact(input, someMoreOptions);
    expect(JSON.stringify(result)).toBe(JSON.stringify(input).replace('Some', 'More'));
  });

  it("replaces text, not tags in compiled JSX/TSX", () => {
    const input = <div><span>div</span> span</div>;
    const spanTextOptions: IDecorateReactOptions = { words: ['span'], replace: 'text' };
    const expected = <div><span>div</span> text</div>;
    const result = TextDecorator.decorateReact(input, spanTextOptions) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("wraps complete text nodes with <span> nodes", () => {
    const input = 'word';
    const options: IDecorateReactOptions = {
            words: ['word'],
            replace: <span></span>
          };
    const expected = <span key='word-0'>word</span>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("wraps complete text nodes with <span> nodes and uses $1 in replacement string", () => {
    const input = 'word';
    const options: IDecorateReactOptions = {
            words: ['word'],
            replace: <span>[$1]</span>
          };
    const expected = <span key='word-0'>[word]</span>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("wraps complete text nodes with <span> nodes and classNames", () => {
    const input = 'word';
    const options: IDecorateReactOptions = {
            words: ['word'],
            replace: <span className='cc-glossary-word'>$1</span>
          };
    const expected = <span className='cc-glossary-word' key='word-0'>word</span>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("does nothing when there's nothing to match", () => {
    const input = <div>Some More Text</div>;
    const expected = <div>Some More Text</div>;
    const result = TextDecorator.decorateReact(input, kNullOptions) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("does nothing when there is no match", () => {
    const input = <div>Some More Text</div>;
    const expected = <div>Some More Text</div>;
    const options = { words: ['foo'], replace: 'bar' };
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("does nothing when there is no match", () => {
    const input = <div>Some More Text</div>;
    const options: IDecorateReactOptions = {
            words: ['foo'],
            replace: <span>$1</span>
          };
    const expected = <div>Some More Text</div>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("wraps partial text nodes in middle with <span> nodes and classNames", () => {
    const input = <div>Some More Text</div>;
    const options: IDecorateReactOptions = {
            words: ['More'],
            replace: <span className='cc-glossary-word'></span>
          };
    const expected = <div>Some <span className='cc-glossary-word' key='More-0'>More</span> Text</div>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("wraps partial text nodes at beginning with <span> nodes and classNames", () => {
    const input = <div>Some More Text</div>;
    const options: IDecorateReactOptions = {
            words: ['Some'],
            replace: <span>$1</span>
          };
    const expected = <div><span key='Some-0'>Some</span> More Text</div>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("wraps partial text nodes at end with <span> nodes and classNames", () => {
    const input = <div>Some More Text</div>;
    const options: IDecorateReactOptions = {
            words: ['Text'],
            replace: <span>$1</span>
          };
    const expected = <div>Some More <span key='Text-0'>Text</span></div>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("wraps partial text nodes with <span> nodes and classNames", () => {
    const input = <div>Some More "Text"</div>;
    const options: IDecorateReactOptions = {
            words: ['Text'],
            replace: <span>$1</span>
          };
    const expected = <div>Some More "<span key='Text-0'>Text</span>"</div>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("wraps multiple text matches with <span> nodes and classNames", () => {
    const input = <div>Some More Text</div>;
    const options: IDecorateReactOptions = {
            words: ['Some', 'More', 'Text'],
            replace: <span></span>
          };
    const expected = <div><span key='Some-0'>Some</span> <span key='More-1'>More</span> <span key='Text-2'>Text</span></div>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("returns the original node when there is no match", () => {
    const input = <div>Some More <span key='Text-0'>Text</span></div>;
    const options: IDecorateReactOptions = {
            words: ['foo'],
            replace: <span></span>
          };
    const expected = input;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });

  it("wraps partial text nodes with <span> nodes in presence of other span nodes", () => {
    const input = <div>Some More <span key='Text-0'>Text</span></div>;
    const options: IDecorateReactOptions = {
            words: ['Some'],
            replace: <span></span>
          };
    const expected = <div><span key='Some-0'>Some</span> More <span key='Text-0'>Text</span></div>;
    const result = TextDecorator.decorateReact(input, options) as ReactElement;
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });
});

it("replaces matches with nested elements", () => {
  const input = <div>Some More Text</div>;
  const options: IDecorateReactOptions = {
          words: ['Text'],
          replace: <span><div>Text</div></span>
        };
  // note: $1 not currently recognized in nested element trees
  const expected = <div>Some More <span key='Text-0'><div>Text</div></span></div>;
  const result = TextDecorator.decorateReact(input, options) as ReactElement;
  expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
});
