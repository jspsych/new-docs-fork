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

The most straightforward way to block out our `timelineUnits` is by wrapping each of the above chunks in a function that returns that chunk. For the sake of including our jsPsych instance in each function's execution context, we'll take advantage of arrow functions.

:::note Arrow Functions
The reason the above works as an arrow function, rather than a defined function, is because arrow functions are unbound to `this` and arguments. As a defined function, we would have to add `jsPsych` as its own argument to our `button_click_listener`, which makes are code less readable and flexible. For more on arrow functions, feel free to check out the [Mozilla docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
:::

:::warning Include Pre-Load
Current unit breakdown below requires pre-load Node. Must decide if this will be a separate unit or factored into one defined below.
:::

Here is the introduction as a `timelineIntro` unit:

```javascript
const timelineIntro = () => {
   var intro = [];

   var welcome = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: "Welcome to the experiment. Press any key to begin."
   };

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
   
   intro.push(welcome, instructions)

   return intro
}
```

Next, here's the `test_procedure` as a `timelineProcedure` unit:

```javascript
const timelineProcedure = () => {
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
     stimulus: function() { return jsPsych.timelineVariable('stimulus'); },
     choices: ['f', 'j'],
     data: {
       task: 'response',
       correct_response: function() { return jsPsych.timelineVariable('correct_response'); }
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
const timelineDebrief = () => {
   var debrief = {
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

   return debrief
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

:::note Introduce `examples/index.html`
Put something in the overview, under the first header, that explains `examples/index.html`
:::

```html
<script>
 const jsPsych = initJsPsych();

 const intro = jsPsychTimelineReactionTimeDemo.timelineUnit.timelineIntro();
 const test = jsPsychTimelineReactionTimeDemo.timelineUnit.timelineProcedure();
 const debrief = jsPsychTimelineReactionTimeDemo.timelineUnit.timelineDebrief();

 jsPsych.run([intro, test, debrief])
</script>
```

With our `timelineUnits` bracketed out and exported, anyone could isolate, rearrange, or reconfigure any one of the pieces of our original experiment. The next section will expand on that last point and go into parametrizing units for configurability.

<details>
    <summary><strong>The complete code so far</strong></summary>
    ```javascript
    // paste whole index.ts in here
    ```
</details>


## Building .createTimelines()

## Designing and executing parameters

Now that we have our initial experiment sectioned off into `timelineUnits`, we can now think about designing parameters, based on how we might want to modify the task for iterative deployments.

Let's define our parameters as a Javascript object named `options`. Let's begin with this initial set of parameters:
- `repetitions`:
- `intro`:
- `debrief`:
**where repetitions takes a number while both intro and debrief take a Boolean. We can then feed this as an argument to .`createTimelines()`**

In essence, we want to be able to run the following from `index.html`, assuming we've rewritten `createTimelines()` to take `options` as an argument.

```javascript
const options = {
 repetitions: 5,
 instructions: true,
 debrief: true
}

const task = jsPsychTimelineReactionTimeDemo.createTimeline(jsPsych, options)
```

Now, let's write implementations for these parameters in each of their corresponding `timelineUnits`. We'll start with the simplest ones, `instructions` and `debrief`.

For `instructions`, we can write a basic implementation by splitting our single `push` call into two&mdash;one for the `welcome` node and the other for the `instructions` node&mdash;then wrapping `push(instructions)` in an if-statement that depends on `options.instruction` as a condition.

```javascript
const timelineIntro = () => {
   var intro = [];

   var welcome = {
     type: jsPsychHtmlKeyboardResponse,
     stimulus: "Welcome to the experiment. Press any key to begin."
   };

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
   
   intro.push(welcome)

   if(options.instructions){
    intro.push(instructions)
   }

   return intro
}
```

Then, we tweak each timelineUnit to take its relevant property in `options.` In this case, timelineTest will take repetitions, timelineIntro will take intro, and timelineDebrief will take debrief. Since these are all properties of options, they'll each be written using dot notation when actually called. 

```javascript
function timelineProcedure(jsPsych: jsPsych, repetitions: number) {
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
     stimulus: function() { return jsPsych.timelineVariable('stimulus'); },
     choices: ['f', 'j'],
     data: {
       task: 'response',
       correct_response: function() { return jsPsych.timelineVariable('correct_response'); }
     },
     on_finish: function(data){
       data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
     }
   };

   var test_procedure = {
     timeline: [fixation, test],
     timeline_variables: test_stimuli,
     repetitions: repetitions,
     randomize_order: true
   };

   return test_procedure;
}

```

All that's left is to adjust `createTimeline()` to take a second `options` the second options argument

```javascript
export function createTimeline(jsPsych: jsPsych, options){
 // fill this in with what the current function would look like at this stage
}
```

## Setting up a util
...

## Testing exports
...

## Writing documentation
...

## Open a pull request!
...
