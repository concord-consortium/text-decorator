import TextDecorator, { decorateReactHOC, IDecorateReactOptions } from "../src/text-decorator";
import * as React from 'react';
import { shallow } from 'enzyme';

/**
 * Dummy test
 */
describe("decorateReactHOC component", () => {
  it("TextDecorator is instantiable", () => {
    expect(new TextDecorator()).toBeInstanceOf(TextDecorator);
  });

  it("is instantiable", () => {
    const options: IDecorateReactOptions = {
      words: ['Text'],
      replace: <span className='cc-glossary-word'>[$1]</span>
    };
    class TestComponent extends React.Component {
      render() {
        return <div>Text</div>;
      }
    }
    const DecoratedTest = decorateReactHOC(options)(TestComponent);
    const wrapper = shallow(<DecoratedTest />);
    // minimal existence test for now
    expect(wrapper).toBeTruthy();
    expect(wrapper.length).toBe(1);
    expect(wrapper.type()).toBe('div');
    const spanWrapper = wrapper.childAt(0);
    expect(spanWrapper.type()).toBe('span');
    expect(spanWrapper.hasClass('cc-glossary-word')).toBe(true);
    expect(spanWrapper.text()).toBe('[Text]');
  });
});
