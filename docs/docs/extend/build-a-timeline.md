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
- Setting up the 'createTimeline' export
- Blocking out timelineUnits and utils as exportable components
- Designing parameters for configuring versions of the same task
- Testing builds
- Preparing documentation
- Finalizing a pull request with jspsych-timeline using GitHub

[maybe include an npx CLI setup bit here]

## Overview exports from index.ts

`index.js` exports three principle kinds of components. 
- `createTimeline`: A function that takes each parameter, incorporates every export, and outputs a jsPsych timeline object.
- `timelineUnits`: An object that includes each part of the larger timeline, broken down into conceptual chunks, typically but not always written as functions.
- `util`: An object containing smaller logical components that support `createTimeline` or `timelineUnits`, like helper functions or type definitions.

## Setting Up `createTimeline`

Since this is the primary export for our package, we can think of this as the "hub" where all of our exports come together to generate a complete, fully configured task. This single export will process any parameters exposed to users and referenced throughout our source code. `createTimeline` will also depend on any timelineUnits and utils we eventually factor out over the course of this tutorial. It's the glue holding our package together, so we'll start here.

To get things going, we can just copy the original code for the [Reaction Time Task](../learn/tutorials/rt-task.md#the-final-code) right here in our function, treating the function as a wrapper.

```javascript
export function createTimeline(jsPsych:JsPsych) {
    var timeline = [];

    /* preload images */
    var preload = {
      type: jsPsychPreload,
      images: ['img/blue.png', 'img/orange.png']
    };
    timeline.push(preload);

    /* define welcome message trial */
    var welcome = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "Welcome to the experiment. Press any key to begin."
    };
    timeline.push(welcome);

    /* define instructions trial */
    var instructions = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `
        <p>In this experiment, a circle will appear in the center 
        of the screen.</p><p>If the circle is <strong>blue</strong>, 
        press the letter F on the keyboard as fast as you can.</p>
        <p>If the circle is <strong>orange</strong>, press the letter J 
        as fast as you can.</p>
        <div style='width: 700px;'>
        <div style='float: left;'><img src='img/blue.png'></img>
        <p class='small'><strong>Press the F key</strong></p></div>
        <div style='float: right;'><img src='img/orange.png'></img>
        <p class='small'><strong>Press the J key</strong></p></div>
        </div>
        <p>Press any key to begin.</p>
      `,
      post_trial_gap: 2000
    };
    timeline.push(instructions);

    /* define trial stimuli array for timeline variables */
    var test_stimuli = [
      { stimulus: "img/blue.png",  correct_response: 'f'},
      { stimulus: "img/orange.png",  correct_response: 'j'}
    ];

    /* define fixation and test trials */
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
        correct_response: jsPsych.timelineVariable('correct_response')
      },
      on_finish: function(data){
        data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
      }
    };

    /* define test procedure */
    var test_procedure = {
      timeline: [fixation, test],
      timeline_variables: test_stimuli,
      repetitions: 5,
      randomize_order: true
    };
    timeline.push(test_procedure);

    /* define debrief */
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
    };
    timeline.push(debrief_block);

    return { timeline: timeline }
}
```

Notice how this code includes everything except `initjsPsych` and `jsPsych.run`. This is because `createTimeline` only outputs the complete `timeline` object and nothing else. It is not responsible for declaring the jsPsych instance that actually runs the experiment; that still happens in the HTML that imports and calls `createTimeline`!

At the same time, `createTimeline` requires a jsPsych instance as an argument, since it still references core jsPsych methods to define trial parameters. 

Now, let's run `npm run build` in the commandline to create a first build of our package. After that, we can call `createTimeline` from `examples/index.html`, assign the output to a `timeline` constant, then run it to see the same familiar reaction time task in action.

```javascript title="examples/index.html"
const jsPsych = initJsPsych({
  on_finish: function() {
  jsPsych.data.displayData();
}});

const timeline = jsPsychTimelineReactionTimeDemo.createTimeline(jsPsych);

jsPsych.run(timeline)
```

<details>
    <summary><strong>The complete code so far</strong></summary>
    ```javascript
    import { JsPsych } from "jspsych";
    import jsPsychPreload from "@jspsych/plugin-preload";
    import jsPsychHtmlKeyboardResponse from "@jspsych/plugin-html-keyboard-response";
    import jsPsychImageKeyboardResponse from "@jspsych/plugin-image-keyboard-response";

    export function createTimeline(jsPsych:JsPsych) {
      var timeline = [];

      /* preload images */
      var preload = {
        type: jsPsychPreload,
        images: ['img/blue.png', 'img/orange.png']
      };
      timeline.push(preload);

      /* define welcome message trial */
      var welcome = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: "Welcome to the experiment. Press any key to begin."
      };
      timeline.push(welcome);

      /* define instructions trial */
      var instructions = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
          <p>In this experiment, a circle will appear in the center 
          of the screen.</p><p>If the circle is <strong>blue</strong>, 
          press the letter F on the keyboard as fast as you can.</p>
          <p>If the circle is <strong>orange</strong>, press the letter J 
          as fast as you can.</p>
          <div style='width: 700px;'>
          <div style='float: left;'><img src='img/blue.png'></img>
          <p class='small'><strong>Press the F key</strong></p></div>
          <div style='float: right;'><img src='img/orange.png'></img>
          <p class='small'><strong>Press the J key</strong></p></div>
          </div>
          <p>Press any key to begin.</p>
        `,
        post_trial_gap: 2000
      };
      timeline.push(instructions);

      /* define trial stimuli array for timeline variables */
      var test_stimuli = [
        { stimulus: "img/blue.png",  correct_response: 'f'},
        { stimulus: "img/orange.png",  correct_response: 'j'}
      ];

      /* define fixation and test trials */
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
          correct_response: jsPsych.timelineVariable('correct_response')
        },
        on_finish: function(data){
          data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
        }
      };

      /* define test procedure */
      var test_procedure = {
        timeline: [fixation, test],
        timeline_variables: test_stimuli,
        repetitions: 5,
        randomize_order: true
      };
      timeline.push(test_procedure);

      /* define debrief */
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
      };
      timeline.push(debrief_block);

      return { timeline: timeline };
    }

    export const timelineUnits = {
    }

    export const utils = {}
    ```
</details>

## Setting up a timelineUnit

:::warning Draft Note: Move this up top and rewrite
"With our `timelineUnits` bracketed out and exported, anyone could isolate, rearrange, or reconfigure any one of the pieces of our original experiment. The next section will expand on that last point and go into parametrizing units for configurability."
:::

Now that we understand `createTimeline` as a consistent end product of our source code, we can start to carve it up into `timelineUnits`. To restate, `timelineUnits` are broken down, conceptual pieces of our experiment timeline&mdash;that is, of the script executed in `createTimeline`. Each `timelineUnit` can be typed as an array of `TimelineNodes`. On first glance, we can split the script in `createTimeline` into three main chunks:
- An introduction, made up of the `welcome` and `instructions` nodes
- The `test_procedure`, alternating between `fixation` and `test` nodes
- The `debrief` consisting of a single node, with a digest of the participant's performance

:::warning Draft Note: Needs hands-on review
Everything past this point must be implementationally verified by a few people willing to go through each step, noting build-breaking errors along the way. 
:::

:::warning Draft Note: Nomenclatures
Make sure that all nomenclatures are consistent and descriptive throughout
:::

The most straightforward way to block out our `timelineUnits` is by wrapping each chunk in a function that returns that chunk.

:::tip jsPsych instance as argument
In the event that a `timelineUnit` or `util` references core jsPsych methods, each export should take the running jsPsych instance as an argument by default. Otherwise, those methods will not be appropriately defined. We explore other ways to factor out references to the jPsych instance in later sections of this tutorial (pending).
:::

:::warning Draft Note: Include Pre-Load
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

We've defined 3 timelineUnits in our source code. Great! Now we need to rewrite `createTimeline` so that it references these units. Instead of pushing each hardcoded trial node to `timeline`, we'll push what's returned from a single call for each timelineUnit.

```javascript
export function createTimeline(jsPsych:JsPsych) {
  var timeline = [];

  timeline.push(timelineIntro(jsPsych))
  timeline.push(timelineTest(jsPsych))
  timeline.push(timelineDebrief(jsPsych))

  return { timeline: timeline }
}
```

This keeps our code maintainable in two critical ways. First, with `createTimeline` rewritten and consolidated as `timelineUnits`, we can identify and debug errors more easily. There is never a world, for example, where one of our `timelineUnits` break but `createTimeline` works fine. Second, when we start adding parameters in the next section, we only need to write the logic for evaluating those parameters once. Otherwise, we might end up writing redundant or even incommensurate logic, once to evaluate a parameter in `createTimeline` and another to evaluate the same parameter in however many units depend on it.

If we run another build, we can see that our `createTimeline` call in `examples/index.html` still works fine.

Now, let's add each of these as exports under `timelineUnits`:

```javascript
export const timelineUnits = {
   timelineIntro,
   timelineTest,
   timelineDebrief
}
```

After running another build, we can now call each `timelineUnit` as well from `examples/index.html`, separately.

:::warning Draft Note: Introduce `examples/index.html`
Put something in the overview, under the first header, that explains `examples/index.html`
:::

```html title='examples/index.html'
<script>
 const jsPsych = initJsPsych();

 const intro = jsPsychTimelineReactionTimeDemo.timelineUnit.timelineIntro(jsPsych);
 const test = jsPsychTimelineReactionTimeDemo.timelineUnit.timelineTest(jsPsych);
 const debrief = jsPsychTimelineReactionTimeDemo.timelineUnit.timelineDebrief(jsPsych);

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

    export function createTimeline(jsPsych:JsPsych) {
      var timeline = [];

      timeline.push(timelineIntro(jsPsych))
      timeline.push(timelineTest(jsPsych))
      timeline.push(timelineDebrief(jsPsych))

      return { timeline: timeline }
    }

    export const timelineUnits = {
      timelineIntro,
      timelineTest,
      timelineDebrief
    }

    export const utils = {}
    ```
</details>

## Designing and implementing parameters

Now that we have our initial experiment sectioned off into `timelineUnits`, we can now think about designing parameters, based on how we might want to modify the task for iterative deployments.

Let's define our parameters as a Javascript object named `options`. Let's begin with this initial set of parameters:
- `repetitions`: An integer that determines the amount of times the pair of "blue" and "orange" trials repeats; basically a parameterization of the original `timeline_procedure` object's `repetitions` property
- `instructions`: A Boolean that allows the timeline to include the instructions trial if `True`
- `debrief`: A Boolean that allows the timeline to include the debrief trial if `True`

In essence, we want to be able to run the following from `index.html`, assuming we've rewritten `createTimeline()` to take `options` as an argument.

```javascript
const options = {
 repetitions: 5,
 instructions: true,
 debrief: true
}

const task = jsPsychTimelineReactionTimeDemo.createTimeline(jsPsych, options)
```

We'll tackle parametrizing our timeline package in two steps: first by implementing parameters at the scope of our `timelineUnits`, then by typing an object for our parameters through `createTimeline`'s functional signature.

### Implementing parameters in `timelineUnits`

Let's first go through each `timelineUnit` and implement the parameters that pertain to them&mdash;that is, `repetitions` in `timelineTest`, `instructions` in `timelineIntro`, and `debrief` in `timelineDebrief`. 

We'll start with `repetitions`, since its first implementation will be a simple matter of swapping out a hardcoded value. We can do this by adding a second argument for `optionRepetitions`, then reading it to the definition of `test_procedure`.

```javascript
function timelineTest(jsPsych: JsPsych, optionRepetitions: number) {
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
     repetitions: optionRepetitions,
     randomize_order: true
   };

   return test_procedure;
}
```

The other parameters will need a little additional logic, since they affect whether whole trials are included on execution. For `instructions`, we can write an `if`-statement that depends on an `optionInstructions` argument, then wrap the `intro_block.push(instructions)` call.

```javascript
function timelineIntro(jsPsych: JsPsych, optionInstructions) {
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

   if(optionInstructions){
    intro_block.push(instructions)
    return intro_block
   }

   return intro_block
}
```

We can do much the same thing with `debrief`. Let's wrap `return debrief_block` in an `if`-statement that evaluates an `optionDebrief` argument. Otherwise, `timelineDebrief` will now return an empty array.

```javascript
function timelineDebrief(jsPsych: JsPsych, optionDebrief) {

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

  if(optionDebrief){
    return debrief_block
  } else {
    return []
  }
}
```

:::tip Alternative Implementation: Conditional Definition Instead Of Conditional Push
For `instructions`, we can write a basic implementation by wrapping our definition of `var instructions` in an `if`-statement. We'll define `instructions` as a trial object in the case that `optionInstructions` is true. Otherwise, we define `var instructions` as an empty array, since this implementation assumes an `instructions` variable will be pushed to the `intro_block` array either way. We'll also add `optionInstructions` as an argument for the `timelineIntro` function.

:::warning Bug: Typing
Need to declare `instructions` as a variable with type array or object before you can run the parametrized unit. Same with `debrief`.
:::

With our implementational logic figured out, we should set a fallback for each of our second arguments. We can accomplish that in the functional signature of each `timelineUnit`, like so:

```javascript
function timelineTest(jsPsych: JsPsych, optionRepetitions: number = 5)
```
```javascript
function timelineIntro(jsPsych: JsPsych, optionInstructions: boolean = true)
```
```javascript
function timelineDebrief(jsPsych: JsPsych, optionDebrief: boolean = true)
```

These fallbacks allow use to successfully call each `timelineUnit` without defining the second argument. Instead, each `timelineUnit` will reference the fallback by default. This is how we set default parameters as if the timeline were a plugin. This is also how we keep our package build from breaking, insofar as none of the `timelineUnit` calls in `createTimeline` define these parameter arguments&mdash;at least not yet.

Now, on next build, we'll be able to run these `timelineUnits` from `index.html` while configuring each unit's behavior with the second argument.

```html title='examples/index.html'
<script>
  const jsPsych = initJsPsych({
    on_finish: function() {
    jsPsych.data.displayData();
  }});

  const intro = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineIntro(jsPsych, false);
  const test = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineTest(jsPsych, 5);
  const debrief = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineDebrief(jsPsych, true);

  jsPsych.run([intro, test, debrief])
</script>
```



### Typing the parameters object in `createTimeline`

There's one last thing to do to fully parameterize our package. While we can read parameters as arguments directly to each exported `timelineUnit`, our `createTimeline` export isn't yet written to take those parameters. To recap, `createTimeline` should work like a complete kit of every way `timelineUnits`&mdash;and later `utils`&mdash;can be configured.

To help `createTimeline` handle this configurability, we need to add arguments to its functional signature. We could start with a single `options` argument, presume `options` is an object with a property for each parameter, then reference those properties in each `timelineUnit` call.

```javascript
export function createTimeline(jsPsych:JsPsych, options ) {

  var timeline = [];

  timeline.push(timelineIntro(jsPsych, options.instructions));
  timeline.push(timelineTest(jsPsych, options.repetitions));
  timeline.push(timelineDebrief(jsPsych, options.debrief));

  return { timeline: timeline };
}
```

This would compile fine and is serviceable as a quick and dirty solution. However, what if our user doesn't want to configure every parameter? What if their `options` object contains some parameters, but not others? What about if their `options` argument includes typos, or isn't even an object at all? 

To weigh an alternative, we could define an argument for each timeline parameter. However, that could eventually get out of hand, for users and developers alike. Our code would become less readable as we implement new parameters or wrote in fallbacks. We'd also need to make sure any fallbacks in `createTimeline` matched those in our `timelineUnits`. Users' deployment scripts would also become less manageable since they'd lack the flexibility to implement a range of often counterbalanced configurations.

This is where we can lean into the additional control Typescript affords us as developers. Let's start by typing `options` as an object with each of our parameters.

```javascript
export function createTimeline(jsPsych:JsPsych, options: { 
  repetitions: number, instructions: boolean, debrief: boolean
} ) {

  var timeline = [];

  timeline.push(timelineIntro(jsPsych, options.instructions));
  timeline.push(timelineTest(jsPsych, options.repetitions));
  timeline.push(timelineDebrief(jsPsych, options.debrief));

  return { timeline: timeline };
}
```

Nice. Once we run a new build, we'll get a syntax error if `options` doesn't match the expected type, every time we call `createTimeline` in our HTML script. Unfortunately, we also can't call `createTimeline` without defining `options` at all. We could solve this be setting a fallback for `options` in the `createTimeline` functional signature, but this could end up redundant or inconsistent with our `timelineUnit` fallbacks. Even then, we wouldn't be able to handle cases where only some of the parameters are defined, but not others.

To address these problems, let's take advantage of two other types available through Typescript: interfaces and Partials. 

An `interface` will let us set the `options` object type outside of the argument definition, then call it back in like so:

```javascript
interface CreateTimelineOptions {
  repetitions: number,
  instructions: boolean,
  debrief: boolean,
}

export function createTimeline(jsPsych:JsPsych, options: CreateTimelineOptions ) {
```
For anyone who's developed a jsPsych plugin before, this will look a little analogous to the [plugin info object](), albeit without any of the boilerplate syntax provided with our plugin template.

In addition to cleaning up our code a little, we have set ourselves up to type `options` as a `Partial` of `interface CreateTimelineOptions`. A `Partial` will include any subset of the type defined in `createTimelineOptions`&mdash;even empty ones! At the same time, it will reject any objects with properties not included in `CreateTimelineOptions`.

```javascript
interface CreateTimelineOptions {
  repetitions: number,
  instructions: boolean,
  debrief: boolean,
}

export function createTimeline(jsPsych:JsPsych, options: Partial<CreateTimelineOptions> = {} ) {
```

Now, on next build, we can run any range of complete or partial configurations through our `createTimeline` call in the example HTML.

```javascript title="example/index.html"
```

We should keep this workflow in mind as we add new parameters. To restate the steps going forward, parameters are (1) introduced as arguments at the component scope, (2) implemented at that same scope, (3) provided a fallback value at scope's function signature, then (4) added to our `interface` type. 

<details>
    <summary><strong>The complete code so far</strong></summary>
    ```javascript
    import { JsPsych } from "jspsych";
    import jsPsychPreload from "@jspsych/plugin-preload";
    import jsPsychHtmlKeyboardResponse from "@jspsych/plugin-html-keyboard-response";
    import jsPsychImageKeyboardResponse from "@jspsych/plugin-image-keyboard-response";

    function timelineIntro(jsPsych: JsPsych, optionInstructions: boolean = true) {
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

      if(optionInstructions){
        intro_block.push(instructions)
        return intro_block
      }

      return intro_block
    }

    function timelineTest(jsPsych: JsPsych, optionRepetitions: number = 5) {
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
        repetitions: optionRepetitions,
        randomize_order: true
      };

      return [test_procedure];
    }

    function timelineDebrief(jsPsych: JsPsych, optionDebrief: boolean = true) {
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

      if(optionDebrief){
        return debrief_block
      } else {
        return []
      }
    }

    interface CreateTimelineOptions {
      repetitions: number,
      instructions: boolean,
      debrief: boolean,
    }

    export function createTimeline(jsPsych:JsPsych, options: Partial<CreateTimelineOptions> = {} ) {
      var timeline = [];

      timeline.push(timelineIntro(jsPsych, options.instructions))
      timeline.push(timelineTest(jsPsych, options.repetitions))
      timeline.push(timelineDebrief(jsPsych, options.debrief))

      return { timeline: timeline }
    }

    export const timelineUnits = {
      timelineIntro,
      timelineTest,
      timelineDebrief
    }

    export const utils = {}
    ```
</details>

## Setting up a util

With the bigger conceptual portions of the experiment factored out as parameterized `timelineUnits`, we can now think about factoring out `utils`, or essential helper functions that support more sophisticated, customizable behaviors. 

To start thinking about `utils`, we're going to again default to the simplest case scenario, take what already exists in our code, and wrap it off into a separate function for export. A good place to start would be any of the functions returning a value to our trial objects. For example, let's look at the debrief trial at the end of the experiment.

```javascript
function timelineDebrief(jsPsych: JsPsych, optionDebrief: boolean = true) {
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

  if(optionDebrief){
    return debrief_block
  } else {
    return []
  }
}
```

Let's consider the functional logic in the `debrief_block.stimulus` definition and factor it out into its own `util` function, `getPerformance`. We'll have to give the jsPsych instance as an initial argument, since our logic calls on the `data` module.

```javascript
function getPerformance(jsPsych: JsPsych) {
  var trials = jsPsych.data.get().filter({task: 'response'});
  var correct_trials = trials.filter({correct: true});
  var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
  var rt = Math.round(correct_trials.select('rt').mean());

  return {accuracy: accuracy, rt: rt};
}
```

Then, let's call our new function in the original `stimulus` definition.

```javascript
function timelineDebrief(jsPsych: JsPsych, optionDebrief: boolean = true) {
  var debrief_block = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      var performance_data = getPerformance(jsPsych)

      return `<p>You responded correctly on ${performance_data.accuracy}% of the trials.</p>
        <p>Your average response time was ${performance_data.rt}ms.</p>
        <p>Press any key to complete the experiment. Thank you!</p>`;
    }
  }

  if(optionDebrief){
    return debrief_block
  } else {
    return []
  }
}
```

On next build, both `createTimeline` and `timelineDebrief` should keep the same functionality when called from `examples/index.html`. Of course, we should also remember to add `getPerformance` to our exports, under `utils`, in case we want to users to reference `getPerformance` from their HTML as well.

```javascript
export const utils = {
  getPerformance
}
```

By factoring out `getPerformance`, we open up some flexibility for users and developers alike. To start, we can now reference this `util` internally throughout our source code. For example, we might want to call `getPerformance` between timeline trials and write its outputs to the data object.

```javascript title="As defined in timelineTest"
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
      
      const performance_data = getPerformance(jsPsych);
      data.total_accuracy = performance_data.accuracy;
      data.total_rt = performance_data.rt;
    }
  };
```

Users could also call `getPerformance` from their HTML like any other export, so long as it's called within the context of another jsPsych timeline.

```javascript title="my cool example in examples/index.html"

```

Factoring out `getPerformance` as a `util` also helps us keep our code legible while we write more robust outputs. 

For instance, let's disaggregate our `accuracy` and `rt` metrics further based on stimulus color. .

```javascript
function getPerformance(jsPsych: JsPsych) {
  var trials = jsPsych.data.get().filter({task: 'response'});
  var correct_trials = trials.filter({correct: true});

  var blue_trials = trials.filter({correct_response: 'f'});
  var correct_blue_trials = blue_trials.filter({correct: true});

  var orange_trials = trials.filter({correct_response: 'j'});
  var correct_orange_trials = orange_trials.filter({correct: true});

  var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
  var blue_accuracy = Math.round(correct_blue_trials.count() / blue_trials.count() * 100);
  var orange_accuracy = Math.round(correct_orange_trials.count() / orange_trials.count() * 100);

  var rt = Math.round(correct_trials.select('rt').mean());
  var blue_rt = Math.round(correct_blue_trials.select('rt').mean());
  var orange_rt = Math.round(correct_orange_trials.select('rt').mean());

  return {
    accuracy: accuracy, 
    rt: rt, 
    blue_accuracy: blue_accuracy,
    blue_rt: blue_rt,
    orange_accuracy: orange_accuracy,
    orange_rt: orange_rt,
  };
}
```

We could then reference these outputs again in the original `timelineDebrief` context, with more HTML strings written to interpolate those values.

```javascript
function timelineDebrief(jsPsych: JsPsych, optionDebrief: boolean = true) {
  var debrief_block = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => {
      var performance_data = getPerformance(jsPsych)

      return `<p>You responded correctly on ${performance_data.accuracy}% of the trials.</p>
        <p>Your average response time was ${performance_data.rt}ms.</p>
        <p>You responded correctly on ${performance_data.blue_accuracy}% of the blue trials.</p>
        <p>Your average response time for blue trials was ${performance_data.blue_rt}ms.</p>
        <p>You responded correctly on ${performance_data.orange_accuracy}% of the orange trials.</p>
        <p>Your average response time for orange trials was ${performance_data.orange_rt}ms.</p>
        <p>Press any key to complete the experiment. Thank you!</p>`;
    }
  }

  if(optionDebrief){
    return debrief_block
  } else {
    return []
  }
}
```

Of course, now we're running into a different problem. The return value is handling a lot of hardcoded string interpolation. Here, we might then write out yet another util, `getPerformanceHTML`, to handle that. 

Let's set this util up so that an object contains an interpolating string for each metric, then appends each to the complete HTML string so long as it's present in the performance metrics object, `performance_data`. Presumably, `performance_data` will be whatever output comes from `getPerformance`.

```javascript
function getPerformanceHTML(performance_data){
  const performanceHTML = {
    accuracy: `<p>You responded correctly on ${performance_data.accuracy}% of the trials.</p>`,
    rt: `<p>Your average response time was ${performance_data.rt}ms.</p>`,
    blue_accuracy: `<p>You responded correctly on ${performance_data.blue_accuracy}% of the blue trials.</p>`,
    blue_rt: `<p>Your average response time for blue trials was ${performance_data.blue_rt}ms.</p>`,
    orange_accuracy: `<p>You responded correctly on ${performance_data.orange_accuracy}% of the orange trials.</p>`,
    orange_rt: `<p>Your average response time for orange trials was ${performance_data.orange_rt}ms.</p>`
  }

  var html = ""

  for (const [key] of Object.entries(performance_data)) {
    html += performanceHTML[key] || "";
  }

  const endHTML = `<p>Press any key to complete the experiment. Thank you!</p>`
  html += endHTML

  return html
}
```
:::tip Typing `performance_data`
We could, of course, take advantage of Typescript to make sure that `performance_data` is always structured like a `getPerformance` output. This would involve similar syntax to how we defined `options` first as the `CreateTimelineOptions` interface, then typed the `options` argument in `createTimeline` as `<Partial>CreateTimelineOptions`. For the sake of simplicity, we won't go over this in the tutorial, but it's good to keep in mind.
:::


:::warning Draft Note: Old fixation util
Everything here and below is the old fixationDuration util draft
:::

Of course, we also need to make sure, despite our fallback, a user defined parameter is able to be inherited throughout our source code and reach the `fixationDuration` call in the `fixation` definition above. We'll add a corresponding argument to our `timelineTest` function signature and the `timelineTest` call in `createTimeline` 

```javascript title='timelineTest function signature'
function timelineTest(jsPsych: jsPsych, optionRepetitions: number = 5, optionFixationDuration: "random" | "fixed" = "random") {
```
```javascript title='timelineTest call in createTimeline'
timeline.push(timelineTest(jsPsych, options.repetitions, options.fixationDuration));
```

As indicated at the end of the previous section, lets also make sure the `fixationDuration` parameter included in our `createTimelineOptions` type interface, with possible values limited to the two cases. 

```javascript
interface CreateTimelineOptions {
  repetitions: number,
  instructions: boolean,
  debrief: boolean,
  fixationDuration: "random" | "fixed"
}
```

And as always, we should add the new `fixationDuration` util to our exports.

```javascript
export const utils = {
  fixationDuration
}
```

Now, with our next build, we can go into `index.html` and use this new argument to adjust our `fixation` trial behavior on the fly, between `timelineTest` calls. 

```html title='examples/index.html'
<script>
  const jsPsych = initJsPsych({
    on_finish: function() {
    jsPsych.data.displayData();
  }});

  const intro = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineIntro(jsPsych, false);
  const test1 = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineTest(jsPsych, 5, "fixed");
  const test2 = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineTest(jsPsych, 5, "random");
  const debrief = jsPsychTimelineReactionTimeDemo.timelineUnits.timelineDebrief(jsPsych, true);

  jsPsych.run([intro, test1, test2, debrief])
</script>
```

We can also call `fixationDuration` separately. For example, maybe we, for whatever reason, define a trial object directly from the HTML that assigns the same functional output to `trial_duration`. We can call `fixationDuration` directly from the `utils` exports for this purpose.

```html title='examples/index.html'
<script>
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
</script>
```

:::warning Script Tag
Remember, for the above to work from the HTML, you need to add a script tag to the HTML head that imports `jsPsychHtmlKeyboardReponse` via CDN. 
:::

Keep in mind that the point of these demonstrated `utils` is to convey the layer of abstraction permitted with a timeline package. `fixationDuration` may not be especially useful right now, at least not in the way we've implemented it so far, but it carves out new room for implementational flexibility. 

Researchers working primarily from HTML files, without digging into our source, might find new unanticipated uses for any of our `util` exports. Developers, meanwhile, can always modify the util itself and give it new functionality, or refactor it with respect to our `timelineUnits`. By designing jsPsych experiments with a layer of exposed, modular access in the form `timelineUnits` and `utils`, we introduce a new point of feedback in the jsPsych research ecosystem&mdash;one that ultimately helps us build a better tool for everyone.

<details>
    <summary><strong>The complete code so far</strong></summary>
    ```javascript
    import { JsPsych } from "jspsych";
    import jsPsychPreload from "@jspsych/plugin-preload";
    import jsPsychHtmlKeyboardResponse from "@jspsych/plugin-html-keyboard-response";
    import jsPsychImageKeyboardResponse from "@jspsych/plugin-image-keyboard-response";

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

    function timelineIntro(jsPsych: JsPsych, optionInstructions: boolean = true, fixationDuration: boolean = "random") {
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

      if(optionInstructions){
        intro_block.push(instructions)
        return intro_block
      }

      return intro_block
    }

    function timelineTest(jsPsych: JsPsych, optionRepetitions: number = 5, optionFixationDuration: "random" | "fixed" = "random") {
      var test_stimuli = [
        { stimulus: "../assets/blue.png",  correct_response: 'f'},
        { stimulus: "../assets/orange.png",  correct_response: 'j'}
      ];

      var fixation = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: '<div style="font-size:60px;">+</div>',
        choices: "NO_KEYS",
        trial_duration: () => fixationDuration(optionFixationDuration),
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
        repetitions: optionRepetitions,
        randomize_order: true
      };

      return [test_procedure];
    }

    function timelineDebrief(jsPsych: JsPsych, optionDebrief: boolean = true) {
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

      if(optionDebrief){
        return debrief_block
      } else {
        return []
      }
    }

    interface CreateTimelineOptions {
      repetitions: number,
      instructions: boolean,
      debrief: boolean,
      fixationDuration: "random" | "fixed"
    }

    export function createTimeline(jsPsych:JsPsych, options: Partial<CreateTimelineOptions> = {} ) {
      var timeline = [];

      timeline.push(timelineIntro(jsPsych, options.instructions, options.fixationDuration))
      timeline.push(timelineTest(jsPsych, options.repetitions))
      timeline.push(timelineDebrief(jsPsych, options.debrief))

      return { timeline: timeline }
    }

    export const timelineUnits = {
      timelineIntro,
      timelineTest,
      timelineDebrief
    }

    export const utils = {
      fixationDuration
    }
    ```
</details>

## Testing exports
...

## Writing documentation
...

## Open a pull request!
...
