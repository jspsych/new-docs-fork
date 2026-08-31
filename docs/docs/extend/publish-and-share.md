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

## Setting Up Changeset

Before opening a pull request with one of our repository, you should call `npm run changeset` in terminal at the root of your fork, whether of `jspsych-contrib` or `jspsych-timelines`. This will write a markdown file in `/changeset` that describes the first version of your package and any changes to it. 

We use changesets as part of our release workflow, to generate new releases to npm and their corresponding release notes. This is a [good overview of changesets](https://changesets.dev/faq#how-do-i-add-a-changeset) if you want to learn more.

Even if you forget to include changesets before opening your pull request, jsPsych's review bot will nudge you to take care of it. You can always use the CLI and commit the changesets before merge. Note that if your package was set up with either of our `jspsych-dev` CLI tools, your package starts at version 0.0.1.

As a shorthand, major versions (1.0.0) indicate releases that are not backwards compatible and will break users' code, while minor versions (0.1.0) indicate changes that are backwards compatible. Patches and bug fixes are indicated in the last release number (0.0.1)

:::tip Pre-Releasing Packages
If your package isn't yet feature complete - or you plan on still making a bunch of breaking changes, like continuing to modify the API's exposed surface - we recommend pre-releasing your package and list major version as 0.
:::

:::warning Draft Note: Set-up in developer tutorials should include forks of jspsych-contrib and jspsych-timelines
By setting that up at the start, we can set people up to return to the root of the forked repos and run changeset
:::

## Opening a Pull Request

Once your package directory is up to standard, you'll want to request to merge your fork - whether of `jspsych-contrib` or `jspsych-timelines` - to the original repo's `main` branch, by opening a pull request.

### Package Contribution Checklist

Your package is ready to merge when it includes each of the following:
- **Working package source at `src/index.js`** - or `src/index.ts` that compiles when calling `npm run build` from the command line.
- **An `examples/index.html` with working demos.** Feel free to add any number of additional HTML files to disaggregate your demos. We also recommend keeping demo assets in a separate `examples/assets/` folder or - if necessary - in an example-specific subfolder (e.g. `examples/example1/assets`). 
- **A `src/index.spec.ts` with tests that all pass** when calling `npm run test` from the command line. We use Jest as the testing framework.  See [testing jsPsych](contributing/dev-environment.md#testing) for more information about configuring the test tools and writing tests.
- **`README.md` introducing the package,** formatted to include an overview of what the plugin does, a `<script>` tag for loading the package from the `jspsych-contrib` CDN, a note on compatibility with different versions of jsPsych, a link to documentation in `/docs`, and an author line for citation.
- **Documentation in `/docs` that breaks down package parameters, data, and example code.** Our autodoc tool in `jspsych-dev` largely automates this process, allowing you to parse formatted docstrings from `/src` and render them as documentation at `docs/plugin-name.md`. `/docs` is also used for this website's plugin documentation under **References**. Those pages are all available to browse [here](browse.md).
- **Citation metadata** in CITATION.cff at the root of your repository. This allows people who use your package in their code to easily cite your work by calling `jsPsych.getCitations([<yourPlugin>])` from their command line. More information on .cff files can be found [here](https://citation-file-format.github.io/).
- **Changesets** for major release 1.0.0

### Pull Request Format

Your open pull request should be titled something equivalent to "Add my-awesome-plugin", and it should include the following in the first comment:
- **An overview** describing what the package does, as well as its default behavior.
- **A feature list** briefly detailing how the user is able to configure the package.
- **A breakdown of files included in the pull request.** This should mirror and confirm what's in the checklist.
- **An author line** listing who worked on the package.

**Keep an eye on your pull request after you've opened it.** Once it's opened, a member of our core team will review the code to be merged and suggest changes as necessary to specific lines. Commit the necessary changes, then leave another comment summarizing those changes when you're done. Our team will then review and possibly prescribe additional changes. Your package will potentially go through a few rounds of review before it's - hopefully - merged. 

By that point, congrats! You'll have given behavioral scientists new ways to collect data using jsPsych.

## Non-Package Contributions

A lot of the time, community developers aren't contributing a full package, but instead bug fixes, changes to documentation, or improvements to existing plugins. 

If this matches a contribution you have for jsPsych, feel free to still open a pull request while including what's relevant from the checklist in your files. Some suggestions include:
- **Running changeset** to include your changes in the release notes for jsPsych, or the release note for a specific jsPsych package.
- **Adding a test file** to show that a new feature works, that a bug is now fixed, or merged changes to code don't break it.
- **Adding an example file** to show off a new feature.

:::warning Draft Note: Suggested Restructuring / Reframing of this Section
*From Alex:* honestly not sure about the structure or keeping this in/tying it with the article at hand, full package contributions, bug fixes/feature contributions, and non-package contributions are all worth talking about and have a lot of similarities in how their PRs are structured, but have different requirements. worth discussing w/ josh what a good structure would look like for that, b/c i think it warrants a full or more complete explanation
:::

## See also

- [Build a plugin](plugins/plugin-tutorial.md)
- [Build an extension](extensions/extension-development.md)
- [Build a timeline](build-a-timeline.md)
- [Contribute to the core project](contributing/contributing.md)
