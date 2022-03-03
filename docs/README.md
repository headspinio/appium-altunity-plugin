# Appium AltUnity Plugin Reference Documentation

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
    * [Get Property](#get-property)
  * [Key Actions](#key-actions)
  * [Touch Actions](#touch-actions)
  * [Set URL (Load Scene)](#set-url-(load-scene))
  * [Get URL (Get Scene)](#get-url-(get-scene))
  * [Get Time Scale](#get-time-scale)
  * [Set Time Scale](#set-time-scale)

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

| Strategy            | Behaviour                                       | Example                           |
|---------------------|-------------------------------------------------|-----------------------------------|
| `xpath`             | Query the source XML for matching element(s)    | `driver.$('//Player')`            |
| `id`                | Find an object by its id or AltId               | `driver.findElement('id', 'foo')` |
| `css selector`      | Find an object by its id or AltId*              | `driver.$('#foo')`                |
| `link text`         | Find an object by its text                      | `driver.$('=text')`               |
| `partial link text` | Find an object whose text contains the selector | `driver.$('*=tex')`               |
| `tag name`          | Find an object by its type                      | `driver.$('<Player>')`            |

> Note that the `css selector` strategy is only provided as an alias for `id`, since many client
> libraries no longer support `id` directly.

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

Get the coordinates of an element.

- The `width` and `height` values of the response will be set to `0` until I figure out how to
  retrieve those reliably.
- The `x` and `y` values represent the center-point of the element (not top-left as is usual)

```js
const {x, y} = await element.getLocation()
const {width, height} = await element.getSize()
```

#### Get Text

Get the text displayed in an element, if it has any, or `null` otherwise.

```js
const text = await element.getText()
```

#### Get Attribute

Get an attribute of an element. The only attributes retrievable in this method are the ones that
you see in the source XML.

```js
const name = await element.getAttribute('name')
```

#### Get Property

This method is a series of overloads on the traditional W3C WebDriver `Get Property` command. You
can basically do 3 things with it, representing retrieving information about a Unity object's
components. All of these modes return strings due to the WebDriver protocol requirements. These
strings represent JSON objects, so they should be parsed on your end for better interaction.

1. Request all components of an element. This will return a stringified JSON array of objects with
   keys `componentName` and `assemblyName`. To do this use the magic property name `*`:
    ```js
    const allComponents = JSON.parse(await element.getProperty('*'))
    // [{"componentName": "UnityEngine.Transform", "assemblyName": "UnityEngine.CoreModule"}, ...]
    ```
2. Request a single component of an element. This will return a JSON object with the same keys:
    ```js
    const component = JSON.parse(await element.getProperty('UnityEngine.Transform'))
    // {"componentName": "UnityEngine.Transform", "assemblyName": "UnityEngine.CoreModule"}
    ```
3. Request a component property using a property string like `<componentName>:<propertyName>`. This
   will return a JSON object representing the property, whose specific form is determined by the
   particular component.
    ```js
    const boundsProp = 'UnityEngine.BoxCollider2D:bounds'
    const bounds = JSON.parse(await element.getProperty(boundsProp))
    // {"size": {"x": 1.2, "y": 0.3, ...}, ...}
    ```

Unfortunately there is no way to get a list of properties for components dynamically. To determine
which properties are accessible, look at the scripting reference for the component in the Unity
docs or in the third party docs. For example, the
[BoxCollider2D](https://docs.unity3d.com/2020.3/Documentation/ScriptReference/BoxCollider2D.html)
docs are how we can determine that this component has a `bounds` property.

### Key Actions

You can define keypress sequences using the W3C WebDriver Actions API. With this plugin, key string
identifiers are taken from the [AltKeyCode](src/client/key-code.ts) enum. In other words, if you want to
press the escape key, you will need to use the string `Escape`, or the numeric code defined in the
enum, `27` (but as a string, since the Actions API requires that key values be strings).

Here's an example of how to press and release the escape key with a 750ms pause in between:

```js
await driver.performActions([{
    type: 'key',
    id: 'keyboard',
    actions: [
        {type: 'keyDown', value: 'Escape'},
        {type: 'pause', duration: 750},
        {type: 'keyUp', value: 'Escape'},
    ]
}])
```

And here's an example of how to hold down the right arrow button for a longer duration, pressing
and releasing the spacebar in the middle (to simulate running and jumping in a platformer game,
let's say):


```js
const runWithJump = {
  type: 'key',
  id:'keyboard',
  actions: [
    {type: 'keyDown', value: 'RightArrow'},
    {type: 'pause', duration: 1500},
    {type: 'keyDown', value: 'Space'},
    {type: 'pause', duration: 500},
    {type: 'keyUp', value: 'Space'},
    {type: 'pause', duration: 500},
    {type: 'keyUp', value: 'RightArrow'},
    {type: 'pause', duration: 1000},
  ]
}
await driver.performActions([runWithJump])
```

Beyond the use of the special `AltKeyCode` enum for key values, the main restriction is that the
request object must contain a single array of actions only (as in the examples; multiple
simultaneous sequences of key presses are not allowed).

### Touch Actions

> Touch actions have not yet been implemented. Currently, only clicking found elements is possible.

### Set URL (Load Scene)

You can load a Unity scene by its scene name using the set URL / navigate command. When doing so,
use `unity://` as the scheme.

```js
await driver.navigateTo('unity://SceneName')
```

### Get URL (Get Scene)

You can get the currently active scene name as well. It will also use the `unity://` scheme.

```js
const curScene = await driver.getUrl()
```

### Get Time Scale

You can get the current game time scale using a special executeScript overload command which takes
no arguments. The value will be returned as a float:

```js
const scale = await driver.executeScript('unity: getTimeScale', [])
```

### Set Time Scale

Likewise you can set the time scale to adjust game speed, using `unity: setTimeScale`, which takes
a single float parameter, representing the desired time scale:

```js
// run the game at 1.5x speed
await driver.executeScript('unity: setTimeScale', [1.5])
```

