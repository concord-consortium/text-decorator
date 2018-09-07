# Text Decorator

Part of [Concord Consortium's](https://concord.org) Glossary PluginApp package which can be used to apply `<span>` tags and classes to application text to support the glossary. It is deployed to [github.io](https://concord-consortium.github.io/text-plugins/).

This project was created using the [TypeScript Library Starter](https://github.com/alexjoverm/typescript-library-starter#readme) project, whose local [README](README-typescript-library-starter) provides additional information about the configuration of the project.

### Demos
- [HTML Demo](https://concord-consortium.github.io/text-plugins/test/decorate-html.test.html)
- [DOM Demo](https://concord-consortium.github.io/text-plugins/test/decorate-dom.test.html)
- [React Demo](https://concord-consortium.github.io/text-plugins/test/decorate-react.test.html)

## API

### decorateDOMClasses
`decorateDOMClasses(textClasses: string | string[], options: IDecorateHtmlOptions,
                    wordClass?: string, listeners?: IEventListeners,
                    container: Element | Document = document)`

Parses the innerHTML of DOM elements with the specified classes, replacing instances of words
specified in the options.words argument with the replacement string specified in options.replace.
Handles HTML tags properly -- text will only be replaced in text, not in tags.
Allows '$1' in the replacement string so that 'word' with a replacement string
of `<span>"$1"</span>` would be replaced with `<span>"word"</span>`.
Adds the specified event handlers to all elements with the specified class, which will
correspond to each replaced word if the replacement string specifies an element with a class.

If this function is called multiple times on the same DOM node, it will create extraneous DOM
element nesting and redundant addition of event listeners. It is best used in contexts where
it can be called immediately after the HTML content is rendered.

- `textClasses`: string | string[] - a class or array of classes whose contents are to be decorated.
  - The individual array elements are passed to `getElementsByClassName()`, so multiple space-delimited classes are ANDed together, i.e. all classes must be present to match, while the array elements are ORed, i.e. matching any array element constitutes a match.
- `options`:
  - `words`: string[] - a list of words to be decorated.
    - Word-matching is case-insensitive.
    - The words can include limited RegExp functionality:
      - '.' - represents a wildcard character ('*' is not supported)
      - '?' - makes the previous character optional
      - '[', ']' - represents a set of possible characters, e.g. [aeiou] for a vowel
  - `replace`: string - the replacement string.
    - Can include '$1' representing the matched word.
- `wordClass`: string - the class used for the enclosing tag (e.g. 'cc-glossary-word')
- `listeners`: IEventListeners - one or more { type, listener } tuples
- `container`: Element | Document - the scope within which to search for elements (defaults to the entire document)

### decorateHtml
`decorateHtml(input: string, options: IDecorateHtmlOptions)`

Parses the specified HTML input, replacing instances of words specified in the
options.words argument with the replacement string specified in options.replace.
Handles HTML tags properly -- text will only be replaced in text, not in tags.
Allows '$1' in the replacement string so that 'word' with a replacement string
of `<span>$1</span>` would be replaced with `<span>word</span>`.

- `input`: the HTML to be decorated as a string
- `options`:
  - `words`: string[] - a list of words to be decorated.
    - Word-matching is case-insensitive.
    - The words can include limited RegExp functionality:
      - '.' - represents a wildcard character ('*' is not supported)
      - '?' - makes the previous character optional
      - '[', ']' - represents a set of possible characters, e.g. [aeiou] for a vowel
  - `replace`: string - the replacement string.
    - Can include '$1' representing the matched word.

### decorateReact
`decorateReact(input: ReactNode, options: IDecorateReactOptions): ReactNode`

Post-processes the specified React virtual DOM, replacing instances of words specified in
the options.words argument with the replacement string specified in options.replace.
Handles nested virtual DOM elements properly: text will only be replaced in text, not in tags.

While this function can be called directly, it is anticipated that for most clients either
`decorateReactHOC()`, the higher-order component (HOC) wrapper, or `DecorateChildren`, the
parent component that supports decorating its children, will be more convenient.

- `input`: the virtual DOM to be decorated
- `options`:
  - `words`: string[] - a list of words to be decorated.
    - Word-matching is case-insensitive.
    - The words can include limited RegExp functionality:
      - '.' - represents a wildcard character ('*' is not supported)
      - '?' - makes the previous character optional
      - '[', ']' - represents a set of possible characters, e.g. [aeiou] for a vowel
  - `replace`: the string or virtual DOM element with which to replace each matched word.
    - The replace element can be coded in JSX/TSX.
    - The replacement can include '$1' representing the matched word.
    - If the replacement is a single empty element without a '$1', the '$1' is inferred,
    i.e. `<span></span>` is treated like `<span>$1</span>`.

Event listeners can be included in the replace argument in typical React fashion, so
the addEventListeners() and removeEventListeners() functions need/should not be called.

### addEventListeners/removeEventListeners
`addEventListeners(className: string, listeners: IEventListeners, container: Element | Document = document)`
`removeEventListeners(className: string, listeners: IEventListeners,container: Element | Document = document)`

Since `decorateHtml()` is simply performing string replacement operations,
it cannot add or remove any event handlers. Once the resulting HTML
has been added to the DOM, `addEventListeners()` can be called to
add handlers for 'click' or other events and the `removeEventListeners()`
function can be used to remove those same event handlers.

- `className`: string - the class used for the enclosing tag (e.g. 'cc-glossary-word')
- `listeners`: IEventListeners - one or more { type, listener } tuples
- `container`: Element | Document - the scope within which to search for elements (defaults to the entire document)

### decorateReactHOC
`decorateReactHOC(options: IDecorateReactOptions)`

Higher-order component which can be used to wrap another component,
decorating text within the wrapped component.

[Discussion](https://medium.com/@franleplant/react-higher-order-components-in-depth-cf9032ee6c3e) of "render highjacking" in a higher-order component using the "inheritance inversion" technique used here.

[Discussion](https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb) of TypeScript types for higher-order components.

Usage:
```javascript
 class MyClass {
   render() { ... }
 }
 export default decorateReactHOC(options)(MyClass);
```
### DecorateChildren
`<DecorateChildren decorateOptions={...}> {...children...} </DecorateChildren>`

React component which decorates any text among its children.
- decorateOptions must be passed in props.
- See [Appendix B](https://medium.com/@franleplant/react-higher-order-components-in-depth-cf9032ee6c3e) for discussion of parent component versus higher-order component wrapper.
