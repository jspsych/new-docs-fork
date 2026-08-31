# Dashboard

We keep a live feed of activity on `@jspsych/jspsych` on a [separate repository](https://github.com/jspsych/dashboard), which regularly syncs and deploys to a separate Github Pages domain. You can check out reports from that repo on this page, rendered using Quarto.

### Navigating Dashboard Views

For each view below, you can:
- Tab through data **by timeframe** - i.e. All Time, Past 90 Days, Past 60 Days, Past 30 Days
- **Expand graphs** using the button on each one's lower right corner
- **Check the last sync data** at the bottom of each view

:::warning Draft Note: To-Do
- Remove name of view from the page displayed in the iframe
- Use the same dashboard logic but for `@jspsych/jspsych-contrib`
- Consider implementing iframe-resizer package to not worry as much about manually adjusting iframe height to fit longterm
- Find a way to make everything mobile friendly.
:::

## Overview

<iframe width = "100%" height="1425" src = "https://jspsych.github.io/dashboard/overview.html"></iframe>

## Pull Requests

<iframe width = "100%" height="900" src = "https://jspsych.github.io/dashboard/pullrequests.html"></iframe>

## Issues

<iframe width = "100%" height="900" src = "https://jspsych.github.io/dashboard/issues.html"></iframe>

## Discussions

<iframe width = "100%" height="200" src = "https://jspsych.github.io/dashboard/discussions.html"></iframe>