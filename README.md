# appium-altunity-plugin

This is an [Appium 2.x](https://appium.io) plugin for [AltUnity
Tester](https://altom.gitlab.io/altunity/altunitytester/).

* [What is this for?](#what-is-this-for?)
* [Feature Overview](#feature-overview)
* [Requirements and Assumptions](#requirements-and-assumptions)
* [Installation](#installation)
* [Usage](#usage)
  * [Starting Sessions](#starting-sessions)
  * [The `UNITY` Context](#the-`unity`-context)
  * [Get Page Source](#get-page-source)
  * [Find Element(s)](#find-element(s))
  * [Element Interaction](#element-interaction)
    * [Click](#click)
    * [Is Displayed](#is-displayed)
    * [Get Rect](#get-rect)
    * [Get Text](#get-text)
    * [Get Attribute](#get-attribute)
  * [Key Actions](#key-actions)
  * [Set URL (Load Scene)](#set-url-(load-scene))
  * [Get URL (Get Scene)](#get-url-(get-scene))
  * [Get Time Scale](#get-time-scale)
  * [Set Time Scale](#set-time-scale)
* [The TypeScript AltUnity Client](#the-typescript-altunity-client)

### What is this for?

The motivation behind this plugin is to make AltUnity Tester completely compatible with Appium, so
that an Appium user doesn't need to learn the AltUnity API or download any extra clients or tools.
In addition, it enables access to the excellent AltUnity Tester functionality while not being bound
by the particular programming language requirements of that project (C# or Python).

The big idea behind AltUnity Tester in general is to allow for easier automation of
[Unity](https://unity.com) games, across all Unity platforms (mobile, desktop, etc...). While
Appium already provides solid automation capabilities for UI-based apps, games tend to not use
standard UI components and thus present themselves as a single opaque element to automation.
AltUnity Tester is a Unity component you can include in your game that exposes a special websocket
server from within the instrumented game. This allows for communication "into" the Unity context
from the outside world, enabling inspecting of objects and triggering behaviours. The other half of
AltUnity Tester is a set of client libraries used to speak to the WebSocket server more easily.
These are written in Python and C#.

Many testers want to use both Appium and AltUnity, since Appium provides a lot of device automation
features outside of what's happening in-game. Without this plugin, test authors needed to mix and
match Appium and AltUnity API clients. With this plugin, test authors can stay entirely within the
Appium scriptwriting paradigm and still take advantage of the power of AltUnity Tester.

## Feature Overview

- A new `UNITY` context, within which other functionality is made available
- Get the 'page source' of the Unity game in XML format
- Find 'elements' (objects) via a number of strategies
- Interact with elements in basic ways (click/tap, get text, etc...)
- (Advanced) a TypeScript AltUnity Tester client (for use independently of the Appium plugin)

## Requirements and Assumptions

- You need a working Appium 2.0 server installation.
- You need existing Appium automation for the target platforms (e.g., if you want to automate
  a Unity game on Android, you need to already know how to automate Android apps with Appium in
  general, and have a functional setup).
- AltUnity Tester must be added to your Unity project, and you must have the instrumented version
  of the game.
- AltUnity Tester's WebSocket port must be accessible to Appium. This means, for example, that you
  will need to set up any necessary port forwarding.
    - Example: if the AltUnity Tester port is `13000`, and you're running on an Android device,
      you'll want to use ADB to forward the port to one on your system:

      ```
      adb forward tcp:13000 tcp:13000
      ```

## Installation

Use the Appium plugin manager to install the most recent version of this plugin:

```
appium plugin install --source=npm appium-altunity-plugin
```

Then, when you start the Appium server, you need to ensure you have enabled the plugin for that
particular server instance, by including it in the list of plugins to use. The short name of this
plugin is `altunity`:

```
appium --use-plugins=altunity
```

In terms of the client side of this plugin, no special installation is required as the plugin does
not introduce any new commands, but rather makes use of existing Appium commands.

## Usage

> Note: each Appium client library has its own conventions and command names. The examples given
> here use the [WebDriverIO](https://webdriver.io) client library. Any Appium library will work
> just as well with this platform, but you may have to search the docs of another library in case
> the command names or conventions differ slightly from what is provided here.

### Starting Sessions

When you start a session with this plugin active, two new capabilities are required in addition to
whatever capabilities would normally be required to launch the app/game:

- `altUnityHost`: a `string`, indicating on which host Appium can find the AltUnity socket server
- `altUnityPort`: a `number`, indicating on which port the AltUnity socket server is listening

### The `UNITY` Context

All of this plugin's features are hidden behind a new context. This ensures that normal platform
automation is not affected and allows for switching back and forth between the normal 'native'
context and the AltUnity integration. When the plugin is active, you will see `UNITY` returned in
the list of available contexts. To enter into the `UNITY` context, simply use the `setContext`
command:

```js
await driver.setContext('UNITY')
```

While in the `UNITY` context, you can take advantage of the other features.

### Get Page Source

To get the hierarchy of the current Unity scene, simply call:

```js
await driver.getPageSource()
```

It will return an XML document that you can use as the basis for element finding operations. An
example source document is available [here](docs/sample-source.xml).

### Find Element(s)

The plugin supports a subset of the locator strategies available in Appium.

| Strategy       | Behaviour                                    | Example                           |
|----------------|----------------------------------------------|-----------------------------------|
| `xpath`        | Query the source XML for matching element(s) | `driver.$('//Player')`            |
| `id`           | Find an object by its id or AltId            | `driver.findElement('id', 'foo')` |
| `css selector` | Find an object by its id or AltId*           | `driver.$('#foo')`                |
| `link text`    | Find an object by its text                   | `driver.$('=text')`               |
| `tag name`     | Find an object by its type                   | `driver.$('<Player>')             |

* Note that the `css selector` strategy is only provided as an alias for `id`, since many client
libraries no longer support `id` directly.

### Element Interaction

From the perspective of your client library, what you get back from a call to find element(s) is
a normal WebElement object. However, from the perspective of Appium, it is not the same as a native
UI element. It is instead a reference to an AltUnity object. Accordingly, it has a smaller set of
possible interactions, which is outlined below.

#### Click

Click/tap the element at its coordinates on the screen. This method does *not* call the click or
tap methods provided by AltUnity Tester since I generally found it to be easier to simply tap the
appropriate screen position. That way its functioning doesn't depend on whether some element is or
isn't on top of some other element.

```js
await element.click()
```

#### Is Displayed

Check whether the element is on the screen. The plugin decides this based on whether the `x` and
`y` values of the element are within the bounds of the screen dimensions as reported by Appium.

```js
await element.isDisplayed()
```

#### Get Rect

#### Get Text

#### Get Attribute

### Key Actions

### Set URL (Load Scene)

### Get URL (Get Scene)

### Get Time Scale

### Set Time Scale

## The TypeScript AltUnity Client

If you don't want to use the Appium plugin but are more interested in using AltUnity directly from
TypeScript or JavaScript, you can also take advantage of the AltUnity client developed to enable
this plugin. It is located in [src/client](src/client) and exports all types. You can import it in
your own Node.js projects like this:

```js
import { AltUnityClient } from 'appium-altunity-plugin'
```

This assumes that you have added this project to your `package.json`, for example by:

```
npm install --save appium-altunity-plugin
```

## Contributing

Contributions to this plugin are welcome! It is developed under the Apache 2 [license](LICENSE).

### Developer Setup

First, clone the repo:

```
git clone git@github.com:projectxyzio/appium-altunity-plugin.git
```

Then change into the repo dir and install dependencies:

```
npm install
```

Finally, transpile the project:

```
npm run build
```

### Run Tests

It's always a good idea to run all tests before making any changes. First, get the sample app used in testing:

```
npm run pretest
```

Then, make sure Appium is using the local clone of this plugin (run from the plugin repo dir):

```
appium plugin uninstall altunity
appium plugin install --source=local $(pwd)
appium --use-plugins=altunity
```

Then ensure you have an Android emulator or device active and connected via ADB, that it is the
only device showing in the device list, and that you have forwarded port 13000:

```
adb forward tcp:1300 tcp:1300
```

Finally, make sure `adb` is available in your PATH. Now you're ready to run the tests!

```
npm run test:unit
npm run test:e2e
```

### Make Changes

It's a good idea to set things up to automatically transpile any time you save a change to a file:

```
npm run watch
```

And remember that anytime you change and transpile the plugin, you'll need to stop and start the
Appium server for the changes to take effect.
