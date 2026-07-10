---
title: Build a timeline
description: Package a reusable, parameterized experimental procedure that others can drop into their experiments.
---

# Build a timeline

A **timeline** packages a whole procedure — a task, a questionnaire, an attention check — built from existing plugins, so that you and others can reuse it across experiments with a single import. Shareable timelines are published to the [`jspsych-timelines`](https://github.com/jspsych/jspsych-timelines) repository.

:::note Page under construction
This guide still needs to be written. The structure below outlines what it should cover.

**TODO:**
- When to build a timeline vs. a [plugin](plugins/plugin-tutorial.md).
- Scaffolding a new timeline with `npx @jspsych/new-timeline`.
- The expected export shape: `createTimeline`, `timelineUnits`, and `utils`.
- Parameterizing a timeline so researchers can configure it.
- Testing and documenting a timeline.
- Publishing to `jspsych-timelines` (see [Publish & share](publish-and-share.md)).
:::

## See also

- [Build a plugin](plugins/plugin-tutorial.md)
- [Publish & share](publish-and-share.md)
- [The timeline](../learn/concepts/timeline.md) concept page

# Timeline Development

This tutorial will walk through translating the same basic reaction time task from the demo experiment into a package for jspsych-timelines. This simple demonstration will highlight key open-science principles behind what makes a distributable experimental task, including:

- Setting up the developer environment with npm
- Blocking out timelineUnits and utils as exportable components
- Building the .createTimeline() export
- Designing parameters for configuring versions of the same task
- Testing builds
- Preparing documentation
- Finalizing a pull request with jspsych-timeline using GitHub

[maybe include an npx CLI setup bit here]

## Overview exports from index.ts

`index.js` exports three principle kinds of components, all of which are functions. 
- `.createTimeline()`:
- `timelineUnits`:
- `util`:

## Setting up a timelineUnit

To restate, `timelineUnits` are broken down, conceptual pieces of our experiment timeline. Each `timelineUnit` can be typed as an array of `TimelineNodes`. 

Let's look back our final code from the [Reaction Time Task](../learn/tutorials/rt-task.md#the-final-code) earlier. On initial review, we can split that timeline into three main chunks:
- An introduction, made up of the `welcome` and `instructions` nodes
- The `test_procedure`, alternating between `fixation` and `test` nodes
- The `debrief` presenting a digest of the participant's performance

:::warning Needs hands-on review
Everything past this point must be implementationally verified by a few people willing to go through each step, noting build-breaking errors along the way. 
:::

The most straightforward way to block out our `timelineUnits` is by wrapping each of the above chunks in a function that returns that chunk. To start each, each of these functions should also take as an argument the jsPsych instance running our experiment, in case any of our trials' logic references core methods.

:::warning Include Pre-Load
Current unit breakdown below requires pre-load Node. Must decide if this will be a separate unit or factored into one defined below.
:::

Here is the introduction as a `timelineIntro` unit:

```javascript
function timelineIntro(jsPsych: JsPsych) {
   var intro_block = [];

   var welcome = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: "Welcome to the experiment. Press any key to begin."
   };

   intro_block.push(welcome)

   var instructions = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: `
       <p>In this experiment, a circle will appear in the center
       of the screen.</p><p>If the circle is <strong>blue</strong>,
       press the letter F on the keyboard as fast as you can.</p>
       <p>If the circle is <strong>orange</strong>, press the letter J
       as fast as you can.</p>
       <div style='width: 700px;'>
       <div style='float: left;'><img src='../assets/blue.png'></img>
       <p class='small'><strong>Press the F key</strong></p></div>
       <div style='float: right;'><img src='../assets/orange.png'></img>
       <p class='small'><strong>Press the J key</strong></p></div>
       </div>
       <p>Press any key to begin.</p>
     `,
     post_trial_gap: 2000
   };
   
   intro_block.push(instructions)

   return intro_block
}
```

Next, here's the `test_procedure` as a `timelineTest` unit:

```javascript
function timelineTest(jsPsych: JsPsych) {
   var test_stimuli = [
     { stimulus: "../blue.png",  correct_response: 'f'},
     { stimulus: "../orange.png",  correct_response: 'j'}
   ];

   var fixation = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: '<div style="font-size:60px;">+</div>',
     choices: "NO_KEYS",
     trial_duration: function(){
       return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0];
     },
     data: {
       task: 'fixation'
     }
   };

   var test = {
     type: jsPsychImageKeyboardResponse,
     stimulus: jsPsych.timelineVariable('stimulus'),
     choices: ['f', 'j'],
     data: {
       task: 'response',
       correct_response: jsPsych.timelineVariable('correct_response');
     },
     on_finish: function(data){
       data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
     }
   };

   var test_procedure = {
     timeline: [fixation, test],
     timeline_variables: test_stimuli,
     repetitions: 5,
     randomize_order: true
   };

   return test_procedure;
}
```

Last, here's `debrief` as a `timelineDebrief` unit:

```javascript
function timelineDebrief(jsPsych: JsPsych) {
   var debrief_block = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: function() {

       var trials = jsPsych.data.get().filter({task: 'response'});
       var correct_trials = trials.filter({correct: true});
       var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
       var rt = Math.round(correct_trials.select('rt').mean());

       return `<p>You responded correctly on ${accuracy}% of the trials.</p>
         <p>Your average response time was ${rt}ms.</p>
         <p>Press any key to complete the experiment. Thank you!</p>`;

     }
   }

   return debrief_block
}
```

Now, let's add each of these as exports under timelineUnits:

```javascript
export const timelineUnits = {
   timelineIntro,
   timelineTest,
   timelineDebrief
}
```

After doing that, we can run `npm run build` in the commandline and call each timelineUnit separately from `examples/index.html`.

:::warning Introduce `examples/index.html`
Put something in the overview, under the first header, that explains `examples/index.html`
:::

```html
<script>
 const jsPsych = initJsPsych();

 const intro = jsPsychTimelineReactionTimeDemo.timelineUnit.timelineIntro();
 const test = jsPsychTimelineReactionTimeDemo.timelineUnit.timelineTest();
 const debrief = jsPsychTimelineReactionTimeDemo.timelineUnit.timelineDebrief();

 jsPsych.run([intro, test, debrief])
</script>
```

With our `timelineUnits` bracketed out and exported, anyone could isolate, rearrange, or reconfigure any one of the pieces of our original experiment. The next section will expand on that last point and go into parametrizing units for configurability.

<details>
    <summary><strong>The complete code so far</strong></summary>
    ```javascript
    import { JsPsych } from "jspsych";
    import jsPsychPreload from "@jspsych/plugin-preload";
    import jsPsychHtmlKeyboardResponse from "@jspsych/plugin-html-keyboard-response";
    import jsPsychImageKeyboardResponse from "@jspsych/plugin-image-keyboard-response";

    function timelineIntro() {
      var intro_block = [];

      var welcome = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: "Welcome to the experiment. Press any key to begin."
      };

      intro_block.push(welcome)

      var instructions = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
        <p>In this experiment, a circle will appear in the center
        of the screen.</p><p>If the circle is <strong>blue</strong>,
        press the letter F on the keyboard as fast as you can.</p>
        <p>If the circle is <strong>orange</strong>, press the letter J
        as fast as you can.</p>
        <div style='width: 700px;'>
        <div style='float: left;'><img src='../assets/blue.png'></img>
        <p class='small'><strong>Press the F key</strong></p></div>
        <div style='float: right;'><img src='../assets/orange.png'></img>
        <p class='small'><strong>Press the J key</strong></p></div>
        </div>
        <p>Press any key to begin.</p>
        `,
        post_trial_gap: 2000
      };
    
      intro_block.push(instructions)

      return intro_block
    }

    function timelineTest(jsPsych: JsPsych) {
      var test_stimuli = [
        { stimulus: "../assets/blue.png",  correct_response: 'f'},
        { stimulus: "../assets/orange.png",  correct_response: 'j'}
      ];

      var fixation = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: '<div style="font-size:60px;">+</div>',
        choices: "NO_KEYS",
        trial_duration: function() {
          return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0];
        },
        data: {
          task: 'fixation'
        }
      };

      var test = {
        type: jsPsychImageKeyboardResponse,
        stimulus: jsPsych.timelineVariable('stimulus'),
        choices: ['f', 'j'],
        data: {
          task: 'response',
          correct_response: jsPsych.timelineVariable('correct_response')
        },
        on_finish: function(data) {
          data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
        }
      };

      var test_procedure = {
        timeline: [fixation, test],
        timeline_variables: test_stimuli,
        repetitions: 5,
        randomize_order: true
      };

      return [test_procedure];
    }

    function timelineDebrief(jsPsych: JsPsych) {
      var debrief_block = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function() {
          var trials = jsPsych.data.get().filter({task: 'response'});
          var correct_trials = trials.filter({correct: true});
          var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
          var rt = Math.round(correct_trials.select('rt').mean());

          return `<p>You responded correctly on ${accuracy}% of the trials.</p>
            <p>Your average response time was ${rt}ms.</p>
            <p>Press any key to complete the experiment. Thank you!</p>`;
        }
      }

      return debrief_block
    }

    export function createTimeline(jsPsych:JsPsych, options: Partial<CreateTimelineOptions> = {}) {

    }

    export const timelineUnits = {
      timelineIntro,
      timelineTest,
      timelineDebrief
    }

    export const utils = {}
    ```
</details>


## Building .createTimelines()

:::warning Rewrite transition in previous section
After writing how to use the timelineUnits to write `.creatTimelines()`, be sure to move the exit transition for the previous section here, as well as rewrite that transition.
:::

## Designing and executing parameters

Now that we have our initial experiment sectioned off into `timelineUnits`, we can now think about designing parameters, based on how we might want to modify the task for iterative deployments.

Let's define our parameters as a Javascript object named `options`. Let's begin with this initial set of parameters:
- `repetitions`: An integer that determines the amount of times the pair of "blue" and "orange" trials repeats. Basically a parametrized version of the `repetition` parameter that already exists in the `timeline_procedure` object!
- `instructions`: A Boolean that allows the timeline to include the instructions trial if `True`
- `debrief`: A Boolean that allows the timeline to include the debrief trial if `True`

In essence, we want to be able to run the following from `index.html`, assuming we've rewritten `createTimelines()` to take `options` as an argument.

```javascript
const options = {
 repetitions: 5,
 instructions: true,
 debrief: true
}

const task = jsPsychTimelineReactionTimeDemo.createTimeline(jsPsych, options)
```

:::warning `options` and `defaultOptions` objects
Start by introducing these objects first in the `.createTimeline()` method.
:::

Now, let's write implementations for these parameters in each of their corresponding `timelineUnits`. We'll start with `instructions` and `debrief`.

For `instructions`, we can write a basic implementation by wrapping our definition of `var instructions` in an `if`-statement. We'll define `instructions` as a trial object in the case that `optionInstructions` is true. Otherwise, we define `var instructions` as an empty array, since this implementation assumes an `instructions` variable will be pushed to the `intro_block` array either way. We'll also add `optionInstructions` as an argument for the `timelineIntro` function.

:::warning Bug: Typing
Need to declare `instructions` as a variable with type array or object before you can run the parametrized unit. Same with `debrief`.
:::
```javascript
function timelineIntro(jsPsych: JsPsych, optionInstructions) {
   var intro_block = [];

   var welcome = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: "Welcome to the experiment. Press any key to begin."
   };

   intro.push(welcome)

   if(optionInstructions){
    var instructions = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: `
       <p>In this experiment, a circle will appear in the center
       of the screen.</p><p>If the circle is <strong>blue</strong>,
       press the letter F on the keyboard as fast as you can.</p>
       <p>If the circle is <strong>orange</strong>, press the letter J
       as fast as you can.</p>
       <div style='width: 700px;'>
       <div style='float: left;'><img src='../assets/blue.png'></img>
       <p class='small'><strong>Press the F key</strong></p></div>
       <div style='float: right;'><img src='../assets/orange.png'></img>
       <p class='small'><strong>Press the J key</strong></p></div>
       </div>
       <p>Press any key to begin.</p>
     `,
     post_trial_gap: 2000
    };
   } else {
    var instructions = []
   }

   intro.push(instructions)

   return intro
}
```

We can do much the same thing with `debrief`. Let's define `var debrief_block` as the expected trial object if `optionsDebrief` is true, and define `debrief_block` as an empty array otherwise. Once again, we're also remembering to add `optionDebrief` as an argument.

```javascript
function timelineDebrief(jsPsych: JsPsych, optionDebrief) {
   if(optionDebrief){
    var debrief_block = {
       type: jsPsychHtmlKeyboardResponse,
       stimulus: function() {

         var trials = jsPsych.data.get().filter({task: 'response'});
         var correct_trials = trials.filter({correct: true});
         var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
         var rt = Math.round(correct_trials.select('rt').mean());

         return `<p>You responded correctly on ${accuracy}% of the trials.</p>
           <p>Your average response time was ${rt}ms.</p>
           <p>Press any key to complete the experiment. Thank you!</p>`;

       }
     }
   } else {
     var debrief_block = []
   }

   return debrief
}
```

Finally, we can implement `repetitions` in the `timelineTest` unit by simply adding `optionRepetitions` as an argument and reading it to the `repetitions` parameter in `test_procedure`.

```javascript
function timelineTest(jsPsych: jsPsych, optionRepetitions) {
   var test_stimuli = [
     { stimulus: "../blue.png",  correct_response: 'f'},
     { stimulus: "../orange.png",  correct_response: 'j'}
   ];

   var fixation = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: '<div style="font-size:60px;">+</div>',
     choices: "NO_KEYS",
     trial_duration: function(){
       return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0];
     },
     data: {
       task: 'fixation'
     }
   };

   var test = {
     type: jsPsychImageKeyboardResponse,
     stimulus: jsPsych.timelineVariable('stimulus'),
     choices: ['f', 'j'],
     data: {
       task: 'response',
       correct_response: jsPsych.timelineVariable('correct_response'),
     },
     on_finish: function(data){
       data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
     }
   };

   var test_procedure = {
     timeline: [fixation, test],
     timeline_variables: test_stimuli,
     repetitions: optionRepetitions,
     randomize_order: true
   };

   return test_procedure;
}

```

All that's left is to adjust `createTimeline()` so that each timelineUnit call takes their new arguments, respectively.

```javascript
export function createTimeline(jsPsych: jsPsych, options){
 // fill this in with what the current function would look like at this stage
}
```

Now, on next build, we'll be able to run these timelineUnits again from the `index.html`, this time altering each unit's behavior through each's new, second argument.

```javascript title='examples/index.html'
const jsPsych = initJsPsych({
  on_finish: function() {
  jsPsych.data.displayData();
}});

const intro = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineIntro(jsPsych, false);
const test = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineTest(jsPsych, 5);
const debrief = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineDebrief(jsPsych, true);

jsPsych.run([intro, test, debrief])
```

:::warning Signpost Other Ways to Factor Out Parameters
:::

## Setting up a util

With the bigger conceptual portions of the experiment factored out as parameterized `timelineUnits`, we can now think about factoring out `util`, or essential helper functions that support more sophisticated, customizable behaviors. 

To start thinking about `utils`, we're going to again default to the simplest case scenario, take what already exists in our code, and wrap it off into a separate function for export. A good place to start would be any of the functions returning a value to our trial objects. For example, let's look at the randomized fixation timing between stimuli.

```javascript
   var fixation = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: '<div style="font-size:60px;">+</div>',
     choices: "NO_KEYS",
     trial_duration: function(){
       return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0];
     },
     data: {
       task: 'fixation'
     }
   };
```

The logic in `trial_duration` samples 1 out of an array of integers, then sets that to the number of milliseconds passed before the fixation trial ends. As a `util`, however, we can factor this out into a separate function. For now, we'll have to give the function `jsPsych` as an argument, since the sampling logic is borrowed from a jsPsych module.

```javascript
function fixationDuration(jsPsych: JsPsych) {
  return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0];
}
```

Then, let's call it in the original trial definition. Remember to return it as the output to an arrow function. Otherwise, our new `fixationDuration` util will only be evaluated once when our trial object is created, as opposed to everytime the trial object is instantiated in our timeline. 

```javascript
var fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size:60px;">+</div>',
  choices: "NO_KEYS",
  trial_duration: () => fixationDuration(jsPsych)
  data: {
    task: 'fixation'
  }
};
```

Why would we want to do this? Doesn't this just get us the same result with extra steps? Well, aside from keeping our logic separated and a little more legible, this gives us an opportunity to scope out more control over this functional behavior of the experiment. As developers, we can have more control over the logic that determines time spent on a fixation point, by working within `fixationDuration` in isolation. We can even add new arguments that affect the util's behavior. As behavioral researchers, we could implement new parameters om our HTML, or call `fixation, in order to incorporate a new variable into our experiments.

For instance, let's turn `fixationDuration` into a switch that, to start off, takes a second argument to distinguish between two cases: `"random"` and `"fixed"`. `"random"` cases can return the original randomization logic, while `"fixed"` returns a reliable 1000 milliseconds. We can also set the randomization logic as the default. 

```javascript
function fixationDuration(jsPsych: JsPsych, mode: "random" | "fixed" = "random") {
  switch (mode) {
    case "fixed":
      return 1000;
    case "random":
      return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0];
    default:
      return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0];
  }
}
```

Once we do this, we need to make sure the `fixationDuration` call in the `fixation` trial definition includes our new argument. Let's also make sure the timelineUnit `timelineTest` takes this new argument, and that the new argument is provided when `timelineTest` is called in `createTimeline`, since this value is inherited all throughout our `src` file.

```javascript
var fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size:60px;">+</div>',
  choices: "NO_KEYS",
  trial_duration: () => fixationDuration(jsPsych, 'fixed')
  data: {
    task: 'fixation'
  }
};
```
```javascript
function timelineTest(jsPsych: jsPsych, optionRepetitions, optionFixationDuration) {
```
```javascript
timeline.push(timelineTest(jsPsych, options.repetitions, options.fixationDuration));
```
:::warning `options` Object and Interface
Once the `options` object and interface are described above, please incorporate that into this "inheritance chain".
:::

Now, with our next build, we can go into `index.html` and use this new argument to adjust our `fixation` trial behavior on the fly, between `timelineTest` calls. 

```javascript title='examples/index.html'
const jsPsych = initJsPsych({
  on_finish: function() {
  jsPsych.data.displayData();
}});

const intro = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineIntro(jsPsych, false);
const test1 = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineTest(jsPsych, 5, "fixed");
const test2 = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineTest(jsPsych, 5, "random");
const debrief = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineDebrief(jsPsych, true);

jsPsych.run([intro, test1, test2, debrief])
```

We can also call `fixationDuration` separately. For example, maybe we, for whatever reason, define a trial object directly from the HTML that assigns the same functional output to `trial_duration`. We can call `fixationDuration` directly from the `utils` exports for this purpose.

```javascript title='examples/index.html'
const jsPsych = initJsPsych({
  on_finish: function() {
  jsPsych.data.displayData();
}});

const XFixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size:60px;">X</div>',
  choices: "NO_KEYS",
  trial_duration: () => jsPsychTimelineReactionTask.utils.fixationDuration(jsPsych, 'fixed'),
  data: {
    task: 'fixation'
  }
}

const intro = jsPsychTimelineReactionTask.timelineUnits.timelineIntro(jsPsych, false);
const test1 = jsPsychTimelineReactionTask.timelineUnits.timelineTest(jsPsych, 5, "fixed");
const test2 = jsPsychTimelineReactionTask.timelineUnits.timelineTest(jsPsych, 5, "random");
const debrief = jsPsychTimelineReactionTask.timelineUnits.timelineDebrief(jsPsych, true);

jsPsych.run([intro, XFixation, test1, test2, debrief])
```

:::warning Script Tag
Remember, for the above to work from the HTML, you need to add a script tag to the top of the HTML file that imports `jsPsychHtmlKeyboardReponse` via CDN. You're calling the plugin directly from the HTML now, so you need to have the type available in the HTML file.
:::

Keep in mind that the point of these demonstrated `utils` is to convey the layer of abstraction permitted with a timeline package. `fixationDuration` may not be especially useful right now, at least not in the way we've implemented it so far, but it carves out new room for implementational flexibility. 

Researchers working primarily from HTML files, without digging into our source, might find new unanticipated uses for any of our `util` exports. Developers, meanwhile, can always modify the util itself and give it new functionality, or refactor it with respect to our `timelineUnits`. By designing jsPsych experiments with a layer of exposed, modular access in the form `timelineUnits` and `utils`, we introduce a new point of feedback in the jsPsych research ecosystem&mdash;one that ultimately helps us build a better tool for everyone.

## Testing exports
...

## Writing documentation
...

## Open a pull request!
...
