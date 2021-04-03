interface WithEquals {
  equals(another: any): boolean;
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toEntityEqual(expected: WithEquals): R;
    }
  }
}

expect.extend({
  toEntityEqual: (got: WithEquals, expected: WithEquals) => {
    const pass = got.equals(expected);
    const message = () => {
      if (pass) {
        // we are doing a negative test - ie we need to *not* be equal
        return `${got} should NOT be equal to ${expected} but was equal`;
      } else {
        return `Get: ${got}, Expected: ${expected}`;
      }
    };
    return { pass, message };
  },
});

export default undefined;
