import TextDecorator from "../src/text-decorator";

/**
 * Dummy test
 */
describe("Dummy test", () => {
  it("works if true is truthy", () => {
    expect(true).toBeTruthy();
  });

  it("TextDecorator is instantiable", () => {
    expect(new TextDecorator()).toBeInstanceOf(TextDecorator);
  });
});
