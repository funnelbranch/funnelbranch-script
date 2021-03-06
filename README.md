# Funnelbranch Script

This is the official source code repository for the [`funnelbranch.js`](https://js.funnelbranch.com/funnelbranch.js) script.

For more information, please visit [www.funnelbranch.com](https://www.funnelbranch.com).

## Zero Config Setup

Include the following script on your HTML pages after substituting the `<PROJECT_ID>` placeholder.

```html
<script src="https://js.funnelbranch.com/funnelbranch.js?projectId=<PROJECT_ID>"></script>
```

This will auto-initialize a Funnelbranch instance and immediately:

- submit the client's current URL
- automatically track and submit client-side URL changes (for SPAs)

Additionally, this will make the `Funnelbranch` class variable and the auto-initialized `funnelbranch` instance variable available on the global `window` object.

## Manual Setup

Include the same script on your HTML pages, but omit the `projectId` query parameter.

```html
<script src="https://js.funnelbranch.com/funnelbranch.js"></script>
```

This will make the `Funnelbranch` class variable available on the global `window` object.
The following code sample then shows how to manually initialize a Funnelbranch instance.

```ts
type Options = {
  controlGroup?: 'A' | 'B';
  // Default: undefined

  enableLocalhost?: boolean;
  // Default: false

  trackClientUrlChanges?: boolean;
  // Default: true

  trackClientHashChanges?: boolean;
  // Default: false
};

const options = {};
const funnelbranch = Funnelbranch.initialize('<PROJECT_ID>', options);
```

Initializing Funnelbranch this way will immediately:

- submit the client's current URL
- if configured, automatically track and submit client-side URL changes (for SPAs)

## Instance API

Custom events can be submitted via the `submitEvent()` method.

```ts
funnelbranch.submitEvent('<EVENT_NAME>');
```

To stop tracking client-side URLs and cancel all browser API subscriptions, use the `destroy()` method.

```ts
funnelbranch.destroy();
```

## NPM

Check out the official [NPM Script Wrapper](https://github.com/funnelbranch/funnelbranch-script-npm) for using this script with SPA frameworks like React and Angular.
