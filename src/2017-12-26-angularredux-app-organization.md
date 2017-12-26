> I'm especially interested in any feedback on my initialization procedures: ... Is that reasonable?

As long as your code is dealing with configuration only, it looks good to me overall. (I assume, you don't have a login screen.) Otherwise, you may want to look at real life [authentication example with Auth0](https://auth0.com/blog/real-world-angular-series-part-2/). I'm not pointing to technology here, but rather how the concerns are being separated and organized.

I might rename `ConfigService` into `EndpointApiConfigService` to be a bit more specific, but I don't know the complete structure of the object and whether it holds any non-endpoint configuration or not.

---

> I am calling 3 different endpoints to get all the data I need. I had considered wrapping this all up in one endpoint that returns three different pieces of information. That would certainly involve less server calls (which is good), but also seems like a poor Separation of Concerns for an API endpoint (which is bad). Thoughts?

This is always a non-trivial API design question to answer. There are many factors you should keep in mind and I will mention a couple of important once. BTW, I'm assuming we're talking about RESTful APIs here.

* **API performance and usage.** This one you mention in your question directly. You don't mention the **costs** nor that **rates** of `fetchRuleModels`, `fetchFields`, `fetchPlaceHolders` invocations. If these are called very frequently, or they are pretty heavy, or both, it's may be a good reason to introduce an API that returns these data combined into a single document. Or you could use server side cache -- you have options here...
* The previous question forces me to think about **granularity of the resources.** Your RESTful API may or may not become dirty if you combine APIs together for the sole sake of convenience. In my practice I try to _find a name of the new resource that would natutally embrace all the concepts being united_. If I can find one, so be it -- it's okay to have such resource, especially if it's a read-only projection of other resources, which seems to be your case unless ruleModels, fields, or placeHolders are non-readonly and/or changing frequently.

  I'd also recommend leaving the existing APIs intact. You may need/have other clients that don't want to deal with the composite resource. In other words, think about the actual and possible clients. Some of them will like to work with specific resource kinds. This may be critical when those resources have POST/PUT/DELETE. It's sometimes pain in the neck to work with these verbs on composites.

  [RESTful Web Services Cookbook](https://books.google.com/books/about/RESTful_Web_Services_Cookbook.html?id=ed5ml0T3zyIC&printsec=frontcover&source=kp_read_button#v=onepage&q&f=false)'s chapter 2.4 covers this in more details.

  [![RESTful Web Services Cookbook][1]][1]

  > Problem: You want to know how to provide a resource whose state is made up of states from two or more resources.

  > Solution: Based on client usage patterns and performance and latency requirements, identify new resources that aggregate other resources to reduce the number of client/server round-trips.

* Having a composite-based API may help achieve **client code simplicity**. If one of those `fetchX` APIs in your current implementation fails, your application will need to gracefully handle it and it's not quite obvious how exactly. From client code's perspective, it would be simpler to attempt to load the entire `Config` at once, and if it fails just show a generic "could not load config" or retry the entire thing.

---

> These HTTP calls are mixed up inside my action-creator services. This seemed pretty reasonable to me, but I'm new to Redux and thought others might disagree. Am I being crazy here?

_DISCLAIMER: I'm not very familiar with Redux._ In my book triggering `fetchX` requests based on `getConfig` request completion is business logic. (Or even more generally: triggering "something" based on "something else" is business logic.)

If something is business logic, I'd rather make sure it is implemented somewhere in my reducer, rather than a service. So, either the `getConfig()` or its `.then(...)` would emit a proper action (`CONFIG_LOADED` in this case).

---

> The fetch methods in all the services both return promises that they resolve with the answer, and also update the store with the new data. This is certainly redundant. Obviously updating the store is a requirement. I could ditch the promise to minimize duplication (and I feel like that would be more in line with typical application flow), but in this one particular case I like being able to have that direct connection between "get some stuff" and "then do some more stuff". Is this a reasonable time to step outside of the norm?

I think, this disconnect is non-Redux idiomatic. I may be wrong.

As soon as you use `.then()` or any other non-command/reducer code to express relationship between entities in your application, you get "broken" store in my understanding. For example, it becomes impossible to track the `CONFIG_LOADED` command. It simply does not exist. Similarly and more importantly, it is impossible to replay it if you wanted to debug it. It is also hard to imagine how to unit test it.

I understand that when everything is done in a clean redux/Event Store way, it may be hard to track what happens when. I'm still looking for a good way to visualize the flow.

Coming back to **Is this a reasonable time to step outside of the norm?** question. I think, it's your call. On one hand, it's probably uncool to "blindly" follow the pattern. On another hand, redux is done the way it's done for a reason. And as soon as you diverge from it, you establish a precedent that may then be used as an excuse to not do something else the "right" way. I prefer to stay away from such, but your code is your code.

---

> Is it reasonable to have a relatively empty app.component with most behavior being handled by some sub-modules that access the store directly? Or should I have the app.component fetch data out of the store and attach itself to the inputs and outputs of the other components that are exported by the sub-modules? These guys are fairly complicated, and there would be a lot of data flowing back and forth.

In my experience it's best to make the components aware of the Stores. Wherever it is possible and straightforward. "Dumb"[er] components are the way to go.

Nowadays, I rarely use `Input`/`Output`, and only in scenarios of grid-alike components (which still sucks, and I'm rewriting those too).

---

One thing I wanted to mention is `toPromise()`. What is the point of it if you are not using `await` with `Promise`s?

Knowing that [`async/await` is not a recommended thing in `ngOnInit`][2] (quite limiting, huh?) I don't see any gains here. Why not consider sticking to `Observable`s which allow you a lot more than simple `.then()`? You only need to remember to `.subscribe()` on the end caller site, and use `.map()`/`.flatMap()` or `.do()` wherever it's absolutely necessary.

---

Another thing is this code:

        let headers = new Headers({
            'Content-Type': 'application/json',
            'MembershipId': config.MembershipId,
            'Authorization': 'Bearer ' + config.ApiKey
        });

        this.http.get(someURL, { headers: headers })
          ...
          .catch(this.handleError);

Normally, projects extract it into some kind of a `CustomHttpService` so that you don't need to create and pass those headers all over the place, or duplicate error handlers, or do any other repetitive code. Basically, DRY.

---

Hopefully, it's helpful. Don't take my words for granted! :)

  [1]: https://i.stack.imgur.com/E51iC.png
  [2]: https://github.com/angular/angular/issues/17420