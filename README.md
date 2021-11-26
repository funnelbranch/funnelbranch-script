# Funnelbranch Script

This is the official source code repository for the [`funnelbranch.js`](https://js.funnelbranch.com/funnelbranch.js) script.

For more information, please visit [www.funnelbranch.com](https://www.funnelbranch.com).

## Script Tag

Include the following script tag on every HTML page.

```html
<script src="https://js.funnelbranch.com/funnelbranch.js?projectId=<PROJECT_ID>"></script>
```

## Script Tag Options

The script tag can also be initialized with query parameter options, like this

```html
<script src="https://js.funnelbranch.com/funnelbranch.js?projectId=<PROJECT_ID>&cookieDomain=<COOKIE_DOMAIN>&enableLocalhost=true"></script>
```

Have a look at the manual setup guide below for an overview of all options.

## Manual Setup

Include the same script on your HTML pages, but omit any query parameters.

```html
<script src="https://js.funnelbranch.com/funnelbranch.js"></script>
<script>
  const funnelbranch = Funnelbranch.initialize('<PROJECT_ID>', options);
  // The second "options" parameter is not mandatory
</script>
```

Here's an overview of all possible options.

```ts
type Options = {
  controlGroup?: 'A' | 'B'; // Default: undefined

  cookieDomain?: string; // Default: current domain

  enableLocalhost?: boolean; // Default: false

  trackClientUrlChanges?: boolean; // Default: true

  trackClientHashChanges?: boolean; // Default: false
};
```

## Instance API

Custom actions can be submitted via the `submitAction()` method.

```ts
funnelbranch.submitAction('<ACTION_NAME>');
```

To stop tracking client-side URLs and cancel all browser API subscriptions, use the `destroy()` method.

```ts
funnelbranch.destroy();
```

Note that if you're using the automatic script tag initialization,
the Funnelbranch instance is automatically available as `window.funnelbranch`.

## Frameworks (React, Angular)

Check out the official [Funnelbranch Script Wrapper](https://github.com/funnelbranch/funnelbranch-script-npm) (NPM) module for using this script with SPA frameworks like React and Angular.
