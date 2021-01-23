import { equals } from 'expect/build/jasmineUtils';

expect.extend({
  jsonStringContaining(received: any, properties: any) {
    received = JSON.parse(received);
    for (let prop in properties) {
      if (!(prop in received)) {
        return {
          pass: false,
          message: () => '',
        };
      }
      const expected = properties[prop];
      const actual = received[prop];
      if (!equals(expected, actual)) {
        return {
          pass: false,
          message: () => '',
        };
      }
    }
    return {
      pass: true,
      message: () => '',
    };
  },
});
