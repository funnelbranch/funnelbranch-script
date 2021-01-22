expect.extend({
  jsonStringContaining(received: any, properties: any) {
    expect(JSON.parse(received)).toEqual(expect.objectContaining(properties));
    return {
      pass: true,
      message: () => 'This message is irrelevant',
    };
  },
});
