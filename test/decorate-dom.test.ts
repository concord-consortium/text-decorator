import { decorateDOMClasses, IDecorateHtmlOptions } from "../src/text-decorator";
import { dispatchSimulatedEvent } from "./test-utils.ts";

describe("TextDecorator.decorateDOMClasses tests", () => {

  it("decorates DOM elements with a single class and adds event handlers", () => {
    // Set up our document body
    document.body.innerHTML = `
      <div>
        <span class="cc-glossarize">
          Some Text
        </span>
        <span>
          Some Text
        </span>
      </div>`;
    let clickCount = 0;
    const onClick = { type: 'click', listener: (evt) => { ++clickCount; } };

    decorateDOMClasses('cc-glossarize', { words: ['Text'], replace: "<span class='cc-glossary-word'>$1</span>" },
                                          'cc-glossary-word', onClick);

    const elements = document.getElementsByClassName('cc-glossary-word');
    expect(elements.length).toBe(1);
    const elt = elements && elements[0];
    dispatchSimulatedEvent(elt, 'click');
    expect(clickCount).toBe(1);
  });

  it("decorates DOM elements with an array of classes and adds event handlers", () => {
    // Set up our document body
    document.body.innerHTML = `
      <div>
        <span class="cc-glossarize">
          Some Text
        </span>
        <span>
          Some Text
        </span>
      </div>`;
    let clickCount = 0;
    const onClick = { type: 'click', listener: (evt) => { ++clickCount; } };

    decorateDOMClasses(['foo', 'cc-glossarize', 'bar'],
                        { words: ['Text'], replace: "<span class='cc-glossary-word'>$1</span>" },
                        'cc-glossary-word', onClick, document);

    const elements = document.getElementsByClassName('cc-glossary-word');
    expect(elements.length).toBe(1);
    const elt = elements && elements[0];
    dispatchSimulatedEvent(elt, 'click');
    expect(clickCount).toBe(1);
  });

  it("decorates DOM elements with an array of classes without event handlers", () => {
    // Set up our document body
    document.body.innerHTML = `
      <div>
        <span class="cc-glossarize">
          Some Text
        </span>
        <span>
          Some Text
        </span>
      </div>`;

    decorateDOMClasses(['cc-glossarize', 'foo'],
                        { words: ['Text'], replace: "<span class='cc-glossary-word'>$1</span>" });

    const elements = document.getElementsByClassName('cc-glossary-word');
    expect(elements.length).toBe(1);
  });

});
