---
title: Publish & share
description: Share your plugin, extension, or timeline with the jsPsych community.
---

# Publish & share

Built something useful? Sharing it means other researchers can build on your work — and your contribution gets recognized as part of the jsPsych ecosystem.

:::note Page under construction
This guide still needs to be written. The structure below outlines what it should cover.

**TODO:**
- Choosing where to publish: [`jspsych-contrib`](https://github.com/jspsych/jspsych-contrib) for plugins/extensions, [`jspsych-timelines`](https://github.com/jspsych/jspsych-timelines) for timelines.
- Submission requirements: documentation, tests, examples, metadata, license.
- Opening a pull request to the contrib repositories.
- Publishing to npm.
- How contributions get featured in [Browse the ecosystem](browse.md).
- Maintaining your package over time.
:::

# Setting Up Changeset

Before opening a pull request with one of our repository, you should use `npm run changeset` in terminal at the root of your fork, whether of `jspsych-contrib` or `jspsych-timelines`. This will write a markdown file in `/changeset` that describes the first version of your package and any changes to it. 

:::warning Draft Note: patch version shorthand
include the patch version shorthand here from the demo for hackathon
:::

We use changesets as part of our release workflow, to generate new releases to npm and their corresponding release notes. This is a [good overview of changesets](https://changesets.dev/faq#how-do-i-add-a-changeset) if you want to learn more.

Even if you forget to include changesets before opening your pull request, jsPsych's review bot will give you a nudge anyway. You can always use the CLI and commit the changesets before merge.

:::warning Draft Note: Set-up in developer tutorials should include forks of jspsych-contrib and jspsych-timelines
By setting that up at the start, we can set people up to return to the root of the forked repos and run changeset
:::

# Opening a Pull Request

### Package Contribution Checklist

When your package is ready to merge, it should include each of the following:
- a `src/index.js` (or `src/index.ts`) that compiles when `npm run build` is run from the command line
- a `examples/index.html` with working demos
    - An example file should be included if applicable. If you are contributing a new feature, new plugin, or new extension, or contributing a modification that changes the behavior of the library in some important way, consider adding an example file to the /examples folder in the repository.
- a `src/index.spec.ts` with tests that all pass when `` is run from the command line
    - The code must be tested through our automated testing system. We use Jest as the testing framework. If you are fixing a bug, consider adding a test case that shows the bug has been resolved. If you are contributing new features, like a new plugin, a test suite for the plugin is very helpful. See testing jsPsych for more information about configuring the test tools and writing tests.
- `README.md` formatted to include overview, parameters summary, and examples
- Docs parsed from `src` and rendered at `docs/plugin-name.md`
    - Relevant documentation must be updated. Any pages in /docs that are affected by the contribution should be updated, and if new pages are needed they should be created. For example, if you are contributing a plugin then adding documentation for the plugin and updating the list of available plugins as well as the mkdocs configuration file is very helpful!
- Citation metadata
    - If you are contributing a plugin/extension, we strongly encourage including a file containing citation information. This file should be named CITATION.cff and placed at the root of your repository. This allows people who use your plugin/extension in their code to easily cite your work by calling `jsPsych.getCitations([<yourPlugin>])` from their command line. More information on .cff files can be found here.
- Changesets for major release 1.0.0

### Pull Request Format

Your open pull request should include the following in the first comment:
- **An overview** describing what the plugin does and its default behavior
- **A feature list** 
- **A breakdown of files included in the PR.** This should mirror and confirm what should be accounted for in the package checklist.
- **An author line** listing who worked on the package.

## See also

- [Build a plugin](plugins/plugin-tutorial.md)
- [Build an extension](extensions/extension-development.md)
- [Build a timeline](build-a-timeline.md)
- [Contribute to the core project](contributing/contributing.md)
