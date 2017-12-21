Disclaimer: I totally understand that my answer is very subjective, but you may still find it useful. I am myself a big proponent of functional programming, and from this perspective your code looks decent. It uses abstractions efficiently, and is DRY.

<h2>Functional Programming is Great; Too Many Abstractions Is Questionable</h2>

However, I'm also a big proponent of clean code. And in my very humble opinion, this code is very hard to understand (especially to anyone who is new to functional programming) because it is *almost* overly generalized.

The code is dense -- that's cool, but **not everyone can deal with so many levels of abstraction at once**.

<h2>Hard Things in Computer Science: Naming Things</h2>

Unfortunately, I am unable to quickly find any abstractions that you can throw away. So there are a few other things we can look at.

**The naming**. It suffers. Yes, I know we see the examples of home brewed composition functions with `fns` all over the place. I believe it's a bad practice and we should do better. It takes just a few keystrokes in your editor/IDE to rename all occurrences of a symbol.

Similarly, the following names are just as bad: `o`, `c`, `data`, `field`, `acc` (in my real life example a developer once confused `accumulator` with `account`, not kidding). I strongly recommend giving these entities much more context specific names. While things like `i` and `j` are commonly used and well-known, I still find them horrible: a) they unnecessarily complicate things, even a small "brain cycle" to interpret it is a distraction; b) they often cause [OBOE][1]; c) devs moved to `forEach()` for a reason. Last but not the list, many devs hold an opinion that one letter long variable name is a smell that suggests that the entity has no strong reason to exist.

<h2>More Functions?</h2>

Yes, over time developers working with JavaScript get used to structures like `const x = a => b => c => { ... }`. Still, IMO each of this levels add extra "brain cycles" needed to understand what's available in which scope; or (more importantly?) what's not available.

I think, that **proper indentation** or **function extraction** or both may help reducing the complexity here. Probably, some function will exist just to split a huge one into a set of smaller ones. (Otherwise, we could just rewrite `group()` inlining all the other functions, which would make the result a HUGE god-function -- while still functional, very hard to deal with).

---

[I tried to rename things and format it differently][2] as per my understanding of readable code. I'm still struggling with a few names as you can see, but this is just to demonstrate the ideas in actions, anyway...

First, `flatten` and `compose`.

    const flatten = objectToFlatten => Object
      .values(objectToFlatten)
      .reduce(
        (subResultArray, currentElement) =>
          Array.isArray(currentElement) ?
            [...subResultArray, ...currentElement] :
            typeof currentElement === 'object' ?
              [...subResultArray, ...flatten(currentElement)] :
              [...subResultArray, currentElement],
        []
      );

    const compose = (...functionList) =>
      argument =>
        functionList.reduce((previousResult, currentFunction) => currentFunction(previousResult), argument);

Group logic related "helper" functions.

    const GROUP = Symbol('group');
    const asGroup = (result = []) => ((result[GROUP] = true), result);
    const isGroup = object => object[GROUP];

    const groupBy = groupingField =>
      (objectList, key) =>
        objectList.reduce(
          (subresultObject, dataElement) => (
            (key = dataElement[groupingField]),
            (
              subresultObject[key] ?
                (subresultObject[key].push(dataElement), subresultObject) :
                ((subresultObject[key] = asGroup([dataElement])), subresultObject)
            )
          ),
          {}
        );

The recursive transformation working horse.

    const transformRecursivelyWithPredicate = predicate =>
      transform =>
        objectToTransform =>
          predicate(objectToTransform)
            ? transform(objectToTransform)
            : Object.entries(objectToTransform)
              .sort(([_, value1], [__, value2]) => value1 - value2)
              .reduce(
                (subresult, [key, value]) => (
                  predicate(value) ? 
                    ((subresult[key] = transform(value)), subresult) : 
                    ((subresult[key] = transformRecursivelyWithPredicate(predicate)(transform)(value)), subresult)
                ),
                {}
              );

And the original composed beast. :)

    const group = (...groupingFields) =>
      compose(...groupingFields.map(compose(groupBy, transformRecursivelyWithPredicate(isGroup))), flatten);

---

<h2>Little Warning</h2>

The very last thing to say is that there's a concerning piece of code. Not a bug per se. I'd try to treat it as a warning.

Original code:

[![enter image description here][3]][3]

Same, in my refactored code:

[![enter image description here][4]][4]

I'm pretty sure you already see what I'm going to say. It's not a great thing to reassign a value that was provided into the arrow function by the caller. Today your code works. Tomorrow a junior developer touches it and things crash...

I'd recommend to rewrite `(subresultObject, dataElement) => ...` as `(subresultObject, _) => ...` or even as `subresultObject => ...` and use a locally scoped `const` "variable" to prevent bugs.

---

P.S. I apologize in advance for using strong words and for my way of thinking potentially misaligning with the coding standards of your organization. I'm not questioning your internal agreements of course, but rather trying to analyse and evaluate the code as a ["spherical cow in a vacuum"][5] from a perspective of the developer on the Clapham omnibus (who obviously can not jump as high as you can).

P.P.S. This is the great question and the code to read/think about!


  [1]: https://en.wikipedia.org/wiki/Off-by-one_error
  [2]: https://github.com/another-guy/crse/blob/master/src/2017-12-21-multi-field-sorting.ts
  [3]: https://i.stack.imgur.com/21w9j.png
  [4]: https://i.stack.imgur.com/mKAWi.png
  [5]: https://en.wikipedia.org/wiki/Spherical_cow