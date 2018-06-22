import { DecorateChildren, IDecorateReactOptions } from "../src/text-decorator";
import * as React from 'react';
import { shallow } from 'enzyme';

/**
 * Dummy test
 */
describe("DecorateChildren component", () => {

  it("is instantiable", () => {
    const options: IDecorateReactOptions = {
      words: ['Text'],
      replace: <span className='cc-glossary-word'>[$1]</span>
    };
    const input = <DecorateChildren decorateOptions={options}>
                    <div>Text</div>
                  </DecorateChildren>;
    const wrapper = shallow(input);
    // minimal existence test for now
    expect(wrapper.type()).toBe('div');
    const spanWrapper = wrapper.childAt(0);
    expect(spanWrapper.type()).toBe('span');
    expect(spanWrapper.hasClass('cc-glossary-word')).toBe(true);
    expect(spanWrapper.text()).toBe('[Text]');
  });
});
