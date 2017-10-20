# stackLoad - A tiny synchronous Javascript/JsonP/CSS module loader that simply does its job.
###### Marco "[Lubber](http://csdb.dk/scener/?id=124)" Wienkoop

## Features
- Checks for particular Javascript Logic/existing Objects in order to prevent loading already existing code which was _not_ embedded using stackload
- Avoids multiple embedding of same files
- Files will be stacked and loaded synchronously after each other and a callback can be given for each stack
- Logs missing files to the console if supported
- Could cancel the whole stackload if just one file is missing
- Guesses filetypes
- Dynamic parameter handling
- Vanilla Javascript: Does not need other libraries itself :)

This small library is especially useful if you want to provide something in one single js file without copying all dependency libraries into it, but still rely on external resources/CDNs, so your single js file stays small and the user does not need to implement or even know what other dependencies are needed to be embedded  
So this library is tiny enough to be embedded into your own single-js file library

## Usage

1) Implement one script tag or copy the code on top of your own library.
```html
<script type="text/javascript" src="stackload.min.js"></script>
```
2) Call it with an object of configuration. That's it
```javascript
stackLoad(filename|fileArray|fileObject|stackObject);
```
You can stack multiple callbacks each having a bunch of files and individual callbacks using the appending `.then` method
```javascript
stackLoad(...).then(filename|fileArray|fileObject|stackObject).then(...);
```  


#### Parameter

The only Parameter stackLoad needs is either
- a string of a filename

```javascript
stackLoad('foo.js');
```
- an array with strings of filenames

```javascript
stackLoad(['foo.js','bar.css']);
```
- a fileObject

```javascript
stackLoad({
    url: 'foo.js'
});
```
- a stackObject with additional features like callback functions for (un)successful loads 

```javascript
stackLoad({
    files: ['foo.js','bar.css'],
    success: function(){...},
    error: function(e){...} 
});
```

fileObject Configuration
```javascript
stackLoad({
    url: 'domain.tld/folder@version',        
    check: 'window.jQuery',
    type: 'css'   
});
```

#### fileObject Properties
**url**: `string` (mandatory)

**check**: `string`  
JS code as a string (! Because this could rely one some previous needed code loaded by stackLoad before) as a dependency if code perhaps already exists.
- The (last) statement of the code needs to **end with an expression** (`var a=1,b=2;b<0;`) and _**not**_ a return statement (`var a=1,b=2;return b<0;`). If that expression is either undefined/false/null then the appropriate file will be loaded
- stackLoad has a little internal helper to get css style properties of a selector path. Just use the function `cssProperties()` within your JS Code

```javascript
//cssProperties takes a css selector string and returns all style-object properties
    check: 'cssProperties("ui multiple foo bar classnames").backgroundImage==="none"'
```
- Can be omitted, the file will be loaded immediately then.)

**type**: `string`  
If omitted, stackLoad tries to guess it from a possible file extension. Otherwise assumes 'js' as default. Other possible values are:
- 'css'
- 'jsonp'  
Using jsonp assumes the url already has the probably needed callback function name as part of the url. stackLoad just adds a timestamp to the url to make sure it is not cached 
- Anything else is considered javascript.

#### stackObject Properties
**files**:  `string` | `array()` of strings | `fileObject` | `array()` of fileObjects  
The files will be synchronously loaded in the order of the array. So take care of possible dependencies.  
    
**success**: `function()`
- Will be called once when _all_ files of the files within the current stackObject have been loaded (regardless if a file was found or not)
- Can be omitted

**error**: `function(eventObject)`
- Will be called on _each_ failed load within the current stackObject. The event object will be delivered to the function as a parameter
- If the given function returns `false` then loading of all remaining files within the current stackObject will be cancelled. It's still possible to start another stackLoad again later.
- Can be omitted
> Internet Explorer does not trigger failing load events for **css** files!
  

## Examples

Load a file.
```javascript
stackLoad('http://cdn.tld/lib/foo.css');
```

Load a list of files.
```javascript
stackLoad([
    'main.js',
    'http://cdn.tld/lib/foo.css'
]);
```

The file type will be guessed according to file extension. JS will be assumed by default
```javascript
stackLoad([
    'main.js',                                   //-> detects js file
    'main.css',                                  //-> detects css file    
    'mainUpper.CSS',                             //-> detects css file    
    'foo.css?count=1',                           //-> detects css file
    'bar.JS?version=1.2.3#ubuntu',               //-> detects js file
    'http://domain.tld/folder/library@version'   //-> detects js file (because no extension available)
]);
```

Loading URLs with unguessable file types which won't be JS files
```javascript
stackLoad({ 
        url:'http://domain.tld/folder/stylesheets/library@version',
        type: 'css'
});
```

Loading jsonp
```javascript
stackLoad({ 
        url:'http://domain.tld/foo/bar?callback=testfunc',
        type: 'jsonp'
});
```

Call a function when all files are loaded
```javascript
stackLoad({
    files: [
        'main.js',
        'http://cdn.tld/lib/foo.css'
    ],
    success: function(){
       console.log('loading finished'); 
    }
});
```

Load jQuery only if not already available:
```javascript
stackLoad({
    files: {
        check: 'window.jQuery',
        url: '//cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js'
    },
    success: function(){
        // jQuery is available now
        $(function() {
            // ...
        };
    }
});

```



Load jQuery and Semantic UI each having a different Callback using the `.then` method
```javascript
stackLoad({
    files: [{
        check: 'window.jQuery',
        url: '//cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js'
    }],
    success: function(){
        // jQuery is available now
        $(function() {
            // ...
        });
    }
}).then({
    files: [{
        type:'css',
        url:'//cdn.jsdelivr.net/npm/semantic-ui@2.2.13/dist/semantic.min.css'
    },{
        check: 'jQuery().modal',
        url: '//cdn.jsdelivr.net/npm/semantic-ui@2.2.13/dist/semantic.min.js'
    }],
    success: function(){
    // Semantic UI is also available now
        $('#gallery').modal('show');
    }
});
```

Check for a specific CSS property in order to load a css file (to not only rely on the filename)  
In this example a HTML tag with assigned class "ui popup" should have an z-index of 1900 if semantic ui css is already available 
```javascript
stackLoad({
    files: [{
        check: 'parseInt(cssProperties("ui popup").zIndex,10)===1900',
        type:'css',
        url:'//cdn.jsdelivr.net/npm/semantic-ui@2.2.13/dist/semantic.min.css'
    }]
});
```



Load Jquery, but load Semantic UI at a later stage and ignore already loaded libraries
```javascript
stackLoad({
    check: 'window.jQuery',
    url: '//cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js'
});

// ...
// Lot's of your code in between
// ...

// stackLoad remembers what it has already loaded,
// so it will skip loading jQuery from the same url again.
stackLoad({
    files: [
    '//cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js',
    {
         type:'css',
         url:'//cdn.jsdelivr.net/npm/semantic-ui@2.2.13/dist/semantic.min.css'
    },{
         check: 'jQuery().modal',
         url: '//cdn.jsdelivr.net/npm/semantic-ui@2.2.13/dist/semantic.min.js'
    }],
    success: function(){
     // Semantic UI is also available now
         $('#gallery').modal('show');
    }
});
```

#### Using the error method property
> Internet Explorer does not trigger failing load events for **css** files!

Do something in case a file is missing
```javascript
stackLoad({
    files: ['foo.css','bar.js'],
    error: function(e){
        console.log('Missing file:',(e.target.src? e.target.src : e.target.href));
    }
});
```

Cancel load in case a file is missing.  
Simply **return false** in your function to make this happen.
```javascript
stackLoad({
    files: ['foo.css','bar.js'],
    error: function(e){
        console.log('Missing file:',(e.target.src? e.target.src : e.target.href));
        console.log('All remaining files will be cancelled!');
        return false;
    }
});
```


## License
 [GPL v3](/LICENSE)